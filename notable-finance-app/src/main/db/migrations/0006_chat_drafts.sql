-- Chat agent (Phase 6.7): durable confirm-gated draft store.
-- Proposed creates/updates survive an app restart until the user Approves / Cancels.
CREATE TABLE `chat_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`summary` text NOT NULL,
	`missing_required` text NOT NULL,
	`warnings` text NOT NULL,
	`payload` text NOT NULL,
	`target_ids` text,
	`computed_preview` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chat_drafts_thread_id_idx` ON `chat_drafts` (`thread_id`);
--> statement-breakpoint
CREATE INDEX `chat_drafts_status_idx` ON `chat_drafts` (`status`);
