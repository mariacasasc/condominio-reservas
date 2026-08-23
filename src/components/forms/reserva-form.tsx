"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ReservaFormState {
  error?: string;
  success?: boolean;
}

interface ReservaFormProps {
  action: (prevState: ReservaFormState | undefined, formData: FormData) => Promise<ReservaFormState>;
}

const estadoInicial: ReservaFormState = {};

export function ReservaForm({ action }: ReservaFormProps) {
  const [state, formAction, isPending] = useActionState(action, estadoInicial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la reserva</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="fecha" className="text-sm font-medium">
              Fecha
            </label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="cantidadPersonas" className="text-sm font-medium">
              Cantidad de personas
            </label>
            <input
              id="cantidadPersonas"
              name="cantidadPersonas"
              type="number"
              min={1}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="horaInicio" className="text-sm font-medium">
              Hora de inicio
            </label>
            <input
              id="horaInicio"
              name="horaInicio"
              type="time"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="horaFin" className="text-sm font-medium">
              Hora de fin
            </label>
            <input
              id="horaFin"
              name="horaFin"
              type="time"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="notas" className="text-sm font-medium">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              name="notas"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {state?.error ? <p className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
          <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
            {isPending ? "Reservando..." : "Solicitar reserva"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
