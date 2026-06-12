import { supabase } from './supabase'
import { useGameStore } from '../store/useGameStore'
import { makeLcg } from './competition'
import type { MarketPlayer, Position } from '../types'

const FIRST_NAMES = [
  'Carlos','Lucas','Gabriel','Matheus','Felipe','Rafael','Bruno','Anderson',
  'Diego','Thiago','Rodrigo','Alex','Fábio','Marco','Paulo','Igor','Leandro',
  'Gustavo','Eduardo','Vinicius','Wesley','Douglas','Danilo','Rayan','Kaue',
  'Enzo','Luan','Pedro','Yago','Murilo','Caio','Davi','Henrique','Alan','Renato',
]
const LAST_NAMES = [
  'Silva','Santos','Oliveira','Souza','Costa','Ferreira','Lima','Carvalho',
  'Alves','Pereira','Ribeiro','Rodrigues','Martins','Nascimento','Gomes','Machado',
  'Araújo','Medeiros','Barros','Batista','Cunha','Monteiro','Ramos','Castro',
  'Moura','Santana','Dias','Pinto','Xavier','Tavares','Correia','Borges','Campos',
]

const POSITIONS_DIST: Position[] = [
  'GOL','GOL',
  'ZAG','ZAG','ZAG','ZAG',
  'LAT','LAT','LAT',
  'VOL','VOL','VOL','VOL',
  'MEI','MEI','MEI',
  'ATA','ATA','ATA','ATA',
]

const CLUBS_POOL = [
  { name: 'Flamengo',    reputation: 85 },
  { name: 'Palmeiras',   reputation: 84 },
  { name: 'Corinthians', reputation: 80 },
  { name: 'São Paulo',   reputation: 78 },
  { name: 'Atlético',    reputation: 77 },
  { name: 'Grêmio',      reputation: 73 },
  { name: 'Inter',       reputation: 72 },
  { name: 'Santos',      reputation: 68 },
  { name: 'Botafogo',    reputation: 70 },
  { name: 'Fluminense',  reputation: 69 },
  { name: 'Bahia',       reputation: 60 },
  { name: 'Fortaleza',   reputation: 58 },
]

function calcValue(rating: number): number {
  if (rating >= 78) return 800_000 + (rating - 78) * 150_000
  if (rating >= 70) return 200_000 + (rating - 70) * 75_000
  if (rating >= 60) return 50_000  + (rating - 60) * 15_000
  return 20_000 + rating * 500
}

function calcWage(rating: number): number {
  if (rating >= 78) return 15_000 + (rating - 78) * 3_000
  if (rating >= 70) return  6_000 + (rating - 70) * 1_125
  if (rating >= 60) return  2_000 + (rating - 60) * 400
  return 800 + rating * 20
}

