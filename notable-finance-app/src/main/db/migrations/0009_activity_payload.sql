-- Store full record payload in activity_log so the History page can render
-- proper read-only form modals (income/expense data) for synced items.
ALTER TABLE `activity_log` ADD COLUMN `payload` text;
