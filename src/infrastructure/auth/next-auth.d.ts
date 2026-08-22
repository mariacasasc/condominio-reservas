import type { Rol } from "@/domain/usuario/usuario.entity";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
      condominioId: string;
    } & DefaultSession["user"];
  }

  interface User {
    rol: Rol;
    condominioId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
    condominioId: string;
  }
}
