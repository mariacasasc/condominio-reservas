import { notFound } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { AreaComunForm } from "@/components/forms/area-comun-form";
import { HorarioForm } from "@/components/forms/horario-form";
import { FechaBloqueadaForm } from "@/components/forms/fecha-bloqueada-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  editarAreaComunAction,
  activarDesactivarAreaAction,
  agregarHorarioAction,
  eliminarHorarioAction,
  agregarFechaBloqueadaAction,
  eliminarFechaBloqueadaAction,
} from "@/app/gerente/areas-comunes/actions";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarAreaComunPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const condominioId = session!.user.condominioId;
  const repositorio = new DrizzleAreaComunRepository();

  const area = await repositorio.buscarPorId(id);
  if (!area || area.condominioId !== condominioId) {
    notFound();
  }

  const [horarios, fechasArea, fechasGenerales] = await Promise.all([
    repositorio.horariosDisponibles(id),
    repositorio.fechasBloqueadas(id),
    repositorio.fechasBloqueadasGenerales(),
  ]);

  const bloqueos = [...fechasArea, ...fechasGenerales].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const horariosOrdenados = [...horarios].sort(
    (a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{area.nombre}</h1>
          <p className="text-sm text-muted-foreground">Editá la configuración de esta área común.</p>
        </div>
        <form action={activarDesactivarAreaAction.bind(null, id, !area.activa)}>
          <Button type="submit" variant={area.activa ? "destructive" : "default"} size="sm">
            {area.activa ? "Desactivar" : "Activar"}
          </Button>
        </form>
      </div>

      <AreaComunForm
        action={editarAreaComunAction.bind(null, id)}
        valoresIniciales={area}
        submitLabel="Guardar cambios"
      />

      <Card>
        <CardHeader>
          <CardTitle>Horarios disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <HorarioForm action={agregarHorarioAction.bind(null, id)} />
          {horariosOrdenados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay horarios configurados.</p>
          ) : (
            <ul className="divide-y divide-border">
              {horariosOrdenados.map((horario) => (
                <li key={horario.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">
                    {DIAS_SEMANA[horario.diaSemana]}, {horario.horaInicio} a {horario.horaFin}
                  </span>
                  <form action={eliminarHorarioAction.bind(null, id, horario.id)}>
                    <button type="submit" className="text-xs text-destructive hover:underline">
                      Eliminar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fechas bloqueadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FechaBloqueadaForm action={agregarFechaBloqueadaAction.bind(null, id)} />
          {bloqueos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay fechas bloqueadas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {bloqueos.map((bloqueo) => (
                <li key={bloqueo.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    {bloqueo.fecha}
                    {bloqueo.motivo ? ` — ${bloqueo.motivo}` : ""}
                    {bloqueo.areaId === null ? <Badge variant="secondary">Todo el condominio</Badge> : null}
                  </span>
                  <form action={eliminarFechaBloqueadaAction.bind(null, id, bloqueo.id)}>
                    <button type="submit" className="text-xs text-destructive hover:underline">
                      Eliminar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
