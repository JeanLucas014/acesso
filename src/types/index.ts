export type Position = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA'
export type Formation = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2'
export type OriginType = 'neighborhood' | 'corporate' | 'historic'
export type Tactic = 'pressure' | 'possession' | 'counter'
export type RiskLevel = 'conservative' | 'balanced' | 'allout'

export interface Player {
  id: string
  name: string
  age: number
  nationality: string
  position_main: Position
  position_secondary?: string
  rating_overall: number
  rating_pace: number
  rating_shooting: number
  rating_passing: number
  rating_dribbling: number
  rating_defending: number
  rating_physical: number
  rating_mental: number
  potential: number
  market_value_brl: number
  wage_brl: number
  current_club_id?: string
  division: string
  renown: string
  sofascore_id?: string
  created_at?: string
}

export interface Club {
  id: string
  name: string
  short_name: string
  city: string
  state: string
  division: string
  is_real: boolean
  stadium_capacity: number
  fanbase_size: number
  reputation: number
  primary_color: string
  secondary_color: string
  created_at?: string
}

export interface UserSave {
  id: string
  user_id: string
  club_id?: string
  club_name: string
  club_primary_color: string
  club_secondary_color: string
  club_crest_template: number
  season_current: number
  budget_brl: number
  wage_bill_brl: number
  prestige: number
  youth_academy_level: number
  stadium_level: number
  origin_type?: string
  created_at?: string
}

export interface SquadPlayer extends Player {
  squad_id: string
  shirt_number?: number
  contract_end_season: number
  morale: number
  fatigue: number
  goals_season: number
  assists_season: number
  rating_avg_season?: number
  is_youth: boolean
  loan_from_club_id?: string
  injury_games_out?: number
  suspension_games_out?: number
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'injury'
  playerId?: string
  playerName?: string
  team: 'home' | 'away'
  assistPlayerId?: string
  assistPlayerName?: string
  severity?: 'leve' | 'moderada' | 'grave'
  detail?: string
}

// Legacy alias kept for compatibility
export type GameEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury'
export type GameEvent = MatchEvent

export interface Match {
  id: string
  save_id: string
  season: number
  competition: string
  round?: number
  home_club_id?: string
  home_club_name: string
  away_club_id?: string
  away_club_name: string
  home_goals?: number
  away_goals?: number
  is_user_home: boolean
  events: MatchEvent[]
  ratings: Record<string, number>
  formation_used?: string
  tactic_used?: string
  played_at: string
}

export interface MatchInput {
  homeSquad: SquadPlayer[]
  awaySquad: SquadPlayer[]
  homeFormation: string
  awayFormation: string
  homeTactic: Tactic
  awayTactic: Tactic
  homeRisk: RiskLevel
  isUserHome: boolean
}

export interface MatchResult {
  homeGoals: number
  awayGoals: number
  events: MatchEvent[]
  ratings: Record<string, number>
  injuredPlayerIds: string[]
  suspendedPlayerIds: string[]
}

export interface SquadUpdate {
  playerId: string
  fatigue: number
  morale: number
  injuryGamesOut: number
  suspensionGamesOut: number
}

export interface Competition {
  id: string
  save_id: string
  type: string
  season: number
  status: 'ongoing' | 'finished'
  state?: string
  created_at?: string
}

export interface Fixture {
  id: string
  competition_id: string
  round: number
  home_club_id?: string
  home_club_name: string
  away_club_id?: string
  away_club_name: string
  home_goals?: number
  away_goals?: number
  is_played: boolean
  is_user_game: boolean
  scheduled_at?: string
}

export interface Standing {
  club_id: string
  club_name: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
}

export interface DraftPlayer {
  localId: string
  name: string
  age: number
  nationality: string
  position: Position
  isYouth: boolean
  rating_overall: number
  rating_pace: number
  rating_shooting: number
  rating_passing: number
  rating_dribbling: number
  rating_defending: number
  potential: number
  wage_brl: number
}

export interface PositionSlot {
  id: string
  label: string
  accepts: Position[]
  x: number
  y: number
}
