import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import { AreaComunNoEncontradaError } from "./editar-area-comun";

export interface EliminarFechaBloqueadaDeps {
  areaComunRepository: AreaComunRepository;
}

export interface EliminarFechaBloqueadaComando {
  fechaBloqueadaId: string;
  condominioId: string;
}

/**
 * Use case: a gerente removes a blocked date. A condominio-wide block
 * (areaId null) has no condominioId column to check against yet — the
 * schema models a single condominio today, real isolation lands in Fase 7.
 */
export async function eliminarFechaBloqueada(
  comando: EliminarFechaBloqueadaComando,
  deps: EliminarFechaBloqueadaDeps,
): Promise<void> {
  const fechaBloqueada = await deps.areaComunRepository.buscarFechaBloqueadaPorId(
    comando.fechaBloqueadaId,
  );
  if (!fechaBloqueada) {
    throw new AreaComunNoEncontradaError("La fecha bloqueada no existe");
  }

  if (fechaBloqueada.areaId) {
    const area = await deps.areaComunRepository.buscarPorId(fechaBloqueada.areaId);
    if (!area || area.condominioId !== comando.condominioId) {
      throw new AreaComunNoEncontradaError("La fecha bloqueada no existe");
    }
  }

  await deps.areaComunRepository.eliminarFechaBloqueada(comando.fechaBloqueadaId);
}
