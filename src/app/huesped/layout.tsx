import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { Header } from "@/components/layout/header";

export default async function HuespedLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.rol !== "huesped") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header nombre={session.user.name ?? session.user.email ?? "Huésped"} rolLabel="Huésped" />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
