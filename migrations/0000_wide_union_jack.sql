CREATE TABLE IF NOT EXISTS "balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" varchar(50) DEFAULT 'PAPER' NOT NULL,
	"thb" numeric(20, 8) DEFAULT '20000' NOT NULL,
	"btc" numeric(20, 8) DEFAULT '0' NOT NULL,
	"eth" numeric(20, 8) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bot_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"level" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bot_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_running" boolean DEFAULT false NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"kill_switch" boolean DEFAULT false NOT NULL,
	"last_pulse_at" timestamp,
	"worker_lock" timestamp,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equity_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" varchar(50) DEFAULT 'PAPER' NOT NULL,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"total_value_thb" numeric(20, 8) NOT NULL,
	"thb" numeric(20, 8) NOT NULL,
	"btc" numeric(20, 8) NOT NULL,
	"eth" numeric(20, 8) NOT NULL,
	"btc_price_thb" numeric(20, 8),
	"eth_price_thb" numeric(20, 8)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fills" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" serial NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"fee" numeric(20, 8) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" varchar(50) DEFAULT 'PAPER' NOT NULL,
	"pair" varchar(20) NOT NULL,
	"side" varchar(10) NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"filled_quantity" numeric(20, 8) DEFAULT '0' NOT NULL,
	"filled_price" numeric(20, 8),
	"fee" numeric(20, 8) DEFAULT '0',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "balances_mode_idx" ON "balances" ("mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bot_events_timestamp_idx" ON "bot_events" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bot_events_level_idx" ON "bot_events" ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "equity_snapshots_timestamp_idx" ON "equity_snapshots" ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "equity_snapshots_mode_idx" ON "equity_snapshots" ("mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fills_order_id_idx" ON "fills" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fills_created_at_idx" ON "fills" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_pair_idx" ON "orders" ("pair");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "settings_key_idx" ON "settings" ("key");