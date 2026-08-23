import { AreaComunForm } from "@/components/forms/area-comun-form";
import { crearAreaComunAction } from "@/app/gerente/areas-comunes/actions";

export default function NuevaAreaComunPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nueva área común</h1>
        <p className="text-sm text-muted-foreground">
          Configurá un nuevo espacio reservable para tu condominio.
        </p>
      </div>

      <AreaComunForm action={crearAreaComunAction} submitLabel="Crear área" />
    </div>
  );
}
