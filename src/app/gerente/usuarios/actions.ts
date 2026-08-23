"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { crearHuespedSchema } from "@/shared/schemas/usuario.schema";
import { crearHuesped, EmailDuplicadoError } from "@/application/usuarios/crear-huesped";
import { desactivarUsuario, UsuarioNoEncontradoError } from "@/application/usuarios/desactivar-usuario";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-password-hasher";

export interface CrearHuespedState {
  error?: string;
  success?: boolean;
}

export async function crearHuespedAction(
  _prevState: CrearHuespedState | undefined,
  formData: FormData,
): Promise<CrearHuespedState> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return { error: "No autorizado." };
  }

  const parsed = crearHuespedSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  try {
    await crearHuesped(
      { condominioId: session.user.condominioId, ...parsed.data },
      {
        usuarioRepository: new DrizzleUsuarioRepository(),
        passwordHasher: new BcryptPasswordHasher(),
      },
    );
  } catch (error) {
    if (error instanceof EmailDuplicadoError) {
      return { error: "Ya existe un huésped registrado con ese correo." };
    }
    throw error;
  }

  revalidatePath("/gerente/usuarios");
  return { success: true };
}

export async function desactivarUsuarioAction(usuarioId: string): Promise<void> {
  const session = await auth();
  if (session?.user.rol !== "gerente") {
    return;
  }

  try {
    await desactivarUsuario(
      { usuarioId, condominioId: session.user.condominioId },
      { usuarioRepository: new DrizzleUsuarioRepository() },
    );
  } catch (error) {
    if (error instanceof UsuarioNoEncontradoError) {
      return;
    }
    throw error;
  }

  revalidatePath("/gerente/usuarios");
}
