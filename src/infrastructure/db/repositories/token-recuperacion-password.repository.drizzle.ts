import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { tokensRecuperacionPassword } from "@/infrastructure/db/schema";
import type { TokenRecuperacionPassword } from "@/domain/usuario/token-recuperacion-password.entity";
import type { TokenRecuperacionPasswordRepository } from "@/domain/usuario/token-recuperacion-password.repository";

function aDominio(
  fila: typeof tokensRecuperacionPassword.$inferSelect,
): TokenRecuperacionPassword {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    tokenHash: fila.tokenHash,
    expiraEn: fila.expiraEn,
    usadoEn: fila.usadoEn,
    createdAt: fila.createdAt,
  };
}

export class DrizzleTokenRecuperacionPasswordRepository
  implements TokenRecuperacionPasswordRepository
{
  async crear(
    token: Omit<TokenRecuperacionPassword, "id" | "createdAt" | "usadoEn">,
  ): Promise<TokenRecuperacionPassword> {
    const [fila] = await db
      .insert(tokensRecuperacionPassword)
      .values({
        usuarioId: token.usuarioId,
        tokenHash: token.tokenHash,
        expiraEn: token.expiraEn,
      })
      .returning();
    return aDominio(fila);
  }

  async buscarPorTokenHash(tokenHash: string): Promise<TokenRecuperacionPassword | null> {
    const [fila] = await db
      .select()
      .from(tokensRecuperacionPassword)
      .where(eq(tokensRecuperacionPassword.tokenHash, tokenHash))
      .limit(1);
    return fila ? aDominio(fila) : null;
  }

  async marcarComoUsado(id: string, usadoEn: Date): Promise<void> {
    await db
      .update(tokensRecuperacionPassword)
      .set({ usadoEn })
      .where(eq(tokensRecuperacionPassword.id, id));
  }
}
