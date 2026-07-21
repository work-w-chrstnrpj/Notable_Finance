CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_page_id` text,
	`account_name` text NOT NULL,
	`account_type` text NOT NULL,
	`starting_balance` real DEFAULT 0 NOT NULL,
	`credit_limit` real,
	`inactive` integer DEFAULT 0 NOT NULL,
	`billing_day` integer,
	`due_day` integer,
	`annual_fee` real,
	`credit_points` real,
	`notion_last_edited_at` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `conflicts` (
	`id` text PRIMARY KEY NOT NULL,
	`record_table` text NOT NULL,
	`record_id` text NOT NULL,
	`field` text NOT NULL,
	`base_value` text,
	`local_value` text,
	`remote_value` text,
	`detected_at` integer NOT NULL,
	`resolved_at` integer,
	`resolution` text
);
--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_page_id` text,
	`name` text NOT NULL,
	`monthly_budget` real DEFAULT 0 NOT NULL,
	`auxiliary` integer DEFAULT 0 NOT NULL,
	`notion_last_edited_at` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expense_scheduler` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_page_id` text,
	`base_snapshot` text,
	`sync_state` text DEFAULT 'dirty' NOT NULL,
	`local_updated_at` integer NOT NULL,
	`notion_last_edited_at` text,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`title` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`account_id` text,
	`category_id` text,
	`frequency` text,
	`next_run_date` text,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_page_id` text,
	`base_snapshot` text,
	`sync_state` text DEFAULT 'dirty' NOT NULL,
	`local_updated_at` integer NOT NULL,
	`notion_last_edited_at` text,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`title` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`interest` real DEFAULT 0 NOT NULL,
	`account_id` text,
	`category_id` text,
	`purchase_date` text,
	`date_paid` text,
	`payment_status` text,
	`payment_frequency` text,
	`period_count` integer,
	`paid_period` integer,
	`is_pasabuy` integer DEFAULT 0 NOT NULL,
	`pasabuyer` text,
	`pasabuy_status` text,
	`pasabuy_account_receiver_id` text,
	`cc_link_payment_receipt_id` text
);
--> statement-breakpoint
CREATE TABLE `income_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_page_id` text,
	`source` text NOT NULL,
	`auxiliary` integer DEFAULT 0 NOT NULL,
	`notion_last_edited_at` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `incomes` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_page_id` text,
	`base_snapshot` text,
	`sync_state` text DEFAULT 'dirty' NOT NULL,
	`local_updated_at` integer NOT NULL,
	`notion_last_edited_at` text,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`title` text NOT NULL,
	`gross_income` real DEFAULT 0 NOT NULL,
	`capital_expenditure` real DEFAULT 0 NOT NULL,
	`account_id` text,
	`category_id` text,
	`date` text,
	`notes` text,
	`is_transaction` integer DEFAULT 0 NOT NULL,
	`transacted_account_id` text,
	`cc_payment_covered_id` text
);
--> statement-breakpoint
CREATE TABLE `mutation_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`record_id` text NOT NULL,
	`payload` text,
	`created_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
