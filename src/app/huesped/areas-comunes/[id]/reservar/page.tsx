import { notFound } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { ReservaForm } from "@/components/forms/reserva-form";
import { crearReservaAction } from "@/app/huesped/areas-comunes/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservarAreaComunPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const condominioId = session!.user.condominioId;
  const repositorio = new DrizzleAreaComunRepository();

  const area = await repositorio.buscarPorId(id);
  if (!area || area.condominioId !== condominioId || !area.activa) {
    notFound();
  }

  const horarios = await repositorio.horariosDisponibles(id);
  const horariosOrdenados = [...horarios].sort(
    (a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reservar {area.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Capacidad máxima: {area.capacidadMaxima} personas · Duración máxima:{" "}
          {area.duracionMaximaMinutos} minutos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {horariosOrdenados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta área todavía no tiene horarios configurados por el gerente.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {horariosOrdenados.map((horario) => (
                <li key={horario.id}>
                  {DIAS_SEMANA[horario.diaSemana]}: {horario.horaInicio} a {horario.horaFin}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ReservaForm action={crearReservaAction.bind(null, id)} />
    </div>
  );
}
