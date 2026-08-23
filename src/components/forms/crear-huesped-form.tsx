"use client";

import { useActionState, useRef, useEffect } from "react";
import { crearHuespedAction, type CrearHuespedState } from "@/app/gerente/usuarios/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const estadoInicial: CrearHuespedState = {};

export function CrearHuespedForm() {
  const [state, formAction, isPending] = useActionState(crearHuespedAction, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dar de alta un huésped</CardTitle>
        <CardDescription>
          El huésped podrá iniciar sesión con el correo y la contraseña que definas acá.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="nombre" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
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
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
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
          {state?.error ? (
            <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={isPending} className="sm:col-span-3 sm:w-fit">
            {isPending ? "Creando..." : "Crear huésped"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
