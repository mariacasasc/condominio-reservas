import type { AreaComun, FechaBloqueada, HorarioDisponible } from "./area-comun.entity";

export interface AreaComunRepository {
  listarPorCondominio(condominioId: string): Promise<AreaComun[]>;
  buscarPorId(id: string): Promise<AreaComun | null>;
  crear(area: Omit<AreaComun, "id">): Promise<AreaComun>;
  horariosDisponibles(areaId: string): Promise<HorarioDisponible[]>;
  fechasBloqueadas(areaId: string): Promise<FechaBloqueada[]>;
}
