import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { reservas } from "@/infrastructure/db/schema";
import type { Reserva } from "@/domain/reserva/reserva.entity";
import type { ReservaRepository } from "@/domain/reserva/reserva.repository";

function aDominio(fila: typeof reservas.$inferSelect): Reserva {
  return {
    id: fila.id,
    areaId: fila.areaId,
    usuarioId: fila.usuarioId,
    fecha: fila.fecha,
    horaInicio: fila.horaInicio,
    horaFin: fila.horaFin,
    cantidadPersonas: fila.cantidadPersonas,
    estado: fila.estado,
    notas: fila.notas,
    revisadoPor: fila.revisadoPor,
    revisadoEn: fila.revisadoEn,
    createdAt: fila.createdAt,
  };
}

export class DrizzleReservaRepository implements ReservaRepository {
  async crear(
    reserva: Omit<Reserva, "id" | "createdAt" | "revisadoPor" | "revisadoEn">,
  ): Promise<Reserva> {
    const [fila] = await db
      .insert(reservas)
      .values({
        areaId: reserva.areaId,
        usuarioId: reserva.usuarioId,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        cantidadPersonas: reserva.cantidadPersonas,
        estado: reserva.estado,
        notas: reserva.notas,
      })
      .returning();
    return aDominio(fila);
  }

  async buscarPorId(id: string): Promise<Reserva | null> {
    const [fila] = await db.select().from(reservas).where(eq(reservas.id, id)).limit(1);
    return fila ? aDominio(fila) : null;
  }

  async listarPorArea(areaId: string): Promise<Reserva[]> {
    const filas = await db.select().from(reservas).where(eq(reservas.areaId, areaId));
    return filas.map(aDominio);
  }

  async listarPorUsuario(usuarioId: string): Promise<Reserva[]> {
    const filas = await db.select().from(reservas).where(eq(reservas.usuarioId, usuarioId));
    return filas.map(aDominio);
  }

  async listarPorAreaYFecha(areaId: string, fecha: string): Promise<Reserva[]> {
    const filas = await db
      .select()
      .from(reservas)
      .where(and(eq(reservas.areaId, areaId), eq(reservas.fecha, fecha)));
    return filas.map(aDominio);
  }

  async actualizarEstado(
    id: string,
    datos: { estado: Reserva["estado"]; revisadoPor: string; revisadoEn: Date },
  ): Promise<Reserva> {
    const [fila] = await db
      .update(reservas)
      .set({
        estado: datos.estado,
        revisadoPor: datos.revisadoPor,
        revisadoEn: datos.revisadoEn,
      })
      .where(eq(reservas.id, id))
      .returning();
    return aDominio(fila);
  }
}
