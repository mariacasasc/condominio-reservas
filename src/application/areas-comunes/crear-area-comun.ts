import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";

export interface CrearAreaComunDeps {
  areaComunRepository: AreaComunRepository;
}

export interface CrearAreaComunComando {
  condominioId: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  capacidadMaxima: number;
  duracionMaximaMinutos: number;
  anticipacionMinimaHoras: number;
  anticipacionMaximaDias: number;
}

/**
 * Use case: a gerente registers a new common area for its condominio.
 * A new area always starts active — there's no draft state.
 */
export async function crearAreaComun(
  comando: CrearAreaComunComando,
  deps: CrearAreaComunDeps,
): Promise<AreaComun> {
  return deps.areaComunRepository.crear({ ...comando, activa: true });
}
