import { z } from "zod";

const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const crearReservaSchema = z.object({
  areaId: z.string().uuid(),
  fecha: z.string().regex(fechaRegex, { message: "Formato de fecha inválido (YYYY-MM-DD)" }),
  horaInicio: z.string().regex(horaRegex, { message: "Formato de hora inválido (HH:mm)" }),
  horaFin: z.string().regex(horaRegex, { message: "Formato de hora inválido (HH:mm)" }),
  cantidadPersonas: z.number().int().positive(),
  notas: z.string().max(500).optional(),
});

export type CrearReservaInput = z.infer<typeof crearReservaSchema>;

export const aprobarReservaSchema = z.object({
  reservaId: z.string().uuid(),
  decision: z.enum(["aprobada", "rechazada"]),
});

export type AprobarReservaInput = z.infer<typeof aprobarReservaSchema>;
