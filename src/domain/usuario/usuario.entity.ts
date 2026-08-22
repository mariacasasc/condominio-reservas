/**
 * Roles supported by the platform. Kept as a literal union (not an enum) so the
 * domain stays framework-agnostic and trivially serializable.
 */
export type Rol = "gerente" | "huesped";

export interface Usuario {
  id: string;
  condominioId: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  createdAt: Date;
}

/** Usuario shape safe to expose to the UI/session — never carries the hash. */
export type UsuarioPublico = Omit<Usuario, "passwordHash">;

export function toUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    condominioId: usuario.condominioId,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    createdAt: usuario.createdAt,
  };
}
