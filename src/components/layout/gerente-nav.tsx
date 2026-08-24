"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/gerente", label: "Áreas comunes" },
  { href: "/gerente/usuarios", label: "Usuarios" },
  { href: "/gerente/reservas", label: "Reservas" },
];

export function GerenteNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl gap-4 px-4">
        {links.map((link) => {
          const activo = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                activo && "border-primary text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
