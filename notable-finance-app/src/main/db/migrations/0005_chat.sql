-- Chat agent (Phase 6.1): threads, messages, credential metadata (keys in safeStorage, not SQLite)
CREATE TABLE `chat_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`key_fingerprint` text NOT NULL,
	`is_default` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`credential_id` text,
	`model_id` text,
	`overlay` text DEFAULT 'default' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`payload_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chat_messages_thread_id_idx` ON `chat_messages` (`thread_id`);
--> statement-breakpoint
CREATE INDEX `chat_threads_updated_at_idx` ON `chat_threads` (`updated_at`);
