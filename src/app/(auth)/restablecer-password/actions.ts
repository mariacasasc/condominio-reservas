"use server";

import { redirect } from "next/navigation";
import { restablecerPasswordSchema } from "@/shared/schemas/auth.schema";
import { restablecerPassword, TokenInvalidoError } from "@/application/usuarios/restablecer-password";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { DrizzleTokenRecuperacionPasswordRepository } from "@/infrastructure/db/repositories/token-recuperacion-password.repository.drizzle";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-password-hasher";

export interface RestablecerPasswordState {
  error?: string;
}

export async function restablecerPasswordAction(
  _prevState: RestablecerPasswordState | undefined,
  formData: FormData,
): Promise<RestablecerPasswordState> {
  const parsed = restablecerPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  try {
    await restablecerPassword(
      { token: parsed.data.token, passwordNueva: parsed.data.password },
      {
        usuarioRepository: new DrizzleUsuarioRepository(),
        tokenRecuperacionPasswordRepository: new DrizzleTokenRecuperacionPasswordRepository(),
        passwordHasher: new BcryptPasswordHasher(),
      },
    );
  } catch (error) {
    if (error instanceof TokenInvalidoError) {
      return { error: "El enlace no es válido o expiró. Solicita uno nuevo." };
    }
    throw error;
  }

  redirect("/login");
}
