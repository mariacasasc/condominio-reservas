import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";

export interface EditarAreaComunDeps {
  areaComunRepository: AreaComunRepository;
}

export interface EditarAreaComunComando {
  areaId: string;
  condominioId: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  capacidadMaxima: number;
  duracionMaximaMinutos: number;
  anticipacionMinimaHoras: number;
  anticipacionMaximaDias: number;
}

export class AreaComunNoEncontradaError extends Error {}

/**
 * Use case: a gerente updates a common area's configuration. condominioId
 * comes from the gerente's session, not the request — same boundary
 * desactivarUsuario uses to stop a guessed UUID crossing condominios.
 */
export async function editarAreaComun(
  comando: EditarAreaComunComando,
  deps: EditarAreaComunDeps,
): Promise<AreaComun> {
  const area = await deps.areaComunRepository.buscarPorId(comando.areaId);
  if (!area || area.condominioId !== comando.condominioId) {
    throw new AreaComunNoEncontradaError("El área común no existe");
  }

  return deps.areaComunRepository.actualizar(comando.areaId, {
    nombre: comando.nombre,
    tipo: comando.tipo,
    descripcion: comando.descripcion,
    capacidadMaxima: comando.capacidadMaxima,
    duracionMaximaMinutos: comando.duracionMaximaMinutos,
    anticipacionMinimaHoras: comando.anticipacionMinimaHoras,
    anticipacionMaximaDias: comando.anticipacionMaximaDias,
  });
}
