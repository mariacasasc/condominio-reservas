import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";

export interface ListarAreasComunesDisponiblesDeps {
  areaComunRepository: AreaComunRepository;
}

/**
 * Use case: list only the active common areas of a condominio, so a huesped
 * only sees spaces that can actually be reserved.
 */
export async function listarAreasComunesDisponibles(
  condominioId: string,
  deps: ListarAreasComunesDisponiblesDeps,
): Promise<AreaComun[]> {
  const areas = await deps.areaComunRepository.listarPorCondominio(condominioId);
  return areas.filter((area) => area.activa);
}
