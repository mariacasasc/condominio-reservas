import { auth } from "@/infrastructure/auth/auth";
import { generarDashboardGerente } from "@/application/reportes/generar-dashboard-gerente";
import { DrizzleReservaRepository } from "@/infrastructure/db/repositories/reserva.repository.drizzle";
import { DrizzleAreaComunRepository } from "@/infrastructure/db/repositories/area-comun.repository.drizzle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MESES_LABEL = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function labelDeMes(mes: string): string {
  const [anio, mesNum] = mes.split("-").map(Number);
  return `${MESES_LABEL[mesNum - 1]} ${anio}`;
}

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function GerenteDashboardPage({ searchParams }: PageProps) {
  const { mes } = await searchParams;
  const session = await auth();
  const condominioId = session!.user.condominioId;

  const dashboard = await generarDashboardGerente(condominioId, mes || undefined, {
    reservaRepository: new DrizzleReservaRepository(),
    areaComunRepository: new DrizzleAreaComunRepository(),
  });

  const { reservasPorArea, reservasPorMes, tasaAprobacionRechazo, ocupacionPorArea } = dashboard;
  const maxPorArea = Math.max(1, ...reservasPorArea.map((r) => r.cantidad));
  const maxPorMes = Math.max(1, ...reservasPorMes.map((r) => r.cantidad));
  const sinDatosDelMes = tasaAprobacionRechazo.total === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Reportes y ocupación del condominio para {labelDeMes(dashboard.mes)}.
          </p>
        </div>
        <form className="flex items-end gap-2">
          <div className="space-y-2">
            <label htmlFor="mes" className="text-sm font-medium">
              Mes
            </label>
            <input
              id="mes"
              name="mes"
              type="month"
              defaultValue={dashboard.mes}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" size="sm">
            Ver
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Reservas del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{tasaAprobacionRechazo.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">% Aprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">
              {tasaAprobacionRechazo.tasaAprobacionPorcentaje === null
                ? "—"
                : `${tasaAprobacionRechazo.tasaAprobacionPorcentaje.toFixed(0)}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{tasaAprobacionRechazo.pendientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Rechazadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">{tasaAprobacionRechazo.rechazadas}</p>
          </CardContent>
        </Card>
      </div>

      {sinDatosDelMes ? (
        <p className="text-sm text-muted-foreground">
          Este condominio todavía no tiene reservas registradas en {labelDeMes(dashboard.mes)}.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Reservas por área</CardTitle>
        </CardHeader>
        <CardContent>
          {reservasPorArea.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin reservas este mes.</p>
          ) : (
            <div className="space-y-3">
              {reservasPorArea.map((fila) => (
                <div key={fila.areaId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{fila.areaNombre}</span>
                    <span className="text-muted-foreground">{fila.cantidad}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(fila.cantidad / maxPorArea) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservas por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-3">
            {reservasPorMes.map((fila) => (
              <div key={fila.mes} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{fila.cantidad}</span>
                <div
                  className="w-full rounded-t-md bg-secondary"
                  style={{ height: `${(fila.cantidad / maxPorMes) * 100}%`, minHeight: fila.cantidad > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-muted-foreground">{labelDeMes(fila.mes)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ocupación por área</CardTitle>
        </CardHeader>
        <CardContent>
          {ocupacionPorArea.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este condominio todavía no tiene áreas comunes.</p>
          ) : (
            <div className="space-y-3">
              {ocupacionPorArea.map((fila) => (
                <div key={fila.areaId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{fila.areaNombre}</span>
                    <span className="text-muted-foreground">
                      {fila.porcentajeOcupacion.toFixed(0)}%
                      {fila.horasDisponibles === 0 ? " (sin horarios configurados)" : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-success"
                      style={{ width: `${fila.porcentajeOcupacion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
