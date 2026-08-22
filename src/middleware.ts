import NextAuth from "next-auth";
import { authConfig } from "@/infrastructure/auth/auth.config";

/**
 * Route protection only — runs on the edge runtime, so it uses the
 * Credentials-free config. `authConfig.callbacks.authorized` decides who can
 * reach /gerente/* and /huesped/*.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/gerente/:path*", "/huesped/:path*"],
};
