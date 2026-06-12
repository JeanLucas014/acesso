import type { Competition, Fixture, Standing, SquadPlayer, Position } from '../types'
import { supabase } from './supabase'
import { simulateAIMatch } from './matchEngine'

// ─── AI team data ─────────────────────────────────────────────────────────────
const AI_CLUB_TEMPLATES = [
  (st: string) => `EC Central ${st}`,
  (st: string) => `Atlético ${st}`,
  (st: string) => `Sport ${st}`,
  (st: string) => `Independente ${st}`,
  (st: string) => `União ${st}`,
  (st: string) => `América ${st}`,
  (st: string) => `River ${st}`,
]

const AI_COLORS = ['#E8001C','#0043A0','#006437','#CC7700','#660099','#007755','#884400']

// Reputations: 2 weak / 3 medium / 2 strong
const AI_REPUTATIONS = [58, 62, 65, 67, 68, 72, 75]

const BRAZILIAN_NAMES = [
  'João','Carlos','Paulo','Bruno','Rafael','Marcos','Thiago','Lucas','Gustavo',
  'Diego','Anderson','Fábio','Rodrigo','Felipe','Marcelo','Willian','Mateus',
  'Renato','Leandro','Eduardo','Roberto','Henrique','Gabriel','Alexandre','Jorge',
]

// ─── LCG deterministic RNG ────────────────────────────────────────────────────
function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function makeLcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

// ─── Generate AI squad (deterministic from clubId) ───────────────────────────
const FORMATION_POSITIONS: Position[] = ['GOL','ZAG','ZAG','LAT','LAT','VOL','VOL','MEI','MEI','ATA','ATA']

export function generateAISquad(clubId: string, avgRating: number): SquadPlayer[] {
  const rng = makeLcg(hashCode(clubId))

  return FORMATION_POSITIONS.map((pos, i) => {
    const delta = Math.round((rng() - 0.5) * 18)
    const base  = Math.max(45, Math.min(85, avgRating + delta))
    const spread = (r: number) => Math.max(40, Math.min(90, base + Math.round((r - 0.5) * 12)))

    const isAtk = pos === 'ATA' || pos === 'MEI'
    const isDef = pos === 'ZAG' || pos === 'LAT' || pos === 'GOL'

    return {
      id: `ai-${clubId}-${i}`,
      name: BRAZILIAN_NAMES[Math.floor(rng() * BRAZILIAN_NAMES.length)],
      age: 20 + Math.floor(rng() * 14),
      nationality: 'Brasileiro',
      position_main: pos,
      rating_overall: base,
      rating_pace:      spread(rng()),
      rating_shooting:  Math.max(40, Math.min(90, base + (isAtk ? 5 : -8))),
      rating_passing:   Math.max(40, Math.min(90, base + (pos === 'MEI' ? 6 : 0))),
      rating_dribbling: spread(rng()),
      rating_defending: Math.max(40, Math.min(90, base + (isDef ? 5 : -8))),
      rating_physical:  spread(rng()),
      rating_mental:    spread(rng()),
      potential: base + 3,
      market_value_brl: 50000,
      wage_brl: 5000,
      division: 'estadual',
      renown: 'local',
      squad_id: `ai-squad-${clubId}-${i}`,
      contract_end_season: 2,
      morale: 70,
      fatigue: 0,
      goals_season: 0,
      assists_season: 0,
      is_youth: false,
      injury_games_out: 0,
      suspension_games_out: 0,
    } as SquadPlayer
  })
}

// ─── Round-robin schedule ─────────────────────────────────────────────────────
interface GameSlot { homeId: string; homeName: string; awayId: string; awayName: string }

