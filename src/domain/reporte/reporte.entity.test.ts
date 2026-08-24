import { describe, expect, it } from "vitest";
import type { AreaComun, HorarioDisponible } from "@/domain/area-comun/area-comun.entity";
import type { Reserva } from "@/domain/reserva/reserva.entity";
import {
  contarOcurrenciasDeDiaSemanaEnMes,
  formatearMes,
  ocupacionPorArea,
  reservasPorArea,
  reservasPorMes,
  tasaAprobacionRechazo,
} from "./reporte.entity";

function area(overrides: Partial<AreaComun> = {}): AreaComun {
  return {
    id: "area-1",
    condominioId: "condo-1",
    nombre: "Quincho",
    tipo: "quincho",
    descripcion: null,
    capacidadMaxima: 20,
    duracionMaximaMinutos: 240,
    anticipacionMinimaHoras: 24,
    anticipacionMaximaDias: 30,
    activa: true,
    ...overrides,
  };
}

function reserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: "reserva-1",
    areaId: "area-1",
    usuarioId: "usuario-1",
    fecha: "2026-08-10",
    horaInicio: "10:00",
    horaFin: "12:00",
    cantidadPersonas: 4,
    estado: "aprobada",
    notas: null,
    revisadoPor: null,
    revisadoEn: null,
    createdAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

