import type { Usuario } from "./usuario.entity";

/**
 * Port (in the hexagonal sense): the application layer depends on this
 * interface only. Infrastructure provides the concrete implementation
 * (see infrastructure/db/repositories/usuario.repository.drizzle.ts).
 */
export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  crear(usuario: Omit<Usuario, "id" | "createdAt" | "activo">): Promise<Usuario>;
  listar(condominioId: string): Promise<Usuario[]>;
  actualizarActivo(id: string, activo: boolean): Promise<Usuario>;
  actualizarPasswordHash(id: string, passwordHash: string): Promise<void>;
}
