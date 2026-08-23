import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import { AreaComunNoEncontradaError } from "./editar-area-comun";

export interface EliminarHorarioDisponibleDeps {
  areaComunRepository: AreaComunRepository;
}

export interface EliminarHorarioDisponibleComando {
  horarioId: string;
  condominioId: string;
}

/** Use case: a gerente removes a weekly availability window from an area. */
export async function eliminarHorarioDisponible(
  comando: EliminarHorarioDisponibleComando,
  deps: EliminarHorarioDisponibleDeps,
): Promise<void> {
  const horario = await deps.areaComunRepository.buscarHorarioPorId(comando.horarioId);
  if (!horario) {
    throw new AreaComunNoEncontradaError("El horario no existe");
  }

  const area = await deps.areaComunRepository.buscarPorId(horario.areaId);
  if (!area || area.condominioId !== comando.condominioId) {
    throw new AreaComunNoEncontradaError("El horario no existe");
  }

  await deps.areaComunRepository.eliminarHorario(comando.horarioId);
}
