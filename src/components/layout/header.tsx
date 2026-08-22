import { signOut } from "@/infrastructure/auth/auth";

interface HeaderProps {
  nombre: string;
  rolLabel: string;
}

export function Header({ nombre, rolLabel }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Reservas Condominio</p>
          <p className="text-xs text-muted-foreground">
            {rolLabel} · {nombre}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-input px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
