import { TrendingUp, TrendingDown, Wallet, Users, Tv, Tag, Trophy, Wrench, ArrowRightLeft, Ticket } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { useSave } from '../hooks/useSave'
import { useFinances } from '../hooks/useFinances'
import type { Finance } from '../types'

function fmtBrl(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$${Math.round(v / 1_000)}k`
  return `R$${v}`
}

function fmtMonth(m: number): string {
  return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m - 1] ?? ''
}

const FAIR_PLAY_COLORS = {
  ok:       '#22C55E',
  warning:  '#EAB308',
  alert:    '#F97316',
  critical: '#EF4444',
}

function categoryIcon(cat: Finance['category']) {
  switch (cat) {
    case 'ticket':       return <Ticket size={14} />
    case 'tv_rights':    return <Tv size={14} />
    case 'sponsorship':  return <Tag size={14} />
    case 'transfer_fee': return <ArrowRightLeft size={14} />
    case 'wage':         return <Users size={14} />
    case 'prize':        return <Trophy size={14} />
    case 'maintenance':  return <Wrench size={14} />
    default:             return <Wallet size={14} />
  }
}

function categoryLabel(cat: Finance['category']): string {
  const labels: Record<Finance['category'], string> = {
    ticket: 'Bilheteria', tv_rights: 'Direitos TV', sponsorship: 'Patrocínio',
    transfer_fee: 'Transferência', wage: 'Folha', prize: 'Premiação', maintenance: 'Manutenção',
  }
  return labels[cat] ?? cat
}

const UPGRADE_COSTS = [0, 150_000, 400_000, 1_000_000, 3_000_000]
const ACADEMY_COSTS = [0, 100_000, 250_000, 500_000, 1_000_000]

export function FinancesPage() {
  const { save }                                                                  = useSave()
  const { totalIncome, netResult, fairPlay, chartData, recent, loading } = useFinances()

  const stadiumLevel = save?.stadium_level ?? 1
  const academyLevel = save?.youth_academy_level ?? 1
  const budget       = save?.budget_brl ?? 0
  const wageBill     = save?.wage_bill_brl ?? 0

  const stadiumCost  = stadiumLevel < 5 ? UPGRADE_COSTS[stadiumLevel] : null
  const academyCost  = academyLevel < 5 ? ACADEMY_COSTS[academyLevel] : null

  const fpColor = fairPlay ? FAIR_PLAY_COLORS[fairPlay.level] : '#22C55E'
  const fpPct   = fairPlay ? Math.min(fairPlay.ratio * 100, 100) : 0

  const maxBar = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-accent font-semibold">Carregando finanças...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[390px] mx-auto px-4 pt-4 pb-24 lg:max-w-4xl">
      <header className="mb-5">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-0.5">Temporada {save?.season_current ?? 1}</p>
        <h1 className="text-[22px] font-bold">Finanças</h1>
      </header>

      {/* Stats 2×2 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} color="#22C55E" />
            <span className="text-[11px] font-semibold text-faint uppercase tracking-wide">Orçamento</span>
          </div>
          <p className="text-[20px] font-bold text-accent leading-none">{fmtBrl(budget)}</p>
          <p className="text-[11px] text-faint mt-1">Disponível</p>
        </div>

        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} color="#EAB308" />
            <span className="text-[11px] font-semibold text-faint uppercase tracking-wide">Folha</span>
          </div>
          <p className="text-[20px] font-bold text-yellow-400 leading-none">{fmtBrl(wageBill)}</p>
          <p className="text-[11px] text-faint mt-1">Por mês</p>
        </div>

        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} color="#22C55E" />
            <span className="text-[11px] font-semibold text-faint uppercase tracking-wide">Receita</span>
          </div>
          <p className="text-[20px] font-bold text-accent leading-none">{fmtBrl(totalIncome)}</p>
          <p className="text-[11px] text-faint mt-1">Esta temporada</p>
        </div>

        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} color={netResult >= 0 ? '#22C55E' : '#EF4444'} />
            <span className="text-[11px] font-semibold text-faint uppercase tracking-wide">Resultado</span>
          </div>
          <p
            className="text-[20px] font-bold leading-none"
            style={{ color: netResult >= 0 ? '#22C55E' : '#EF4444' }}
          >
            {netResult >= 0 ? '+' : ''}{fmtBrl(netResult)}
          </p>
          <p className="text-[11px] text-faint mt-1">Esta temporada</p>
        </div>
      </div>

      {/* Fair Play */}
      {fairPlay && (
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-wide">Fair Play Financeiro</p>
            <span
              className="text-[12px] font-bold px-2 py-0.5 rounded"
              style={{ color: fpColor, background: `${fpColor}18` }}
            >
              {fairPlay.label}
            </span>
          </div>

          <div className="h-2 rounded-full bg-[#1F1F1F] mb-2 overflow-hidden relative">
            <div className="absolute top-0 bottom-0 w-[1.5px] bg-[#52525B] z-10" style={{ left: '70%' }} />
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${fpPct}%`, background: fpColor }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted">
              Folha / Receita: <span className="font-semibold" style={{ color: fpColor }}>{Math.round(fpPct)}%</span>
            </p>
            <p className="text-[11px] text-faint">Meta: &lt;70%</p>
          </div>
          <p className="text-[11px] text-faint mt-1.5">{fairPlay.description}</p>
        </div>
      )}

      {/* Monthly bar chart */}
      <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wide">Receita × Despesa</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#22C55E' }} />
              <span className="text-[10px] text-faint">Receita</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(239,68,68,0.7)' }} />
              <span className="text-[10px] text-faint">Despesa</span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-0.5 h-28">
          {chartData.map(d => {
            const incH = Math.round((d.income  / maxBar) * 96)
            const expH = Math.round((d.expense / maxBar) * 96)
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                  <div
                    className="rounded-t-sm"
                    style={{ height: `${Math.max(incH, 2)}px`, width: '45%', background: '#22C55E' }}
                  />
                  <div
                    className="rounded-t-sm"
                    style={{ height: `${Math.max(expH, 2)}px`, width: '45%', background: 'rgba(239,68,68,0.7)' }}
                  />
                </div>
                <span className="text-[9px] text-faint">{fmtMonth(d.month)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Transações Recentes</p>
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] overflow-hidden">
          {recent.length === 0 ? (
            <p className="text-xs text-faint text-center py-6">Nenhuma transação ainda. Jogue para gerar receita!</p>
          ) : (
            recent.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-ui-border last:border-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: f.type === 'income' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                    color: f.type === 'income' ? '#22C55E' : '#EF4444',
                  }}
                >
                  {categoryIcon(f.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate">{f.description ?? categoryLabel(f.category)}</p>
                  <p className="text-[10px] text-faint">
                    {categoryLabel(f.category)} · {fmtMonth(f.month)}
                  </p>
                </div>
                <span
                  className="text-[13px] font-bold flex-shrink-0"
                  style={{ color: f.type === 'income' ? '#22C55E' : '#EF4444' }}
                >
                  {f.type === 'income' ? '+' : '-'}{fmtBrl(f.amount_brl)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Club structure */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Estrutura do Clube</p>
        <div className="flex flex-col gap-3">
          <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="text-[13px] font-semibold">Estádio</p>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(234,179,8,0.1)', color: '#EAB308' }}
              >
                Nível {stadiumLevel}
              </span>
            </div>
            <p className="text-[11px] text-faint mb-3">
              {[8_000, 12_000, 20_000, 35_000, 50_000][stadiumLevel - 1]?.toLocaleString('pt-BR')} lugares
              {stadiumLevel < 5 && ` → ${[12_000, 20_000, 35_000, 50_000][stadiumLevel - 1]?.toLocaleString('pt-BR')} com upgrade`}
            </p>
            {stadiumLevel < 5 && stadiumCost != null ? (
              <button
                disabled={budget < stadiumCost}
                className="w-full py-2.5 rounded-lg text-[12px] font-bold border disabled:opacity-40"
                style={{ borderColor: '#22C55E', color: '#22C55E', background: 'rgba(34,197,94,0.06)' }}
              >
                Expandir — {fmtBrl(stadiumCost)}
              </button>
            ) : (
              <p className="text-[11px] text-accent font-semibold text-center">Nível máximo atingido</p>
            )}
          </div>

          <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="text-[13px] font-semibold">Centro de Formação</p>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(234,179,8,0.1)', color: '#EAB308' }}
              >
                Nível {academyLevel}
              </span>
            </div>
            <p className="text-[11px] text-faint mb-3">
              {['Base local', 'Regional', 'Estadual', 'Nacional', 'Elite'][academyLevel - 1]} · Revelação de jovens talentos
            </p>
            {academyLevel < 5 && academyCost != null ? (
              <button
                disabled={budget < academyCost}
                className="w-full py-2.5 rounded-lg text-[12px] font-bold border disabled:opacity-40"
                style={{ borderColor: '#22C55E', color: '#22C55E', background: 'rgba(34,197,94,0.06)' }}
              >
                Melhorar — {fmtBrl(academyCost)}
              </button>
            ) : (
              <p className="text-[11px] text-accent font-semibold text-center">Nível máximo atingido</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
