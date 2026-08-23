import { describe, expect, it } from "vitest";
import { tokenEsValido, type TokenRecuperacionPassword } from "./token-recuperacion-password.entity";

function crearToken(overrides: Partial<TokenRecuperacionPassword> = {}): TokenRecuperacionPassword {
  return {
    id: "token-1",
    usuarioId: "usuario-1",
    tokenHash: "hash",
    expiraEn: new Date("2026-09-01T10:00:00"),
    usadoEn: null,
    createdAt: new Date("2026-09-01T09:00:00"),
    ...overrides,
  };
}

describe("token-recuperacion-password.entity (domain, no framework deps)", () => {
  it("es válido cuando no fue usado y todavía no expiró", () => {
    const token = crearToken({ expiraEn: new Date("2026-09-01T10:00:00") });
    const ahora = new Date("2026-09-01T09:30:00");
    expect(tokenEsValido(token, ahora)).toBe(true);
  });

  it("no es válido si ya fue usado", () => {
    const token = crearToken({ usadoEn: new Date("2026-09-01T09:15:00") });
    const ahora = new Date("2026-09-01T09:30:00");
    expect(tokenEsValido(token, ahora)).toBe(false);
  });

  it("no es válido si ya expiró", () => {
    const token = crearToken({ expiraEn: new Date("2026-09-01T09:00:00") });
    const ahora = new Date("2026-09-01T09:30:00");
    expect(tokenEsValido(token, ahora)).toBe(false);
  });
});
