import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { areasComunes, fechasBloqueadas, horariosDisponibles } from "@/infrastructure/db/schema";
import { aHoraDominio } from "@/infrastructure/db/hora";
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
    horaInicio: aHoraDominio(fila.horaInicio),
    horaFin: aHoraDominio(fila.horaFin),
  };
}

function fechaBloqueadaADominio(fila: typeof fechasBloqueadas.$inferSelect): FechaBloqueada {
  return {
    id: fila.id,
    condominioId: fila.condominioId,
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

  async actualizar(
    id: string,
    cambios: Omit<AreaComun, "id" | "condominioId" | "activa">,
  ): Promise<AreaComun> {
    const [fila] = await db
      .update(areasComunes)
      .set({
        nombre: cambios.nombre,
        tipo: cambios.tipo,
        descripcion: cambios.descripcion,
        capacidadMaxima: cambios.capacidadMaxima,
        duracionMaximaMinutos: cambios.duracionMaximaMinutos,
        anticipacionMinimaHoras: cambios.anticipacionMinimaHoras,
        anticipacionMaximaDias: cambios.anticipacionMaximaDias,
      })
      .where(eq(areasComunes.id, id))
      .returning();
    return aDominio(fila);
  }

  async actualizarActiva(id: string, activa: boolean): Promise<AreaComun> {
    const [fila] = await db
      .update(areasComunes)
      .set({ activa })
      .where(eq(areasComunes.id, id))
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

  async buscarHorarioPorId(id: string): Promise<HorarioDisponible | null> {
    const [fila] = await db
      .select()
      .from(horariosDisponibles)
      .where(eq(horariosDisponibles.id, id))
      .limit(1);
    return fila ? horarioADominio(fila) : null;
  }

  async crearHorario(horario: Omit<HorarioDisponible, "id">): Promise<HorarioDisponible> {
    const [fila] = await db
      .insert(horariosDisponibles)
      .values({
        areaId: horario.areaId,
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
      })
      .returning();
    return horarioADominio(fila);
  }

  async eliminarHorario(id: string): Promise<void> {
    await db.delete(horariosDisponibles).where(eq(horariosDisponibles.id, id));
  }

  async fechasBloqueadas(areaId: string): Promise<FechaBloqueada[]> {
    const filas = await db
      .select()
      .from(fechasBloqueadas)
      .where(eq(fechasBloqueadas.areaId, areaId));
    return filas.map(fechaBloqueadaADominio);
  }

  async fechasBloqueadasGenerales(condominioId: string): Promise<FechaBloqueada[]> {
    const filas = await db
      .select()
      .from(fechasBloqueadas)
      .where(and(eq(fechasBloqueadas.condominioId, condominioId), isNull(fechasBloqueadas.areaId)));
    return filas.map(fechaBloqueadaADominio);
  }

  async buscarFechaBloqueadaPorId(id: string): Promise<FechaBloqueada | null> {
    const [fila] = await db
      .select()
      .from(fechasBloqueadas)
      .where(eq(fechasBloqueadas.id, id))
      .limit(1);
    return fila ? fechaBloqueadaADominio(fila) : null;
  }

  async crearFechaBloqueada(fecha: Omit<FechaBloqueada, "id">): Promise<FechaBloqueada> {
    const [fila] = await db
      .insert(fechasBloqueadas)
      .values({
        condominioId: fecha.condominioId,
        areaId: fecha.areaId,
        fecha: fecha.fecha,
        motivo: fecha.motivo,
      })
      .returning();
    return fechaBloqueadaADominio(fila);
  }

  async eliminarFechaBloqueada(id: string): Promise<void> {
    await db.delete(fechasBloqueadas).where(eq(fechasBloqueadas.id, id));
  }
}
