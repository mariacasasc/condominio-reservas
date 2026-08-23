"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  solicitarRecuperacionAction,
  type RecuperarPasswordState,
} from "@/app/(auth)/recuperar-password/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const estadoInicial: RecuperarPasswordState = {};

export function RecuperarPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    solicitarRecuperacionAction,
    estadoInicial,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>Ingresa tu correo para generar un enlace de recuperación.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.enviado ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Si el correo existe en la plataforma, se generó un enlace de recuperación.
            </p>
            {state.token ? (
              <div className="space-y-2 rounded-md border border-input bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Fase 1 — sin envío de email real. Enlace temporal para pruebas:
                </p>
                <Link
                  href={`/restablecer-password?token=${state.token}`}
                  className="break-all text-sm text-primary underline underline-offset-4"
                >
                  {`/restablecer-password?token=${state.token}`}
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enviando..." : "Generar enlace"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
