# Proposal: Fase 7 — Multi-condominio real (condominio isolation audit)

## Intent

The platform is modeled multi-tenant but has never been *proven* multi-tenant: only one `condominios` row exists, so no cross-tenant leak can surface in manual testing. Two concrete gaps are verified in code today:

- `fechasBloqueadas` has no `condominioId` (`schema.ts:87-92`). `AreaComunRepository.fechasBloqueadasGenerales()` takes **no parameter at all** — a condominio-wide block leaks into every condominio's availability check (`crear-reserva.ts:77`) and edit page, and `eliminar-fecha-bloqueada.ts:29` cannot validate ownership.
- `crear-reserva.ts` carries no `condominioId` and never checks that the target area belongs to the caller's condominio.

A live write-path break of this exact class (`aprobar-reserva.ts`) went undetected until now and was already fixed outside this change. That it was undetected is the reason for a full audit.

## Scope

### In Scope
- Add `condominio_id` (NOT NULL, FK) to `fechas_bloqueadas` + migration + backfill; scope `fechasBloqueadasGenerales(condominioId)` and `eliminar-fecha-bloqueada`.
- Audit all 23 use cases in `src/application/**` against the fetch-then-compare convention; fix every miss (known: `crear-reserva.ts`).
- Audit the 11 `src/app/**` callers that read `session.user.condominioId` to confirm each forwards it into a use case that *checks* it, not merely passes it through.
- Vitest regression tests covering the negative (cross-tenant) branch of each audited use case, using in-memory fakes.
- Multi-condominio seed (2 condominios) so isolation is manually reproducible.

### Out of Scope (fixed user constraints)
- Session-switching UI, mutable `condominioId` in JWT/session, many-to-many usuario↔condominio. One condominio per usuario stays.
- `super-admin` role, its routes, UI, and the `rolEnum` migration. Condominios stay seed/SQL-created.
- Per-condominio `usuarios.email` uniqueness. Global unique index stays.
- Re-fixing `aprobar-reserva.ts` (already fixed).
- Repository-layer mandatory scoping (Fase 8 concern).

## Capabilities

### New Capabilities
- `condominio-isolation`: every use case reading or mutating a tenant-owned entity by raw ID must reject foreign-condominio access indistinguishably from "not found".

### Modified Capabilities
- None (no `openspec/specs/` exists yet; this is the first change in the repo).

## Approach

Formalize the convention already proven in `desactivar-usuario.ts:24-27`: fetch the entity unscoped, compare `entity.condominioId !== comando.condominioId`, throw the domain's NotFound error. Existence is never leaked. Add a schema column **only where scope is underivable**, not merely indirect.

## Key Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | `fechas_bloqueadas` **gains** `condominio_id` | `areaId` is nullable; for a condominio-wide row scope is *underivable* — no join, no check, no fix without the column. Alternatives (non-null `areaId` + per-condominio "virtual area", or a join table) add a fake domain concept to dodge one column. |
| 2 | `reservas` does **not** gain `condominio_id` | `areaId` is NOT NULL, so scope is always derivable via `areasComunes` — the opposite of case 1. `DrizzleReservaRepository.listarPorCondominio` already resolves it with an `innerJoin`, and `aprobar-reserva.ts:43-46` now does the same. Denormalizing buys one indexed `WHERE` at the price of a write-time invariant that can silently drift, plus a migration over historical rows — zero correctness gain. Revisit in Fase 8 if measured as a bottleneck. |
| 3 | Audit is exhaustive, not spot-fix | The same bug class recurred silently across three phases. Checklist covers every use case accepting (or needing) `condominioId` and every one fetching by raw ID. |
| 4 | Add Vitest tests for isolation branches | The project's verification convention (end-to-end against real Postgres) is a *happy path* against a *single condominio* — structurally incapable of catching a cross-tenant leak. This is security logic, not CRUD: the negative branch is the requirement. Scope stays narrow (in-memory fakes, isolation branch only), a down payment on Fase 8's planned fakes — not a general coverage push. |

## Audit Checklist

