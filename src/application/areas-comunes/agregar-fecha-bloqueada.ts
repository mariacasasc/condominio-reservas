import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { FechaBloqueada } from "@/domain/area-comun/area-comun.entity";
import { AreaComunNoEncontradaError } from "./editar-area-comun";

export interface AgregarFechaBloqueadaDeps {
  areaComunRepository: AreaComunRepository;
}

export interface AgregarFechaBloqueadaComando {
  condominioId: string;
  areaId: string | null;
  fecha: string;
  motivo: string | null;
}

/**
 * Use case: a gerente blocks a date. A null areaId blocks the whole
 * condominio (e.g. a holiday) instead of a single area.
 */
export async function agregarFechaBloqueada(
  comando: AgregarFechaBloqueadaComando,
  deps: AgregarFechaBloqueadaDeps,
): Promise<FechaBloqueada> {
  if (comando.areaId) {
    const area = await deps.areaComunRepository.buscarPorId(comando.areaId);
    if (!area || area.condominioId !== comando.condominioId) {
      throw new AreaComunNoEncontradaError("El área común no existe");
    }
  }

  return deps.areaComunRepository.crearFechaBloqueada({
    areaId: comando.areaId,
    fecha: comando.fecha,
    motivo: comando.motivo,
  });
}
