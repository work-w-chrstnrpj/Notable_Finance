-- Migration 003: User Preferences
-- Per-user UI preferences (e.g. the floating quick-action button toggle).
-- Kept separate from Notion credentials so UI settings never touch secrets.

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  show_fab BOOLEAN NOT NULL DEFAULT TRUE,
  extras JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
