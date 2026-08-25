# Condominio Isolation Specification

## Purpose

Every tenant-owned entity (`fechas_bloqueadas`, `areas_comunes`, `reservas`) MUST be readable and mutable only by callers scoped to the same `condominioId`. Cross-tenant access MUST be indistinguishable from "the resource does not exist" — no distinct "forbidden"/"no access" message may ever confirm a foreign resource's existence.

## Requirements

### Requirement: Fecha Bloqueada Condominio Column

The `fechas_bloqueadas` table MUST have a NOT NULL `condominio_id` foreign key. The migration MUST backfill existing rows using the single condominio present at migration time.

#### Scenario: Migration backfills existing rows

- GIVEN a database with one condominio and existing `fechas_bloqueadas` rows (including condominio-wide rows with `area_id IS NULL`)
- WHEN the migration runs
- THEN every existing row has `condominio_id` set to that condominio's id
- AND the column is NOT NULL afterward

#### Scenario: New condominio-wide block requires condominio_id

- GIVEN a gerente creates a condominio-wide blocked date (`areaId` null)
- WHEN the row is persisted
- THEN `condominio_id` is stored and matches the gerente's condominio

### Requirement: Fechas Bloqueadas Generales Scoped Lookup

`AreaComunRepository.fechasBloqueadasGenerales` MUST require a `condominioId` parameter and MUST return only condominio-wide blocks belonging to that condominio.

#### Scenario: Availability check only sees own condominio's blocks

- GIVEN condominio A and condominio B each have a condominio-wide blocked date
- WHEN `crear-reserva` computes availability for an area in condominio A
- THEN only condominio A's condominio-wide block affects the result
- AND condominio B's block is not considered

### Requirement: Reserva Creation Enforces Area Condominio Match

`crear-reserva` MUST fetch the target `areaComun`, then reject the command with the domain's NotFound-style error when `area.condominioId !== comando.condominioId`, before creating any reserva.

#### Scenario: Huesped reserves an area in their own condominio

- GIVEN a huesped of condominio A
- WHEN they create a reserva for an area belonging to condominio A
- THEN the reserva is created successfully

#### Scenario: Huesped attempts cross-tenant reserva

- GIVEN a huesped of condominio A and a valid area id belonging to condominio B
- WHEN they attempt to create a reserva against that area
- THEN the use case throws the same NotFound-style error used for a non-existent area
- AND no reserva row is persisted

### Requirement: Fecha Bloqueada Deletion Enforces Condominio Match

`eliminar-fecha-bloqueada` MUST fetch the target fecha bloqueada, then reject with the NotFound-style error when its `condominioId` (whether derived via `areaId`'s area or the row's own `condominioId` for null-area rows) does not match the caller's `condominioId`.

#### Scenario: Gerente deletes own condominio's blocked date

- GIVEN a gerente of condominio A and a blocked date belonging to condominio A
- WHEN they delete it
- THEN the row is removed

#### Scenario: Gerente attempts cross-tenant deletion

- GIVEN a gerente of condominio A and a valid blocked-date id belonging to condominio B (area-scoped or condominio-wide)
- WHEN they attempt to delete it
- THEN the use case throws the same NotFound-style error used for a non-existent id
- AND the row remains in condominio B

### Requirement: Fecha Bloqueada Creation Validates And Persists Condominio

`agregar-fecha-bloqueada` MUST persist `condominioId` on every row and MUST reject the command when an `areaId` is provided that does not belong to the caller's condominio.

#### Scenario: Gerente blocks a date for their own area

- GIVEN a gerente of condominio A and an area belonging to condominio A
- WHEN they add a blocked date for that area
- THEN the row is persisted with `condominioId` equal to condominio A

#### Scenario: Gerente attempts to block a foreign area's date

- GIVEN a gerente of condominio A and a valid area id belonging to condominio B
- WHEN they attempt to add a blocked date for that area
- THEN the use case throws the same NotFound-style error used for a non-existent area
- AND no row is persisted

### Requirement: Uniform Not-Found Semantics For Cross-Tenant Access

Every audited use case MUST use the exact same error type and message for "entity not found" and "entity exists but belongs to another condominio". No use case may expose a distinct "forbidden"/"unauthorized" message for cross-tenant access.

#### Scenario: Error indistinguishable from true not-found

- GIVEN two otherwise-identical requests: one for a random non-existent id and one for a real id owned by another condominio
- WHEN each request is processed by the same use case
- THEN both throw the identical error type and message

### Requirement: Multi-Condominio Development Seed

The seed fixture MUST create at least two condominios, each with its own gerente, huesped, and areas comunes, so that isolation is manually reproducible without a bespoke test setup.

#### Scenario: Seed produces two isolated condominios

- GIVEN the seed script runs against an empty database
- WHEN seeding completes
- THEN at least two condominios exist, each with a distinct gerente, huesped, and set of areas comunes
- AND no area, usuario, or fecha bloqueada is shared between them

### Requirement: Isolation Regression Test Coverage

Each fixed or audited use case in the checklist MUST have a Vitest test, using in-memory fakes, covering the cross-tenant negative branch.

#### Scenario: Regression test fails if isolation check is removed

- GIVEN the in-memory fake repositories seeded with two condominios
- WHEN the fetch-then-compare isolation check is removed from a covered use case
- THEN its corresponding test fails
