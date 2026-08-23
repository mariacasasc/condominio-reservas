import { createHash } from "node:crypto";
import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { TokenRecuperacionPasswordRepository } from "@/domain/usuario/token-recuperacion-password.repository";
import { tokenEsValido } from "@/domain/usuario/token-recuperacion-password.entity";
import type { PasswordHasher } from "@/domain/usuario/password-hasher";

export interface RestablecerPasswordDeps {
  usuarioRepository: UsuarioRepository;
  tokenRecuperacionPasswordRepository: TokenRecuperacionPasswordRepository;
  passwordHasher: PasswordHasher;
  ahora?: () => Date;
}

export interface RestablecerPasswordComando {
  token: string;
  passwordNueva: string;
}

export class TokenInvalidoError extends Error {}

/**
 * Use case: consume a recovery token to set a new password. The error is
 * deliberately generic — not-found, expired, and already-used all mean the
 * same thing to the caller: get a new link.
 */
export async function restablecerPassword(
  comando: RestablecerPasswordComando,
  deps: RestablecerPasswordDeps,
): Promise<void> {
  const tokenHash = createHash("sha256").update(comando.token).digest("hex");
  const registro = await deps.tokenRecuperacionPasswordRepository.buscarPorTokenHash(tokenHash);

  const ahora = (deps.ahora ?? (() => new Date()))();
  if (!registro || !tokenEsValido(registro, ahora)) {
    throw new TokenInvalidoError("El enlace no es válido o expiró");
  }

  const passwordHash = await deps.passwordHasher.hash(comando.passwordNueva);
  await deps.usuarioRepository.actualizarPasswordHash(registro.usuarioId, passwordHash);
  await deps.tokenRecuperacionPasswordRepository.marcarComoUsado(registro.id, ahora);
}
