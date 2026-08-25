ALTER TABLE "fechas_bloqueadas" ADD COLUMN "condominio_id" uuid;--> statement-breakpoint
UPDATE "fechas_bloqueadas" fb SET "condominio_id" = ac."condominio_id"
  FROM "areas_comunes" ac WHERE fb."area_id" = ac."id";--> statement-breakpoint
-- Only one condominio exists today; wide rows (area_id IS NULL) belong to it.
UPDATE "fechas_bloqueadas" SET "condominio_id" = (SELECT "id" FROM "condominios" LIMIT 1)
  WHERE "condominio_id" IS NULL;--> statement-breakpoint
ALTER TABLE "fechas_bloqueadas" ALTER COLUMN "condominio_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fechas_bloqueadas" ADD CONSTRAINT "fechas_bloqueadas_condominio_id_condominios_id_fk" FOREIGN KEY ("condominio_id") REFERENCES "public"."condominios"("id") ON DELETE cascade ON UPDATE no action;
