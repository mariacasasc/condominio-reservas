import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";
import { DrizzleReservaRepository } from "@/infrastructure/db/repositories/reserva.repository.drizzle";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { EstadoReservaBadge } from "@/components/reservas/estado-reserva-badge";
import { DecidirReservaForm } from "@/components/forms/decidir-reserva-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalleReservaPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const condominioId = session!.user.condominioId;

  const reservaRepository = new DrizzleReservaRepository();
  const reserva = await reservaRepository.buscarPorId(id);
  if (!reserva) {
    notFound();
  }

  const areaComunRepository = new DrizzleAreaComunRepository();
  const area = await areaComunRepository.buscarPorId(reserva.areaId);
  if (!area || area.condominioId !== condominioId) {
    notFound();
  }

  const usuarioRepository = new DrizzleUsuarioRepository();
  const [huesped, revisor] = await Promise.all([
    usuarioRepository.buscarPorId(reserva.usuarioId),
    reserva.revisadoPor ? usuarioRepository.buscarPorId(reserva.revisadoPor) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/gerente/reservas" className="text-sm text-primary hover:underline">
          ← Volver a la bandeja
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{area.nombre}</h1>
          <p className="text-sm text-muted-foreground">Detalle de la reserva.</p>
        </div>
        <EstadoReservaBadge estado={reserva.estado} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la reserva</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Huésped</p>
            <p className="text-foreground">{huesped?.nombre ?? "Huésped"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha</p>
            <p className="text-foreground">{reserva.fecha}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Horario</p>
            <p className="text-foreground">
              {reserva.horaInicio} a {reserva.horaFin}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Cantidad de personas</p>
            <p className="text-foreground">{reserva.cantidadPersonas}</p>
          </div>
          {reserva.notas ? (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Notas</p>
              <p className="text-foreground">{reserva.notas}</p>
            </div>
          ) : null}
          <div>
            <p className="text-muted-foreground">Solicitada el</p>
            <p className="text-foreground">{reserva.createdAt.toLocaleString("es-CL")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de revisión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reserva.revisadoPor && reserva.revisadoEn ? (
            <div className="text-sm">
              <p className="text-muted-foreground">Revisado por</p>
              <p className="text-foreground">{revisor?.nombre ?? "Gerente"}</p>
              <p className="mt-2 text-muted-foreground">Revisado el</p>
              <p className="text-foreground">{reserva.revisadoEn.toLocaleString("es-CL")}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no fue revisada.</p>
          )}

          {reserva.estado === "pendiente" ? <DecidirReservaForm reservaId={reserva.id} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
