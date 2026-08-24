export interface EmailNotificacion {
  destinatarioEmail: string;
  destinatarioNombre: string;
  asunto: string;
  cuerpoHtml: string;
}

/**
 * Port (in the hexagonal sense): the application layer depends on this
 * interface only. Infrastructure provides the concrete implementation
 * (see infrastructure/notificaciones/resend-notificador.ts).
 */
export interface NotificadorPort {
  enviarEmail(notificacion: EmailNotificacion): Promise<void>;
}
