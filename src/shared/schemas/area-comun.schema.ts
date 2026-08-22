import { z } from "zod";

export const crearAreaComunSchema = z.object({
  nombre: z.string().min(2).max(100),
  tipo: z.string().min(2).max(50),
  descripcion: z.string().max(500).optional(),
  capacidadMaxima: z.number().int().positive(),
  duracionMaximaMinutos: z.number().int().positive(),
  anticipacionMinimaHoras: z.number().int().min(0),
  anticipacionMaximaDias: z.number().int().positive(),
});

export type CrearAreaComunInput = z.infer<typeof crearAreaComunSchema>;
