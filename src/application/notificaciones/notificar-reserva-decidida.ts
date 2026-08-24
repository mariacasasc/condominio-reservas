import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { NotificadorPort } from "@/domain/notificacion/notificador.port";
import type { Reserva } from "@/domain/reserva/reserva.entity";
import { plantillaReservaDecidida } from "./plantillas-email";

export interface NotificarReservaDecididaDeps {
  usuarioRepository: UsuarioRepository;
  areaComunRepository: AreaComunRepository;
  notificadorPort: NotificadorPort;
}

/**
 * Notifies the huesped who made the reserva that it was aprobada/rechazada.
 * Best-effort by design — the caller (aprobarReserva) decides how to handle
 * a failure here, since a failed email must never invalidate an already
 * persisted decision.
 */
export async function notificarReservaDecidida(
  reserva: Reserva,
  deps: NotificarReservaDecididaDeps,
): Promise<void> {
  if (reserva.estado !== "aprobada" && reserva.estado !== "rechazada") {
    return;
  }

  const [huesped, area] = await Promise.all([
    deps.usuarioRepository.buscarPorId(reserva.usuarioId),
    deps.areaComunRepository.buscarPorId(reserva.areaId),
  ]);
  if (!huesped || !area) {
    return;
  }

  const { asunto, cuerpoHtml } = plantillaReservaDecidida({
    areaNombre: area.nombre,
    fecha: reserva.fecha,
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin,
    decision: reserva.estado,
  });

  await deps.notificadorPort.enviarEmail({
    destinatarioEmail: huesped.email,
    destinatarioNombre: huesped.nombre,
    asunto,
    cuerpoHtml,
  });
}
