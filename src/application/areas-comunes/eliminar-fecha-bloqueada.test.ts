import { describe, expect, it, vi } from "vitest";
import { eliminarFechaBloqueada } from "./eliminar-fecha-bloqueada";
import type { EliminarFechaBloqueadaDeps, EliminarFechaBloqueadaComando } from "./eliminar-fecha-bloqueada";
import { AreaComunNoEncontradaError } from "./editar-area-comun";
import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { FechaBloqueada } from "@/domain/area-comun/area-comun.entity";

const noUsado = (): never => {
  throw new Error("Método no usado en este test");
};

const CONDOMINIO_A = "condominio-a";
const CONDOMINIO_B = "condominio-b";

function crearDeps(overrides: Partial<AreaComunRepository>): EliminarFechaBloqueadaDeps {
  const areaComunRepository: AreaComunRepository = {
    buscarFechaBloqueadaPorId: noUsado,
    eliminarFechaBloqueada: noUsado,
    listarPorCondominio: noUsado,
    buscarPorId: noUsado,
    crear: noUsado,
    actualizar: noUsado,
    actualizarActiva: noUsado,
    horariosDisponibles: noUsado,
    buscarHorarioPorId: noUsado,
    crearHorario: noUsado,
    eliminarHorario: noUsado,
    fechasBloqueadas: noUsado,
    fechasBloqueadasGenerales: noUsado,
    crearFechaBloqueada: noUsado,
    ...overrides,
  };
  return { areaComunRepository };
}

describe("eliminarFechaBloqueada (aislamiento por condominio)", () => {
  it("elimina el bloqueo cuando pertenece al condominio del comando", async () => {
    const fechaBloqueada: FechaBloqueada = {
      id: "bloqueo-1",
      condominioId: CONDOMINIO_A,
      areaId: "area-1",
      fecha: "2026-03-01",
      motivo: null,
    };
    const eliminarFechaBloqueadaMock = vi.fn(async () => {});
    const deps = crearDeps({
      buscarFechaBloqueadaPorId: async () => fechaBloqueada,
      eliminarFechaBloqueada: eliminarFechaBloqueadaMock,
    });
    const comando: EliminarFechaBloqueadaComando = {
      fechaBloqueadaId: fechaBloqueada.id,
      condominioId: CONDOMINIO_A,
    };

    await eliminarFechaBloqueada(comando, deps);

    expect(eliminarFechaBloqueadaMock).toHaveBeenCalledWith(fechaBloqueada.id);
  });

  it("rechaza eliminar un bloqueo de área ajeno a otro condominio con el mismo error que un id inexistente", async () => {
    const fechaBloqueadaDeOtroCondominio: FechaBloqueada = {
      id: "bloqueo-b",
      condominioId: CONDOMINIO_B,
      areaId: "area-b",
      fecha: "2026-03-01",
      motivo: null,
    };

    const comando = (fechaBloqueadaId: string): EliminarFechaBloqueadaComando => ({
      fechaBloqueadaId,
      condominioId: CONDOMINIO_A,
    });

    const errorIdInexistente = await eliminarFechaBloqueada(
      comando("bloqueo-inexistente"),
      crearDeps({ buscarFechaBloqueadaPorId: async () => null }),
    ).catch((error: unknown) => error);

    const errorCruzado = await eliminarFechaBloqueada(
      comando(fechaBloqueadaDeOtroCondominio.id),
      crearDeps({ buscarFechaBloqueadaPorId: async () => fechaBloqueadaDeOtroCondominio }),
    ).catch((error: unknown) => error);

    expect(errorIdInexistente).toBeInstanceOf(AreaComunNoEncontradaError);
    expect(errorCruzado).toBeInstanceOf(AreaComunNoEncontradaError);
    expect((errorCruzado as Error).message).toBe((errorIdInexistente as Error).message);
    expect((errorCruzado as Error).message).toBe("La fecha bloqueada no existe");
  });

  it("rechaza eliminar un bloqueo de todo el condominio (areaId null) perteneciente a otro condominio", async () => {
    const bloqueoGeneralDeOtroCondominio: FechaBloqueada = {
      id: "bloqueo-general-b",
      condominioId: CONDOMINIO_B,
      areaId: null,
      fecha: "2026-12-25",
      motivo: "Navidad",
    };

    const error = await eliminarFechaBloqueada(
      { fechaBloqueadaId: bloqueoGeneralDeOtroCondominio.id, condominioId: CONDOMINIO_A },
      crearDeps({ buscarFechaBloqueadaPorId: async () => bloqueoGeneralDeOtroCondominio }),
    ).catch((error: unknown) => error);

    expect(error).toBeInstanceOf(AreaComunNoEncontradaError);
    expect((error as Error).message).toBe("La fecha bloqueada no existe");
  });
});
