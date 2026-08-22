import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { PasswordHasher } from "@/domain/usuario/password-hasher";
import { toUsuarioPublico, type UsuarioPublico } from "@/domain/usuario/usuario.entity";

export interface AutenticarUsuarioDeps {
  usuarioRepository: UsuarioRepository;
  passwordHasher: PasswordHasher;
}

export interface AutenticarUsuarioComando {
  email: string;
  password: string;
}

export class CredencialesInvalidasError extends Error {}

/**
 * Use case behind the Credentials provider's `authorize` callback. Returns a
 * password-hash-free user on success — this is what ends up in the JWT.
 */
export async function autenticarUsuario(
  comando: AutenticarUsuarioComando,
  deps: AutenticarUsuarioDeps,
): Promise<UsuarioPublico> {
  const usuario = await deps.usuarioRepository.buscarPorEmail(comando.email);
  if (!usuario) {
    throw new CredencialesInvalidasError("Correo o contraseña incorrectos");
  }

  const esValida = await deps.passwordHasher.verificar(comando.password, usuario.passwordHash);
  if (!esValida) {
    throw new CredencialesInvalidasError("Correo o contraseña incorrectos");
  }

  return toUsuarioPublico(usuario);
}
