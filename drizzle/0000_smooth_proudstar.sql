CREATE TYPE "public"."estado_reserva" AS ENUM('pendiente', 'aprobada', 'rechazada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('gerente', 'huesped');--> statement-breakpoint
CREATE TABLE "areas_comunes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominio_id" uuid NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"descripcion" text,
	"capacidad_maxima" integer NOT NULL,
	"duracion_maxima_minutos" integer NOT NULL,
	"anticipacion_minima_horas" integer NOT NULL,
	"anticipacion_maxima_dias" integer NOT NULL,
	"activa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condominios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"direccion" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fechas_bloqueadas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid,
	"fecha" date NOT NULL,
	"motivo" text
);
--> statement-breakpoint
CREATE TABLE "horarios_disponibles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"dia_semana" integer NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fin" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fin" time NOT NULL,
	"cantidad_personas" integer NOT NULL,
	"estado" "estado_reserva" DEFAULT 'pendiente' NOT NULL,
	"notas" text,
	"revisado_por" uuid,
	"revisado_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominio_id" uuid NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"rol" "rol" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "areas_comunes" ADD CONSTRAINT "areas_comunes_condominio_id_condominios_id_fk" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fechas_bloqueadas" ADD CONSTRAINT "fechas_bloqueadas_area_id_areas_comunes_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas_comunes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios_disponibles" ADD CONSTRAINT "horarios_disponibles_area_id_areas_comunes_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas_comunes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_area_id_areas_comunes_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas_comunes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_revisado_por_usuarios_id_fk" FOREIGN KEY ("revisado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_condominio_id_condominios_id_fk" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominios"("id") ON DELETE cascade ON UPDATE no action;