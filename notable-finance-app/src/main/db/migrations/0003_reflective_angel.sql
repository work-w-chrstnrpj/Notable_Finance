CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`resource` text NOT NULL,
	`record_id` text NOT NULL,
	`notion_page_id` text,
	`title` text,
	`action` text NOT NULL,
	`direction` text NOT NULL,
	`at` integer NOT NULL
);
