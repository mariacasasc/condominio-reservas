import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import { horarioValido, type HorarioDisponible } from "@/domain/area-comun/area-comun.entity";
import { AreaComunNoEncontradaError } from "./editar-area-comun";

export interface AgregarHorarioDisponibleDeps {
  areaComunRepository: AreaComunRepository;
}

export interface AgregarHorarioDisponibleComando {
  areaId: string;
  condominioId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export class HorarioInvalidoError extends Error {}

/** Use case: a gerente adds a recurring weekly availability window to an area. */
export async function agregarHorarioDisponible(
  comando: AgregarHorarioDisponibleComando,
  deps: AgregarHorarioDisponibleDeps,
): Promise<HorarioDisponible> {
  const area = await deps.areaComunRepository.buscarPorId(comando.areaId);
  if (!area || area.condominioId !== comando.condominioId) {
    throw new AreaComunNoEncontradaError("El área común no existe");
  }

  if (!horarioValido(comando)) {
    throw new HorarioInvalidoError("La hora de inicio debe ser anterior a la hora de fin");
  }

  return deps.areaComunRepository.crearHorario({
    areaId: comando.areaId,
    diaSemana: comando.diaSemana,
    horaInicio: comando.horaInicio,
    horaFin: comando.horaFin,
  });
}
