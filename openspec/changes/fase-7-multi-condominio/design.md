# Design: Fase 7 — Multi-condominio real (condominio isolation audit)

## Technical Approach

Isolation stays in the **application layer**, enforced by the fetch-then-compare convention already proven in `desactivar-usuario.ts:24-27` and `aprobar-reserva.ts:43-46`: fetch the entity unscoped by raw ID, compare `entity.condominioId !== comando.condominioId`, throw the same NotFound-style error used for a genuinely missing row. The domain keeps zero framework deps; repositories stay dumb. One schema column is added only where scope is underivable (`fechas_bloqueadas`, whose `area_id` is nullable). `reservas` is untouched — its `area_id` is NOT NULL, so scope resolves via `areasComunes`.

## Architecture Decisions

| # | Decision | Alternatives rejected | Rationale |
|---|---|---|---|
| 1 | `fechas_bloqueadas.condominio_id` NOT NULL FK → `condominios(id)`, `ON DELETE CASCADE` | Non-null `area_id` + virtual area; join table; leave nullable | A condominio-wide row (`area_id IS NULL`) has no join path. Nullable would keep the unchecked branch alive. Matches `usuarios`/`areas_comunes` FK style exactly. |
| 2 | **No** secondary index on the new column | `INDEX (condominio_id, area_id)` | `schema.ts` declares zero secondary indexes today, including on `areas_comunes.condominio_id`. Table is tiny (holidays). Indexing one FK inconsistently is noise; Fase 8 owns measured indexing. |
| 3 | `eliminar-fecha-bloqueada` compares the row's **own** `condominioId`, dropping the `areaId` branch | Keep the area-derived check and add the column check | Column is now authoritative for both branches. Net line reduction, one code path, no `if (areaId)` fork. |
| 4 | `crear-reserva` folds the tenant check into the existing `!area` guard | Separate `throw` after it | Guarantees byte-identical message (`"El área común no existe"`) for foreign vs. nonexistent — existence is never leaked. |
| 5 | Fakes are **colocated per test file**, no shared module | `src/application/_fakes/` toolkit | Proposal Risk 4: avoid establishing a framework by accident. Fase 8 owns the shared fake-repository toolkit. |

## Data Flow

    Server Action / Page ──(session.user.condominioId)──→ Use case
                                                             │
                                          buscarPorId(rawId) │
                                                             ▼
                                          entity.condominioId !== comando.condominioId
                                                             │
                                       ┌─────────────────────┴──────────────────┐
                                    throw NotFound (same msg)              proceed → repo write

## File Changes

| File | Action | Description |
|---|---|---|
| `src/infrastructure/db/schema.ts` | Modify | `fechasBloqueadas.condominioId` uuid NOT NULL FK cascade |
| `drizzle/0002_*.sql` + `drizzle/meta/` | Create | `pnpm db:generate`, then hand-edit body to add-nullable → backfill → SET NOT NULL |
| `src/domain/area-comun/area-comun.entity.ts` | Modify | `FechaBloqueada.condominioId: string` |
| `src/domain/area-comun/area-comun.repository.ts` | Modify | `fechasBloqueadasGenerales(condominioId: string)` |
| `.../repositories/area-comun.repository.drizzle.ts` | Modify | `and(eq(condominioId), isNull(areaId))`; map + insert new column |
| `src/application/reservas/crear-reserva.ts` | Modify | `condominioId` in comando; tenant guard; pass to `fechasBloqueadasGenerales` |
| `src/application/areas-comunes/agregar-fecha-bloqueada.ts` | Modify | Persist `condominioId` (area check already correct) |
| `src/application/areas-comunes/eliminar-fecha-bloqueada.ts` | Modify | Compare row's own `condominioId`; drop `areaId` fork; delete stale Fase 7 comment |
| `src/app/huesped/areas-comunes/actions.ts` | Modify | **Only app file missing the value** — forward `session.user.condominioId` into `crearReserva` |
| `src/app/gerente/areas-comunes/[id]/editar/page.tsx:39` | Modify | `fechasBloqueadasGenerales(condominioId)` |
| `src/application/reservas/crear-reserva.test.ts` | Create | Isolation regression |
| `src/application/areas-comunes/{agregar,eliminar}-fecha-bloqueada.test.ts` | Create | Isolation regression |
| `src/infrastructure/db/seed.ts` | Modify | Second condominio fixture |

### App-layer audit result (11 session readers verified against real code)

Already forwarding into a checking use case, **no change**: `gerente/dashboard/page.tsx`, `gerente/usuarios/page.tsx`, `gerente/page.tsx`, `gerente/usuarios/actions.ts`, `gerente/areas-comunes/actions.ts` (all 7 calls), `gerente/reservas/page.tsx`, `huesped/mis-reservas/page.tsx`, `huesped/areas-comunes/page.tsx`. Inline fetch-then-compare already present: `gerente/reservas/[id]/page.tsx:28`, `huesped/areas-comunes/[id]/reservar/page.tsx:21`, `gerente/areas-comunes/[id]/editar/page.tsx:32`.

