import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";
import { listarReservasCondominio } from "@/application/reservas/listar-reservas-condominio";
import { listarAreasComunes } from "@/application/areas-comunes/listar-areas-comunes";
import { listarUsuarios } from "@/application/usuarios/listar-usuarios";
import { DrizzleReservaRepository } from "@/infrastructure/db/repositories/reserva.repository.drizzle";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { EstadoReservaBadge, ESTADO_RESERVA_LABEL } from "@/components/reservas/estado-reserva-badge";
import { DecidirReservaForm } from "@/components/forms/decidir-reserva-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EstadoReserva } from "@/domain/reserva/reserva.entity";

const ESTADOS: EstadoReserva[] = ["pendiente", "aprobada", "rechazada", "cancelada"];

interface PageProps {
  searchParams: Promise<{ areaId?: string; fecha?: string; estado?: string }>;
}

export default async function GerenteReservasPage({ searchParams }: PageProps) {
  const { areaId, fecha, estado } = await searchParams;
  const session = await auth();
  const condominioId = session!.user.condominioId;

  const estadoFiltro: EstadoReserva = ESTADOS.includes(estado as EstadoReserva)
    ? (estado as EstadoReserva)
    : "pendiente";

  const [reservas, areas, usuarios] = await Promise.all([
    listarReservasCondominio(
      condominioId,
      { areaId: areaId || undefined, fecha: fecha || undefined, estado: estadoFiltro },
      { reservaRepository: new DrizzleReservaRepository() },
    ),
    listarAreasComunes(condominioId, { areaComunRepository: new DrizzleAreaComunRepository() }),
    listarUsuarios(condominioId, { usuarioRepository: new DrizzleUsuarioRepository() }),
  ]);

  const nombrePorAreaId = new Map(areas.map((area) => [area.id, area.nombre]));
  const nombrePorUsuarioId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre]));
  const ordenadas = [...reservas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reservas</h1>
        <p className="text-sm text-muted-foreground">
          Bandeja de reservas del condominio. Aprobá o rechazá las pendientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-4 sm:items-end">
            <div className="space-y-2">
              <label htmlFor="estado" className="text-sm font-medium">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                defaultValue={estadoFiltro}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_RESERVA_LABEL[e]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="areaId" className="text-sm font-medium">
                Área
              </label>
              <select
                id="areaId"
                name="areaId"
                defaultValue={areaId ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Todas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="fecha" className="text-sm font-medium">
                Fecha
              </label>
              <input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={fecha ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="sm">
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {ordenadas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reservas que coincidan con el filtro.</p>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Área</th>
                    <th className="py-2 pr-4 font-medium">Huésped</th>
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Horario</th>
                    <th className="py-2 pr-4 font-medium">Personas</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {ordenadas.map((reserva) => (
                    <tr key={reserva.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 text-foreground">
                        <Link
                          href={`/gerente/reservas/${reserva.id}`}
                          className="font-medium hover:underline"
                        >
                          {nombrePorAreaId.get(reserva.areaId) ?? "Área común"}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-foreground">
                        {nombrePorUsuarioId.get(reserva.usuarioId) ?? "Huésped"}
                      </td>
                      <td className="py-2 pr-4 text-foreground">{reserva.fecha}</td>
                      <td className="py-2 pr-4 text-foreground">
                        {reserva.horaInicio} a {reserva.horaFin}
                      </td>
                      <td className="py-2 pr-4 text-foreground">{reserva.cantidadPersonas}</td>
                      <td className="py-2 pr-4">
                        <EstadoReservaBadge estado={reserva.estado} />
                      </td>
                      <td className="py-2 pr-4">
                        {reserva.estado === "pendiente" ? (
                          <DecidirReservaForm reservaId={reserva.id} />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
