import { describe, expect, it, vi } from "vitest";
import { crearReserva, ReservaInvalidaError } from "./crear-reserva";
import type { CrearReservaDeps, CrearReservaComando } from "./crear-reserva";
import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";
import type { ReservaRepository } from "@/domain/reserva/reserva.repository";
import type { Reserva } from "@/domain/reserva/reserva.entity";
import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { NotificadorPort } from "@/domain/notificacion/notificador.port";

const noUsado = (): never => {
  throw new Error("Método no usado en este test");
};

const CONDOMINIO_A = "condominio-a";
const CONDOMINIO_B = "condominio-b";

function crearArea(overrides: Partial<AreaComun> = {}): AreaComun {
  return {
    id: "area-1",
    condominioId: CONDOMINIO_A,
    nombre: "Quincho",
    tipo: "quincho",
    descripcion: null,
    capacidadMaxima: 10,
    duracionMaximaMinutos: 120,
    anticipacionMinimaHoras: 24,
    anticipacionMaximaDias: 60,
    activa: true,
    ...overrides,
  };
}

/**
 * `ahora` fijo + una fecha objetivo 5 días después: el `diaSemana` se deriva
 * del propio objeto Date (no se hardcodea) para que el horario disponible
 * siempre coincida, sin depender de qué día de la semana caiga la fecha.
 */
function construirFechaObjetivo() {
  const ahora = new Date(2026, 0, 5, 8, 0, 0);
  const fechaObjetivo = new Date(2026, 0, 10, 0, 0, 0);
  const diaSemana = fechaObjetivo.getDay();
  const fecha = `${fechaObjetivo.getFullYear()}-${String(fechaObjetivo.getMonth() + 1).padStart(2, "0")}-${String(fechaObjetivo.getDate()).padStart(2, "0")}`;
  return { ahora, diaSemana, fecha };
}

describe("crearReserva (aislamiento por condominio)", () => {
  it("permite crear la reserva cuando el área pertenece al condominio del comando", async () => {
    const area = crearArea();
    const { ahora, diaSemana, fecha } = construirFechaObjetivo();

    const reservaCreada: Reserva = {
      id: "reserva-1",
      areaId: area.id,
      usuarioId: "usuario-1",
      fecha,
      horaInicio: "10:00",
      horaFin: "11:00",
      cantidadPersonas: 4,
      estado: "pendiente",
      notas: null,
      revisadoPor: null,
      revisadoEn: null,
      createdAt: ahora,
    };

    const areaComunRepository: AreaComunRepository = {
      buscarPorId: async () => area,
      horariosDisponibles: async () => [
        { id: "h1", areaId: area.id, diaSemana, horaInicio: "09:00", horaFin: "17:00" },
      ],
      fechasBloqueadas: async () => [],
      fechasBloqueadasGenerales: async () => [],
      listarPorCondominio: noUsado,
      crear: noUsado,
      actualizar: noUsado,
      actualizarActiva: noUsado,
      buscarHorarioPorId: noUsado,
      crearHorario: noUsado,
      eliminarHorario: noUsado,
      buscarFechaBloqueadaPorId: noUsado,
      crearFechaBloqueada: noUsado,
      eliminarFechaBloqueada: noUsado,
    };

    const reservaRepository: ReservaRepository = {
      listarPorAreaYFecha: async () => [],
      crear: async () => reservaCreada,
      buscarPorId: noUsado,
      listarPorArea: noUsado,
      listarPorUsuario: noUsado,
      listarPorCondominio: noUsado,
      actualizarEstado: noUsado,
    };

    const usuarioRepository: UsuarioRepository = {
      buscarPorId: async () => null,
      listar: async () => [],
      buscarPorEmail: noUsado,
      crear: noUsado,
      actualizarActivo: noUsado,
      actualizarPasswordHash: noUsado,
    };

    const notificadorPort: NotificadorPort = {
      enviarEmail: vi.fn(async () => {}),
    };

    const deps: CrearReservaDeps = {
      areaComunRepository,
      reservaRepository,
      usuarioRepository,
      notificadorPort,
      ahora: () => ahora,
    };

    const comando: CrearReservaComando = {
      areaId: area.id,
      usuarioId: "usuario-1",
      condominioId: CONDOMINIO_A,
      fecha,
      horaInicio: "10:00",
      horaFin: "11:00",
      cantidadPersonas: 4,
    };

    const resultado = await crearReserva(comando, deps);

    expect(resultado).toEqual(reservaCreada);
  });

  it("rechaza una reserva contra un área de otro condominio con el mismo error que un área inexistente", async () => {
    const areaDeOtroCondominio = crearArea({ id: "area-b", condominioId: CONDOMINIO_B });

    function crearDepsSoloBuscarPorId(area: AreaComun | null): CrearReservaDeps {
      const areaComunRepository: AreaComunRepository = {
        buscarPorId: async () => area,
        listarPorCondominio: noUsado,
        crear: noUsado,
        actualizar: noUsado,
        actualizarActiva: noUsado,
        horariosDisponibles: noUsado,
        buscarHorarioPorId: noUsado,
        crearHorario: noUsado,
        eliminarHorario: noUsado,
        fechasBloqueadas: noUsado,
        fechasBloqueadasGenerales: noUsado,
        buscarFechaBloqueadaPorId: noUsado,
        crearFechaBloqueada: noUsado,
        eliminarFechaBloqueada: noUsado,
      };
      const reservaRepository: ReservaRepository = {
        crear: noUsado,
        buscarPorId: noUsado,
        listarPorArea: noUsado,
        listarPorUsuario: noUsado,
        listarPorAreaYFecha: noUsado,
        listarPorCondominio: noUsado,
        actualizarEstado: noUsado,
      };
      const usuarioRepository: UsuarioRepository = {
        buscarPorId: noUsado,
        listar: noUsado,
        buscarPorEmail: noUsado,
        crear: noUsado,
        actualizarActivo: noUsado,
        actualizarPasswordHash: noUsado,
      };
      const notificadorPort: NotificadorPort = { enviarEmail: noUsado };
      return { areaComunRepository, reservaRepository, usuarioRepository, notificadorPort };
    }

    const comandoBase: CrearReservaComando = {
      areaId: "cualquiera",
      usuarioId: "usuario-1",
      condominioId: CONDOMINIO_A,
      fecha: "2026-02-01",
      horaInicio: "10:00",
      horaFin: "11:00",
      cantidadPersonas: 2,
    };

    const errorAreaInexistente = await crearReserva(
      { ...comandoBase, areaId: "area-inexistente" },
      crearDepsSoloBuscarPorId(null),
    ).catch((error: unknown) => error);

    const errorAreaCruzada = await crearReserva(
      { ...comandoBase, areaId: areaDeOtroCondominio.id },
      crearDepsSoloBuscarPorId(areaDeOtroCondominio),
    ).catch((error: unknown) => error);

    expect(errorAreaInexistente).toBeInstanceOf(ReservaInvalidaError);
    expect(errorAreaCruzada).toBeInstanceOf(ReservaInvalidaError);
    expect((errorAreaCruzada as Error).message).toBe((errorAreaInexistente as Error).message);
    expect((errorAreaCruzada as Error).message).toBe("El área común no existe");
  });
});