| Use case | Status |
|---|---|
| `reservas/crear-reserva` | **Fix** — no `condominioId`; must verify area's condominio matches the huesped's |
| `areas-comunes/eliminar-fecha-bloqueada` | **Fix** — null-`areaId` branch unchecked (depends on Decision 1) |
| `areas-comunes/agregar-fecha-bloqueada` | **Fix** — must persist `condominioId`; null-`areaId` branch currently unvalidated |
| `reservas/aprobar-reserva` | Verify only (fixed) |
| `usuarios/desactivar-usuario`, `areas-comunes/editar-area-comun`, `activar-desactivar-area`, `agregar-horario-disponible`, `eliminar-horario-disponible` | Verify — pattern present |
| `areas-comunes/crear-area-comun`, `usuarios/crear-huesped` | Verify — writes take `condominioId` from session; confirm never client-supplied |
| `listar-areas-comunes`, `listar-areas-comunes-disponibles`, `listar-usuarios`, `listar-reservas-condominio`, `reportes/generar-dashboard-gerente` | Verify — scoped list queries |
| `reservas/listar-mis-reservas` | Verify — usuario-scoped; confirm implied condominio scope holds |
| `notificaciones/*` (3) | Verify — recipients derived from the reserva's own area/usuario |
| `auth/autenticar-usuario`, `usuarios/solicitar-recuperacion-password`, `restablecer-password` | Verify — intentionally global (email/token identity, per constraint 3) |

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/infrastructure/db/schema.ts` | Modified | `fechas_bloqueadas.condominio_id` NOT NULL FK |
| `drizzle/` migration | New | Add column + backfill from `areas_comunes`; single-condominio default for wide rows |
| `src/domain/area-comun/area-comun.repository.ts` + `.entity.ts` | Modified | `fechasBloqueadasGenerales(condominioId)`; `FechaBloqueada.condominioId` |
| `src/infrastructure/db/repositories/area-comun.repository.drizzle.ts` | Modified | Scope generales query; return new column |
| `src/application/**` | Modified | Isolation fixes per checklist |
| `src/app/**` (11 session readers) | Verified/Modified | Forward `condominioId` into checked commands |
| `src/infrastructure/db/seed.ts` | Modified | 2 condominios with own gerente/huesped/areas |
| `src/application/**/*.test.ts` | New | Isolation regression tests (first tests in this layer) |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `fechas_bloqueadas` migration regresses Fase 2/3 booking availability | Med | `estaFechaBloqueada` is a pure domain function and unchanged; only the repository query narrows. Backfill verified against real Postgres before/after row counts. |
| Existing condominio-wide rows have no source of truth for backfill | Low | One condominio exists today; backfill assigns it. Documented in the migration. |
| Audit finds more missing checks than forecast, inflating the change | Med | Checklist is fixed up front; any *new* gap found gets a task, and if the change exceeds the 400-line review budget, split into chained slices (schema → audit fixes → tests). |
| First tests in `application/` establish a fake-repository pattern by accident | Low | Keep fakes minimal and colocated; explicitly flag Fase 8 as the owner of a shared fake toolkit. |
| Scope creep back into session-switching / super-admin | Med | Non-goals are explicit above and derived from fixed user decisions. |

## Rollback Plan

1. Revert application/domain/UI commits — the fetch-then-compare checks are additive and independent.
2. Revert the schema change with a down migration dropping `fechas_bloqueadas.condominio_id`; no data is destroyed (the column is derived, existing rows keep `area_id`/`fecha`/`motivo`).
3. Revert `seed.ts` and re-run `pnpm db:seed` (idempotent, wipe-and-repopulate) to return to the single-condominio fixture.
4. Tests are additive; deleting them affects nothing else.

## Dependencies

- Local PostgreSQL 17 for end-to-end verification (existing project requirement).
- `aprobar-reserva.ts` fix already merged — this change assumes it is present.

## Success Criteria

- [ ] `fechas_bloqueadas.condominio_id` exists, is NOT NULL, and `fechasBloqueadasGenerales` cannot be called without a condominio.
- [ ] Every use case in the audit checklist is marked Verified or Fixed, with no "Fix" left open.
- [ ] With a 2-condominio seed, a gerente of condominio A using a valid ID belonging to condominio B receives the NotFound-style error on every audited path — never a success, never an "unauthorized" that confirms existence.
- [ ] A huesped of condominio A cannot create a reserva against an area of condominio B.
- [ ] `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` pass; new isolation tests fail if a check is removed.
- [ ] End-to-end verification against real Postgres, DB restored to seed state afterwards (project convention).
