-- Notion page icons are only sent when a row is pushed. Re-push existing synced
-- Transfer / Credit Card Payment / Borrowed Money rows once so their icon is applied.
UPDATE `incomes` SET `sync_state` = 'dirty', `local_updated_at` = CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE `sync_state` = 'clean' AND `notion_page_id` IS NOT NULL AND `deleted` = 0
  AND `category_id` IN (SELECT `id` FROM `income_categories` WHERE lower(`source`) IN ('transfer', 'credit card payment', 'borrowed money'));
