import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HuespedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">
          Reservá áreas comunes de tu condominio y hacé seguimiento de tus reservas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Áreas comunes</CardTitle>
            <CardDescription>Mirá los espacios disponibles y pedí una reserva.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/huesped/areas-comunes">Ver áreas comunes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mis reservas</CardTitle>
            <CardDescription>Revisá el estado de tus reservas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link href="/huesped/mis-reservas">Ver mis reservas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
