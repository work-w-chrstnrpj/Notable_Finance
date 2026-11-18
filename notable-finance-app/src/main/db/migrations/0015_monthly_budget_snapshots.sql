-- Saved budgets (ADR-0006): per-month copies of expense category budgets. Local only; not a sync table.
CREATE TABLE `monthly_budget_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`category_id` text NOT NULL,
	`category_name` text NOT NULL,
	`budget` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_budget_snapshots_month_category_uq` ON `monthly_budget_snapshots` (`month`,`category_id`);
--> statement-breakpoint
CREATE INDEX `monthly_budget_snapshots_month_idx` ON `monthly_budget_snapshots` (`month`);
