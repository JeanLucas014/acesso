import type { SquadPlayer, MatchInput, MatchResult, MatchEvent, SquadUpdate, Position } from '../types'

// ─── Knuth Poisson ───────────────────────────────────────────────────────────
function poissonGoals(lambda: number): number {
  const L = Math.exp(-Math.max(0.01, lambda))
  let k = 0
  let p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

// ─── Sector strength ─────────────────────────────────────────────────────────
interface Strength { attack: number; midfield: number; defense: number }

function calcSectorStrength(squad: SquadPlayer[]): Strength {
  function sectorAvg(players: SquadPlayer[], attrs: (keyof SquadPlayer)[]): number {
    if (!players.length) return 50
    return players.reduce((sum, p) => {
      const base = attrs.reduce((s, a) => s + (Number(p[a]) || 50), 0) / attrs.length
      let mult = 1.0
      if (p.fatigue > 80) mult *= 0.80
      else if (p.fatigue > 60) mult *= 0.90
      if (p.morale >= 80) mult *= 1.05
      else if (p.morale < 40) mult *= 0.92
      return sum + base * mult
    }, 0) / players.length
  }

  const attackers  = squad.filter(p => p.position_main === 'ATA' || p.position_main === 'MEI')
  const midfielders = squad.filter(p => p.position_main === 'VOL' || p.position_main === 'MEI')
  const defenders  = squad.filter(p => ['ZAG','LAT','GOL'].includes(p.position_main))

  return {
    attack:   sectorAvg(attackers,   ['rating_shooting','rating_dribbling','rating_pace']),
    midfield: sectorAvg(midfielders, ['rating_passing','rating_mental','rating_physical']),
    defense:  sectorAvg(defenders,   ['rating_defending','rating_physical','rating_mental']),
  }
}

// ─── Expected goals ───────────────────────────────────────────────────────────
function calcExpectedGoals(
  strength: Strength,
  opponentStrength: Strength,
  tactic: MatchInput['homeTactic'],
  risk: MatchInput['homeRisk'],
  isHome: boolean
): number {
  const attackEff = strength.attack / Math.max(opponentStrength.defense, 30)
  const base = attackEff * 0.75

  const tacticMult: Record<string, number> = { pressure: 1.10, possession: 0.95, counter: 0.88 }
  const riskMult:   Record<string, number>  = { conservative: 0.75, balanced: 1.0, allout: 1.35 }
  const homeMult = isHome ? 1.15 : 0.92

  return Math.max(0.25, Math.min(3.8, base * tacticMult[tactic] * riskMult[risk] * homeMult))
}

// ─── Event generation ─────────────────────────────────────────────────────────
function weightedPick<T>(items: T[], weights: number[]): T {
  let total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

const GOAL_WEIGHTS: Partial<Record<Position, number>> = {
  ATA: 5, MEI: 3, VOL: 1.5, LAT: 0.5, ZAG: 0.3, GOL: 0.05,
}
const ASSIST_WEIGHTS: Partial<Record<Position, number>> = {
  MEI: 4, LAT: 2.5, VOL: 2, ATA: 1.5, ZAG: 0.4, GOL: 0.05,
}

function generateEvents(
  homeSquad: SquadPlayer[],
  awaySquad: SquadPlayer[],
  homeGoals: number,
  awayGoals: number
): MatchEvent[] {
  const events: MatchEvent[] = []

  function addGoals(squad: SquadPlayer[], count: number, team: 'home' | 'away') {
    const minutes = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 1).sort((a, b) => a - b)
    minutes.forEach(minute => {
      const scorer = weightedPick(squad, squad.map(p => GOAL_WEIGHTS[p.position_main] ?? 1))
      const others = squad.filter(p => p.id !== scorer.id)
      const hasAssist = Math.random() < 0.65 && others.length > 0
      const assist = hasAssist
        ? weightedPick(others, others.map(p => ASSIST_WEIGHTS[p.position_main] ?? 1))
        : null
      events.push({
        minute, type: 'goal', playerId: scorer.id, playerName: scorer.name, team,
        assistPlayerId: assist?.id, assistPlayerName: assist?.name,
      })
    })
  }

  function addCards(squad: SquadPlayer[], team: 'home' | 'away') {
    const yellowCount = Math.floor(Math.random() * 3)  // 0–2
    const shuffled = [...squad].sort(() => Math.random() - 0.5).slice(0, yellowCount)
    shuffled.forEach(p => {
      const minute = Math.floor(Math.random() * 84) + 1
      events.push({ minute, type: 'yellow_card', playerId: p.id, playerName: p.name, team })
      if (Math.random() < 0.07) {
        events.push({
          minute: Math.min(minute + 5 + Math.floor(Math.random() * 20), 90),
          type: 'red_card', playerId: p.id, playerName: p.name, team,
        })
      }
    })
  }

  function addInjuries(squad: SquadPlayer[], team: 'home' | 'away') {
    squad.forEach(p => {
      if (Math.random() < 0.04) {
        const minute = Math.floor(Math.random() * 80) + 1
        const r = Math.random()
        const severity: MatchEvent['severity'] = r < 0.6 ? 'leve' : r < 0.9 ? 'moderada' : 'grave'
        events.push({ minute, type: 'injury', playerId: p.id, playerName: p.name, team, severity })
      }
    })
  }

  addGoals(homeSquad, homeGoals, 'home')
  addGoals(awaySquad, awayGoals, 'away')
  addCards(homeSquad, 'home')
  addCards(awaySquad, 'away')
  addInjuries(homeSquad, 'home')
  addInjuries(awaySquad, 'away')

  return events.sort((a, b) => a.minute - b.minute)
}

// ─── Ratings ──────────────────────────────────────────────────────────────────
function calcRatings(
  starters: SquadPlayer[],
  events: MatchEvent[],
  team: 'home' | 'away',
  _goalsScored: number,
  goalsConceded: number
): Record<string, number> {
  const ratings: Record<string, number> = {}

  starters.forEach(p => {
    let rating = 6.0

    const goals   = events.filter(e => e.type === 'goal'        && e.team === team && e.playerId === p.id).length
    const assists  = events.filter(e => e.type === 'goal'        && e.team === team && e.assistPlayerId === p.id).length
    const yellows  = events.filter(e => e.type === 'yellow_card' && e.team === team && e.playerId === p.id).length
    const reds     = events.filter(e => e.type === 'red_card'    && e.team === team && e.playerId === p.id).length
    const injured  = events.some(e  => e.type === 'injury'       && e.team === team && e.playerId === p.id)

    rating += goals   * 1.5
    rating += assists * 0.8
    rating -= yellows * 0.5
    rating -= reds    * 2.0
    if (injured) rating -= 0.3

    if (goalsConceded === 0 && ['GOL','ZAG','LAT'].includes(p.position_main)) rating += 1.2
    if (p.position_main === 'GOL') {
      if (goalsConceded === 0) rating += 0.8
      else if (goalsConceded === 1) rating += 0.2
      else if (goalsConceded >= 3) rating -= 0.5
    }

    ratings[p.id] = Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10))
  })

  return ratings
}

