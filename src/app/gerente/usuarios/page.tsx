import { auth } from "@/infrastructure/auth/auth";
import { listarUsuarios } from "@/application/usuarios/listar-usuarios";
import { DrizzleUsuarioRepository } from "@/infrastructure/db/repositories/usuario.repository.drizzle";
import { CrearHuespedForm } from "@/components/forms/crear-huesped-form";
import { desactivarUsuarioAction } from "@/app/gerente/usuarios/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROL_LABEL: Record<string, string> = {
  gerente: "Gerente",
  huesped: "Huésped",
};

export default async function GerenteUsuariosPage() {
  const session = await auth();
  const condominioId = session!.user.condominioId;

  const usuarios = await listarUsuarios(condominioId, {
    usuarioRepository: new DrizzleUsuarioRepository(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gerentes y huéspedes con acceso a la plataforma.
        </p>
      </div>

      <CrearHuespedForm />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Nombre</th>
                  <th className="py-2 pr-4 font-medium">Correo</th>
                  <th className="py-2 pr-4 font-medium">Rol</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-foreground">{usuario.nombre}</td>
                    <td className="py-2 pr-4 text-foreground">{usuario.email}</td>
                    <td className="py-2 pr-4 text-foreground">{ROL_LABEL[usuario.rol]}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={usuario.activo ? "default" : "destructive"}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">
                      {usuario.activo ? (
                        <form action={desactivarUsuarioAction.bind(null, usuario.id)}>
                          <button
                            type="submit"
                            className="rounded-md border border-input px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted"
                          >
                            Desactivar
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
