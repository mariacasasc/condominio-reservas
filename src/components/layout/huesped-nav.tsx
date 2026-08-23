"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/huesped/areas-comunes", label: "Áreas comunes" },
  { href: "/huesped/mis-reservas", label: "Mis reservas" },
];

export function HuespedNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl gap-4 px-4">
        {links.map((link) => {
          const activo = pathname.startsWith(link.href);
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
