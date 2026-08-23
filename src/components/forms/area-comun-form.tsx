"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AreaComunFormState {
  error?: string;
  success?: boolean;
}

interface AreaComunFormValores {
  nombre: string;
  tipo: string;
  descripcion: string | null;
  capacidadMaxima: number;
  duracionMaximaMinutos: number;
  anticipacionMinimaHoras: number;
  anticipacionMaximaDias: number;
}

interface AreaComunFormProps {
  action: (prevState: AreaComunFormState | undefined, formData: FormData) => Promise<AreaComunFormState>;
  valoresIniciales?: AreaComunFormValores;
  submitLabel: string;
}

const estadoInicial: AreaComunFormState = {};

export function AreaComunForm({ action, valoresIniciales, submitLabel }: AreaComunFormProps) {
  const [state, formAction, isPending] = useActionState(action, estadoInicial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del área</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="nombre" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              defaultValue={valoresIniciales?.nombre}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="tipo" className="text-sm font-medium">
              Tipo
            </label>
            <input
              id="tipo"
              name="tipo"
              type="text"
              required
              placeholder="Quincho, piscina, salón..."
              defaultValue={valoresIniciales?.tipo}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="descripcion" className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={valoresIniciales?.descripcion ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="capacidadMaxima" className="text-sm font-medium">
              Capacidad máxima (personas)
            </label>
            <input
              id="capacidadMaxima"
              name="capacidadMaxima"
              type="number"
              min={1}
              required
              defaultValue={valoresIniciales?.capacidadMaxima}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="duracionMaximaMinutos" className="text-sm font-medium">
              Duración máxima (minutos)
            </label>
            <input
              id="duracionMaximaMinutos"
              name="duracionMaximaMinutos"
              type="number"
              min={1}
              required
              defaultValue={valoresIniciales?.duracionMaximaMinutos}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="anticipacionMinimaHoras" className="text-sm font-medium">
              Anticipación mínima (horas)
            </label>
            <input
              id="anticipacionMinimaHoras"
              name="anticipacionMinimaHoras"
              type="number"
              min={0}
              required
              defaultValue={valoresIniciales?.anticipacionMinimaHoras}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="anticipacionMaximaDias" className="text-sm font-medium">
              Anticipación máxima (días)
            </label>
            <input
              id="anticipacionMaximaDias"
              name="anticipacionMaximaDias"
              type="number"
              min={1}
              required
              defaultValue={valoresIniciales?.anticipacionMaximaDias}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {state?.error ? <p className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
          {state?.success ? (
            <p className="text-sm text-success sm:col-span-2">Cambios guardados.</p>
          ) : null}
          <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
            {isPending ? "Guardando..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
