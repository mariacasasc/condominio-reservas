import type { AreaComun, FechaBloqueada, HorarioDisponible } from "./area-comun.entity";

export interface AreaComunRepository {
  listarPorCondominio(condominioId: string): Promise<AreaComun[]>;
  buscarPorId(id: string): Promise<AreaComun | null>;
  crear(area: Omit<AreaComun, "id">): Promise<AreaComun>;
  actualizar(id: string, cambios: Omit<AreaComun, "id" | "condominioId" | "activa">): Promise<AreaComun>;
  actualizarActiva(id: string, activa: boolean): Promise<AreaComun>;

  horariosDisponibles(areaId: string): Promise<HorarioDisponible[]>;
  buscarHorarioPorId(id: string): Promise<HorarioDisponible | null>;
  crearHorario(horario: Omit<HorarioDisponible, "id">): Promise<HorarioDisponible>;
  eliminarHorario(id: string): Promise<void>;

  /** Bloqueos puntuales de un área específica (`areaId` no nulo). */
  fechasBloqueadas(areaId: string): Promise<FechaBloqueada[]>;
  /** Bloqueos que aplican a todo el condominio (`areaId` nulo), scoped por condominio. */
  fechasBloqueadasGenerales(condominioId: string): Promise<FechaBloqueada[]>;
  buscarFechaBloqueadaPorId(id: string): Promise<FechaBloqueada | null>;
  crearFechaBloqueada(fecha: Omit<FechaBloqueada, "id">): Promise<FechaBloqueada>;
  eliminarFechaBloqueada(id: string): Promise<void>;
}
