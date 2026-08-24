"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import {
  aprobarReserva,
  ReservaNoEncontradaError,
  TransicionInvalidaError,
} from "@/application/reservas/aprobar-reserva";
import { DrizzleReservaRepository } from "@/infrastructure/db/repositories/reserva.repository.drizzle";

export interface DecidirReservaFormState {
  error?: string;
  success?: boolean;
}

export async function decidirReservaAction(
  _prevState: DecidirReservaFormState | undefined,
  formData: FormData,
): Promise<DecidirReservaFormState> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return { error: "No autorizado." };
  }

  const reservaId = formData.get("reservaId");
  const decision = formData.get("decision");
  if (
    typeof reservaId !== "string" ||
    !reservaId ||
    (decision !== "aprobada" && decision !== "rechazada")
  ) {
    return { error: "Solicitud inválida." };
  }

  try {
    await aprobarReserva(
      { reservaId, revisadoPor: session.user.id, decision },
      { reservaRepository: new DrizzleReservaRepository() },
    );
  } catch (error) {
    if (error instanceof ReservaNoEncontradaError) {
      return { error: "La reserva no existe." };
    }
    if (error instanceof TransicionInvalidaError) {
      return { error: "Esta reserva ya fue revisada y no se puede modificar." };
    }
    throw error;
  }

  revalidatePath("/gerente/reservas");
  revalidatePath(`/gerente/reservas/${reservaId}`);
  revalidatePath("/huesped/mis-reservas");
  return { success: true };
}
