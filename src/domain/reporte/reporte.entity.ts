import type { AreaComun, HorarioDisponible } from "@/domain/area-comun/area-comun.entity";
import type { Reserva } from "@/domain/reserva/reserva.entity";

export interface ReservasPorArea {
  areaId: string;
  areaNombre: string;
  cantidad: number;
}

export interface ReservasPorMes {
  mes: string; // "YYYY-MM"
  cantidad: number;
}

export interface TasaAprobacionRechazo {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  canceladas: number;
  total: number;
  tasaAprobacionPorcentaje: number | null;
}

export interface OcupacionPorArea {
  areaId: string;
  areaNombre: string;
  horasDisponibles: number;
  horasReservadas: number;
  porcentajeOcupacion: number;
}

/** "YYYY-MM" for the calendar month a Date falls in, in the server's local time. */
export function formatearMes(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function mesAnterior(mes: string): string {
  const [anio, mesNum] = mes.split("-").map(Number);
  const anioAnterior = mesNum === 1 ? anio - 1 : anio;
  const mesNumAnterior = mesNum === 1 ? 12 : mesNum - 1;
  return `${anioAnterior}-${String(mesNumAnterior).padStart(2, "0")}`;
}

function duracionEnHoras(horaInicio: string, horaFin: string): number {
  const [hIni, mIni] = horaInicio.split(":").map(Number);
  const [hFin, mFin] = horaFin.split(":").map(Number);
  return (hFin * 60 + mFin - (hIni * 60 + mIni)) / 60;
}

// Constructed from UTC components (not parsed from a string) so the day-of-week
// walk below never shifts with the server's local timezone — same concern that
// keeps estaDentroDeHorarioDisponible away from `new Date(fecha).getDay()`.
function diasEnElMes(anio: number, mesNum: number): number {
  return new Date(Date.UTC(anio, mesNum, 0)).getUTCDate();
}

/** Domain rule: how many times a given weekday (0=Sunday..6=Saturday) occurs within a "YYYY-MM" month. */
export function contarOcurrenciasDeDiaSemanaEnMes(mes: string, diaSemana: number): number {
  const [anioStr, mesStr] = mes.split("-");
  const anio = Number(anioStr);
  const mesNum = Number(mesStr);
  const totalDias = diasEnElMes(anio, mesNum);

  let ocurrencias = 0;
  for (let dia = 1; dia <= totalDias; dia++) {
    if (new Date(Date.UTC(anio, mesNum - 1, dia)).getUTCDay() === diaSemana) {
      ocurrencias++;
    }
  }
  return ocurrencias;
}

/** Reservations of the given month, grouped by área, sorted from most to least booked. */
export function reservasPorArea(reservas: Reserva[], areas: AreaComun[], mes: string): ReservasPorArea[] {
  const nombrePorAreaId = new Map(areas.map((area) => [area.id, area.nombre]));
  const cantidadPorAreaId = new Map<string, number>();

  for (const reserva of reservas) {
    if (!reserva.fecha.startsWith(mes)) continue;
    cantidadPorAreaId.set(reserva.areaId, (cantidadPorAreaId.get(reserva.areaId) ?? 0) + 1);
  }

  return [...cantidadPorAreaId.entries()]
    .map(([areaId, cantidad]) => ({
      areaId,
      areaNombre: nombrePorAreaId.get(areaId) ?? "Área eliminada",
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

/** Trend of the last `cantidadMeses` months (default 6) ending at `mesFinal`, in chronological order. */
export function reservasPorMes(
  reservas: Reserva[],
  mesFinal: string,
  cantidadMeses = 6,
): ReservasPorMes[] {
  const meses: string[] = [];
  let cursor = mesFinal;
  for (let i = 0; i < cantidadMeses; i++) {
    meses.unshift(cursor);
    cursor = mesAnterior(cursor);
  }

  const cantidadPorMes = new Map(meses.map((mes) => [mes, 0]));
  for (const reserva of reservas) {
    const mesReserva = reserva.fecha.slice(0, 7);
    if (cantidadPorMes.has(mesReserva)) {
      cantidadPorMes.set(mesReserva, (cantidadPorMes.get(mesReserva) ?? 0) + 1);
    }
  }

  return meses.map((mes) => ({ mes, cantidad: cantidadPorMes.get(mes) ?? 0 }));
}

/** Approval/rejection rate of the given month's reservations. */
export function tasaAprobacionRechazo(reservas: Reserva[], mes: string): TasaAprobacionRechazo {
  const delMes = reservas.filter((reserva) => reserva.fecha.startsWith(mes));
  const pendientes = delMes.filter((r) => r.estado === "pendiente").length;
  const aprobadas = delMes.filter((r) => r.estado === "aprobada").length;
  const rechazadas = delMes.filter((r) => r.estado === "rechazada").length;
  const canceladas = delMes.filter((r) => r.estado === "cancelada").length;
  const decididas = aprobadas + rechazadas;

  // Sin ninguna reserva aprobada o rechazada todavía, "0%" sugeriría un rechazo
  // total falso — null representa "sin datos suficientes" para que la UI
  // muestre un guion en vez de una tasa engañosa.
  const tasaAprobacionPorcentaje = decididas === 0 ? null : (aprobadas / decididas) * 100;

  return { pendientes, aprobadas, rechazadas, canceladas, total: delMes.length, tasaAprobacionPorcentaje };
}

/**
 * Occupancy per área for the given month: reserved hours (aprobadas) over
 * available hours (horarios recurrentes × cuántas veces cae ese día de
 * semana en el mes). Capped at 100% — una reserva más larga que el horario
 * nominal (o solapamientos de horarios) no debería mostrar más de "lleno".
 */
export function ocupacionPorArea(
  reservas: Reserva[],
  areas: AreaComun[],
  horariosPorAreaId: Map<string, HorarioDisponible[]>,
  mes: string,
): OcupacionPorArea[] {
  const aprobadasDelMes = reservas.filter(
    (reserva) => reserva.estado === "aprobada" && reserva.fecha.startsWith(mes),
  );

  return areas.map((area) => {
    const horarios = horariosPorAreaId.get(area.id) ?? [];
    const horasDisponibles = horarios.reduce((total, horario) => {
      const ocurrencias = contarOcurrenciasDeDiaSemanaEnMes(mes, horario.diaSemana);
      return total + duracionEnHoras(horario.horaInicio, horario.horaFin) * ocurrencias;
    }, 0);

    const horasReservadas = aprobadasDelMes
      .filter((reserva) => reserva.areaId === area.id)
      .reduce((total, reserva) => total + duracionEnHoras(reserva.horaInicio, reserva.horaFin), 0);

    const porcentajeOcupacion =
      horasDisponibles === 0 ? 0 : Math.min(100, (horasReservadas / horasDisponibles) * 100);

    return {
      areaId: area.id,
      areaNombre: area.nombre,
      horasDisponibles,
      horasReservadas,
      porcentajeOcupacion,
    };
  });
}
