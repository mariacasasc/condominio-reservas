import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { usuarios } from "@/infrastructure/db/schema";
import type { Usuario } from "@/domain/usuario/usuario.entity";
import type { UsuarioRepository } from "@/domain/usuario/usuario.repository";

function aDominio(fila: typeof usuarios.$inferSelect): Usuario {
  return {
    id: fila.id,
    condominioId: fila.condominioId,
    nombre: fila.nombre,
    email: fila.email,
    passwordHash: fila.passwordHash,
    rol: fila.rol,
    createdAt: fila.createdAt,
  };
}

export class DrizzleUsuarioRepository implements UsuarioRepository {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const [fila] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    return fila ? aDominio(fila) : null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const [fila] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return fila ? aDominio(fila) : null;
  }

  async crear(usuario: Omit<Usuario, "id" | "createdAt">): Promise<Usuario> {
    const [fila] = await db
      .insert(usuarios)
      .values({
        condominioId: usuario.condominioId,
        nombre: usuario.nombre,
        email: usuario.email,
        passwordHash: usuario.passwordHash,
        rol: usuario.rol,
      })
      .returning();
    return aDominio(fila);
  }
}
