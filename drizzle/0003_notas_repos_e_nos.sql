CREATE TYPE "public"."note_kind" AS ENUM('folder', 'file');--> statement-breakpoint
CREATE TABLE "note_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repo_id" uuid NOT NULL,
	"parent_id" uuid,
	"kind" "note_kind" NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "note_repos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "note_nodes" ADD CONSTRAINT "note_nodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_nodes" ADD CONSTRAINT "note_nodes_repo_id_note_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."note_repos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_nodes" ADD CONSTRAINT "note_nodes_parent_id_note_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."note_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_repos" ADD CONSTRAINT "note_repos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_nodes_repo_idx" ON "note_nodes" USING btree ("repo_id");--> statement-breakpoint
CREATE INDEX "note_nodes_parent_idx" ON "note_nodes" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "note_nodes_unique_name" ON "note_nodes" USING btree ("repo_id",coalesce("parent_id", '00000000-0000-0000-0000-000000000000'::uuid),lower("name")) WHERE "note_nodes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "note_repos_user_idx" ON "note_repos" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "note_repos_unique_name" ON "note_repos" USING btree ("user_id",lower("name")) WHERE "note_repos"."deleted_at" is null;