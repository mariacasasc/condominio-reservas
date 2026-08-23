import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";
import { listarAreasComunesDisponibles } from "@/application/areas-comunes/listar-areas-comunes-disponibles";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HuespedAreasComunesPage() {
  const session = await auth();
  const condominioId = session!.user.condominioId;

  const areas = await listarAreasComunesDisponibles(condominioId, {
    areaComunRepository: new DrizzleAreaComunRepository(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Áreas comunes</h1>
        <p className="text-sm text-muted-foreground">
          Espacios disponibles para reservar en tu condominio.
        </p>
      </div>

      {areas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay áreas comunes disponibles para reservar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id}>
              <CardHeader>
                <CardTitle>{area.nombre}</CardTitle>
                <CardDescription className="capitalize">{area.tipo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {area.descripcion ? <p>{area.descripcion}</p> : null}
                <ul className="space-y-1">
                  <li>Capacidad máxima: {area.capacidadMaxima} personas</li>
                  <li>Duración máxima: {area.duracionMaximaMinutos} minutos</li>
                </ul>
                <Button asChild size="sm">
                  <Link href={`/huesped/areas-comunes/${area.id}/reservar`}>Reservar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
