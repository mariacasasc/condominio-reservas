/**
 * `tipo` is deliberately free text (not a literal union): a manager can
 * register new kinds of common areas without a code change.
 */
export interface AreaComun {
  id: string;
  condominioId: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  capacidadMaxima: number;
  duracionMaximaMinutos: number;
  anticipacionMinimaHoras: number;
  anticipacionMaximaDias: number;
  activa: boolean;
}

export interface HorarioDisponible {
  id: string;
  areaId: string;
  diaSemana: number; // 0 (Sunday) - 6 (Saturday)
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
}

export interface FechaBloqueada {
  id: string;
  areaId: string | null; // null = applies condominium-wide
  fecha: string; // "YYYY-MM-DD"
  motivo: string | null;
}

/** Domain rule: an inactive area cannot be booked. */
export function puedeReservarse(area: AreaComun): boolean {
  return area.activa;
}

/** Domain rule: party size must fit within the area's capacity. */
export function cabeEnCapacidad(area: AreaComun, cantidadPersonas: number): boolean {
  return cantidadPersonas > 0 && cantidadPersonas <= area.capacidadMaxima;
}

/** Domain rule: a horario's start must precede its end. */
export function horarioValido(horario: Pick<HorarioDisponible, "horaInicio" | "horaFin">): boolean {
  return horario.horaInicio < horario.horaFin;
}
