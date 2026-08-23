import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import { toUsuarioPublico, type UsuarioPublico } from "@/domain/usuario/usuario.entity";

export interface DesactivarUsuarioDeps {
  usuarioRepository: UsuarioRepository;
}

export interface DesactivarUsuarioComando {
  usuarioId: string;
  condominioId: string;
}

export class UsuarioNoEncontradoError extends Error {}

/**
 * Use case: a gerente revokes a usuario's access. condominioId comes from
 * the gerente's own session, not the request — it's the boundary that stops
 * a guessed UUID from reaching a usuario in another condominio.
 */
export async function desactivarUsuario(
  comando: DesactivarUsuarioComando,
  deps: DesactivarUsuarioDeps,
): Promise<UsuarioPublico> {
  const usuario = await deps.usuarioRepository.buscarPorId(comando.usuarioId);
  if (!usuario || usuario.condominioId !== comando.condominioId) {
    throw new UsuarioNoEncontradoError("El usuario no existe");
  }

  const actualizado = await deps.usuarioRepository.actualizarActivo(comando.usuarioId, false);
  return toUsuarioPublico(actualizado);
}
