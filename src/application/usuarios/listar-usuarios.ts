import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";
import { toUsuarioPublico, type UsuarioPublico } from "@/domain/usuario/usuario.entity";

export interface ListarUsuariosDeps {
  usuarioRepository: UsuarioRepository;
}

/**
 * Use case: list every usuario registered for a condominio, active or not,
 * so a gerente can manage access.
 */
export async function listarUsuarios(
  condominioId: string,
  deps: ListarUsuariosDeps,
): Promise<UsuarioPublico[]> {
  const usuarios = await deps.usuarioRepository.listar(condominioId);
  return usuarios.map(toUsuarioPublico);
}
