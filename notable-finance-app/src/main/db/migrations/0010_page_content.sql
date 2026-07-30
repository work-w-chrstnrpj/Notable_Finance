-- Page Content (Notion block children) cached locally per record, edited local-first.
-- `page_content` holds Markdown; `page_content_dirty` = 1 when edited locally and pending
-- push. When dirty, the local copy is authoritative; when clean, it's a refreshable cache.
ALTER TABLE `incomes` ADD COLUMN `page_content` text;
--> statement-breakpoint
ALTER TABLE `incomes` ADD COLUMN `page_content_dirty` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `expenses` ADD COLUMN `page_content` text;
--> statement-breakpoint
ALTER TABLE `expenses` ADD COLUMN `page_content_dirty` integer DEFAULT 0 NOT NULL;
