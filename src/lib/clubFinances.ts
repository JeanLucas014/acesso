import { supabase } from './supabase'
import type { Finance, FairPlayStatus } from '../types'

export async function recordMatchRevenue(opts: {
  saveId: string
  season: number
  stadiumLevel: number
  stadiumCapacity: number
  prestige: number
  isHome: boolean
  isWin: boolean
}): Promise<void> {
  if (!opts.isHome) return

  const { saveId, season, stadiumLevel, prestige, isWin } = opts

  const occupancy   = Math.min(0.95, 0.35 + prestige * 0.005 + (isWin ? 0.05 : 0))
  const capacity    = [8_000, 12_000, 20_000, 35_000, 50_000][stadiumLevel - 1] ?? 8_000
  const ticketAvg   = 30 + stadiumLevel * 8 + prestige * 0.4
  const ticketRev   = Math.round(capacity * occupancy * ticketAvg)

  const tvRights    = Math.round(15_000 + prestige * 200 + stadiumLevel * 3_000)

  await supabase.from('finances').insert([
    {
      save_id: saveId, season, month: currentMonth(),
      type: 'income', category: 'ticket',
      amount_brl: ticketRev, description: 'Bilheteria — jogo em casa',
    },
    {
      save_id: saveId, season, month: currentMonth(),
      type: 'income', category: 'tv_rights',
      amount_brl: tvRights, description: 'Direitos de transmissão',
    },
  ])
}

export async function recordMonthlyExpenses(opts: {
  saveId: string
  season: number
  wageBill: number
  stadiumLevel: number
}): Promise<void> {
  const { saveId, season, wageBill, stadiumLevel } = opts

  const maintenance = 3_000 + stadiumLevel * 1_500

  await supabase.from('finances').insert([
    {
      save_id: saveId, season, month: currentMonth(),
      type: 'expense', category: 'wage',
      amount_brl: wageBill, description: 'Folha de pagamento mensal',
    },
    {
      save_id: saveId, season, month: currentMonth(),
      type: 'expense', category: 'maintenance',
      amount_brl: maintenance, description: 'Manutenção do estádio e CT',
    },
  ])
}

export async function recordSponsorshipIncome(opts: {
  saveId: string
  season: number
  prestige: number
  stadiumLevel: number
}): Promise<void> {
  const { saveId, season, prestige, stadiumLevel } = opts

  const sponsorship = Math.round(10_000 + prestige * 500 + stadiumLevel * 5_000)

  await supabase.from('finances').insert({
    save_id: saveId, season, month: currentMonth(),
    type: 'income', category: 'sponsorship',
    amount_brl: sponsorship, description: 'Receita de patrocínio mensal',
  })
}

export async function getFinances(saveId: string, season: number): Promise<Finance[]> {
  const { data } = await supabase
    .from('finances')
    .select('*')
    .eq('save_id', saveId)
    .eq('season', season)
    .order('created_at', { ascending: false })

  if (!data) return []
  return data as Finance[]
}

export async function getRecentTransactions(saveId: string, limit = 20): Promise<Finance[]> {
  const { data } = await supabase
    .from('finances')
    .select('*')
    .eq('save_id', saveId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []
  return data as Finance[]
}

export function checkFairPlay(wageBill: number, finances: Finance[]): FairPlayStatus {
  const byMonth = new Map<string, number>()
  finances
    .filter(f => f.type === 'income')
    .forEach(f => {
      const key = `${f.season}-${f.month}`
      byMonth.set(key, (byMonth.get(key) ?? 0) + f.amount_brl)
    })

  const avgIncome =
    byMonth.size > 0
      ? Array.from(byMonth.values()).reduce((s, v) => s + v, 0) / byMonth.size
      : Math.max(wageBill * 1.5, 20_000)

  const ratio = wageBill / Math.max(avgIncome, 1)

  if (ratio < 0.5) return { ratio, level: 'ok',       label: 'Excelente',    description: 'Folha saudável. Clube financeiramente sustentável.' }
  if (ratio < 0.7) return { ratio, level: 'ok',       label: 'Saudável',     description: 'Dentro do limite ideal de fair play.' }
  if (ratio < 0.9) return { ratio, level: 'warning',  label: 'Atenção',      description: 'Folha próxima do limite. Monitore as contratações.' }
  if (ratio < 1.1) return { ratio, level: 'alert',    label: 'Alerta',       description: 'Folha acima de 90% da receita. Risco financeiro.' }
  return                  { ratio, level: 'critical',  label: 'Crítico',      description: 'Folha supera receita. Ações imediatas necessárias!' }
}

export function getMonthlyChartData(finances: Finance[]): { month: number; income: number; expense: number }[] {
  const map = new Map<number, { income: number; expense: number }>()
  for (let m = 1; m <= 12; m++) map.set(m, { income: 0, expense: 0 })

  finances.forEach(f => {
    const entry = map.get(f.month)!
    if (f.type === 'income')  entry.income  += f.amount_brl
    else                      entry.expense += f.amount_brl
  })

  return Array.from(map.entries()).map(([month, v]) => ({ month, ...v }))
}

function currentMonth(): number {
  return new Date().getMonth() + 1
}
