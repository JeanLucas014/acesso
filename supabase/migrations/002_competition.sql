-- Fase 2: competições e fixtures do campeonato estadual

CREATE TABLE IF NOT EXISTS competitions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  save_id     uuid REFERENCES user_saves(id) ON DELETE CASCADE NOT NULL,
  type        text NOT NULL DEFAULT 'estadual',
  season      integer NOT NULL DEFAULT 1,
  status      text NOT NULL DEFAULT 'ongoing',
  state       text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixtures (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id  uuid REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  round           integer NOT NULL,
  home_club_id    uuid,
  home_club_name  text NOT NULL,
  away_club_id    uuid,
  away_club_name  text NOT NULL,
  home_goals      integer,
  away_goals      integer,
  is_played       boolean NOT NULL DEFAULT false,
  is_user_game    boolean NOT NULL DEFAULT false,
  scheduled_at    timestamptz
);

-- Add injury/suspension tracking to squads
ALTER TABLE squads
  ADD COLUMN IF NOT EXISTS injury_games_out    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspension_games_out integer NOT NULL DEFAULT 0;

-- RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitions_own" ON competitions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_saves us WHERE us.id = save_id AND us.user_id = auth.uid())
  );

CREATE POLICY "fixtures_own" ON fixtures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM competitions c
      JOIN user_saves us ON us.id = c.save_id
      WHERE c.id = competition_id AND us.user_id = auth.uid()
    )
  );