export function generateMarketPool(season: number): MarketPlayer[] {
  const rand = makeLcg(season * 7919 + 31337)

  const pool: MarketPlayer[] = []

  // 40 free agents (is_free_agent = true)
  for (let i = 0; i < 40; i++) {
    const pos     = POSITIONS_DIST[i % POSITIONS_DIST.length]
    const name    = `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`
    const age     = 18 + Math.floor(rand() * 16)
    const rating  = 50 + Math.floor(rand() * 22)
    const pot     = Math.min(99, rating + Math.floor(rand() * 12))
    const pace    = 50 + Math.floor(rand() * 40)
    const shoot   = 50 + Math.floor(rand() * 40)
    const pass    = 50 + Math.floor(rand() * 40)
    const drib    = 50 + Math.floor(rand() * 40)
    const def     = 50 + Math.floor(rand() * 40)
    const phys    = 50 + Math.floor(rand() * 40)
    const mental  = 50 + Math.floor(rand() * 40)
    const value   = calcValue(rating)
    const wage    = calcWage(rating)

    pool.push({
      id: `free_${season}_${i}`,
      name, age, nationality: 'Brasileiro', position: pos,
      rating_overall: rating, rating_pace: pace, rating_shooting: shoot,
      rating_passing: pass, rating_dribbling: drib, rating_defending: def,
      rating_physical: phys, rating_mental: mental,
      potential: pot, market_value_brl: value, wage_brl: wage,
      is_free_agent: true, seller_reputation: 0, division: 'estadual',
      is_hot: rand() < 0.08,
    })
  }

  // 60 club players (5 per club)
  CLUBS_POOL.forEach((club, ci) => {
    for (let j = 0; j < 5; j++) {
      const posIdx  = (ci * 5 + j) % POSITIONS_DIST.length
      const pos     = POSITIONS_DIST[posIdx]
      const name    = `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`
      const age     = 20 + Math.floor(rand() * 14)
      const base    = club.reputation - 20 + Math.floor(rand() * 20)
      const rating  = Math.max(55, Math.min(88, base))
      const pot     = Math.min(99, rating + Math.floor(rand() * 8))
      const pace    = 55 + Math.floor(rand() * 35)
      const shoot   = 55 + Math.floor(rand() * 35)
      const pass    = 55 + Math.floor(rand() * 35)
      const drib    = 55 + Math.floor(rand() * 35)
      const def     = 55 + Math.floor(rand() * 35)
      const phys    = 55 + Math.floor(rand() * 35)
      const mental  = 55 + Math.floor(rand() * 35)
      const value   = calcValue(rating)
      const wage    = calcWage(rating)

      pool.push({
        id: `club_${season}_${ci}_${j}`,
        name, age, nationality: 'Brasileiro', position: pos,
        rating_overall: rating, rating_pace: pace, rating_shooting: shoot,
        rating_passing: pass, rating_dribbling: drib, rating_defending: def,
        rating_physical: phys, rating_mental: mental,
        potential: pot, market_value_brl: value, wage_brl: wage,
        current_club_name: club.name, is_free_agent: false,
        seller_reputation: club.reputation, division: 'serie_a',
        is_hot: rand() < 0.12,
      })
    }
  })

  return pool
}

export type TransferWindowStatus = 'open_jan' | 'open_jul' | 'closed' | 'free_agent_only'

export function getWindowStatus(currentRound: number): TransferWindowStatus {
  if (currentRound <= 3)  return 'open_jan'
  if (currentRound <= 6)  return 'closed'
  if (currentRound <= 9)  return 'open_jul'
  return 'closed'
}

export function canSignPlayer(player: MarketPlayer, round: number): boolean {
  const status = getWindowStatus(round)
  if (status === 'open_jan' || status === 'open_jul') return true
  if (status === 'free_agent_only') return player.is_free_agent
  return false
}

export type NegotiationResult =
  | 'rejected_by_club'
  | 'countered'
  | 'rejected_by_player'
  | 'accepted'
  | 'free_agent_accepted'

export interface TransferOfferResult {
  status: NegotiationResult
  message: string
  counterFee?: number
}

function negotiateWithPlayer(opts: {
  player: MarketPlayer
  offerWage: number
  titularity: 'guaranteed' | 'probable' | 'uncertain'
  userPrestige: number
}): boolean {
  const { player, offerWage, titularity, userPrestige } = opts

  const divPts: Record<string, number> = {
    serie_a: 100, serie_b: 70, serie_c: 40, serie_d: 20, estadual: 10,
  }
  const titPts: Record<string, number> = { guaranteed: 100, probable: 60, uncertain: 20 }

  const divScore  = divPts[player.division] ?? 10
  const titScore  = titPts[titularity]
  const wageRatio = Math.min(offerWage / Math.max(player.wage_brl, 1), 3.0)
  const repScore  = Math.min(userPrestige, 100)

  const score = (wageRatio * 40) + (divScore * 0.25) + (titScore * 0.20) + (repScore * 0.15)
  return score >= 60
}

