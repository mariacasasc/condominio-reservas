import { Resend } from "resend";
import type { EmailNotificacion, NotificadorPort } from "@/domain/notificacion/notificador.port";

export class ResendNotificador implements NotificadorPort {
  private readonly resend: Resend;
  private readonly remitente: string;

  constructor(apiKey = process.env.RESEND_API_KEY ?? "") {
    this.resend = new Resend(apiKey);
    // "onboarding@resend.dev" es el remitente de prueba de Resend: no requiere
    // dominio verificado, pero solo entrega al email de la cuenta de Resend.
    this.remitente = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  }

  async enviarEmail(notificacion: EmailNotificacion): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.remitente,
      to: notificacion.destinatarioEmail,
      subject: notificacion.asunto,
      html: notificacion.cuerpoHtml,
    });
    if (error) {
      throw new Error(`Resend rechazó el envío: ${error.message}`);
    }
  }
}
