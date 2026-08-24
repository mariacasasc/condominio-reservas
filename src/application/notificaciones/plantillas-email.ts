interface DatosFranjaHoraria {
  areaNombre: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
}

interface PlantillaEmail {
  asunto: string;
  cuerpoHtml: string;
}

function envoltorioHtml(titulo: string, contenido: string): string {
  return `
    <div style="font-family: sans-serif; color: #2B2620; background-color: #F7F4EF; padding: 24px;">
      <h2 style="color: #2F5233; margin: 0 0 16px;">${titulo}</h2>
      ${contenido}
    </div>
  `.trim();
}

export function plantillaReservaCreada(
  datos: DatosFranjaHoraria & { huespedNombre: string },
): PlantillaEmail {
  return {
    asunto: `Nueva reserva pendiente — ${datos.areaNombre}`,
    cuerpoHtml: envoltorioHtml(
      "Tenés una reserva pendiente de revisión",
      `<p><strong>${datos.huespedNombre}</strong> solicitó reservar <strong>${datos.areaNombre}</strong>.</p>
       <p>Fecha: ${datos.fecha}<br/>Horario: ${datos.horaInicio} a ${datos.horaFin}</p>
       <p>Ingresá a la plataforma para aprobar o rechazar la solicitud.</p>`,
    ),
  };
}

export function plantillaReservaDecidida(
  datos: DatosFranjaHoraria & { decision: "aprobada" | "rechazada" },
): PlantillaEmail {
  const aprobada = datos.decision === "aprobada";
  return {
    asunto: `Tu reserva fue ${datos.decision} — ${datos.areaNombre}`,
    cuerpoHtml: envoltorioHtml(
      aprobada ? "¡Tu reserva fue aprobada!" : "Tu reserva fue rechazada",
      `<p>Tu solicitud para <strong>${datos.areaNombre}</strong> quedó <strong style="color: ${
        aprobada ? "#3F7D4A" : "#A63A2E"
      };">${datos.decision}</strong>.</p>
       <p>Fecha: ${datos.fecha}<br/>Horario: ${datos.horaInicio} a ${datos.horaFin}</p>`,
    ),
  };
}
