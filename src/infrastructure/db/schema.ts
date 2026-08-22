import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["gerente", "huesped"]);
export const estadoReservaEnum = pgEnum("estado_reserva", [
  "pendiente",
  "aprobada",
  "rechazada",
  "cancelada",
]);

/** One row today; modeled with an id so the platform can go multi-tenant later. */
export const condominios = pgTable("condominios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  direccion: varchar("direccion", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  condominioId: uuid("condominio_id")
    .notNull()
    .references(() => condominios.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: rolEnum("rol").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const areasComunes = pgTable("areas_comunes", {
  id: uuid("id").primaryKey().defaultRandom(),
  condominioId: uuid("condominio_id")
    .notNull()
    .references(() => condominios.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  // Free text on purpose: a gerente can introduce new area types without a migration.
  tipo: varchar("tipo", { length: 50 }).notNull(),
  descripcion: text("descripcion"),
  capacidadMaxima: integer("capacidad_maxima").notNull(),
  duracionMaximaMinutos: integer("duracion_maxima_minutos").notNull(),
  anticipacionMinimaHoras: integer("anticipacion_minima_horas").notNull(),
  anticipacionMaximaDias: integer("anticipacion_maxima_dias").notNull(),
  activa: boolean("activa").notNull().default(true),
});

/** Recurring weekly availability window for an area. */
export const horariosDisponibles = pgTable("horarios_disponibles", {
  id: uuid("id").primaryKey().defaultRandom(),
  areaId: uuid("area_id")
    .notNull()
    .references(() => areasComunes.id, { onDelete: "cascade" }),
  diaSemana: integer("dia_semana").notNull(), // 0 (Sunday) - 6 (Saturday)
  horaInicio: time("hora_inicio").notNull(),
  horaFin: time("hora_fin").notNull(),
});

/** Holidays and one-off blocks. Null areaId = applies to the whole condominio. */
export const fechasBloqueadas = pgTable("fechas_bloqueadas", {
  id: uuid("id").primaryKey().defaultRandom(),
  areaId: uuid("area_id").references(() => areasComunes.id, { onDelete: "cascade" }),
  fecha: date("fecha").notNull(),
  motivo: text("motivo"),
});

export const reservas = pgTable("reservas", {
  id: uuid("id").primaryKey().defaultRandom(),
  areaId: uuid("area_id")
    .notNull()
    .references(() => areasComunes.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  fecha: date("fecha").notNull(),
  horaInicio: time("hora_inicio").notNull(),
  horaFin: time("hora_fin").notNull(),
  cantidadPersonas: integer("cantidad_personas").notNull(),
  estado: estadoReservaEnum("estado").notNull().default("pendiente"),
  notas: text("notas"),
  revisadoPor: uuid("revisado_por").references(() => usuarios.id),
  revisadoEn: timestamp("revisado_en", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
