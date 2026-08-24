"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { crearReservaSchema } from "@/shared/schemas/reserva.schema";
import { crearReserva, ReservaInvalidaError } from "@/application/reservas/crear-reserva";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { DrizzleReservaRepository } from "@/infrastructure/db/repositories/reserva.repository.drizzle";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { ResendNotificador } from "@/infrastructure/notificaciones/resend-notificador";

export interface ReservaFormState {
  error?: string;
  success?: boolean;
}

export async function crearReservaAction(
  areaId: string,
  _prevState: ReservaFormState | undefined,
  formData: FormData,
): Promise<ReservaFormState> {
  const session = await auth();
  if (session?.user.rol !== "huesped") {
    return { error: "No autorizado." };
  }

  const parsed = crearReservaSchema.safeParse({
    areaId,
    fecha: formData.get("fecha"),
    horaInicio: formData.get("horaInicio"),
    horaFin: formData.get("horaFin"),
    cantidadPersonas: formData.get("cantidadPersonas"),
    notas: formData.get("notas") || undefined,
  });
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  try {
    await crearReserva(
      {
        areaId: parsed.data.areaId,
        usuarioId: session.user.id,
        fecha: parsed.data.fecha,
        horaInicio: parsed.data.horaInicio,
        horaFin: parsed.data.horaFin,
        cantidadPersonas: parsed.data.cantidadPersonas,
        notas: parsed.data.notas?.trim() || undefined,
      },
      {
        areaComunRepository: new DrizzleAreaComunRepository(),
        reservaRepository: new DrizzleReservaRepository(),
        usuarioRepository: new DrizzleUsuarioRepository(),
        notificadorPort: new ResendNotificador(),
      },
    );
  } catch (error) {
    if (error instanceof ReservaInvalidaError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/huesped/mis-reservas");
  redirect("/huesped/mis-reservas");
}
