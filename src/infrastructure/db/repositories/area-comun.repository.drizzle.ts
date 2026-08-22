import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { areasComunes, fechasBloqueadas, horariosDisponibles } from "@/infrastructure/db/schema";
import type {
  AreaComun,
  FechaBloqueada,
  HorarioDisponible,
} from "@/domain/area-comun/area-comun.entity";
import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";

function aDominio(fila: typeof areasComunes.$inferSelect): AreaComun {
  return {
    id: fila.id,
    condominioId: fila.condominioId,
    nombre: fila.nombre,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    capacidadMaxima: fila.capacidadMaxima,
    duracionMaximaMinutos: fila.duracionMaximaMinutos,
    anticipacionMinimaHoras: fila.anticipacionMinimaHoras,
    anticipacionMaximaDias: fila.anticipacionMaximaDias,
    activa: fila.activa,
  };
}

function horarioADominio(fila: typeof horariosDisponibles.$inferSelect): HorarioDisponible {
  return {
    id: fila.id,
    areaId: fila.areaId,
    diaSemana: fila.diaSemana,
    horaInicio: fila.horaInicio,
    horaFin: fila.horaFin,
  };
}

function fechaBloqueadaADominio(fila: typeof fechasBloqueadas.$inferSelect): FechaBloqueada {
  return {
    id: fila.id,
    areaId: fila.areaId,
    fecha: fila.fecha,
    motivo: fila.motivo,
  };
}

export class DrizzleAreaComunRepository implements AreaComunRepository {
  async listarPorCondominio(condominioId: string): Promise<AreaComun[]> {
    const filas = await db
      .select()
      .from(areasComunes)
      .where(eq(areasComunes.condominioId, condominioId));
    return filas.map(aDominio);
  }

  async buscarPorId(id: string): Promise<AreaComun | null> {
    const [fila] = await db.select().from(areasComunes).where(eq(areasComunes.id, id)).limit(1);
    return fila ? aDominio(fila) : null;
  }

  async crear(area: Omit<AreaComun, "id">): Promise<AreaComun> {
    const [fila] = await db
      .insert(areasComunes)
      .values({
        condominioId: area.condominioId,
        nombre: area.nombre,
        tipo: area.tipo,
        descripcion: area.descripcion,
        capacidadMaxima: area.capacidadMaxima,
        duracionMaximaMinutos: area.duracionMaximaMinutos,
        anticipacionMinimaHoras: area.anticipacionMinimaHoras,
        anticipacionMaximaDias: area.anticipacionMaximaDias,
        activa: area.activa,
      })
      .returning();
    return aDominio(fila);
  }

  async horariosDisponibles(areaId: string): Promise<HorarioDisponible[]> {
    const filas = await db
      .select()
      .from(horariosDisponibles)
      .where(eq(horariosDisponibles.areaId, areaId));
    return filas.map(horarioADominio);
  }

  async fechasBloqueadas(areaId: string): Promise<FechaBloqueada[]> {
    const filas = await db
      .select()
      .from(fechasBloqueadas)
      .where(eq(fechasBloqueadas.areaId, areaId));
    return filas.map(fechaBloqueadaADominio);
  }
}
