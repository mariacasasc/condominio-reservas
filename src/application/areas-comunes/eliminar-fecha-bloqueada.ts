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
 * Use case: a gerente removes a blocked date. `condominioId` on the row
 * itself is authoritative for both area-scoped and condominio-wide blocks.
 */
export async function eliminarFechaBloqueada(
  comando: EliminarFechaBloqueadaComando,
  deps: EliminarFechaBloqueadaDeps,
): Promise<void> {
  const fechaBloqueada = await deps.areaComunRepository.buscarFechaBloqueadaPorId(
    comando.fechaBloqueadaId,
  );
  if (!fechaBloqueada || fechaBloqueada.condominioId !== comando.condominioId) {
    throw new AreaComunNoEncontradaError("La fecha bloqueada no existe");
  }

  await deps.areaComunRepository.eliminarFechaBloqueada(comando.fechaBloqueadaId);
}
