import type { TokenRecuperacionPassword } from "./token-recuperacion-password.entity";

export interface TokenRecuperacionPasswordRepository {
  crear(
    token: Omit<TokenRecuperacionPassword, "id" | "createdAt" | "usadoEn">,
  ): Promise<TokenRecuperacionPassword>;
  buscarPorTokenHash(tokenHash: string): Promise<TokenRecuperacionPassword | null>;
  marcarComoUsado(id: string, usadoEn: Date): Promise<void>;
}
