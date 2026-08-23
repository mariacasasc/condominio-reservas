"use server";

import { solicitarRecuperacionSchema } from "@/shared/schemas/auth.schema";
import { solicitarRecuperacionPassword } from "@/application/usuarios/solicitar-recuperacion-password";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { DrizzleTokenRecuperacionPasswordRepository } from "@/infrastructure/db/repositories/token-recuperacion-password.repository.drizzle";

export interface RecuperarPasswordState {
  error?: string;
  enviado?: boolean;
  token?: string;
}

export async function solicitarRecuperacionAction(
  _prevState: RecuperarPasswordState | undefined,
  formData: FormData,
): Promise<RecuperarPasswordState> {
  const parsed = solicitarRecuperacionSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: "Ingresa un correo válido." };
  }

  const resultado = await solicitarRecuperacionPassword(parsed.data, {
    usuarioRepository: new DrizzleUsuarioRepository(),
    tokenRecuperacionPasswordRepository: new DrizzleTokenRecuperacionPasswordRepository(),
  });

  if (resultado) {
    // Fase 1: sin envío de email real (eso es Fase 5, Notificaciones). El
    // token se loguea y se muestra en la página para poder probar el flujo.
    console.log(`[recuperacion-password] token para ${parsed.data.email}: ${resultado.token}`);
  }

  return { enviado: true, token: resultado?.token };
}
