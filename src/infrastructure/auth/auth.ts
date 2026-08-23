import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/infrastructure/auth/auth.config";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-password-hasher";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import {
  autenticarUsuario,
  CredencialesInvalidasError,
  UsuarioInactivoError,
} from "@/application/auth/autenticar-usuario";
import { loginSchema } from "@/shared/schemas/auth.schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        try {
          const usuario = await autenticarUsuario(parsed.data, {
            usuarioRepository: new DrizzleUsuarioRepository(),
            passwordHasher: new BcryptPasswordHasher(),
          });

          return {
            id: usuario.id,
            name: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            condominioId: usuario.condominioId,
          };
        } catch (error) {
          if (error instanceof CredencialesInvalidasError || error instanceof UsuarioInactivoError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
});