function buildSchedule(clubs: { id: string; name: string }[]): GameSlot[][] {
  const n = clubs.length  // 8
  const ids   = clubs.map(c => c.id)
  const names = Object.fromEntries(clubs.map(c => [c.id, c.name]))

  const fixed     = ids[0]
  const rotatable = ids.slice(1)
  const firstLeg: GameSlot[][] = []

  for (let r = 0; r < n - 1; r++) {
    const round: GameSlot[] = []
    const isFixedHome = r % 2 === 0
    round.push(isFixedHome
      ? { homeId: fixed, homeName: names[fixed], awayId: rotatable[0], awayName: names[rotatable[0]] }
      : { homeId: rotatable[0], homeName: names[rotatable[0]], awayId: fixed, awayName: names[fixed] })

    for (let i = 1; i < n / 2; i++) {
      const a = rotatable[i]
      const b = rotatable[n - 1 - i]
      const aHome = (r + i) % 2 === 0
      round.push(aHome
        ? { homeId: a, homeName: names[a], awayId: b, awayName: names[b] }
        : { homeId: b, homeName: names[b], awayId: a, awayName: names[a] })
    }

    firstLeg.push(round)
    rotatable.unshift(rotatable.pop()!)
  }

  const secondLeg = firstLeg.map(round =>
    round.map(g => ({ homeId: g.awayId, homeName: g.awayName, awayId: g.homeId, awayName: g.homeName }))
  )

  return [...firstLeg, ...secondLeg]
}

