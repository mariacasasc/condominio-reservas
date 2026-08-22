import { auth } from "@/infrastructure/auth/auth";
import { listarAreasComunes } from "@/application/areas-comunes/listar-areas-comunes";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function GerenteAreasComunesPage() {
  const session = await auth();
  const condominioId = session!.user.condominioId;

  const areas = await listarAreasComunes(condominioId, {
    areaComunRepository: new DrizzleAreaComunRepository(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Áreas comunes</h1>
        <p className="text-sm text-muted-foreground">
          Espacios disponibles para reserva en tu condominio.
        </p>
      </div>

      {areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay áreas comunes registradas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{area.nombre}</CardTitle>
                  <Badge variant={area.activa ? "default" : "destructive"}>
                    {area.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <CardDescription className="capitalize">{area.tipo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {area.descripcion ? <p>{area.descripcion}</p> : null}
                <ul className="space-y-1">
                  <li>Capacidad máxima: {area.capacidadMaxima} personas</li>
                  <li>Duración máxima: {area.duracionMaximaMinutos} minutos</li>
                  <li>Anticipación mínima: {area.anticipacionMinimaHoras} horas</li>
                  <li>Anticipación máxima: {area.anticipacionMaximaDias} días</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
