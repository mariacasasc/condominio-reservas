import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Reservas Condominio</h1>
          <p className="text-sm text-muted-foreground">
            Plataforma de reserva de áreas comunes
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
