-- Fase 3: transferências e finanças

CREATE TABLE IF NOT EXISTS transfers (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  save_id          uuid REFERENCES user_saves(id) ON DELETE CASCADE NOT NULL,
  player_id        uuid REFERENCES players(id) ON DELETE SET NULL,
  type             text NOT NULL,
  fee_brl          bigint DEFAULT 0,
  wage_brl         integer,
  contract_seasons integer DEFAULT 2,
  from_club_id     uuid,
  from_club_name   text,
  to_club_id       uuid,
  to_club_name     text,
  season           integer,
  transfer_window  text,
  clauses          jsonb DEFAULT '{}',
  status           text DEFAULT 'pending',
  counter_fee      bigint,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finances (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  save_id      uuid REFERENCES user_saves(id) ON DELETE CASCADE NOT NULL,
  season       integer NOT NULL,
  month        integer NOT NULL,
  type         text NOT NULL,
  category     text NOT NULL,
  amount_brl   bigint NOT NULL,
  description  text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_own" ON transfers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_saves us WHERE us.id = save_id AND us.user_id = auth.uid())
  );

CREATE POLICY "finances_own" ON finances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_saves us WHERE us.id = save_id AND us.user_id = auth.uid())
  );
