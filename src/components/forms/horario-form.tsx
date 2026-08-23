"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

export interface HorarioFormState {
  error?: string;
  success?: boolean;
}

interface HorarioFormProps {
  action: (prevState: HorarioFormState | undefined, formData: FormData) => Promise<HorarioFormState>;
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const estadoInicial: HorarioFormState = {};

export function HorarioForm({ action }: HorarioFormProps) {
  const [state, formAction, isPending] = useActionState(action, estadoInicial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div className="space-y-2">
        <label htmlFor="diaSemana" className="text-sm font-medium">
          Día
        </label>
        <select
          id="diaSemana"
          name="diaSemana"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {DIAS_SEMANA.map((dia, indice) => (
            <option key={dia} value={indice}>
              {dia}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="horaInicio" className="text-sm font-medium">
          Desde
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
          Hasta
        </label>
        <input
          id="horaFin"
          name="horaFin"
          type="time"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Agregando..." : "Agregar horario"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive sm:col-span-4">{state.error}</p> : null}
    </form>
  );
}
