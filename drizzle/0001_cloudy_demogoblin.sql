ALTER TABLE "items" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_source_id_items_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_source_id_sections_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;