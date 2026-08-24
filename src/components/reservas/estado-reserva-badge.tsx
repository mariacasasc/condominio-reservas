import { Badge } from "@/components/ui/badge";
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

export { ESTADO_LABEL as ESTADO_RESERVA_LABEL };

export function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  return <Badge className={ESTADO_CLASSNAME[estado]}>{ESTADO_LABEL[estado]}</Badge>;
}
