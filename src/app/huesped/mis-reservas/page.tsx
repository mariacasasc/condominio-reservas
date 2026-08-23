import { auth } from "@/infrastructure/auth/auth";
import { listarMisReservas } from "@/application/reservas/listar-mis-reservas";
import { listarAreasComunes } from "@/application/areas-comunes/listar-areas-comunes";
import { DrizzleReservaRepository } from "@/infrastructure/db/repositories/reserva.repository.drizzle";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EstadoReserva } from "@/domain/reserva/reserva.entity";

const ESTADO_LABEL: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

const ESTADO_CLASSNAME: Record<EstadoReserva, string> = {
  pendiente: "border-transparent bg-secondary text-secondary-foreground",
  aprobada: "border-transparent bg-success/10 text-success",
  rechazada: "border-transparent bg-destructive/10 text-destructive",
  cancelada: "border-transparent bg-muted text-muted-foreground",
};

export default async function MisReservasPage() {
  const session = await auth();
  const usuarioId = session!.user.id;
  const condominioId = session!.user.condominioId;

  const [reservas, areas] = await Promise.all([
    listarMisReservas(usuarioId, { reservaRepository: new DrizzleReservaRepository() }),
    listarAreasComunes(condominioId, { areaComunRepository: new DrizzleAreaComunRepository() }),
  ]);

  const nombrePorAreaId = new Map(areas.map((area) => [area.id, area.nombre]));
  const ordenadas = [...reservas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mis reservas</h1>
        <p className="text-sm text-muted-foreground">Historial y estado de tus reservas.</p>
      </div>

      {ordenadas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no tenés reservas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordenadas.map((reserva) => (
            <Card key={reserva.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{nombrePorAreaId.get(reserva.areaId) ?? "Área común"}</CardTitle>
                  <Badge className={ESTADO_CLASSNAME[reserva.estado]}>
                    {ESTADO_LABEL[reserva.estado]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{reserva.fecha}</p>
                <p>
                  {reserva.horaInicio} a {reserva.horaFin}
                </p>
                <p>
                  {reserva.cantidadPersonas} persona{reserva.cantidadPersonas === 1 ? "" : "s"}
                </p>
                {reserva.notas ? <p>Notas: {reserva.notas}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
