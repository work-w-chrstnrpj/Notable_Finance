-- Period budgets: the quarter, half and year rows of the Custom monthly budget database, kept as written
-- (Q1 2026, H1 2026, 2026) so Monitoring can use them directly. Read-only cache, replaced on every pull.
CREATE TABLE `period_budget_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`category_id` text NOT NULL,
	`category_name` text NOT NULL,
	`budget` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `period_budget_snapshots_period_category_uq` ON `period_budget_snapshots` (`period`,`category_id`);
