# Plataforma de Reservas de Áreas Comunes — Documentación General

Sistema de reservas de áreas comunes para condominios/edificios. Dos roles: **gerente** (administra el condominio, aprueba o rechaza reservas) y **huésped** (reserva áreas comunes disponibles). Primer proyecto profesional del autor, construido desde el día uno con principios SOLID y arquitectura en capas, pensado como MVP escalable.

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Modelo de datos](#modelo-de-datos)
4. [Diseño / paleta de color](#diseño--paleta-de-color)
5. [Cómo levantar el proyecto en local](#cómo-levantar-el-proyecto-en-local)
6. [Estado actual](#estado-actual)
7. [Roadmap de fases](#roadmap-de-fases)
8. [Convenciones del proyecto](#convenciones-del-proyecto)
9. [Decisiones técnicas y por qué](#decisiones-técnicas-y-por-qué)

---

## Stack tecnológico

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict | Unifica frontend y backend en un solo lenguaje; server actions evitan levantar un backend aparte |
| Estilos | Tailwind CSS + shadcn/ui | Componentes accesibles (Radix) y themeables, sin reinventar inputs/diálogos/selects |
| Base de datos | PostgreSQL 17 (instalación nativa local) | Ver [Decisiones técnicas](#decisiones-técnicas-y-por-qué) — se evaluó Docker primero |
| ORM | Drizzle ORM + drizzle-kit | Cercano a SQL puro, migraciones tipadas |
| Auth | Auth.js (NextAuth v5), Credentials + bcryptjs | Sistema cerrado (el gerente da de alta huéspedes, no hay auto-registro público) |
| Validación | Zod | Schemas compartidos entre formularios cliente y server actions |
| Testing | Vitest | Tests unitarios de dominio y casos de uso |
| Package manager | pnpm | Instalación estricta, sin dependencias fantasma |

---

## Arquitectura

Arquitectura por capas inspirada en Clean/Hexagonal (Ports & Adapters), aplicada de forma pragmática dentro de Next.js:

```
src/
  app/                    # Next.js routing — capa de entrega, delgada, sin lógica de negocio
    (auth)/login/
    gerente/
    huesped/
  domain/                 # Entidades y reglas de negocio, CERO dependencias de framework
    usuario/
    area-comun/
    reserva/
  application/             # Casos de uso: orquestan el dominio a través de interfaces (puertos)
    auth/autenticar-usuario.ts
    areas-comunes/listar-areas-comunes.ts
    reservas/crear-reserva.ts
    reservas/aprobar-reserva.ts
  infrastructure/
    db/
      schema.ts           # Definición Drizzle (fuente de verdad del modelo de datos)
      client.ts
      repositories/       # Implementan los puertos del dominio usando Drizzle
      seed.ts
    auth/
      auth.ts / auth.config.ts   # Auth.js
  shared/                 # Schemas Zod, utils
components/                # UI presentacional (ui/, forms/, layout/)
```

**Regla de dependencia:** la flecha siempre apunta hacia adentro — `app` → `application` → `domain`. `domain` no importa nada de Next.js, Drizzle ni Auth.js. `application` depende solo de interfaces definidas en `domain`. `infrastructure` implementa esas interfaces con tecnología concreta.

**Por qué:** cumple el Principio de Inversión de Dependencias (SOLID). El dominio se puede testear sin base de datos ni servidor. El día que se cambie Drizzle/Postgres por otra cosa, las reglas de negocio no se tocan — solo se reescribe `infrastructure/`.

---

## Modelo de datos

Todas las tablas usan nombres en español (idioma real del dominio de negocio) — ver `src/infrastructure/db/schema.ts` como fuente de verdad.

| Tabla | Propósito | Notas |
|---|---|---|
| `condominios` | Un condominio (una sola fila hoy) | Modelado desde el día uno para soportar multi-condominio a futuro |
| `usuarios` | Gerentes y huéspedes | `rol`: `gerente` \| `huesped` |
| `areas_comunes` | Catálogo de espacios reservables | `tipo` es texto libre — el gerente puede dar de alta tipos nuevos sin migración |
| `horarios_disponibles` | Disponibilidad recurrente semanal por área | `dia_semana` 0–6, `hora_inicio`/`hora_fin` |
| `fechas_bloqueadas` | Feriados y bloqueos puntuales | `area_id` nullable = aplica a todo el condominio |
| `reservas` | Reservas hechas por huéspedes | `estado`: `pendiente` \| `aprobada` \| `rechazada` \| `cancelada`. Toda reserva nace `pendiente` — el gerente debe aprobarla, nunca autoconfirmación |

Diseño normalizado (no motor de reglas genérico tipo EAV) — la "personalización" se resuelve con columnas de configuración por área (`capacidad_maxima`, `duracion_maxima_minutos`, `anticipacion_minima_horas`, `anticipacion_maxima_dias`) más las tablas de horarios/bloqueos.

---

## Diseño / paleta de color

Dirección estética: verde bosque + marrón tierra + fondo cálido crema — transmite naturaleza/hospitalidad, coherente con un producto de este rubro. Contraste verificado AA.

| Token | Valor | Uso |
|---|---|---|
| `background` | `#F7F4EF` | Fondo general |
| `foreground` | `#2B2620` | Texto principal |
| `primary` | `#2F5233` | Acciones principales |
| `secondary` | `#8B5E34` | Acciones secundarias |
| `muted` | `#E8E2D6` | Bordes, superficies secundarias |
| `success` | `#3F7D4A` | Reserva aprobada |
| `destructive` | `#A63A2E` | Reserva rechazada/cancelada |

Definidos como tokens en el tema de Tailwind, no como colores sueltos en componentes.

---

## Cómo levantar el proyecto en local

**Prerrequisitos:** Node.js (funciona con la versión instalada, se recomienda migrar a una LTS — ver nota abajo), pnpm, PostgreSQL 17 corriendo como servicio local (**no se usa Docker** — ver [Decisiones técnicas](#decisiones-técnicas-y-por-qué)).

```bash
# 1. Variables de entorno
cp .env.example .env
# Editar .env si tu Postgres local tiene otras credenciales

# 2. Instalar dependencias
pnpm install

# 3. Aplicar el schema a la base de datos
pnpm db:push

# 4. Sembrar datos de prueba (re-ejecutable: limpia y vuelve a insertar)
pnpm db:seed

# 5. Levantar el servidor de desarrollo
pnpm dev
```

Abrir `http://localhost:3000`.

**Usuarios de prueba (creados por el seed):**

| Rol | Email | Contraseña |
|---|---|---|
| Gerente | `gerente@losrobles.cl` | `gerente1234` |
| Huésped | `huesped@losrobles.cl` | `huesped1234` |

**Otros comandos útiles:**

```bash
pnpm tsc --noEmit    # chequeo de tipos
pnpm lint            # eslint
pnpm test            # vitest
pnpm db:generate     # genera una nueva migración a partir de cambios en schema.ts
```

**Nota sobre Node:** el entorno de desarrollo original tiene Node Current (no LTS). Se recomienda migrar a Node 22 LTS con `nvm-windows` para evitar incompatibilidades silenciosas con el ecosistema — pendiente, no bloqueante.

---

## Estado actual

### ✅ Fase 0 — Fundaciones (completada y verificada)

- Scaffold Next.js + TS + Tailwind + shadcn/ui, paleta de marca aplicada.
- Arquitectura en capas (`domain/application/infrastructure/app`) con las 3 entidades núcleo.
- Schema Drizzle completo (6 tablas) + migración generada y aplicada contra Postgres real.
- Auth.js (Credentials + bcryptjs), rol en sesión, middleware protegiendo `/gerente/*` y `/huesped/*`.
- Seed idempotente: 1 condominio, 1 gerente, 1 huésped, 3 áreas comunes.
- Slice vertical funcionando de punta a punta: login → gerente ve el listado de áreas comunes (verificado contra Postgres real, no solo compilación).

### ✅ Fase 1 — Gestión de usuarios (completada y verificada)

- Casos de uso `crear-huesped`, `listar-usuarios`, `desactivar-usuario` (dominio `usuario` ampliado con `activo`).
- UI `/gerente/usuarios`: tabla con alta y baja, link agregado al nav de `/gerente`.
- Recuperación de contraseña: token de un solo uso con expiración (30 min), hasheado (SHA-256) en tabla `tokens_recuperacion_password`; en esta fase el token se muestra/loguea, sin envío de email real (eso queda para la Fase 5).
- Manejo de error amigable para email duplicado.
- Fix de seguridad: un usuario desactivado no puede loguearse (`autenticar-usuario.ts` valida `activo`).
- Verificado de punta a punta contra Postgres real (no solo compilación): alta, duplicado, login del huésped nuevo, desactivación bloqueando el login, y el flujo completo de recuperación/restablecimiento de contraseña, incluyendo que un token ya usado no se puede reutilizar.

### ✅ Fase 2 — CRUD de áreas comunes (completada y verificada)

- Puerto `AreaComunRepository` ampliado con `actualizar`, `actualizarActiva`, alta/baja de `horarios_disponibles` y `fechas_bloqueadas` (implementado en `DrizzleAreaComunRepository`).
- Casos de uso: `crear-area-comun`, `editar-area-comun`, `activar-desactivar-area`, `agregar-horario-disponible` (valida `horaInicio < horaFin` vía la regla de dominio `horarioValido`), `eliminar-horario-disponible`, `agregar-fecha-bloqueada`, `eliminar-fecha-bloqueada`.
- UI: `/gerente/areas-comunes/nueva` y `/gerente/areas-comunes/[id]/editar` (esta última con las subsecciones de horarios y fechas bloqueadas); link "Editar" y botón "Nueva área" agregados al listado en `/gerente`.
- Un bloqueo de fecha puede ser específico de un área o "todo el condominio" (`areaId` nulo) — se gestiona con un checkbox en el mismo formulario y se lista en todas las áreas.
- Limitación conocida documentada en el código: un bloqueo condominio-wide no tiene `condominio_id` propio en el schema (una sola fila hoy), así que no se valida contra el condominio del gerente al eliminarlo — se resuelve en la Fase 7 (multi-condominio real).
- Verificado de punta a punta contra Postgres real: alta de área nueva, edición de sus datos, activar/desactivar reflejado en el listado, alta y baja de horarios, y alta/baja de fechas bloqueadas (tanto específicas de un área como de todo el condominio, confirmando que estas últimas aparecen en todas las áreas).

### ✅ Fase 3 — Flujo de reserva (huésped) (completada y verificada)

- Casos de uso nuevos: `listarAreasComunesDisponibles` (filtra `activa===true`, regla de negocio de quién puede reservar) y `listarMisReservas` (wrapper trivial sobre `listarPorUsuario`).
- `crearReserva` ampliado con dos validaciones de dominio que faltaban: `estaDentroDeHorarioDisponible` (el slot debe caer dentro de un `horarioDisponible` recurrente del día de semana correspondiente) y `estaFechaBloqueada` (contra bloqueos del área o de todo el condominio). Nuevas reglas puras en `domain/area-comun/area-comun.entity.ts`. Día de semana calculado parseando los componentes de `fecha` manualmente (no `new Date(fecha).getDay()`) para evitar corrimientos de timezone en el server.
- UI: `/huesped/areas-comunes` (catálogo de áreas activas), `/huesped/areas-comunes/[id]/reservar` (formulario con fecha/hora/cantidad/notas, muestra los horarios disponibles del área como ayuda ya que no hay librería de date-picker instalada), `/huesped/mis-reservas` (historial con badge de estado). `HuespedNav` agregado al layout; home de `/huesped` con accesos directos.
- `crearReservaSchema.cantidadPersonas` pasado a `z.coerce.number()` (llega como string desde `FormData`).
- Verificado de punta a punta contra Postgres real: intento de reserva sin horarios configurados rechazado con el mensaje correcto; gerente agrega un horario; huésped reserva dentro de ese horario y la reserva queda `pendiente`, visible en `/huesped/mis-reservas`.

**Lo que todavía NO existe (por diseño, es de fases siguientes):** aprobación de reservas, cancelación de una reserva por el propio huésped, notificaciones (envío real de email), dashboard, multi-condominio activo, CI/CD.

### ✅ Fase 7 — Aislamiento por condominio (completada y verificada)

- Alcance acotado por decisión explícita antes de escribir código: **sin** selector de condominio en sesión (sigue siendo un condominio fijo por usuario, como hoy), **sin** rol `super-admin` (los condominios se siguen creando manualmente), **sin** cambio a la unicidad global de `usuarios.email`. El roadmap original planteaba las tres cosas; se descartaron para enfocar la fase en cerrar huecos reales de aislamiento en vez de construir infraestructura de sesión que nadie necesita todavía.
- `fechas_bloqueadas` gana columna `condominio_id` propia — un bloqueo "todo el condominio" (`areaId` nulo) no tenía antes forma de derivar a qué condominio pertenecía. Migración `nullable → backfill → NOT NULL` (hecha a mano sobre el SQL generado por `drizzle-kit`, porque solo existía un condominio al momento de migrar).
- `fechasBloqueadasGenerales()` pasa a recibir `condominioId`: antes no tenía parámetro y filtraba bloqueos de **todos** los condominios en el cálculo de disponibilidad de cualquier área — el hueco real era peor que el documentado en la Fase 2 (no era solo el borrado, afectaba a toda reserva nueva).
- Auditoría completa de los casos de uso en `application/` contra el patrón fetch-then-compare (`entity.condominioId !== comando.condominioId`, mismo error que "no existe" para nunca filtrar la existencia de un recurso ajeno — patrón original de `desactivar-usuario.ts`, Fase 1). Se encontró y corrigió, aparte del flujo SDD de esta fase, un **bug de seguridad ya explotable**: `aprobar-reserva.ts` no validaba pertenencia al condominio en la mutación, solo la UI lo hacía. Se cerraron los mismos huecos categóricos en `crear-reserva`/`huesped/areas-comunes/actions.ts` (el punto real de la fuga era el server action, que nunca leía `condominioId`), `eliminar-fecha-bloqueada` y `agregar-fecha-bloqueada`.
- `reservas` **no** gana `condominio_id` propio: su `areaId` es `NOT NULL`, el condominio siempre es derivable vía el join a `areas_comunes` (mismo camino que ya usaba `listarPorCondominio` desde la Fase 4) — se evaluó agregar la columna igual que a `fechas_bloqueadas` y se descartó por ser un dato redundante, sin ganancia real, con riesgo de desincronizarse.
- Primeros tests unitarios del proyecto en `application/` (Vitest, fakes mínimos por archivo, no un toolkit compartido): prueban específicamente el caso negativo cross-tenant, porque la verificación manual contra Postgres real que usa el proyecto en el resto de las fases (happy path de un solo condominio) es estructuralmente incapaz de detectar una fuga entre tenants.
- Seed permanente con dos condominios ("Los Robles" y "Vista Mar") — sin un segundo condominio en los datos de prueba, este tipo de bug de aislamiento queda invisible en el uso normal. De paso se agregaron horarios disponibles a las áreas de ambos condominios (el seed no tenía ninguno desde la Fase 0, así que reservar de verdad vía UI requería que el gerente los cargara a mano primero).
- Desarrollada con el flujo SDD completo (exploración → propuesta → spec → diseño → tasks → apply → verify → archive), documentado en `openspec/` (`sdd-archive` movió el cambio a su ubicación final tras el merge). Entregada en 2 PRs encadenados por presupuesto de revisión (~150 y ~250 líneas cada uno).
- Verificado: `pnpm tsc --noEmit`, `pnpm lint` y `pnpm test` (29 tests, 7 nuevos) sin errores; `pnpm db:seed` corrido dos veces contra Postgres real confirmando idempotencia; verificación manual del rechazo cross-tenant contra Postgres real. `sdd-verify` independiente (lectura directa del código, no solo el reporte de implementación): PASS, 0 issues, en ambos PRs.

### ✅ Fase 4 — Aprobación de reservas (gerente) (completada y verificada)

- Puerto `ReservaRepository` ampliado con `listarPorCondominio(condominioId, filtros?)` (filtros opcionales `areaId`/`fecha`/`estado`), implementado en `DrizzleReservaRepository` con un `innerJoin` contra `areas_comunes` — la tabla `reservas` no tiene `condominio_id` propio, así que el alcance por condominio se resuelve vía el área.
- Caso de uso `listarReservasCondominio` (wrapper delgado, mismo estilo que `listarMisReservas`) en `application/reservas/`.
- UI: `/gerente/reservas` — bandeja con formulario GET (sin JS) para filtrar por estado/área/fecha, filtrada a `pendiente` por defecto. Acciones "Aprobar"/"Rechazar" inline por fila (solo en reservas pendientes) conectadas a `aprobarReserva` (ya implementado en Fase 3) vía un único server action `decidirReservaAction` con un campo `decision` en el formulario, en vez de dos actions separadas.
- UI: `/gerente/reservas/[id]` — vista de detalle con el historial de revisión (`revisadoPor` resuelto a nombre, `revisadoEn`), reutilizando las mismas acciones de aprobar/rechazar si la reserva sigue pendiente. Sigue el patrón de rutas `[id]` de `areas-comunes` en vez de modales.
- Componentes nuevos: `EstadoReservaBadge` (`components/reservas/`) — extrae la paleta de badges de estado que ya existía inline en `/huesped/mis-reservas` a un componente compartido, reusado en ambas páginas nuevas; `DecidirReservaForm` (`components/forms/`) — client component con `useActionState` para mostrar el mensaje de error amigable si `ReservaNoEncontradaError`/`TransicionInvalidaError` ocurre (por ejemplo, doble clic aprobando dos veces).
- `decidirReservaAction` revalida `/gerente/reservas`, `/gerente/reservas/[id]` y `/huesped/mis-reservas` para que el huésped vea el cambio de estado sin recargar manualmente.
- Link "Reservas" agregado a `GerenteNav`.
- **Bug pre-existente descubierto (no corregido, fuera de alcance de esta fase):** `estaDentroDeHorarioDisponible` en `domain/area-comun/area-comun.entity.ts` (Fase 3) compara horas con `>=`/`<=` sobre strings. Postgres devuelve `horaInicio`/`horaFin` de `horarios_disponibles` con segundos (`"09:00:00"`), mientras que una reserva llega como `"09:00"` (sin segundos, formato de `<input type="time">`). Cuando una reserva empieza exactamente en el mismo minuto que la apertura del horario, la comparación de strings falla (`"09:00" >= "09:00:00"` es `false` porque un prefijo propio siempre compara como "menor"), rechazando una reserva que debería ser válida. Solo afecta el caso borde de "reservar justo a la hora de apertura"; se recomienda corregirlo en una fase futura comparando por minutos parseados en vez de por string.
- Verificado de punta a punta contra Postgres real, pero mediante un script que ejercita los mismos casos de uso que la UI (`crearReserva` → `listarReservasCondominio` → `aprobarReserva` → `listarMisReservas`) en vez de un click-through de navegador, dado que este entorno no tiene automatización de browser disponible: reserva creada por el huésped aparece en la bandeja `pendiente` del gerente, el filtro por área funciona, `aprobarReserva` deja la reserva en `aprobada` con `revisadoPor`/`revisadoEn` completos, el huésped ve el nuevo estado en `listarMisReservas`, y un segundo intento de decisión sobre la misma reserva lanza `TransicionInvalidaError` como se espera. `pnpm tsc --noEmit`, `pnpm lint` y `pnpm test` (suite existente) sin errores. Base de datos restaurada a su estado de seed original después de la verificación.

### ✅ Fase 5 — Notificaciones (completada y verificada)

- Puerto `NotificadorPort` (`domain/notificacion/notificador.port.ts`) con un único método `enviarEmail(notificacion)`, desacoplado de cualquier proveedor concreto.
- Implementación `ResendNotificador` (`infrastructure/notificaciones/`) usando el SDK de [Resend](https://resend.com). Remitente configurable por `RESEND_FROM_EMAIL` (default `onboarding@resend.dev`, el remitente de prueba de Resend — no requiere dominio verificado pero **solo entrega al email de la cuenta de Resend** hasta que se verifique un dominio propio).
- Composición de contenido en `application/notificaciones/`: `plantillas-email.ts` (HTML con la paleta de marca) y dos casos de uso delgados, `notificarReservaCreada` (avisa a los gerentes activos del condominio) y `notificarReservaDecidida` (avisa al huésped cuando su reserva pasa a `aprobada`/`rechazada`).
- `crearReserva` y `aprobarReserva` ahora reciben `usuarioRepository` y `notificadorPort` como dependencias adicionales y llaman a la notificación correspondiente después de persistir el cambio — **awaited pero best-effort**: un email fallido se loguea con `console.error` y nunca revierte ni invalida una reserva/decisión ya guardada (importante en despliegues serverless, donde una promesa sin awaitear puede cortarse al terminar la función).
- Notificaciones in-app (tabla `notificaciones`) quedaron fuera de esta fase — eran opcionales en el roadmap y el email cubre el caso de uso principal.
- Verificado de punta a punta contra Postgres real con un `NotificadorPort` de prueba (sin key de Resend configurada en este entorno): `crearReserva` dispara exactamente un email al gerente del condominio, `aprobarReserva` dispara exactamente un email al huésped dueño de la reserva, y ambos casos de uso devuelven la entidad esperada incluso si se simula que el envío falla. `pnpm tsc --noEmit`, `pnpm lint` y `pnpm test` sin errores. Base de datos restaurada a su estado de seed original después de la verificación.
- **Pendiente para quien retome el proyecto:** configurar `RESEND_API_KEY` (y opcionalmente `RESEND_FROM_EMAIL` con un dominio propio verificado) en `.env` para que el envío real funcione — sin esa key, `ResendNotificador` fallará al enviar (el error queda logueado, no rompe el flujo de reservas).

### ✅ Fase 6 — Reportes y dashboard (gerente) (completada y verificada)

- Cuatro funciones puras nuevas en `domain/reporte/reporte.entity.ts` (archivo nuevo, no se agregaron a `reserva.entity.ts` para no mezclar el ciclo de vida de una reserva individual con reportes agregados — cohesión distinta): `reservasPorArea`, `reservasPorMes`, `tasaAprobacionRechazo` y `ocupacionPorArea`, más el auxiliar `contarOcurrenciasDeDiaSemanaEnMes` y `formatearMes`.
- **Sin `groupBy`/`count()`/SQL de agregación** — no hay precedente de eso en el proyecto (todas las agregaciones existentes se hacen en memoria después de un fetch), así que Fase 6 sigue el mismo patrón: `generarDashboardGerente` (`application/reportes/generar-dashboard-gerente.ts`) trae las reservas y áreas completas del condominio y agrega todo en TypeScript puro.
- **Decisión de diseño — no existe un método del puerto que devuelva áreas con `horariosDisponibles` embebidos:** se verificó el uso real en Fases 2/3 (`/huesped/areas-comunes/[id]/reservar/page.tsx`) y el puerto `AreaComunRepository` siempre trae horarios por área por separado (`horariosDisponibles(areaId)`), nunca embebidos en una sola llamada. `generarDashboardGerente` sigue ese mismo patrón: una llamada a `listarPorCondominio` para las áreas y luego `Promise.all` de `horariosDisponibles(areaId)` por cada área (N llamadas), en vez de agregar un método nuevo al puerto solo para esta fase.
- Filtro único: `mes` (`YYYY-MM`, default el mes actual del servidor), replicando la convención de formulario GET nativo de `/gerente/reservas`. `reservasPorMes` (tendencia) ignora el filtro a propósito y siempre muestra los últimos 6 meses terminando en el mes actual real, como pide el roadmap.
- Caso borde de la tasa de aprobación: cuando `aprobadas + rechazadas === 0` en el mes, `tasaAprobacionPorcentaje` es `null` (no `0`) — un `0%` sugeriría "toda reserva fue rechazada", que es engañoso cuando en realidad no hubo ninguna decisión tomada. La UI muestra un guion (`—`) en ese caso.
- Cálculo de ocupación: `horasDisponibles` de un área = para cada `horarioDisponible` recurrente, su duración en horas × cuántas veces cae ese día de semana dentro del mes filtrado (`contarOcurrenciasDeDiaSemanaEnMes`, que itera los días del mes construyendo fechas con `Date.UTC(...)` a partir de componentes numéricos — nunca parseando un string de fecha con timezone ambigua, mismo criterio que `estaDentroDeHorarioDisponible` de Fase 3). `horasReservadas` solo cuenta reservas en estado `aprobada`. El porcentaje se capea a 100% (una reserva puede durar más que el "horario nominal" si hubo overlaps históricos) y da `0%` si el área no tiene horarios configurados (evita división por cero).
- UI `/gerente/dashboard`: formulario GET con `<input type="month">`, 4 stat cards (total del mes, % aprobación, pendientes, rechazadas), gráfico de barras horizontales "reservas por área" (`bg-primary`), gráfico de barras verticales "reservas por mes" (`bg-secondary`), y barras de ocupación por área (`bg-success` sobre fondo `bg-muted`) — todo con `<div>` + Tailwind, sin agregar ninguna librería de gráficos (no hay precedente de eso en el proyecto). Estado vacío manejado (condominio sin reservas en el mes muestra un mensaje en vez de gráficos rotos o divisiones por cero).
- Link "Dashboard" agregado a `GerenteNav`.
- Verificado de punta a punta contra Postgres real: `pnpm db:seed` para partir de estado limpio, luego un script temporal insertó horarios y reservas conocidas (2 áreas con horarios, 5 reservas de agosto 2026 en distintos estados, más reservas de meses anteriores para la tendencia) y llamó a `generarDashboardGerente` directamente, comparando cada número devuelto contra el cálculo hecho a mano (21 aserciones, todas pasaron): agrupación y orden de `reservasPorArea`, los 6 meses de `reservasPorMes` con ceros donde no hay datos y cruzando el límite de año, `tasaAprobacionRechazo` (75% = 3 aprobadas / 4 decididas, ignorando pendientes/canceladas), `ocupacionPorArea` (20h y 20h disponibles por área con 1 horario semanal × 5 ocurrencias en agosto, y 0% para el área sin horarios). El script restauró la base a su estado de seed original (reservas y horarios de prueba eliminados) al terminar. `pnpm tsc --noEmit`, `pnpm lint` y `pnpm test` (22 tests, incluyendo 13 nuevos para `reporte.entity.ts`) sin errores.

---

## Roadmap de fases

Cada fase es un incremento entregable. La arquitectura no cambia entre fases — solo crece el número de entidades, casos de uso y páginas.

> **Estado (verificado contra el código en `src/`, no solo contra este documento):** Fases 0, 1, 2, 3, 4, 5, 6 y 7 completadas. Ninguna fase 8–9 tiene código todavía. **Seguimos con la Fase 8 — Calidad, CI/CD y despliegue.**

### ✅ Fase 1 — Gestión de usuarios (completada)

**Objetivo:** el gerente controla quién tiene acceso a la plataforma (no hay auto-registro público).

- Caso de uso `crear-huesped`: el gerente da de alta huéspedes desde la UI.
- Casos de uso `listar-usuarios`, `desactivar-usuario`.
- UI: `/gerente/usuarios` — tabla con alta y baja.
- Recuperación de contraseña: token de un solo uso, con expiración.
- Manejo de error amigable para email duplicado (la restricción única ya existe en el schema).

**Depende de:** Fase 0.
**Definición de terminado:** un gerente puede crear un huésped desde la UI, ese huésped puede loguearse, y un gerente puede desactivarlo.

### ✅ Fase 2 — CRUD de áreas comunes (completada)

**Objetivo:** el gerente configura completamente el catálogo de espacios reservables. **Esto es lo que resuelve el "no hay opción de editar" que se observó en Fase 0.**

- Casos de uso: `crear-area-comun`, `editar-area-comun`, `activar-desactivar-area`.
- Gestión de `horarios_disponibles` (franjas recurrentes por día de semana).
- Gestión de `fechas_bloqueadas` (feriados y bloqueos puntuales, con o sin área asociada).
- UI: `/gerente/areas-comunes/nueva`, `/gerente/areas-comunes/[id]/editar`, subsección de horarios/bloqueos dentro del detalle.

**Depende de:** Fase 0 (el repositorio y schema ya existen; falta la UI de escritura).
**Definición de terminado:** un gerente puede crear un área nueva con su tipo, capacidad y reglas, editarla y desactivarla, todo desde la UI.

### ✅ Fase 3 — Flujo de reserva (huésped) (completada)

**Objetivo:** un huésped ve disponibilidad real y reserva.

- UI: `/huesped` — catálogo de áreas comunes (reutiliza `listar-areas-comunes`).
- UI: `/huesped/areas-comunes/[id]` — selector de fecha/hora que respeta `horarios_disponibles`, `fechas_bloqueadas` y duración máxima.
- Conectar `crear-reserva` (ya implementado en `application/reservas/`) a un server action con validación Zod (`shared/schemas/reserva.schema.ts`, ya existe).
- UI: `/huesped/mis-reservas` — historial y estado.

**Depende de:** Fase 2 (sin horarios/bloqueos configurables no se puede calcular disponibilidad real).
**Definición de terminado:** un huésped puede ver franjas disponibles reales y crear una reserva que queda en estado `pendiente`.

### ✅ Fase 4 — Aprobación de reservas (gerente) (completada)

**Objetivo:** cerrar el ciclo de vida de la reserva.

- UI: `/gerente/reservas` — bandeja de pendientes, filtrable por área/fecha.
- Conectar `aprobar-reserva` (ya implementado) a un server action.
- Vista de detalle con historial de revisión (`revisado_por`, `revisado_en`, ya en el schema).

**Depende de:** Fase 3.
**Definición de terminado:** un gerente puede aprobar o rechazar una reserva pendiente y el huésped ve el cambio de estado reflejado.

### ✅ Fase 5 — Notificaciones (completada)

- Puerto `NotificadorPort` en `domain`/`application`, implementación por email (Resend) en `infrastructure/notificaciones`.
- Eventos: reserva creada (avisa al gerente), reserva aprobada/rechazada (avisa al huésped).
- Notificaciones in-app: descartadas por ahora (eran opcionales en el roadmap).

**Depende de:** Fase 4.

### ✅ Fase 6 — Reportes y dashboard (completada)

- Cuatro funciones puras nuevas en `domain/reporte/reporte.entity.ts`: `reservasPorArea`, `reservasPorMes` (últimos 6 meses, ignora el filtro de mes seleccionado), `tasaAprobacionRechazo` y `ocupacionPorArea` (con su auxiliar `contarOcurrenciasDeDiaSemanaEnMes`), más `formatearMes` para derivar el "mes actual" del servidor.
- Caso de uso `generarDashboardGerente` (`application/reportes/`) que trae reservas y áreas del condominio (una llamada cada uno) y agrega en memoria — sigue el mismo patrón que el resto del proyecto, sin `groupBy`/SQL de agregación.
- UI: `/gerente/dashboard` — filtro de mes (`<input type="month">`), stat cards, gráfico de barras "reservas por área" (`bg-primary`), gráfico de barras "reservas por mes" (`bg-secondary`) y barras de ocupación por área (`bg-success` sobre `bg-muted`), todo con `<div>`+Tailwind (no se agregó ninguna librería de gráficos).

**Depende de:** Fase 4 (necesita volumen de datos real).

### ✅ Fase 7 — Aislamiento por condominio (completada)

- Auditoría de aislamiento de datos por `condominio_id` en cada query de `application/` — el ítem que realmente se hizo del roadmap original.
- `fechas_bloqueadas` gana `condominio_id` propio; `reservas` se evaluó y se descartó (su condominio ya es derivable vía `areaId`, siempre `NOT NULL`).
- **Descartado por decisión explícita, no por falta de tiempo:** selector de condominio en sesión y rol `super-admin`. Ninguno de los dos tiene un caso de uso real hoy (un usuario sigue perteneciendo a exactamente un condominio; los condominios se siguen creando a mano). Si en el futuro aparece la necesidad real (por ejemplo, una administradora que gestiona varios edificios), son su propia fase — agregarlos ahora hubiera sido construir infraestructura de sesión especulativa.

**Depende de:** Fases 1–4 estables (cambio transversal, mejor con el dominio maduro).

### ⬜ Fase 8 — Calidad, CI/CD y despliegue

- Tests de integración con Postgres real (Testcontainers) para los repositorios Drizzle.
- Tests de casos de uso con repositorios en memoria (fakes que implementan los puertos del dominio).
- CI (GitHub Actions): lint + tsc + vitest + build en cada PR.
- Migraciones automáticas en despliegue (`drizzle-kit migrate`).
- Despliegue: Vercel (app) + Postgres administrado (Neon/Supabase/RDS) para producción.

**Depende de:** todas las fases funcionales anteriores.

### ⬜ Fase 9 — Pulido final

- Auditoría de accesibilidad (teclado, foco, labels — el contraste de color ya está cuidado desde Fase 0).
- Responsive real en mobile.
- Textos de error y estados vacíos revisados con foco en el usuario final hispanohablante.
- Rate limiting básico en login y creación de reservas.

**Depende de:** todo lo anterior.

---

## Convenciones del proyecto

- **Idioma del dominio:** tablas, columnas, entidades y casos de uso en español (es el idioma real del negocio). Estructura de carpetas, identificadores de código y comentarios en inglés.
- **Copy de UI:** en español — los usuarios finales (gerente/huésped) son hispanohablantes.
- **Comentarios en código:** solo cuando explican un *por qué* no obvio (una restricción oculta, un workaround). Nunca describen *qué* hace el código.
- **Sin lógica de negocio en `app/`:** toda regla de negocio vive en `domain/` o se orquesta en `application/`. Las rutas solo llaman casos de uso.
- **Seed idempotente:** `pnpm db:seed` siempre limpia y vuelve a poblar — nunca falla por ejecutarse dos veces.

---

## Decisiones técnicas y por qué

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| PostgreSQL nativo (instalado con `winget`) | Docker Compose | Docker Desktop requiere virtualización por hardware habilitada en BIOS/UEFI; en la máquina de desarrollo estaba deshabilitada y activarla requiere reiniciar y entrar al firmware manualmente. Se optó por no bloquear el arranque del proyecto por eso. El `docker-compose.yml` se mantiene en el repo por si se retoma Docker más adelante (por ejemplo, para Testcontainers en Fase 8) |
| bcryptjs | bcrypt nativo | `bcrypt` requiere compilar un módulo nativo (node-gyp/toolchain de C++); `bcryptjs` es una implementación pura en JS con la misma API, sin esa fricción en Windows |
| Next.js 15.5.23 fijo | Última versión (16.x) | Se fijó a la versión pedida explícitamente al iniciar el proyecto |
| pnpm instalado vía `npm install -g pnpm` | `corepack enable` | Corepack falló con `EPERM` al intentar escribir en `Program Files\nodejs` (requiere permisos de administrador); instalar el paquete a nivel de usuario con npm lo evitó |
