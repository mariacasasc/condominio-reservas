# Tasks: Fase 7 — Multi-condominio real (condominio isolation audit)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~400 (150 fix slice + 250 test/seed slice) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: schema + migration + use-case fixes (~150) → PR 2: isolation tests + seed (~250) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Schema, migration, repo, and all 3 use-case fixes compile and behave correctly | PR 1 | `pnpm tsc --noEmit && pnpm lint` | `pnpm db:migrate` + manual reserva/fecha-bloqueada flows against real Postgres, restore seed after | Revert app/domain/schema commits; drop `condominio_id` via down migration (derived column, no data loss) |
| 2 | Isolation regression tests pass and prove the negative branch; 2-condominio seed reproducible | PR 2 | `pnpm test src/application` | `pnpm db:seed` then manual cross-tenant attempts by gerente/huesped of condominio A against condominio B ids | Tests and seed rows are additive; delete test files and seed block independently of PR 1 |

## Phase 1: Schema, Migration, Repository (PR 1)

- [x] 1.1 `src/infrastructure/db/schema.ts`: add `condominioId` uuid NOT NULL FK (`ON DELETE cascade`) to `fechasBloqueadas`. *(Req: Fecha Bloqueada Condominio Column)*
- [x] 1.2 Run `pnpm db:generate`, then hand-edit the generated SQL into add-nullable-column → backfill from `areas_comunes` (join on `area_id`) → backfill remaining `area_id IS NULL` rows from the single existing condominio → `ALTER ... SET NOT NULL` → add FK constraint. *(Req: Fecha Bloqueada Condominio Column, scenario: migration backfills existing rows)*
- [x] 1.3 Run `pnpm db:migrate` against local Postgres; record `SELECT count(*)` before/after and confirm zero `condominio_id IS NULL` rows.
- [x] 1.4 `src/domain/area-comun/area-comun.entity.ts`: add `condominioId: string` to `FechaBloqueada`.
- [x] 1.5 `src/domain/area-comun/area-comun.repository.ts`: change `fechasBloqueadasGenerales()` to `fechasBloqueadasGenerales(condominioId: string)`. *(Req: Fechas Bloqueadas Generales Scoped Lookup)*
- [x] 1.6 `src/infrastructure/db/repositories/area-comun.repository.drizzle.ts`: scope the generales query with `and(eq(condominioId), isNull(areaId))`; map/insert the new column. *(Req: Fechas Bloqueadas Generales Scoped Lookup, scenario: availability check only sees own condominio's blocks)*

## Phase 2: Use-Case Fixes (PR 1, depends on Phase 1)

- [x] 2.1 `src/application/areas-comunes/eliminar-fecha-bloqueada.ts`: replace the `if (fechaBloqueada.areaId)` fork with one direct compare of the row's own `condominioId` against `comando.condominioId`; delete the stale Fase 7 comment. *(Req: Fecha Bloqueada Deletion Enforces Condominio Match)*
- [x] 2.2 `src/application/areas-comunes/agregar-fecha-bloqueada.ts`: persist `condominioId` on the inserted row for the `areaId === null` (condominio-wide) branch; area-ownership check is already correct. *(Req: Fecha Bloqueada Creation Validates And Persists Condominio)*
- [x] 2.3 `src/application/reservas/crear-reserva.ts`: add `condominioId` to `CrearReservaComando`; fold the tenant guard into the existing `!area` check (`!area || area.condominioId !== comando.condominioId`) so the error message is byte-identical for foreign vs. nonexistent; pass `comando.condominioId` into `fechasBloqueadasGenerales`. *(Req: Reserva Creation Enforces Area Condominio Match, Uniform Not-Found Semantics)*
- [x] 2.4 `src/app/huesped/areas-comunes/actions.ts` (`crearReservaAction`): read `session.user.condominioId` and forward it into the `crearReserva` command — this file currently never reads `condominioId` at all. *(Req: Reserva Creation Enforces Area Condominio Match — real fix site)*
- [x] 2.5 `src/app/gerente/areas-comunes/[id]/editar/page.tsx:39`: pass `condominioId` into `fechasBloqueadasGenerales`.

## Phase 3: Verify PR 1 (depends on Phase 2)

- [x] 3.1 Run `pnpm tsc --noEmit`, `pnpm lint`; fix any type/lint errors from the signature changes.
- [x] 3.2 Manual E2E against real Postgres: crear reserva, agregar/eliminar fecha bloqueada happy paths still work; restore seed state after.

## Phase 4: Isolation Tests + Seed (PR 2, depends on Phase 3)

- [ ] 4.1 `src/infrastructure/db/seed.ts`: add condominio B ("Vista Mar") — 1 gerente, 1 huésped, 1 área activa, ≥1 horario, 1 reserva `pendiente`, 1 condominio-wide `fechaBloqueada`; add horarios + 1 condominio-wide `fechaBloqueada` to condominio A. *(Req: Multi-Condominio Development Seed)*
- [ ] 4.2 `src/application/reservas/crear-reserva.test.ts`: colocated in-memory fakes (only `buscarPorId` implemented, rest `noUsado`); test asserts identical error class+message for foreign-condominio area vs. nonexistent area. *(Req: Isolation Regression Test Coverage, scenario: huesped attempts cross-tenant reserva)*
- [ ] 4.3 `src/application/areas-comunes/eliminar-fecha-bloqueada.test.ts`: fake covering both area-scoped and condominio-wide cross-tenant deletion attempts. *(Req: Isolation Regression Test Coverage, scenario: gerente attempts cross-tenant deletion)*
- [ ] 4.4 `src/application/areas-comunes/agregar-fecha-bloqueada.test.ts`: fake covering cross-tenant area-block attempt. *(Req: Isolation Regression Test Coverage, scenario: gerente attempts to block a foreign area's date)*

## Phase 5: Final Verification (depends on Phase 4)

- [ ] 5.1 Run `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` — full suite green; new isolation tests fail if a check is manually removed (spot-check one).
- [ ] 5.2 Manual E2E with 2-condominio seed: gerente/huesped of condominio A against condominio B ids on all 3 fixed paths receive the NotFound-style error; restore seed state after.