export async function makeTransferOffer(opts: {
  saveId: string
  marketPlayer: MarketPlayer
  offerFee: number
  offerWage: number
  contractSeasons: number
  titularity: 'guaranteed' | 'probable' | 'uncertain'
  clauses: { rivalBlock?: boolean; resalePct?: number }
  userPrestige: number
  userClubId: string
  userClubName: string
  season: number
  currentRound: number
}): Promise<TransferOfferResult> {
  const {
    saveId, marketPlayer, offerFee, offerWage, contractSeasons,
    titularity, clauses, userPrestige, userClubId, userClubName, season, currentRound,
  } = opts

  const windowStatus = getWindowStatus(currentRound)
  if (windowStatus === 'closed') {
    return { status: 'rejected_by_club', message: 'Janela de transferências fechada. Só é possível contratar jogadores sem clube.' }
  }
  if (!canSignPlayer(marketPlayer, currentRound)) {
    return { status: 'rejected_by_club', message: 'Janela fechada para este tipo de transferência.' }
  }

  // Free agent — skip club negotiation
  if (!marketPlayer.is_free_agent) {
    const askingPrice = Math.round(marketPlayer.market_value_brl * 1.1)

    if (offerFee < askingPrice * 0.7) {
      return {
        status: 'countered',
        message: `${marketPlayer.current_club_name} rejeitou a oferta. Pede no mínimo ${fmtBrl(Math.round(askingPrice * 0.75))}.`,
        counterFee: Math.round(askingPrice * 0.75),
      }
    }
    if (offerFee < askingPrice) {
      const counter = Math.round(askingPrice * 0.88)
      return {
        status: 'countered',
        message: `${marketPlayer.current_club_name} quer um valor maior. Contraproposta: ${fmtBrl(counter)}.`,
        counterFee: counter,
      }
    }
  }

  // Negotiate with player
  const playerAccepts = negotiateWithPlayer({ player: marketPlayer, offerWage, titularity, userPrestige })
  if (!playerAccepts) {
    const minWage = Math.ceil(marketPlayer.wage_brl * 1.1 / 500) * 500
    return {
      status: 'rejected_by_player',
      message: `${marketPlayer.name} recusou. Ele quer pelo menos ${fmtBrl(minWage)}/mês.`,
    }
  }

  // Finalize
  const ok = await finalizeTransfer({
    saveId, marketPlayer, fee: marketPlayer.is_free_agent ? 0 : offerFee,
    wage: offerWage, contractSeasons, clauses, userClubId, userClubName, season, currentRound,
  })

  return ok
    ? { status: marketPlayer.is_free_agent ? 'free_agent_accepted' : 'accepted', message: `${marketPlayer.name} é seu novo jogador! Bem-vindo ao clube! 🎉` }
    : { status: 'rejected_by_club', message: 'Erro ao finalizar transferência.' }
}

async function finalizeTransfer(opts: {
  saveId: string
  marketPlayer: MarketPlayer
  fee: number
  wage: number
  contractSeasons: number
  clauses: { rivalBlock?: boolean; resalePct?: number }
  userClubId: string
  userClubName: string
  season: number
  currentRound: number
}): Promise<boolean> {
  try {
    const { saveId, marketPlayer, fee, wage, contractSeasons, clauses, userClubId, userClubName, season } = opts

    // 1. Get current save budget
    const { data: saveData } = await supabase
      .from('user_saves')
      .select('budget_brl, wage_bill_brl')
      .eq('id', saveId)
      .single()

    if (!saveData) return false
    if (saveData.budget_brl < fee) return false

    // 2. Insert player into players table
    const { data: playerData } = await supabase.from('players').insert({
      name: marketPlayer.name,
      age: marketPlayer.age,
      nationality: marketPlayer.nationality,
      position_main: marketPlayer.position,
      rating_overall: marketPlayer.rating_overall,
      rating_pace: marketPlayer.rating_pace,
      rating_shooting: marketPlayer.rating_shooting,
      rating_passing: marketPlayer.rating_passing,
      rating_dribbling: marketPlayer.rating_dribbling,
      rating_defending: marketPlayer.rating_defending,
      rating_physical: marketPlayer.rating_physical,
      rating_mental: marketPlayer.rating_mental,
      potential: marketPlayer.potential,
      market_value_brl: marketPlayer.market_value_brl,
      wage_brl: wage,
      current_club_id: userClubId,
      division: 'estadual',
      renown: 'local',
    }).select('id').single()

    if (!playerData) return false

    // 3. Get squad count for shirt number
    const { count } = await supabase
      .from('squads')
      .select('id', { count: 'exact', head: true })
      .eq('save_id', saveId)

    // 4. Insert squad record
    await supabase.from('squads').insert({
      save_id: saveId,
      player_id: playerData.id,
      shirt_number: (count ?? 0) + 1,
      wage_brl: wage,
      contract_end_season: season + contractSeasons,
      morale: 75,
      fatigue: 0,
      is_youth: false,
    })

    const newBudget   = saveData.budget_brl   - fee
    const newWageBill = saveData.wage_bill_brl + wage

    // 5. Update save budget
    await supabase.from('user_saves').update({ budget_brl: newBudget, wage_bill_brl: newWageBill }).eq('id', saveId)
    useGameStore.getState().setSave({ budget: newBudget, wageBill: newWageBill })

    // 6. Record transfer
    const window = opts.currentRound <= 3 ? 'jan' : opts.currentRound <= 9 ? 'jul' : 'free_agent'
    await supabase.from('transfers').insert({
      save_id: saveId,
      player_id: playerData.id,
      type: marketPlayer.is_free_agent ? 'free' : 'buy',
      fee_brl: fee,
      wage_brl: wage,
      contract_seasons: contractSeasons,
      from_club_name: marketPlayer.current_club_name ?? 'Livre',
      to_club_id: userClubId,
      to_club_name: userClubName,
      season,
      transfer_window: window,
      clauses: { resale_pct: clauses.resalePct, rival_block: clauses.rivalBlock },
      status: 'accepted',
    })

    // 7. Record finance expense (only if fee > 0)
    if (fee > 0) {
      await supabase.from('finances').insert({
        save_id: saveId, season, month: currentMonth(),
        type: 'expense', category: 'transfer_fee',
        amount_brl: fee, description: `Compra — ${marketPlayer.name}`,
      })
    }

    return true
  } catch {
    return false
  }
}

