import type { ReservaRepository } from "@/domain/reserva/reserva.repository";
import type { EstadoReserva, Reserva } from "@/domain/reserva/reserva.entity";
import { puedeTransicionar } from "@/domain/reserva/reserva.entity";

export interface AprobarReservaDeps {
  reservaRepository: ReservaRepository;
  ahora?: () => Date;
}

export interface AprobarReservaComando {
  reservaId: string;
  revisadoPor: string; // usuario id of the gerente making the decision
  decision: Extract<EstadoReserva, "aprobada" | "rechazada">;
}

export class ReservaNoEncontradaError extends Error {}
export class TransicionInvalidaError extends Error {}

/**
 * Use case: a gerente approves or rejects a pending reservation. Enforces
 * the domain's state machine — an already-decided reservation cannot be
 * re-decided.
 */
export async function aprobarReserva(
  comando: AprobarReservaComando,
  deps: AprobarReservaDeps,
): Promise<Reserva> {
  const reserva = await deps.reservaRepository.buscarPorId(comando.reservaId);
  if (!reserva) {
    throw new ReservaNoEncontradaError("La reserva no existe");
  }
  if (!puedeTransicionar(reserva.estado, comando.decision)) {
    throw new TransicionInvalidaError(
      `No se puede pasar de "${reserva.estado}" a "${comando.decision}"`,
    );
  }

  const ahora = (deps.ahora ?? (() => new Date()))();
  return deps.reservaRepository.actualizarEstado(comando.reservaId, {
    estado: comando.decision,
    revisadoPor: comando.revisadoPor,
    revisadoEn: ahora,
  });
}
