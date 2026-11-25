ALTER TABLE "products" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "payment_window_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_unique" UNIQUE("sku");--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_window" CHECK ("store_settings"."payment_window_hours" BETWEEN 1 AND 168);