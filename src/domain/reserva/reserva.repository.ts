import type { Reserva } from "./reserva.entity";

export interface ReservaRepository {
  crear(reserva: Omit<Reserva, "id" | "createdAt" | "revisadoPor" | "revisadoEn">): Promise<Reserva>;
  buscarPorId(id: string): Promise<Reserva | null>;
  listarPorArea(areaId: string): Promise<Reserva[]>;
  listarPorUsuario(usuarioId: string): Promise<Reserva[]>;
  listarPorAreaYFecha(areaId: string, fecha: string): Promise<Reserva[]>;
  actualizarEstado(
    id: string,
    datos: { estado: Reserva["estado"]; revisadoPor: string; revisadoEn: Date },
  ): Promise<Reserva>;
}
