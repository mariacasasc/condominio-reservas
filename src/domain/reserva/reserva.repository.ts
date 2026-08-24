import type { EstadoReserva, Reserva } from "./reserva.entity";

export interface FiltrosReservasCondominio {
  areaId?: string;
  fecha?: string;
  estado?: EstadoReserva;
}

export interface ReservaRepository {
  crear(reserva: Omit<Reserva, "id" | "createdAt" | "revisadoPor" | "revisadoEn">): Promise<Reserva>;
  buscarPorId(id: string): Promise<Reserva | null>;
  listarPorArea(areaId: string): Promise<Reserva[]>;
  listarPorUsuario(usuarioId: string): Promise<Reserva[]>;
  listarPorAreaYFecha(areaId: string, fecha: string): Promise<Reserva[]>;
  /** Joins against areas_comunes to scope by condominio — reservas has no condominio_id of its own. */
  listarPorCondominio(condominioId: string, filtros?: FiltrosReservasCondominio): Promise<Reserva[]>;
  actualizarEstado(
    id: string,
    datos: { estado: Reserva["estado"]; revisadoPor: string; revisadoEn: Date },
  ): Promise<Reserva>;
}
