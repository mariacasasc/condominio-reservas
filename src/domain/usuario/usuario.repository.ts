import type { Usuario } from "./usuario.entity";

/**
 * Port (in the hexagonal sense): the application layer depends on this
 * interface only. Infrastructure provides the concrete implementation
 * (see infrastructure/db/repositories/usuario.repository.drizzle.ts).
 */
export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  crear(usuario: Omit<Usuario, "id" | "createdAt">): Promise<Usuario>;
}
