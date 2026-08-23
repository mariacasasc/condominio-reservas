import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";
import { AreaComunNoEncontradaError } from "./editar-area-comun";

export interface ActivarDesactivarAreaDeps {
  areaComunRepository: AreaComunRepository;
}

export interface ActivarDesactivarAreaComando {
  areaId: string;
  condominioId: string;
  activa: boolean;
}

/** Use case: a gerente opens or closes a common area for booking. */
export async function activarDesactivarArea(
  comando: ActivarDesactivarAreaComando,
  deps: ActivarDesactivarAreaDeps,
): Promise<AreaComun> {
  const area = await deps.areaComunRepository.buscarPorId(comando.areaId);
  if (!area || area.condominioId !== comando.condominioId) {
    throw new AreaComunNoEncontradaError("El área común no existe");
  }

  return deps.areaComunRepository.actualizarActiva(comando.areaId, comando.activa);
}
