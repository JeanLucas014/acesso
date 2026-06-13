ALTER TABLE user_saves
  ADD COLUMN IF NOT EXISTS default_lineup   jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS default_formation text  DEFAULT '4-3-3';
