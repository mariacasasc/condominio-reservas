"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import {
  crearAreaComunSchema,
  horarioDisponibleSchema,
  fechaBloqueadaSchema,
} from "@/shared/schemas/area-comun.schema";
import { crearAreaComun } from "@/application/areas-comunes/crear-area-comun";
import { editarAreaComun, AreaComunNoEncontradaError } from "@/application/areas-comunes/editar-area-comun";
import { activarDesactivarArea } from "@/application/areas-comunes/activar-desactivar-area";
import {
  agregarHorarioDisponible,
  HorarioInvalidoError,
} from "@/application/areas-comunes/agregar-horario-disponible";
import { eliminarHorarioDisponible } from "@/application/areas-comunes/eliminar-horario-disponible";
import { agregarFechaBloqueada } from "@/application/areas-comunes/agregar-fecha-bloqueada";
import { eliminarFechaBloqueada } from "@/application/areas-comunes/eliminar-fecha-bloqueada";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";

export interface AreaComunFormState {
  error?: string;
  success?: boolean;
}

function parseAreaComunFormData(formData: FormData) {
  return {
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    descripcion: formData.get("descripcion") || undefined,
    capacidadMaxima: formData.get("capacidadMaxima"),
    duracionMaximaMinutos: formData.get("duracionMaximaMinutos"),
    anticipacionMinimaHoras: formData.get("anticipacionMinimaHoras"),
    anticipacionMaximaDias: formData.get("anticipacionMaximaDias"),
  };
}

export async function crearAreaComunAction(
  _prevState: AreaComunFormState | undefined,
  formData: FormData,
): Promise<AreaComunFormState> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return { error: "No autorizado." };
  }

  const parsed = crearAreaComunSchema.safeParse(parseAreaComunFormData(formData));
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  await crearAreaComun(
    {
      condominioId: session.user.condominioId,
      ...parsed.data,
      descripcion: parsed.data.descripcion?.trim() || null,
    },
    { areaComunRepository: new DrizzleAreaComunRepository() },
  );

  revalidatePath("/gerente");
  redirect("/gerente");
}

export async function editarAreaComunAction(
  areaId: string,
  _prevState: AreaComunFormState | undefined,
  formData: FormData,
): Promise<AreaComunFormState> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return { error: "No autorizado." };
  }

  const parsed = crearAreaComunSchema.safeParse(parseAreaComunFormData(formData));
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  try {
    await editarAreaComun(
      {
        areaId,
        condominioId: session.user.condominioId,
        ...parsed.data,
        descripcion: parsed.data.descripcion?.trim() || null,
      },
      { areaComunRepository: new DrizzleAreaComunRepository() },
    );
  } catch (error) {
    if (error instanceof AreaComunNoEncontradaError) {
      return { error: "El área no existe." };
    }
    throw error;
  }

  revalidatePath("/gerente");
  revalidatePath(`/gerente/areas-comunes/${areaId}/editar`);
  return { success: true };
}

export async function activarDesactivarAreaAction(areaId: string, activa: boolean): Promise<void> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return;
  }

  try {
    await activarDesactivarArea(
      { areaId, condominioId: session.user.condominioId, activa },
      { areaComunRepository: new DrizzleAreaComunRepository() },
    );
  } catch (error) {
    if (!(error instanceof AreaComunNoEncontradaError)) {
      throw error;
    }
  }

  revalidatePath("/gerente");
  revalidatePath(`/gerente/areas-comunes/${areaId}/editar`);
}

export interface HorarioFormState {
  error?: string;
  success?: boolean;
}

export async function agregarHorarioAction(
  areaId: string,
  _prevState: HorarioFormState | undefined,
  formData: FormData,
): Promise<HorarioFormState> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return { error: "No autorizado." };
  }

  const parsed = horarioDisponibleSchema.safeParse({
    diaSemana: formData.get("diaSemana"),
    horaInicio: formData.get("horaInicio"),
    horaFin: formData.get("horaFin"),
  });
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  try {
    await agregarHorarioDisponible(
      { areaId, condominioId: session.user.condominioId, ...parsed.data },
      { areaComunRepository: new DrizzleAreaComunRepository() },
    );
  } catch (error) {
    if (error instanceof AreaComunNoEncontradaError) {
      return { error: "El área no existe." };
    }
    if (error instanceof HorarioInvalidoError) {
      return { error: "La hora de inicio debe ser anterior a la hora de fin." };
    }
    throw error;
  }

  revalidatePath(`/gerente/areas-comunes/${areaId}/editar`);
  return { success: true };
}

export async function eliminarHorarioAction(areaId: string, horarioId: string): Promise<void> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return;
  }

  try {
    await eliminarHorarioDisponible(
      { horarioId, condominioId: session.user.condominioId },
      { areaComunRepository: new DrizzleAreaComunRepository() },
    );
  } catch (error) {
    if (!(error instanceof AreaComunNoEncontradaError)) {
      throw error;
    }
  }

  revalidatePath(`/gerente/areas-comunes/${areaId}/editar`);
}

export interface FechaBloqueadaFormState {
  error?: string;
  success?: boolean;
}

export async function agregarFechaBloqueadaAction(
  areaId: string,
  _prevState: FechaBloqueadaFormState | undefined,
  formData: FormData,
): Promise<FechaBloqueadaFormState> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return { error: "No autorizado." };
  }

  const parsed = fechaBloqueadaSchema.safeParse({
    fecha: formData.get("fecha"),
    motivo: formData.get("motivo") || undefined,
  });
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  const general = formData.get("general") === "on";

  try {
    await agregarFechaBloqueada(
      {
        condominioId: session.user.condominioId,
        areaId: general ? null : areaId,
        fecha: parsed.data.fecha,
        motivo: parsed.data.motivo?.trim() || null,
      },
      { areaComunRepository: new DrizzleAreaComunRepository() },
    );
  } catch (error) {
    if (error instanceof AreaComunNoEncontradaError) {
      return { error: "El área no existe." };
    }
    throw error;
  }

  revalidatePath(`/gerente/areas-comunes/${areaId}/editar`);
  return { success: true };
}

export async function eliminarFechaBloqueadaAction(
  areaId: string,
  fechaBloqueadaId: string,
): Promise<void> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return;
  }

  try {
    await eliminarFechaBloqueada(
      { fechaBloqueadaId, condominioId: session.user.condominioId },
      { areaComunRepository: new DrizzleAreaComunRepository() },
    );
  } catch (error) {
    if (!(error instanceof AreaComunNoEncontradaError)) {
      throw error;
    }
  }

  revalidatePath(`/gerente/areas-comunes/${areaId}/editar`);
}
