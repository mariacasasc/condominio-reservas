import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo válido" }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const solicitarRecuperacionSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo válido" }),
});

export type SolicitarRecuperacionInput = z.infer<typeof solicitarRecuperacionSchema>;

export const restablecerPasswordSchema = z.object({
  token: z.string().min(1, { message: "Token inválido" }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
});

export type RestablecerPasswordInput = z.infer<typeof restablecerPasswordSchema>;
