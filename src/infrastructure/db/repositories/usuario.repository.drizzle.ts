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
    activo: fila.activo,
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

  async crear(usuario: Omit<Usuario, "id" | "createdAt" | "activo">): Promise<Usuario> {
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

  async listar(condominioId: string): Promise<Usuario[]> {
    const filas = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.condominioId, condominioId));
    return filas.map(aDominio);
  }

  async actualizarActivo(id: string, activo: boolean): Promise<Usuario> {
    const [fila] = await db
      .update(usuarios)
      .set({ activo })
      .where(eq(usuarios.id, id))
      .returning();
    return aDominio(fila);
  }

  async actualizarPasswordHash(id: string, passwordHash: string): Promise<void> {
    await db.update(usuarios).set({ passwordHash }).where(eq(usuarios.id, id));
  }
}
