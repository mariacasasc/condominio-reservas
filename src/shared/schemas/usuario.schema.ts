import { z } from "zod";

export const crearHuespedSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es obligatorio" }).max(150),
  email: z.string().email({ message: "Ingresa un correo válido" }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
});

export type CrearHuespedInput = z.infer<typeof crearHuespedSchema>;

export const desactivarUsuarioSchema = z.object({
  usuarioId: z.string().uuid(),
});

export type DesactivarUsuarioInput = z.infer<typeof desactivarUsuarioSchema>;
