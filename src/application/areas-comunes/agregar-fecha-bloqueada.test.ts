import { describe, expect, it, vi } from "vitest";
import { agregarFechaBloqueada } from "./agregar-fecha-bloqueada";
import type { AgregarFechaBloqueadaDeps, AgregarFechaBloqueadaComando } from "./agregar-fecha-bloqueada";
import { AreaComunNoEncontradaError } from "./editar-area-comun";
import type { AreaComunRepository } from "@/domain/area-comun/area-comun.repository";
import type { AreaComun, FechaBloqueada } from "@/domain/area-comun/area-comun.entity";

const noUsado = (): never => {
  throw new Error("Método no usado en este test");
};

const CONDOMINIO_A = "condominio-a";
const CONDOMINIO_B = "condominio-b";

function crearArea(overrides: Partial<AreaComun> = {}): AreaComun {
  return {
    id: "area-1",
    condominioId: CONDOMINIO_A,
    nombre: "Quincho",
    tipo: "quincho",
    descripcion: null,
    capacidadMaxima: 10,
    duracionMaximaMinutos: 120,
    anticipacionMinimaHoras: 24,
    anticipacionMaximaDias: 60,
    activa: true,
    ...overrides,
  };
}

describe("agregarFechaBloqueada (aislamiento por condominio)", () => {
  it("persiste el bloqueo cuando el área pertenece al condominio del comando", async () => {
    const area = crearArea();
    const fechaPersistida: FechaBloqueada = {
      id: "bloqueo-1",
      condominioId: CONDOMINIO_A,
      areaId: area.id,
      fecha: "2026-03-01",
      motivo: "Mantenimiento",
    };
    const crearFechaBloqueadaMock = vi.fn(async () => fechaPersistida);

    const areaComunRepository: AreaComunRepository = {
      buscarPorId: async () => area,
      crearFechaBloqueada: crearFechaBloqueadaMock,
      listarPorCondominio: noUsado,
      crear: noUsado,
      actualizar: noUsado,
      actualizarActiva: noUsado,
      horariosDisponibles: noUsado,
      buscarHorarioPorId: noUsado,
      crearHorario: noUsado,
      eliminarHorario: noUsado,
      fechasBloqueadas: noUsado,
      fechasBloqueadasGenerales: noUsado,
      buscarFechaBloqueadaPorId: noUsado,
      eliminarFechaBloqueada: noUsado,
    };

    const deps: AgregarFechaBloqueadaDeps = { areaComunRepository };
    const comando: AgregarFechaBloqueadaComando = {
      condominioId: CONDOMINIO_A,
      areaId: area.id,
      fecha: "2026-03-01",
      motivo: "Mantenimiento",
    };

    const resultado = await agregarFechaBloqueada(comando, deps);

    expect(resultado).toEqual(fechaPersistida);
    expect(crearFechaBloqueadaMock).toHaveBeenCalledWith({
      condominioId: CONDOMINIO_A,
      areaId: area.id,
      fecha: "2026-03-01",
      motivo: "Mantenimiento",
    });
  });

  it("rechaza bloquear un área de otro condominio con el mismo error que un área inexistente", async () => {
    const areaDeOtroCondominio = crearArea({ id: "area-b", condominioId: CONDOMINIO_B });

    function crearDepsSoloBuscarPorId(area: AreaComun | null): AgregarFechaBloqueadaDeps {
      const areaComunRepository: AreaComunRepository = {
        buscarPorId: async () => area,
        listarPorCondominio: noUsado,
        crear: noUsado,
        actualizar: noUsado,
        actualizarActiva: noUsado,
        horariosDisponibles: noUsado,
        buscarHorarioPorId: noUsado,
        crearHorario: noUsado,
        eliminarHorario: noUsado,
        fechasBloqueadas: noUsado,
        fechasBloqueadasGenerales: noUsado,
        buscarFechaBloqueadaPorId: noUsado,
        crearFechaBloqueada: noUsado,
        eliminarFechaBloqueada: noUsado,
      };
      return { areaComunRepository };
    }

    const comandoBase: AgregarFechaBloqueadaComando = {
      condominioId: CONDOMINIO_A,
      areaId: "cualquiera",
      fecha: "2026-03-01",
      motivo: null,
    };

    const errorAreaInexistente = await agregarFechaBloqueada(
      { ...comandoBase, areaId: "area-inexistente" },
      crearDepsSoloBuscarPorId(null),
    ).catch((error: unknown) => error);

    const errorAreaCruzada = await agregarFechaBloqueada(
      { ...comandoBase, areaId: areaDeOtroCondominio.id },
      crearDepsSoloBuscarPorId(areaDeOtroCondominio),
    ).catch((error: unknown) => error);

    expect(errorAreaInexistente).toBeInstanceOf(AreaComunNoEncontradaError);
    expect(errorAreaCruzada).toBeInstanceOf(AreaComunNoEncontradaError);
    expect((errorAreaCruzada as Error).message).toBe((errorAreaInexistente as Error).message);
    expect((errorAreaCruzada as Error).message).toBe("El área común no existe");
  });
});
