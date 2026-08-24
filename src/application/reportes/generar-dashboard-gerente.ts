import type { ReservaRepository } from "@/domain/reserva/reserva.repository";
import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { HorarioDisponible } from "@/domain/area-comun/area-comun.entity";
import {
  formatearMes,
  ocupacionPorArea,
  reservasPorArea,
  reservasPorMes,
  tasaAprobacionRechazo,
  type OcupacionPorArea,
  type ReservasPorArea,
  type ReservasPorMes,
  type TasaAprobacionRechazo,
} from "@/domain/reporte/reporte.entity";

export interface GenerarDashboardGerenteDeps {
  reservaRepository: ReservaRepository;
  areaComunRepository: AreaComunRepository;
  ahora?: () => Date;
}

export interface DashboardGerente {
  mes: string;
  reservasPorArea: ReservasPorArea[];
  reservasPorMes: ReservasPorMes[];
  tasaAprobacionRechazo: TasaAprobacionRechazo;
  ocupacionPorArea: OcupacionPorArea[];
}

/**
 * Use case: builds the gerente's dashboard for a given month (default: the
 * current one). El puerto AreaComunRepository no tiene un método que traiga
 * las áreas ya con sus horarios embebidos (no hay precedente de eso en el
 * proyecto — ver FASES.md Fase 6), así que se pide `horariosDisponibles` por
 * área en paralelo en vez de agregar un método nuevo al puerto.
 */
export async function generarDashboardGerente(
  condominioId: string,
  mes: string | undefined,
  deps: GenerarDashboardGerenteDeps,
): Promise<DashboardGerente> {
  const ahora = (deps.ahora ?? (() => new Date()))();
  const mesSeleccionado = mes ?? formatearMes(ahora);
  const mesActualReal = formatearMes(ahora);

  const [reservas, areas] = await Promise.all([
    deps.reservaRepository.listarPorCondominio(condominioId),
    deps.areaComunRepository.listarPorCondominio(condominioId),
  ]);

  const entradas = await Promise.all(
    areas.map(
      async (area) =>
        [area.id, await deps.areaComunRepository.horariosDisponibles(area.id)] as const,
    ),
  );
  const horariosPorAreaId = new Map<string, HorarioDisponible[]>(entradas);

  return {
    mes: mesSeleccionado,
    reservasPorArea: reservasPorArea(reservas, areas, mesSeleccionado),
    reservasPorMes: reservasPorMes(reservas, mesActualReal),
    tasaAprobacionRechazo: tasaAprobacionRechazo(reservas, mesSeleccionado),
    ocupacionPorArea: ocupacionPorArea(reservas, areas, horariosPorAreaId, mesSeleccionado),
  };
}
