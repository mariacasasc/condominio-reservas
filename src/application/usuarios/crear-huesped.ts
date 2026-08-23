import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import type { PasswordHasher } from "@/domain/usuario/password-hasher";
import { toUsuarioPublico, type UsuarioPublico } from "@/domain/usuario/usuario.entity";

export interface CrearHuespedDeps {
  usuarioRepository: UsuarioRepository;
  passwordHasher: PasswordHasher;
}

export interface CrearHuespedComando {
  condominioId: string;
  nombre: string;
  email: string;
  password: string;
}

export class EmailDuplicadoError extends Error {}

/**
 * Use case: a gerente grants platform access to a new huesped. There's no
 * public sign-up — this is the only way a huesped account comes to exist.
 */
export async function crearHuesped(
  comando: CrearHuespedComando,
  deps: CrearHuespedDeps,
): Promise<UsuarioPublico> {
  const existente = await deps.usuarioRepository.buscarPorEmail(comando.email);
  if (existente) {
    throw new EmailDuplicadoError("Ya existe un usuario registrado con ese correo");
  }

  const passwordHash = await deps.passwordHasher.hash(comando.password);
  const usuario = await deps.usuarioRepository.crear({
    condominioId: comando.condominioId,
    nombre: comando.nombre,
    email: comando.email,
    passwordHash,
    rol: "huesped",
  });

  return toUsuarioPublico(usuario);
}
