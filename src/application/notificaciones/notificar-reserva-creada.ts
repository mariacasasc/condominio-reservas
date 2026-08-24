import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { NotificadorPort } from "@/domain/notificacion/notificador.port";
import type { Reserva } from "@/domain/reserva/reserva.entity";
import type { AreaComun } from "@/domain/area-comun/area-comun.entity";
import { plantillaReservaCreada } from "./plantillas-email";

export interface NotificarReservaCreadaDeps {
  usuarioRepository: UsuarioRepository;
  notificadorPort: NotificadorPort;
}

/**
 * Notifies every active gerente of the reserva's condominio. Best-effort by
 * design — the caller (crearReserva) decides how to handle a failure here,
 * since a failed email must never invalidate an already-persisted reserva.
 */
export async function notificarReservaCreada(
  reserva: Reserva,
  area: AreaComun,
  deps: NotificarReservaCreadaDeps,
): Promise<void> {
  const [huesped, usuariosCondominio] = await Promise.all([
    deps.usuarioRepository.buscarPorId(reserva.usuarioId),
    deps.usuarioRepository.listar(area.condominioId),
  ]);
  const gerentes = usuariosCondominio.filter((u) => u.rol === "gerente" && u.activo);

  const { asunto, cuerpoHtml } = plantillaReservaCreada({
    areaNombre: area.nombre,
    huespedNombre: huesped?.nombre ?? "Un huésped",
    fecha: reserva.fecha,
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin,
  });

  await Promise.all(
    gerentes.map((gerente) =>
      deps.notificadorPort.enviarEmail({
        destinatarioEmail: gerente.email,
        destinatarioNombre: gerente.nombre,
        asunto,
        cuerpoHtml,
      }),
    ),
  );
}
