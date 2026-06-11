-- ═══════════════════════════════════════════════
-- Acesso — Initial Schema Migration
-- ═══════════════════════════════════════════════

-- CLUBS
CREATE TABLE IF NOT EXISTS clubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  short_name text,
  city text,
  state text,
  division text,
  is_real boolean DEFAULT true,
  stadium_capacity integer DEFAULT 10000,
  fanbase_size integer DEFAULT 5000,
  reputation integer DEFAULT 30,
  primary_color text DEFAULT '#22C55E',
  secondary_color text DEFAULT '#FFFFFF',
  created_at timestamptz DEFAULT now()
);

-- PLAYERS
CREATE TABLE IF NOT EXISTS players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  age integer,
  nationality text DEFAULT 'Brasileiro',
  position_main text,
  position_secondary text,
  rating_overall integer,
  rating_pace integer,
  rating_shooting integer,
  rating_passing integer,
  rating_dribbling integer,
  rating_defending integer,
  rating_physical integer,
  rating_mental integer,
  potential integer,
  market_value_brl bigint,
  wage_brl integer,
  current_club_id uuid REFERENCES clubs(id),
  division text DEFAULT 'serie_a',
  renown text DEFAULT 'local',
  sofascore_id text,
  created_at timestamptz DEFAULT now()
);

-- USER SAVES
CREATE TABLE IF NOT EXISTS user_saves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  club_id uuid REFERENCES clubs(id),
  club_name text,
  club_primary_color text,
  club_secondary_color text,
  club_crest_template integer DEFAULT 1,
  season_current integer DEFAULT 1,
  budget_brl bigint DEFAULT 300000,
  wage_bill_brl integer DEFAULT 0,
  prestige integer DEFAULT 10,
  youth_academy_level integer DEFAULT 0,
  stadium_level integer DEFAULT 1,
  origin_type text,
  created_at timestamptz DEFAULT now()
);

-- SQUADS
CREATE TABLE IF NOT EXISTS squads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  save_id uuid REFERENCES user_saves(id) NOT NULL,
  player_id uuid REFERENCES players(id) NOT NULL,
  shirt_number integer,
  wage_brl integer,
  contract_end_season integer DEFAULT 3,
  morale integer DEFAULT 70,
  fatigue integer DEFAULT 0,
  goals_season integer DEFAULT 0,
  assists_season integer DEFAULT 0,
  rating_avg_season numeric(3,1),
  is_youth boolean DEFAULT false,
  loan_from_club_id uuid,
  created_at timestamptz DEFAULT now()
);

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  save_id uuid REFERENCES user_saves(id) NOT NULL,
  season integer DEFAULT 1,
  competition text,
  round integer,
  home_club_id uuid,
  home_club_name text,
  away_club_id uuid,
  away_club_name text,
  home_goals integer,
  away_goals integer,
  is_user_home boolean,
  events jsonb DEFAULT '[]',
  ratings jsonb DEFAULT '{}',
  formation_used text,
  tactic_used text,
  played_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- clubs: public read
CREATE POLICY "clubs_public_read" ON clubs
  FOR SELECT USING (true);

CREATE POLICY "clubs_insert_authenticated" ON clubs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- players: public read
CREATE POLICY "players_public_read" ON players
  FOR SELECT USING (true);

CREATE POLICY "players_insert_authenticated" ON players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- user_saves: only own saves
CREATE POLICY "saves_select_own" ON user_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saves_insert_own" ON user_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saves_update_own" ON user_saves
  FOR UPDATE USING (auth.uid() = user_id);

-- squads: via save ownership
CREATE POLICY "squads_select_own" ON squads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_saves
      WHERE user_saves.id = squads.save_id
      AND user_saves.user_id = auth.uid()
    )
  );

CREATE POLICY "squads_insert_own" ON squads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_saves
      WHERE user_saves.id = squads.save_id
      AND user_saves.user_id = auth.uid()
    )
  );

CREATE POLICY "squads_update_own" ON squads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_saves
      WHERE user_saves.id = squads.save_id
      AND user_saves.user_id = auth.uid()
    )
  );

-- matches: via save ownership
CREATE POLICY "matches_select_own" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_saves
      WHERE user_saves.id = matches.save_id
      AND user_saves.user_id = auth.uid()
    )
  );

CREATE POLICY "matches_insert_own" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_saves
      WHERE user_saves.id = matches.save_id
      AND user_saves.user_id = auth.uid()
    )
  );