describe("reporte.entity (domain, no framework deps)", () => {
  describe("formatearMes", () => {
    it("formatea año y mes con cero a la izquierda", () => {
      expect(formatearMes(new Date(2026, 0, 15))).toBe("2026-01");
      expect(formatearMes(new Date(2026, 10, 3))).toBe("2026-11");
    });
  });

  describe("contarOcurrenciasDeDiaSemanaEnMes", () => {
    it("cuenta cuántos domingos hay en agosto 2026", () => {
      // Agosto 2026: domingos 2, 9, 16, 23, 30 -> 5
      expect(contarOcurrenciasDeDiaSemanaEnMes("2026-08", 0)).toBe(5);
    });

    it("cuenta correctamente en febrero de un año bisiesto", () => {
      // Febrero 2028 (bisiesto) tiene 29 días, empieza martes.
      const totalOcurrencias = [0, 1, 2, 3, 4, 5, 6].reduce(
        (total, dia) => total + contarOcurrenciasDeDiaSemanaEnMes("2028-02", dia),
        0,
      );
      expect(totalOcurrencias).toBe(29);
    });
  });

  describe("reservasPorArea", () => {
    it("devuelve un mes sin reservas como lista vacía", () => {
      expect(reservasPorArea([], [area()], "2026-08")).toEqual([]);
    });

    it("agrupa por área y ordena de mayor a menor cantidad", () => {
      const areas = [area({ id: "a1", nombre: "Quincho" }), area({ id: "a2", nombre: "Salón" })];
      const reservas = [
        reserva({ areaId: "a1", fecha: "2026-08-01" }),
        reserva({ areaId: "a1", fecha: "2026-08-05" }),
        reserva({ areaId: "a2", fecha: "2026-08-02" }),
        reserva({ areaId: "a1", fecha: "2026-07-30" }), // fuera del mes filtrado
      ];
      expect(reservasPorArea(reservas, areas, "2026-08")).toEqual([
        { areaId: "a1", areaNombre: "Quincho", cantidad: 2 },
        { areaId: "a2", areaNombre: "Salón", cantidad: 1 },
      ]);
    });
  });

  describe("reservasPorMes", () => {
    it("devuelve los últimos 6 meses en orden cronológico, con ceros donde no hay datos", () => {
      const reservas = [reserva({ fecha: "2026-08-05" }), reserva({ fecha: "2026-06-01" })];
      const resultado = reservasPorMes(reservas, "2026-08");
      expect(resultado.map((r) => r.mes)).toEqual([
        "2026-03",
        "2026-04",
        "2026-05",
        "2026-06",
        "2026-07",
        "2026-08",
      ]);
      expect(resultado.find((r) => r.mes === "2026-08")?.cantidad).toBe(1);
      expect(resultado.find((r) => r.mes === "2026-06")?.cantidad).toBe(1);
      expect(resultado.find((r) => r.mes === "2026-07")?.cantidad).toBe(0);
    });

    it("cruza el límite de año correctamente", () => {
      const resultado = reservasPorMes([], "2026-02");
      expect(resultado.map((r) => r.mes)).toEqual([
        "2025-09",
        "2025-10",
        "2025-11",
        "2025-12",
        "2026-01",
        "2026-02",
      ]);
    });
  });

  describe("tasaAprobacionRechazo", () => {
    it("es null cuando no hay aprobadas ni rechazadas en el mes", () => {
      const reservas = [reserva({ estado: "pendiente", fecha: "2026-08-01" })];
      const resultado = tasaAprobacionRechazo(reservas, "2026-08");
      expect(resultado.tasaAprobacionPorcentaje).toBeNull();
      expect(resultado.pendientes).toBe(1);
      expect(resultado.total).toBe(1);
    });

    it("calcula el porcentaje sobre aprobadas + rechazadas, ignorando pendientes/canceladas", () => {
      const reservas = [
        reserva({ estado: "aprobada", fecha: "2026-08-01" }),
        reserva({ estado: "aprobada", fecha: "2026-08-02" }),
        reserva({ estado: "aprobada", fecha: "2026-08-03" }),
        reserva({ estado: "rechazada", fecha: "2026-08-04" }),
        reserva({ estado: "pendiente", fecha: "2026-08-05" }),
        reserva({ estado: "cancelada", fecha: "2026-08-06" }),
        reserva({ estado: "aprobada", fecha: "2026-07-01" }), // fuera de mes
      ];
      const resultado = tasaAprobacionRechazo(reservas, "2026-08");
      expect(resultado.tasaAprobacionPorcentaje).toBe(75);
      expect(resultado.total).toBe(6);
    });
  });

  describe("ocupacionPorArea", () => {
    it("da 0% cuando el área no tiene horarios configurados", () => {
      const areas = [area({ id: "a1" })];
      const horariosPorAreaId = new Map<string, HorarioDisponible[]>([["a1", []]]);
      const resultado = ocupacionPorArea([], areas, horariosPorAreaId, "2026-08");
      expect(resultado).toEqual([
        { areaId: "a1", areaNombre: "Quincho", horasDisponibles: 0, horasReservadas: 0, porcentajeOcupacion: 0 },
      ]);
    });

    it("calcula horas disponibles a partir de las ocurrencias del día de semana en el mes", () => {
      const areas = [area({ id: "a1" })];
      // Agosto 2026: 5 domingos. Horario domingo 09:00-13:00 = 4h -> 20h disponibles.
      const horarios: HorarioDisponible[] = [
        { id: "h1", areaId: "a1", diaSemana: 0, horaInicio: "09:00", horaFin: "13:00" },
      ];
      const horariosPorAreaId = new Map([["a1", horarios]]);
      const reservas = [
        reserva({ areaId: "a1", estado: "aprobada", fecha: "2026-08-02", horaInicio: "09:00", horaFin: "11:00" }),
      ];
      const [resultado] = ocupacionPorArea(reservas, areas, horariosPorAreaId, "2026-08");
      expect(resultado.horasDisponibles).toBe(20);
      expect(resultado.horasReservadas).toBe(2);
      expect(resultado.porcentajeOcupacion).toBe(10);
    });

    it("capea el porcentaje de ocupación a 100%", () => {
      const areas = [area({ id: "a1" })];
      const horarios: HorarioDisponible[] = [
        { id: "h1", areaId: "a1", diaSemana: 0, horaInicio: "09:00", horaFin: "10:00" },
      ];
      const horariosPorAreaId = new Map([["a1", horarios]]);
      // Varias reservas aprobadas que en conjunto superan las horas "disponibles" nominales.
      const reservas = [
        reserva({ areaId: "a1", estado: "aprobada", fecha: "2026-08-02", horaInicio: "08:00", horaFin: "12:00" }),
        reserva({ areaId: "a1", estado: "aprobada", fecha: "2026-08-09", horaInicio: "08:00", horaFin: "12:00" }),
      ];
      const [resultado] = ocupacionPorArea(reservas, areas, horariosPorAreaId, "2026-08");
      expect(resultado.porcentajeOcupacion).toBe(100);
    });

    it("ignora reservas pendientes/rechazadas al calcular horas reservadas", () => {
      const areas = [area({ id: "a1" })];
      const horarios: HorarioDisponible[] = [
        { id: "h1", areaId: "a1", diaSemana: 0, horaInicio: "09:00", horaFin: "13:00" },
      ];
      const horariosPorAreaId = new Map([["a1", horarios]]);
      const reservas = [
        reserva({ areaId: "a1", estado: "pendiente", fecha: "2026-08-02", horaInicio: "09:00", horaFin: "11:00" }),
        reserva({ areaId: "a1", estado: "rechazada", fecha: "2026-08-09", horaInicio: "09:00", horaFin: "11:00" }),
      ];
      const [resultado] = ocupacionPorArea(reservas, areas, horariosPorAreaId, "2026-08");
      expect(resultado.horasReservadas).toBe(0);
    });
  });
});