The real leak is a file **not** in the list of 11: `src/app/huesped/areas-comunes/actions.ts` never reads `condominioId` at all — that absence is the bug.

## Interfaces / Contracts

```ts
// domain/area-comun/area-comun.entity.ts
export interface FechaBloqueada {
  id: string;
  condominioId: string;      // NEW — authoritative scope for both branches
  areaId: string | null;
  fecha: string;
  motivo: string | null;
}

// domain/area-comun/area-comun.repository.ts
fechasBloqueadasGenerales(condominioId: string): Promise<FechaBloqueada[]>;

// application/reservas/crear-reserva.ts
export interface CrearReservaComando { areaId: string; usuarioId: string; condominioId: string; /* ... */ }
```

Guard placement — `crear-reserva.ts:49`, replacing the bare `!area` check:

```ts
const area = await deps.areaComunRepository.buscarPorId(comando.areaId);
if (!area || area.condominioId !== comando.condominioId) {
  throw new ReservaInvalidaError("El área común no existe");
}
```

### Migration SQL shape (hand-edited after `pnpm db:generate`)

```sql
ALTER TABLE "fechas_bloqueadas" ADD COLUMN "condominio_id" uuid;
UPDATE "fechas_bloqueadas" fb SET "condominio_id" = ac."condominio_id"
  FROM "areas_comunes" ac WHERE fb."area_id" = ac."id";
-- Only one condominio exists today; wide rows (area_id IS NULL) belong to it.
UPDATE "fechas_bloqueadas" SET "condominio_id" = (SELECT "id" FROM "condominios" LIMIT 1)
  WHERE "condominio_id" IS NULL;
ALTER TABLE "fechas_bloqueadas" ALTER COLUMN "condominio_id" SET NOT NULL;
ALTER TABLE "fechas_bloqueadas" ADD CONSTRAINT "fechas_bloqueadas_condominio_id_condominios_id_fk"
  FOREIGN KEY ("condominio_id") REFERENCES "public"."condominios"("id") ON DELETE cascade;
```

Editing the SQL body is safe: `drizzle-kit` reconciles future diffs from `meta/*_snapshot.json` (final schema state), not from statement text. Do not switch migration tooling.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (application) | Cross-tenant negative branch of `crearReserva`, `eliminarFechaBloqueada`, `agregarFechaBloqueada` | Vitest, colocated `*.test.ts`, in-memory fakes |
| Unit (domain) | Unchanged — `estaFechaBloqueada` stays pure | Existing suite |
| E2E | 2-condominio seed, manual cross-tenant attempts | Project convention: real Postgres, restore seed after |

Fake pattern (repeat inside each test file; `() => never` is assignable to every method signature, so only the methods under test are implemented):

```ts
const noUsado = (): never => { throw new Error("Método no usado en este test"); };

const areaComunRepository: AreaComunRepository = {
  buscarPorId: async () => areaDeCondominioB,   // el único método bajo prueba
  listarPorCondominio: noUsado,
  crear: noUsado,
  actualizar: noUsado,
  // ...el resto de la interfaz: noUsado
};
```

Each test file: one `describe("<useCase> (aislamiento por condominio)")`, and every isolation test asserts **both** the error class and that its message equals the not-found message — indistinguishability is the requirement, not just rejection.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The only privileged surface is one SQL migration, covered under Migration / Rollout.

## Migration / Rollout

`pnpm db:generate` → hand-edit SQL as above → `pnpm db:migrate`. Record `SELECT count(*) FROM fechas_bloqueadas` before/after; counts must match and no `condominio_id` may be null. Rollback per proposal: drop the column (no data loss, it is derived).

**Seed fixture** (`seed.ts`, permanent): keep condominio A ("Los Robles") as-is and add horarios + one condominio-wide `fechaBloqueada` to it; add condominio B ("Vista Mar") with 1 gerente, 1 huésped, 1 área activa, ≥1 horario, 1 reserva `pendiente`, 1 condominio-wide `fechaBloqueada`. Wide blocks on both sides prove `fechasBloqueadasGenerales` no longer leaks in either direction. Wipe order in `seed()` already covers `fechasBloqueadas`.

**Sequencing** (3 slices; slice 1 must land first — it is the only compile-breaking change):

1. Schema + migration + entity + repository interface/impl + the two mechanical call sites (`eliminar`/`agregar-fecha-bloqueada`, editar page). ~120 lines.
2. `crear-reserva` guard + `huesped/areas-comunes/actions.ts` forwarding. ~30 lines.
3. Tests + seed fixture. ~250 lines.

400-line review budget: total is **at the limit**. Slices 1+2 can share one PR (~150); slice 3 ships as a chained follow-up PR targeting it. If the audit surfaces additional gaps, they extend slice 2 and slice 3 splits per test file.

## Open Questions

- [ ] None blocking. Confirm during apply that no `fechas_bloqueadas` row exists whose `area_id` points to an area in a different condominio than the backfilled value (impossible with one condominio; assert anyway).
