import type { ReservaRepository, FiltrosReservasCondominio } from "@/domain/reserva/reserva.repository";
import type { Reserva } from "@/domain/reserva/reserva.entity";

export interface ListarReservasCondominioDeps {
  reservaRepository: ReservaRepository;
}

/**
 * Use case: list every reserva of a condominio, optionally filtered by area,
 * fecha or estado — powers the gerente's approval inbox.
 */
export async function listarReservasCondominio(
  condominioId: string,
  filtros: FiltrosReservasCondominio,
  deps: ListarReservasCondominioDeps,
): Promise<Reserva[]> {
  return deps.reservaRepository.listarPorCondominio(condominioId, filtros);
}
