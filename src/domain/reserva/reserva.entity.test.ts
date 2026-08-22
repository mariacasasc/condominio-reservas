import { describe, expect, it } from "vitest";
import {
  puedeTransicionar,
  respetaAnticipacion,
  respetaDuracionMaxima,
  seSuperponen,
  tieneHorarioValido,
} from "./reserva.entity";

describe("reserva.entity (domain, no framework deps)", () => {
  it("permite pasar de pendiente a aprobada, pero no al revés", () => {
    expect(puedeTransicionar("pendiente", "aprobada")).toBe(true);
    expect(puedeTransicionar("aprobada", "pendiente")).toBe(false);
  });

  it("no permite decidir dos veces una reserva ya rechazada", () => {
    expect(puedeTransicionar("rechazada", "aprobada")).toBe(false);
  });

  it("valida que la hora de fin sea posterior a la de inicio", () => {
    expect(tieneHorarioValido("10:00", "12:00")).toBe(true);
    expect(tieneHorarioValido("12:00", "10:00")).toBe(false);
  });

  it("respeta la duración máxima permitida", () => {
    expect(respetaDuracionMaxima("10:00", "12:00", 120)).toBe(true);
    expect(respetaDuracionMaxima("10:00", "13:00", 120)).toBe(false);
  });

  it("detecta reservas que se superponen en el mismo día", () => {
    const a = { fecha: "2026-09-01", horaInicio: "10:00", horaFin: "12:00" };
    const b = { fecha: "2026-09-01", horaInicio: "11:00", horaFin: "13:00" };
    const c = { fecha: "2026-09-01", horaInicio: "12:00", horaFin: "14:00" };
    expect(seSuperponen(a, b)).toBe(true);
    expect(seSuperponen(a, c)).toBe(false);
  });

  it("exige la anticipación mínima y respeta la máxima", () => {
    const ahora = new Date("2026-09-01T08:00:00");
    const inicioMuyPronto = new Date("2026-09-01T09:00:00");
    const inicioValido = new Date("2026-09-02T09:00:00");
    expect(respetaAnticipacion(inicioMuyPronto, ahora, 24, 30)).toBe(false);
    expect(respetaAnticipacion(inicioValido, ahora, 24, 30)).toBe(true);
  });
});
