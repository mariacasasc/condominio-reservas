import type { ReservaRepository } from "@/domain/reserva/reserva.repository";
import type { Reserva } from "@/domain/reserva/reserva.entity";

export interface ListarMisReservasDeps {
  reservaRepository: ReservaRepository;
}

/**
 * Use case: list every reserva made by a given huesped, regardless of state.
 */
export async function listarMisReservas(
  usuarioId: string,
  deps: ListarMisReservasDeps,
): Promise<Reserva[]> {
  return deps.reservaRepository.listarPorUsuario(usuarioId);
}
