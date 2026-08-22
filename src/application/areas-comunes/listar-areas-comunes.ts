import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";

export interface ListarAreasComunesDeps {
  areaComunRepository: AreaComunRepository;
}

/**
 * Use case: list every common area registered for a condominio, active or
 * not, so a gerente can manage them. Orchestration only — no persistence
 * details leak in from here.
 */
export async function listarAreasComunes(
  condominioId: string,
  deps: ListarAreasComunesDeps,
): Promise<AreaComun[]> {
  return deps.areaComunRepository.listarPorCondominio(condominioId);
}