// ─── Generate state championship ─────────────────────────────────────────────
export async function generateStateChampionship(
  saveId: string,
  userClub: { id: string; name: string; state: string },
  season: number
): Promise<string | null> {
  // Create 7 AI clubs
  const aiClubs: { id: string; name: string; reputation: number }[] = []

  for (let i = 0; i < 7; i++) {
    const name = AI_CLUB_TEMPLATES[i](userClub.state)
    const { data, error } = await supabase.from('clubs').insert({
      name,
      short_name: name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase(),
      city: userClub.state,
      state: userClub.state,
      division: 'estadual',
      is_real: false,
      stadium_capacity: 5000,
      fanbase_size: 1000,
      reputation: AI_REPUTATIONS[i],
      primary_color: AI_COLORS[i],
      secondary_color: '#FFFFFF',
    }).select('id').single()

    if (error || !data) return null
    aiClubs.push({ id: data.id, name, reputation: AI_REPUTATIONS[i] })
  }

  // Create competition record
  const { data: comp, error: compErr } = await supabase.from('competitions').insert({
    save_id: saveId,
    type: 'estadual',
    season,
    status: 'ongoing',
    state: userClub.state,
  }).select('id').single()

  if (compErr || !comp) return null

  // Build schedule with user club first (fixed position)
  const allClubs = [
    { id: userClub.id, name: userClub.name },
    ...aiClubs.map(c => ({ id: c.id, name: c.name })),
  ]
  const schedule = buildSchedule(allClubs)

  // Insert all fixtures
  const fixtures = schedule.flatMap((round, roundIdx) =>
    round.map(game => ({
      competition_id: comp.id,
      round: roundIdx + 1,
      home_club_id: game.homeId,
      home_club_name: game.homeName,
      away_club_id: game.awayId,
      away_club_name: game.awayName,
      is_user_game: game.homeId === userClub.id || game.awayId === userClub.id,
    }))
  )

  const { error: fixErr } = await supabase.from('fixtures').insert(fixtures)
  if (fixErr) return null

  return comp.id
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export async function getActiveCompetition(saveId: string): Promise<Competition | null> {
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .eq('save_id', saveId)
    .eq('status', 'ongoing')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export async function getNextUserFixture(saveId: string): Promise<{
  fixture: Fixture
  competition: Competition
  opponentName: string
  opponentReputation: number
} | null> {
  const comp = await getActiveCompetition(saveId)
  if (!comp) return null

  const { data } = await supabase
    .from('fixtures')
    .select('*')
    .eq('competition_id', comp.id)
    .eq('is_user_game', true)
    .eq('is_played', false)
    .order('round', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  // Fetch opponent club reputation
  const { data: save } = await supabase.from('user_saves').select('club_id').eq('id', saveId).single()
  const userClubId = save?.club_id
  const opponentId = data.home_club_id === userClubId ? data.away_club_id : data.home_club_id
  const opponentName = data.home_club_id === userClubId ? data.away_club_name : data.home_club_name

  let opponentReputation = 65
  if (opponentId) {
    const { data: club } = await supabase.from('clubs').select('reputation').eq('id', opponentId).single()
    if (club) opponentReputation = club.reputation
  }

  return { fixture: data as Fixture, competition: comp, opponentName, opponentReputation }
}

export async function getStandings(competitionId: string): Promise<Standing[]> {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('home_club_id,home_club_name,away_club_id,away_club_name,home_goals,away_goals,is_played')
    .eq('competition_id', competitionId)
    .eq('is_played', true)

  const table: Record<string, Standing> = {}

  function ensure(id: string, name: string) {
    if (!table[id]) table[id] = { club_id: id, club_name: name, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_diff: 0, points: 0 }
  }

  ;(fixtures ?? []).forEach(f => {
    if (f.home_goals == null || f.away_goals == null) return
    const hId = f.home_club_id ?? 'unknown-home'
    const aId = f.away_club_id ?? 'unknown-away'
    ensure(hId, f.home_club_name)
    ensure(aId, f.away_club_name)

    const h = table[hId]
    const a = table[aId]
    h.played++; a.played++
    h.goals_for    += f.home_goals; h.goals_against += f.away_goals
    a.goals_for    += f.away_goals; a.goals_against += f.home_goals

    if (f.home_goals > f.away_goals) { h.won++; h.points += 3; a.lost++ }
    else if (f.home_goals < f.away_goals) { a.won++; a.points += 3; h.lost++ }
    else { h.drawn++; h.points++; a.drawn++; a.points++ }
  })

  return Object.values(table)
    .map(s => ({ ...s, goal_diff: s.goals_for - s.goals_against }))
    .sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for)
}

export async function getFixturesByRound(competitionId: string, round: number): Promise<Fixture[]> {
  const { data } = await supabase
    .from('fixtures')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('round', round)
    .order('is_user_game', { ascending: false })
  return (data ?? []) as Fixture[]
}

export async function simulateRoundAI(round: number, competitionId: string, _userClubId: string): Promise<void> {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('id,home_club_id,away_club_id,is_user_game')
    .eq('competition_id', competitionId)
    .eq('round', round)
    .eq('is_played', false)
    .eq('is_user_game', false)

  if (!fixtures?.length) return

  // Fetch all clubs' reputations in one query
  const clubIds = [...new Set(fixtures.flatMap(f => [f.home_club_id, f.away_club_id].filter(Boolean)))] as string[]
  const { data: clubs } = await supabase.from('clubs').select('id,reputation').in('id', clubIds)
  const repMap: Record<string, number> = {}
  ;(clubs ?? []).forEach(c => { repMap[c.id] = c.reputation })

  const updates = fixtures.map(f => {
    const homeRep = repMap[f.home_club_id ?? ''] ?? 65
    const awayRep = repMap[f.away_club_id ?? ''] ?? 65
    const { homeGoals, awayGoals } = simulateAIMatch(homeRep, awayRep)
    return { id: f.id, home_goals: homeGoals, away_goals: awayGoals, is_played: true }
  })

  for (const upd of updates) {
    await supabase.from('fixtures').update({
      home_goals: upd.home_goals,
      away_goals: upd.away_goals,
      is_played: true,
    }).eq('id', upd.id)
  }
}

export async function getCurrentRound(competitionId: string): Promise<number> {
  // First round that has at least one unplayed fixture
  const { data } = await supabase
    .from('fixtures')
    .select('round')
    .eq('competition_id', competitionId)
    .eq('is_played', false)
    .order('round', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.round ?? 14
}
