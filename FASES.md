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

**Lo que todavía NO existe (por diseño, es de fases siguientes):** alta/edición/baja de áreas comunes, gestión de horarios y bloqueos, flujo de reserva del huésped, aprobación de reservas, notificaciones (envío real de email), dashboard, multi-condominio activo, CI/CD.

---

## Roadmap de fases

Cada fase es un incremento entregable. La arquitectura no cambia entre fases — solo crece el número de entidades, casos de uso y páginas.

> **Estado (verificado contra el código en `src/`, no solo contra este documento):** Fases 0 y 1 completadas. Ninguna fase 2–9 tiene código todavía (no existe CRUD de áreas comunes, ni server actions para `crear-reserva`/`aprobar-reserva`, aunque esos dos casos de uso ya están escritos en `application/`). **Seguimos con la Fase 2 — CRUD de áreas comunes.**

### ✅ Fase 1 — Gestión de usuarios (completada)

**Objetivo:** el gerente controla quién tiene acceso a la plataforma (no hay auto-registro público).

- Caso de uso `crear-huesped`: el gerente da de alta huéspedes desde la UI.
- Casos de uso `listar-usuarios`, `desactivar-usuario`.
- UI: `/gerente/usuarios` — tabla con alta y baja.
- Recuperación de contraseña: token de un solo uso, con expiración.
- Manejo de error amigable para email duplicado (la restricción única ya existe en el schema).

**Depende de:** Fase 0.
**Definición de terminado:** un gerente puede crear un huésped desde la UI, ese huésped puede loguearse, y un gerente puede desactivarlo.

### ⬜ Fase 2 — CRUD de áreas comunes (siguiente)

**Objetivo:** el gerente configura completamente el catálogo de espacios reservables. **Esto es lo que resuelve el "no hay opción de editar" que se observó en Fase 0.**

- Casos de uso: `crear-area-comun`, `editar-area-comun`, `activar-desactivar-area`.
- Gestión de `horarios_disponibles` (franjas recurrentes por día de semana).
- Gestión de `fechas_bloqueadas` (feriados y bloqueos puntuales, con o sin área asociada).
- UI: `/gerente/areas-comunes/nueva`, `/gerente/areas-comunes/[id]/editar`, subsección de horarios/bloqueos dentro del detalle.

**Depende de:** Fase 0 (el repositorio y schema ya existen; falta la UI de escritura).
**Definición de terminado:** un gerente puede crear un área nueva con su tipo, capacidad y reglas, editarla y desactivarla, todo desde la UI.

### ⬜ Fase 3 — Flujo de reserva (huésped)

**Objetivo:** un huésped ve disponibilidad real y reserva.

- UI: `/huesped` — catálogo de áreas comunes (reutiliza `listar-areas-comunes`).
- UI: `/huesped/areas-comunes/[id]` — selector de fecha/hora que respeta `horarios_disponibles`, `fechas_bloqueadas` y duración máxima.
- Conectar `crear-reserva` (ya implementado en `application/reservas/`) a un server action con validación Zod (`shared/schemas/reserva.schema.ts`, ya existe).
- UI: `/huesped/mis-reservas` — historial y estado.

**Depende de:** Fase 2 (sin horarios/bloqueos configurables no se puede calcular disponibilidad real).
**Definición de terminado:** un huésped puede ver franjas disponibles reales y crear una reserva que queda en estado `pendiente`.

### ⬜ Fase 4 — Aprobación de reservas (gerente)

**Objetivo:** cerrar el ciclo de vida de la reserva.

- UI: `/gerente/reservas` — bandeja de pendientes, filtrable por área/fecha.
- Conectar `aprobar-reserva` (ya implementado) a un server action.
- Vista de detalle con historial de revisión (`revisado_por`, `revisado_en`, ya en el schema).

**Depende de:** Fase 3.
**Definición de terminado:** un gerente puede aprobar o rechazar una reserva pendiente y el huésped ve el cambio de estado reflejado.

### ⬜ Fase 5 — Notificaciones

- Puerto `NotificadorPort` en `domain`/`application`, implementación por email (Resend o Nodemailer) en `infrastructure/notificaciones`.
- Eventos: reserva creada (avisa al gerente), reserva aprobada/rechazada (avisa al huésped).
- Opcional: notificaciones in-app (tabla `notificaciones` nueva).

**Depende de:** Fase 4.

### ⬜ Fase 6 — Reportes y dashboard

- Casos de uso de agregación (reservas por área/mes, tasa de aprobación/rechazo, ocupación).
- UI: `/gerente/dashboard` con gráficos simples.

**Depende de:** Fase 4 (necesita volumen de datos real).

### ⬜ Fase 7 — Multi-condominio real

- Selector de condominio en sesión (hoy `condominioId` viaja en el JWT pero solo hay uno).
- Rol adicional posible: `super-admin` que administra condominios y gerentes.
- Auditoría de aislamiento de datos por `condominio_id` en cada query.

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
