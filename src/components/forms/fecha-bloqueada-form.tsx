"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

export interface FechaBloqueadaFormState {
  error?: string;
  success?: boolean;
}

interface FechaBloqueadaFormProps {
  action: (
    prevState: FechaBloqueadaFormState | undefined,
    formData: FormData,
  ) => Promise<FechaBloqueadaFormState>;
}

const estadoInicial: FechaBloqueadaFormState = {};

export function FechaBloqueadaForm({ action }: FechaBloqueadaFormProps) {
  const [state, formAction, isPending] = useActionState(action, estadoInicial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4 sm:items-end">
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
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="motivo" className="text-sm font-medium">
          Motivo (opcional)
        </label>
        <input
          id="motivo"
          name="motivo"
          type="text"
          placeholder="Feriado, mantenimiento..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input id="general" name="general" type="checkbox" className="size-4 rounded border-input" />
        <label htmlFor="general" className="text-sm font-medium">
          Todo el condominio
        </label>
      </div>
      <Button type="submit" disabled={isPending} size="sm" className="sm:col-span-4 sm:w-fit">
        {isPending ? "Agregando..." : "Bloquear fecha"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive sm:col-span-4">{state.error}</p> : null}
    </form>
  );
}
