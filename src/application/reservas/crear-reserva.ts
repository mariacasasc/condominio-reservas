import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { ReservaRepository } from "@/domain/reserva/reserva.repository";
import type { Reserva } from "@/domain/reserva/reserva.entity";
import {
  cabeEnCapacidad,
  estaDentroDeHorarioDisponible,
  estaFechaBloqueada,
  puedeReservarse,
} from "@/domain/area-comun/area-comun.entity";
import {
  respetaAnticipacion,
  respetaDuracionMaxima,
  seSuperponen,
  tieneHorarioValido,
} from "@/domain/reserva/reserva.entity";

export interface CrearReservaDeps {
  areaComunRepository: AreaComunRepository;
  reservaRepository: ReservaRepository;
  ahora?: () => Date;
}

export interface CrearReservaComando {
  areaId: string;
  usuarioId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cantidadPersonas: number;
  notas?: string;
}

export class ReservaInvalidaError extends Error {}

/**
 * Use case: a huesped requests a booking. Every domain rule is enforced here
 * before a single row is written — infrastructure only persists what this
 * function already decided is valid.
 */
export async function crearReserva(
  comando: CrearReservaComando,
  deps: CrearReservaDeps,
): Promise<Reserva> {
  const area = await deps.areaComunRepository.buscarPorId(comando.areaId);
  if (!area) {
    throw new ReservaInvalidaError("El área común no existe");
  }
  if (!puedeReservarse(area)) {
    throw new ReservaInvalidaError("El área común no está disponible para reservas");
  }
  if (!cabeEnCapacidad(area, comando.cantidadPersonas)) {
    throw new ReservaInvalidaError("La cantidad de personas excede la capacidad del área");
  }
  if (!tieneHorarioValido(comando.horaInicio, comando.horaFin)) {
    throw new ReservaInvalidaError("La hora de fin debe ser posterior a la hora de inicio");
  }
  if (!respetaDuracionMaxima(comando.horaInicio, comando.horaFin, area.duracionMaximaMinutos)) {
    throw new ReservaInvalidaError("La reserva excede la duración máxima permitida");
  }

  // Parsed manually (not `new Date(fecha).getDay()`) to avoid the server's
  // timezone shifting a UTC-midnight parse into the wrong day.
  const [anio, mes, dia] = comando.fecha.split("-").map(Number);
  const diaSemana = new Date(anio, mes - 1, dia).getDay();
  const horarios = await deps.areaComunRepository.horariosDisponibles(comando.areaId);
  if (!estaDentroDeHorarioDisponible(horarios, diaSemana, comando.horaInicio, comando.horaFin)) {
    throw new ReservaInvalidaError("El horario solicitado está fuera de la disponibilidad del área");
  }

  const [fechasDelArea, fechasGenerales] = await Promise.all([
    deps.areaComunRepository.fechasBloqueadas(comando.areaId),
    deps.areaComunRepository.fechasBloqueadasGenerales(),
  ]);
  if (estaFechaBloqueada(fechasDelArea, fechasGenerales, comando.fecha)) {
    throw new ReservaInvalidaError("La fecha solicitada está bloqueada para este área");
  }

  const ahora = (deps.ahora ?? (() => new Date()))();
  const fechaHoraInicio = new Date(`${comando.fecha}T${comando.horaInicio}:00`);
  if (
    !respetaAnticipacion(
      fechaHoraInicio,
      ahora,
      area.anticipacionMinimaHoras,
      area.anticipacionMaximaDias,
    )
  ) {
    throw new ReservaInvalidaError(
      "La reserva no respeta la anticipación mínima o máxima permitida",
    );
  }

  const reservasDelDia = await deps.reservaRepository.listarPorAreaYFecha(
    comando.areaId,
    comando.fecha,
  );
  const haySolape = reservasDelDia
    .filter((r) => r.estado === "pendiente" || r.estado === "aprobada")
    .some((r) => seSuperponen(r, comando));
  if (haySolape) {
    throw new ReservaInvalidaError("Ya existe una reserva en ese horario");
  }

  return deps.reservaRepository.crear({
    areaId: comando.areaId,
    usuarioId: comando.usuarioId,
    fecha: comando.fecha,
    horaInicio: comando.horaInicio,
    horaFin: comando.horaFin,
    cantidadPersonas: comando.cantidadPersonas,
    estado: "pendiente",
    notas: comando.notas ?? null,
  });
}
