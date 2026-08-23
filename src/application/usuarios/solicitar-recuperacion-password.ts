import { createHash, randomBytes } from "node:crypto";
import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { TokenRecuperacionPasswordRepository } from "@/domain/usuario/token-recuperacion-password.repository";

const EXPIRACION_MINUTOS = 30;

export interface SolicitarRecuperacionPasswordDeps {
  usuarioRepository: UsuarioRepository;
  tokenRecuperacionPasswordRepository: TokenRecuperacionPasswordRepository;
  ahora?: () => Date;
}

export interface SolicitarRecuperacionPasswordComando {
  email: string;
}

/**
 * Use case: issue a single-use password reset token. Returns null when the
 * email doesn't match an active account — callers must show the same
 * generic message either way, so this doesn't become an account-enumeration
 * oracle.
 */
export async function solicitarRecuperacionPassword(
  comando: SolicitarRecuperacionPasswordComando,
  deps: SolicitarRecuperacionPasswordDeps,
): Promise<{ token: string } | null> {
  const usuario = await deps.usuarioRepository.buscarPorEmail(comando.email);
  if (!usuario || !usuario.activo) {
    return null;
  }

  const ahora = (deps.ahora ?? (() => new Date()))();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiraEn = new Date(ahora.getTime() + EXPIRACION_MINUTOS * 60 * 1000);

  await deps.tokenRecuperacionPasswordRepository.crear({
    usuarioId: usuario.id,
    tokenHash,
    expiraEn,
  });

  return { token };
}
