import type { NextAuthConfig } from "next-auth";
import type { Rol } from "@/domain/usuario/usuario.entity";

/**
 * Edge-safe config: no Credentials provider here (bcrypt/DB access need the
 * Node runtime), so this object alone can back the middleware's `auth()`
 * check. The full config (with the Credentials provider) lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const rol = auth?.user?.rol;

      if (pathname.startsWith("/gerente")) {
        return isLoggedIn && rol === "gerente";
      }
      if (pathname.startsWith("/huesped")) {
        return isLoggedIn && rol === "huesped";
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.rol = user.rol;
        token.condominioId = user.condominioId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as Rol;
      session.user.condominioId = token.condominioId as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
