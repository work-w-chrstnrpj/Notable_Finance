-- Notion page icons for reference data (Phase 3.1): accounts (uploaded images,
-- cached as data URIs) and income/expense categories (emoji or library icons).
ALTER TABLE `accounts` ADD COLUMN `icon` text;
--> statement-breakpoint
ALTER TABLE `income_categories` ADD COLUMN `icon` text;
--> statement-breakpoint
ALTER TABLE `expense_categories` ADD COLUMN `icon` text;
