-- Regenerate snapshots for existing records after page_content schema changes.
-- This ensures all income and expense records have the correct snapshot state.
UPDATE `incomes` SET `page_content_dirty` = 0 WHERE `page_content_dirty` IS NULL;
UPDATE `expenses` SET `page_content_dirty` = 0 WHERE `page_content_dirty` IS NULL;
