export type EstadoReserva = "pendiente" | "aprobada" | "rechazada" | "cancelada";

export interface Reserva {
  id: string;
  areaId: string;
  usuarioId: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
  cantidadPersonas: number;
  estado: EstadoReserva;
  notas: string | null;
  revisadoPor: string | null;
  revisadoEn: Date | null;
  createdAt: Date;
}

/** Valid state transitions for a reservation's approval workflow. */
const TRANSICIONES_VALIDAS: Record<EstadoReserva, EstadoReserva[]> = {
  pendiente: ["aprobada", "rechazada", "cancelada"],
  aprobada: ["cancelada"],
  rechazada: [],
  cancelada: [],
};

export function puedeTransicionar(desde: EstadoReserva, hacia: EstadoReserva): boolean {
  return TRANSICIONES_VALIDAS[desde].includes(hacia);
}

/** Domain rule: the reservation must respect the area's min/max lead time. */
export function respetaAnticipacion(
  fechaHoraInicio: Date,
  ahora: Date,
  anticipacionMinimaHoras: number,
  anticipacionMaximaDias: number,
): boolean {
  const diffHoras = (fechaHoraInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  const diffDias = diffHoras / 24;
  return diffHoras >= anticipacionMinimaHoras && diffDias <= anticipacionMaximaDias;
}

/** Domain rule: end time must be strictly after start time. */
export function tieneHorarioValido(horaInicio: string, horaFin: string): boolean {
  return horaInicio < horaFin;
}

/** Domain rule: duration must not exceed the area's maximum. */
export function respetaDuracionMaxima(
  horaInicio: string,
  horaFin: string,
  duracionMaximaMinutos: number,
): boolean {
  const [hIni, mIni] = horaInicio.split(":").map(Number);
  const [hFin, mFin] = horaFin.split(":").map(Number);
  const minutos = hFin * 60 + mFin - (hIni * 60 + mIni);
  return minutos > 0 && minutos <= duracionMaximaMinutos;
}

/** Domain rule: two reservations for the same area overlap in time. */
export function seSuperponen(a: Pick<Reserva, "fecha" | "horaInicio" | "horaFin">, b: Pick<Reserva, "fecha" | "horaInicio" | "horaFin">): boolean {
  if (a.fecha !== b.fecha) return false;
  return a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;
}