// ─── Post-match squad effects ─────────────────────────────────────────────────
export function applyMatchEffects(
  allUserPlayers: SquadPlayer[],
  starterIds: string[],
  isUserHome: boolean,
  homeGoals: number,
  awayGoals: number,
  events: MatchEvent[]
): SquadUpdate[] {
  const userGoals     = isUserHome ? homeGoals : awayGoals
  const opponentGoals = isUserHome ? awayGoals : homeGoals
  const diff          = userGoals - opponentGoals

  const moraleDelta   = diff > 0 ? 8 : diff === 0 ? 2 : -6
  const goleadaPenalty = diff <= -3 ? -15 : 0
  const userTeam = isUserHome ? 'home' : 'away'

  return allUserPlayers.map(p => {
    const isStarter = starterIds.includes(p.id)

    const newFatigue = Math.max(0, Math.min(100, p.fatigue + (isStarter ? 20 : -15)))
    const newMorale  = Math.max(0, Math.min(100, p.morale + moraleDelta + goleadaPenalty))

    const injuryEv = events.find(e => e.type === 'injury' && e.playerId === p.id && e.team === userTeam)
    let injuryGamesOut = 0
    if (injuryEv) {
      if (injuryEv.severity === 'leve')     injuryGamesOut = Math.floor(Math.random() * 2) + 2
      else if (injuryEv.severity === 'moderada') injuryGamesOut = Math.floor(Math.random() * 4) + 5
      else                                   injuryGamesOut = Math.floor(Math.random() * 6) + 10
    }

    const redEv = events.find(e => e.type === 'red_card' && e.playerId === p.id && e.team === userTeam)
    const suspensionGamesOut = redEv ? 2 : 0

    return { playerId: p.id, fatigue: newFatigue, morale: newMorale, injuryGamesOut, suspensionGamesOut }
  })
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export function simulateMatch(input: MatchInput): MatchResult {
  const homeStrength = calcSectorStrength(input.homeSquad)
  const awayStrength = calcSectorStrength(input.awaySquad)

  const lambdaHome = calcExpectedGoals(homeStrength, awayStrength, input.homeTactic, input.homeRisk, true)
  const lambdaAway = calcExpectedGoals(awayStrength, homeStrength, input.awayTactic, 'balanced', false)

  const homeGoals = poissonGoals(lambdaHome)
  const awayGoals = poissonGoals(lambdaAway)

  const events = generateEvents(input.homeSquad, input.awaySquad, homeGoals, awayGoals)

  const homeRatings = calcRatings(input.homeSquad, events, 'home', homeGoals, awayGoals)
  const awayRatings = calcRatings(input.awaySquad, events, 'away', awayGoals, homeGoals)
  const ratings = { ...homeRatings, ...awayRatings }

  const injuredPlayerIds   = events.filter(e => e.type === 'injury').map(e => e.playerId!).filter(Boolean)
  const suspendedPlayerIds = events.filter(e => e.type === 'red_card').map(e => e.playerId!).filter(Boolean)

  return { homeGoals, awayGoals, events, ratings, injuredPlayerIds, suspendedPlayerIds }
}

// ─── Simplified AI-vs-AI ─────────────────────────────────────────────────────
export function simulateAIMatch(homeReputation: number, awayReputation: number): { homeGoals: number; awayGoals: number } {
  const lambdaHome = Math.max(0.25, (homeReputation / Math.max(awayReputation, 30)) * 0.8 * 1.12)
  const lambdaAway = Math.max(0.25, (awayReputation / Math.max(homeReputation, 30)) * 0.8 * 0.92)
  return { homeGoals: poissonGoals(lambdaHome), awayGoals: poissonGoals(lambdaAway) }
}
