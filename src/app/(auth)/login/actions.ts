"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/infrastructure/auth/auth";
import { loginSchema } from "@/shared/schemas/auth.schema";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Revisa los datos ingresados." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw error;
  }

  const session = await auth();
  const destino = session?.user.rol === "gerente" ? "/gerente" : "/huesped";
  redirect(destino);
}
