export interface TokenRecuperacionPassword {
  id: string;
  usuarioId: string;
  tokenHash: string;
  expiraEn: Date;
  usadoEn: Date | null;
  createdAt: Date;
}

/** Domain rule: a token is usable only if it hasn't been used and hasn't expired. */
export function tokenEsValido(token: TokenRecuperacionPassword, ahora: Date): boolean {
  return token.usadoEn === null && token.expiraEn > ahora;
}