export async function sellPlayer(opts: {
  saveId: string
  squadId: string
  playerId: string
  playerName: string
  playerWage: number
  fee: number
  toClubName: string
  season: number
}): Promise<boolean> {
  try {
    const { saveId, squadId, playerId, playerName, playerWage, fee, toClubName, season } = opts

    const { data: saveData } = await supabase
      .from('user_saves')
      .select('budget_brl, wage_bill_brl')
      .eq('id', saveId)
      .single()
    if (!saveData) return false

    // Remove from squad
    await supabase.from('squads').delete().eq('id', squadId)

    // Mark player as no club
    await supabase.from('players').update({ current_club_id: null }).eq('id', playerId)

    const newBudget   = saveData.budget_brl   + fee
    const newWageBill = Math.max(0, saveData.wage_bill_brl - playerWage)

    await supabase.from('user_saves').update({ budget_brl: newBudget, wage_bill_brl: newWageBill }).eq('id', saveId)
    useGameStore.getState().setSave({ budget: newBudget, wageBill: newWageBill })

    await supabase.from('transfers').insert({
      save_id: saveId, player_id: playerId,
      type: 'sell', fee_brl: fee,
      to_club_name: toClubName, season, window: 'jan', status: 'accepted',
    })

    if (fee > 0) {
      await supabase.from('finances').insert({
        save_id: saveId, season, month: currentMonth(),
        type: 'income', category: 'transfer_fee',
        amount_brl: fee, description: `Venda — ${playerName}`,
      })
    }

    return true
  } catch {
    return false
  }
}

export async function checkContractAlerts(saveId: string, currentSeason: number): Promise<{ name: string; seasonsLeft: number }[]> {
  const { data } = await supabase
    .from('squads')
    .select('id, player_id, contract_end_season, players(name)')
    .eq('save_id', saveId)
    .lte('contract_end_season', currentSeason + 1)

  if (!data) return []
  return data.map(row => {
    const p = row.players as unknown as { name: string } | null
    return {
      name: p?.name ?? 'Jogador',
      seasonsLeft: (row.contract_end_season as number) - currentSeason,
    }
  })
}

export async function renewContract(squadId: string, newContractEndSeason: number, newWage: number): Promise<boolean> {
  const { error } = await supabase
    .from('squads')
    .update({ contract_end_season: newContractEndSeason, wage_brl: newWage })
    .eq('id', squadId)
  return !error
}

function fmtBrl(v: number): string {
  return `R$${v.toLocaleString('pt-BR')}`
}

function currentMonth(): number {
  return new Date().getMonth() + 1
}
