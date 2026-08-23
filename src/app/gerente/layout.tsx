import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { Header } from "@/components/layout/header";
import { GerenteNav } from "@/components/layout/gerente-nav";

export default async function GerenteLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Defense in depth: middleware already gates /gerente/*, this is the
  // second, cheaper line of defense at the layout level.
  if (!session?.user || session.user.rol !== "gerente") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header nombre={session.user.name ?? session.user.email ?? "Gerente"} rolLabel="Gerente" />
      <GerenteNav />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
