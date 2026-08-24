"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  decidirReservaAction,
  type DecidirReservaFormState,
} from "@/app/gerente/reservas/actions";

const estadoInicial: DecidirReservaFormState = {};

export function DecidirReservaForm({ reservaId }: { reservaId: string }) {
  const [state, formAction, isPending] = useActionState(decidirReservaAction, estadoInicial);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <form action={formAction}>
          <input type="hidden" name="reservaId" value={reservaId} />
          <input type="hidden" name="decision" value="aprobada" />
          <Button type="submit" size="sm" disabled={isPending}>
            Aprobar
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="reservaId" value={reservaId} />
          <input type="hidden" name="decision" value="rechazada" />
          <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
            Rechazar
          </Button>
        </form>
      </div>
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </div>
  );
}
