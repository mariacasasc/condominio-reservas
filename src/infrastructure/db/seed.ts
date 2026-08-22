/**
 * Seed script for local development. Requires a running Postgres instance
 * reachable at DATABASE_URL (see docker-compose.yml). Run with:
 *   pnpm db:seed
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
  usuarios,
} from "@/infrastructure/db/schema";

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
  await db.delete(fechasBloqueadas);
  await db.delete(horariosDisponibles);
  await db.delete(areasComunes);
  await db.delete(usuarios);
  await db.delete(condominios);

  const [condominio] = await db
    .insert(condominios)
    .values({
      nombre: "Condominio Los Robles",
      direccion: "Av. Principal 123, Santiago",
    })
    .returning();

  const passwordHash = await hasher.hash("gerente1234");
  const [gerente] = await db
    .insert(usuarios)
    .values({
      condominioId: condominio.id,
      nombre: "María Fernández",
      email: "gerente@losrobles.cl",
      passwordHash,
      rol: "gerente",
    })
    .returning();

  const huespedPasswordHash = await hasher.hash("huesped1234");
  const [huesped] = await db
    .insert(usuarios)
    .values({
      condominioId: condominio.id,
      nombre: "Juan Pérez",
      email: "huesped@losrobles.cl",
      passwordHash: huespedPasswordHash,
      rol: "huesped",
    })
    .returning();

  await db.insert(areasComunes).values([
    {
      condominioId: condominio.id,
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
      condominioId: condominio.id,
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
      condominioId: condominio.id,
      nombre: "Cancha Multicanchas",
      tipo: "deportiva",
      descripcion: "Cancha techada para fútbol, básquetbol y vóleibol.",
      capacidadMaxima: 20,
      duracionMaximaMinutos: 120,
      anticipacionMinimaHoras: 12,
      anticipacionMaximaDias: 15,
      activa: true,
    },
  ]);

  console.log(`Condominio creado: ${condominio.nombre} (${condominio.id})`);
  console.log(`Gerente creado: ${gerente.email} / contraseña: gerente1234`);
  console.log(`Huésped creado: ${huesped.email} / contraseña: huesped1234`);
  console.log("3 áreas comunes creadas.");

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
