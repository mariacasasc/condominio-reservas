import { z } from "zod";

export const crearAreaComunSchema = z.object({
  nombre: z.string().min(2).max(100),
  tipo: z.string().min(2).max(50),
  descripcion: z.string().max(500).optional(),
  capacidadMaxima: z.coerce.number().int().positive(),
  duracionMaximaMinutos: z.coerce.number().int().positive(),
  anticipacionMinimaHoras: z.coerce.number().int().min(0),
  anticipacionMaximaDias: z.coerce.number().int().positive(),
});

export type CrearAreaComunInput = z.infer<typeof crearAreaComunSchema>;

export const horarioDisponibleSchema = z.object({
  diaSemana: z.coerce.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido"),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido"),
});

export type HorarioDisponibleInput = z.infer<typeof horarioDisponibleSchema>;

export const fechaBloqueadaSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  motivo: z.string().max(200).optional(),
});

export type FechaBloqueadaInput = z.infer<typeof fechaBloqueadaSchema>;
