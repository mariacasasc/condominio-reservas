"use client";

import { useActionState } from "react";
import {
  restablecerPasswordAction,
  type RestablecerPasswordState,
} from "@/app/(auth)/restablecer-password/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const estadoInicial: RestablecerPasswordState = {};

export function RestablecerPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    restablecerPasswordAction,
    estadoInicial,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Elegir nueva contraseña</CardTitle>
        <CardDescription>Ingresa la contraseña con la que vas a iniciar sesión.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
