/**
 * Seed script for local development. Requires a running Postgres instance
 * reachable at DATABASE_URL (see docker-compose.yml). Run with:
 *   pnpm db:seed
 *
 * Two condominios are seeded on purpose (Fase 7): with only one condominio,
 * no cross-tenant leak can ever surface in manual testing. Condominio A
 * ("Los Robles") and condominio B ("Vista Mar") each get their own gerente,
 * huésped, área(s), horarios and a condominio-wide fecha bloqueada, so
 * isolation can be exercised by hand (e.g. try to delete condominio B's
 * fecha bloqueada while logged in as condominio A's gerente) without any
 * bespoke test setup.
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-password-hasher";
import {
  areasComunes,
  condominios,
  fechasBloqueadas,
  horariosDisponibles,
  reservas,
  tokensRecuperacionPassword,
  usuarios,
} from "@/infrastructure/db/schema";

/** Horario amplio (todos los días, 08:00-22:00) para que cualquier reserva de prueba entre dentro de la disponibilidad. */
async function crearHorariosAmplios(
  db: ReturnType<typeof drizzle>,
  areaId: string,
): Promise<void> {
  await db.insert(horariosDisponibles).values(
    Array.from({ length: 7 }, (_, diaSemana) => ({
      areaId,
      diaSemana,
      horaInicio: "08:00",
      horaFin: "22:00",
    })),
  );
}

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }

  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient);
  const hasher = new BcryptPasswordHasher();

  console.log("Seeding database...");

  // Wipe in FK-safe order so `pnpm db:seed` can be re-run without colliding
  // on the unique email constraint.
  await db.delete(reservas);
  await db.delete(tokensRecuperacionPassword);
  await db.delete(fechasBloqueadas);
  await db.delete(horariosDisponibles);
  await db.delete(areasComunes);
  await db.delete(usuarios);
  await db.delete(condominios);

  // ---------------------------------------------------------------------
  // Condominio A: "Los Robles"
  // ---------------------------------------------------------------------
  const [condominioA] = await db
    .insert(condominios)
    .values({
      nombre: "Condominio Los Robles",
      direccion: "Av. Principal 123, Santiago",
    })
    .returning();

  const gerenteAPasswordHash = await hasher.hash("gerente1234");
  const [gerenteA] = await db
    .insert(usuarios)
    .values({
      condominioId: condominioA.id,
      nombre: "María Fernández",
      email: "gerente@losrobles.cl",
      passwordHash: gerenteAPasswordHash,
      rol: "gerente",
    })
    .returning();

  const huespedAPasswordHash = await hasher.hash("huesped1234");
  const [huespedA] = await db
    .insert(usuarios)
    .values({
      condominioId: condominioA.id,
      nombre: "Juan Pérez",
      email: "huesped@losrobles.cl",
      passwordHash: huespedAPasswordHash,
      rol: "huesped",
    })
    .returning();

  // Desactivado a propósito: permite verificar manualmente que un usuario
  // inactivo no puede iniciar sesión (Fase 1).
  const huespedInactivoPasswordHash = await hasher.hash("huesped1234");
  const [huespedInactivoA] = await db
    .insert(usuarios)
    .values({
      condominioId: condominioA.id,
      nombre: "Camila Rojas",
      email: "huesped.inactivo@losrobles.cl",
      passwordHash: huespedInactivoPasswordHash,
      rol: "huesped",
      activo: false,
    })
    .returning();

  const areasA = await db
    .insert(areasComunes)
    .values([
      {
        condominioId: condominioA.id,
        nombre: "Quincho Central",
        tipo: "quincho",
        descripcion: "Espacio techado con parrilla y mesas para eventos familiares.",
        capacidadMaxima: 25,
        duracionMaximaMinutos: 240,
        anticipacionMinimaHoras: 24,
        anticipacionMaximaDias: 30,
        activa: true,
      },
      {
        condominioId: condominioA.id,
        nombre: "Sala de Eventos",
        tipo: "salon",
        descripcion: "Salón multiuso con sistema de sonido y proyector.",
        capacidadMaxima: 50,
        duracionMaximaMinutos: 300,
        anticipacionMinimaHoras: 48,
        anticipacionMaximaDias: 60,
        activa: true,
      },
      {
        condominioId: condominioA.id,
        nombre: "Cancha Multicanchas",
        tipo: "deportiva",
        descripcion: "Cancha techada para fútbol, básquetbol y vóleibol.",
        capacidadMaxima: 20,
        duracionMaximaMinutos: 120,
        anticipacionMinimaHoras: 12,
        anticipacionMaximaDias: 15,
        activa: true,
      },
    ])
    .returning();

  for (const area of areasA) {
    await crearHorariosAmplios(db, area.id);
  }

  // Bloqueo general (areaId null) de condominio A — prueba que
  // fechasBloqueadasGenerales(condominioId) no filtra bloqueos de otro condominio.
  await db.insert(fechasBloqueadas).values({
    condominioId: condominioA.id,
    areaId: null,
    fecha: "2026-12-25",
    motivo: "Navidad (bloqueo general Los Robles)",
  });

  // ---------------------------------------------------------------------
  // Condominio B: "Vista Mar" (Fase 7 — aislamiento multi-condominio)
  // ---------------------------------------------------------------------
  const [condominioB] = await db
    .insert(condominios)
    .values({
      nombre: "Condominio Vista Mar",
      direccion: "Av. Costanera 456, Viña del Mar",
    })
    .returning();

  const gerenteBPasswordHash = await hasher.hash("gerente1234");
  const [gerenteB] = await db
    .insert(usuarios)
    .values({
      condominioId: condominioB.id,
      nombre: "Roberto Silva",
      email: "gerente@vistamar.cl",
      passwordHash: gerenteBPasswordHash,
      rol: "gerente",
    })
    .returning();

  const huespedBPasswordHash = await hasher.hash("huesped1234");
  const [huespedB] = await db
    .insert(usuarios)
    .values({
      condominioId: condominioB.id,
      nombre: "Valentina Muñoz",
      email: "huesped@vistamar.cl",
      passwordHash: huespedBPasswordHash,
      rol: "huesped",
    })
    .returning();

  const [areaB] = await db
    .insert(areasComunes)
    .values({
      condominioId: condominioB.id,
      nombre: "Piscina y Terraza",
      tipo: "piscina",
      descripcion: "Piscina con terraza y zona de camastros frente al mar.",
      capacidadMaxima: 30,
      duracionMaximaMinutos: 180,
      anticipacionMinimaHoras: 12,
      anticipacionMaximaDias: 30,
      activa: true,
    })
    .returning();

  await crearHorariosAmplios(db, areaB.id);

  await db.insert(reservas).values({
    areaId: areaB.id,
    usuarioId: huespedB.id,
    fecha: "2026-09-15",
    horaInicio: "10:00",
    horaFin: "12:00",
    cantidadPersonas: 6,
    estado: "pendiente",
    notas: "Cumpleaños familiar",
  });

  // Bloqueo general (areaId null) de condominio B — su contraparte prueba que
  // el bloqueo general de A no se filtra hacia B (y viceversa).
  await db.insert(fechasBloqueadas).values({
    condominioId: condominioB.id,
    areaId: null,
    fecha: "2026-12-31",
    motivo: "Fin de año (bloqueo general Vista Mar)",
  });

  console.log(`Condominio creado: ${condominioA.nombre} (${condominioA.id})`);
  console.log(`  Gerente: ${gerenteA.email} / contraseña: gerente1234`);
  console.log(`  Huésped: ${huespedA.email} / contraseña: huesped1234`);
  console.log(
    `  Huésped inactivo: ${huespedInactivoA.email} / contraseña: huesped1234 (login debe fallar)`,
  );
  console.log(`  ${areasA.length} áreas comunes creadas, cada una con horario 08:00-22:00 todos los días.`);

  console.log(`Condominio creado: ${condominioB.nombre} (${condominioB.id})`);
  console.log(`  Gerente: ${gerenteB.email} / contraseña: gerente1234`);
  console.log(`  Huésped: ${huespedB.email} / contraseña: huesped1234`);
  console.log(`  1 área común creada (${areaB.nombre}) con horario 08:00-22:00 todos los días.`);
  console.log("  1 reserva pendiente y 1 bloqueo general creados.");

  await queryClient.end();
}

seed()
  .then(() => {
    console.log("Seed completado.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error al ejecutar el seed:", error);
    process.exit(1);
  });
