-- Borrowed Money rows now use a blue anchor icon. Re-push the already-synced ones once so Notion gets it.
UPDATE `incomes` SET `sync_state` = 'dirty', `local_updated_at` = CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE `sync_state` = 'clean' AND `notion_page_id` IS NOT NULL AND `deleted` = 0
  AND `category_id` IN (SELECT `id` FROM `income_categories` WHERE lower(`source`) = 'borrowed money');
