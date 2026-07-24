-- Chat agent (Phase 6.9): presentation-only mirror of the draft payload so the
-- confirm card can show resolved names/amounts instead of raw ids.
ALTER TABLE `chat_drafts` ADD COLUMN `display` text;
