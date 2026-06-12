import { useState, useMemo } from 'react'
import { Search, X, ChevronRight, AlertCircle, Lock, Unlock } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { useSave } from '../hooks/useSave'
import { useSquad } from '../hooks/useSquad'
import { useCompetition } from '../hooks/useCompetition'
import { generateMarketPool, getWindowStatus, makeTransferOffer, sellPlayer } from '../lib/transferWindow'
import type { MarketPlayer, SquadPlayer, Position } from '../types'

type Tab = 'mercado' | 'vender' | 'emprestimos'
type PosFil = 'TODOS' | Position

function fmtBrl(v: number): string {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$${Math.round(v / 1_000)}k`
  return `R$${v}`
}

const POS_COLORS: Record<string, string> = {
  GOL: '#6366F1', ZAG: '#3B82F6', LAT: '#06B6D4',
  VOL: '#EAB308', MEI: '#F97316', ATA: '#EF4444',
}

function PosBadge({ pos }: { pos: string }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${POS_COLORS[pos] ?? '#52525B'}22`, color: POS_COLORS[pos] ?? '#A1A1AA' }}
    >
      {pos}
    </span>
  )
}

function WindowBanner({ round }: { round: number }) {
  const status = getWindowStatus(round)
  const isOpen = status === 'open_jan' || status === 'open_jul'
  const label  = status === 'open_jan'
    ? 'Janela aberta — Janeiro' : status === 'open_jul'
    ? 'Janela aberta — Julho' : 'Janela fechada — Apenas agentes livres'

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-[10px] mb-4 border-[0.5px] text-center justify-center"
      style={{
        background: isOpen ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
        borderColor: isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
      }}
    >
      {isOpen ? <Unlock size={13} color="#22C55E" /> : <Lock size={13} color="#EF4444" />}
      <span
        className="text-[12px] font-semibold"
        style={{ color: isOpen ? '#22C55E' : '#EF4444' }}
      >
        {label}
      </span>
    </div>
  )
}

interface MarketCardProps {
  player: MarketPlayer
  onPropose: (p: MarketPlayer) => void
}

function MarketCard({ player, onPropose }: MarketCardProps) {
  return (
    <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <PosBadge pos={player.position} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold truncate">{player.name}</p>
          {player.is_hot && (
            <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded flex-shrink-0">HOT</span>
          )}
        </div>
        <p className="text-[11px] text-faint truncate">
          {player.is_free_agent ? 'Livre · Sem clube' : `${player.current_club_name} · ${player.division}`}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted">Idade {player.age}</span>
          <span className="text-[10px] text-faint">•</span>
          <span className="text-[11px] text-muted">Sal {fmtBrl(player.wage_brl)}/mês</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[20px] font-bold text-accent leading-none">{player.rating_overall}</span>
        <span className="text-[10px] text-faint">{fmtBrl(player.market_value_brl)}</span>
        <button
          onClick={() => onPropose(player)}
          className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 flex items-center gap-1"
        >
          Propor <ChevronRight size={10} />
        </button>
      </div>
    </div>
  )
}

interface SellCardProps {
  player: SquadPlayer
  onSell: (p: SquadPlayer) => void
}

function SellCard({ player, onSell }: SellCardProps) {
  const seasonsLeft = player.contract_end_season - 1
  return (
    <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <PosBadge pos={player.position_main} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate">{player.name}</p>
        <p className="text-[11px] text-faint">
          Idade {player.age} · Contrato até T{player.contract_end_season}
        </p>
        <p className="text-[11px] text-muted">Sal {fmtBrl(player.wage_brl)}/mês</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[20px] font-bold text-white leading-none">{player.rating_overall}</span>
        <span className="text-[10px] text-faint">{fmtBrl(player.market_value_brl)}</span>
        {seasonsLeft <= 1 && (
          <span className="text-[10px] text-yellow-400">Expira em breve</span>
        )}
        <button
          onClick={() => onSell(player)}
          className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-danger/10 text-danger border border-danger/20 flex items-center gap-1"
        >
          Vender <ChevronRight size={10} />
        </button>
      </div>
    </div>
  )
}

// ─── Proposal modal ───────────────────────────────────────────────────────────

interface ProposeModalProps {
  player: MarketPlayer
  budget: number
  onClose: () => void
  onSubmit: (fee: number, wage: number, seasons: number, tit: 'guaranteed' | 'probable' | 'uncertain', rivalBlock: boolean) => void
  loading: boolean
}

function ProposeModal({ player, budget, onClose, onSubmit, loading }: ProposeModalProps) {
  const [fee, setFee]         = useState(player.is_free_agent ? 0 : player.market_value_brl)
  const [wage, setWage]       = useState(player.wage_brl)
  const [seasons, setSeasons] = useState(2)
  const [tit, setTit]         = useState<'guaranteed' | 'probable' | 'uncertain'>('probable')
  const [rival, setRival]     = useState(false)

  const totalCost = player.is_free_agent ? 0 : fee
  const canAfford = budget >= totalCost

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-[390px] bg-[#111111] rounded-t-2xl pb-6">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#2a2a2a]" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-ui-border">
          <div>
            <h3 className="text-[15px] font-bold">{player.name}</h3>
            <p className="text-[11px] text-faint">
              {player.is_free_agent ? 'Agente livre' : player.current_club_name} · {fmtBrl(player.market_value_brl)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md bg-ui-border/40">
            <X size={16} color="#A1A1AA" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
          {!player.is_free_agent && (
            <div>
              <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
                Valor da Oferta (R$)
              </label>
              <input
                type="number"
                value={fee}
                onChange={e => setFee(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-medium outline-none border border-ui-border"
                style={{ background: '#0A0A0A', color: '#FFFFFF' }}
              />
              <p className="text-[11px] text-faint mt-1">
                Pedido: {fmtBrl(Math.round(player.market_value_brl * 1.1))}
              </p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
              Salário Mensal (R$)
            </label>
            <input
              type="number"
              value={wage}
              onChange={e => setWage(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium outline-none border border-ui-border"
              style={{ background: '#0A0A0A', color: '#FFFFFF' }}
            />
            <p className="text-[11px] text-faint mt-1">Salário atual: {fmtBrl(player.wage_brl)}/mês</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
              Duração do Contrato
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSeasons(s)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold border"
                  style={{
                    background: seasons === s ? 'rgba(34,197,94,0.15)' : '#0A0A0A',
                    borderColor: seasons === s ? '#22C55E' : '#1F1F1F',
                    color: seasons === s ? '#22C55E' : '#A1A1AA',
                  }}
                >
                  {s}T
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
              Promessa de Titularidade
            </label>
            <div className="flex gap-2">
              {(['guaranteed', 'probable', 'uncertain'] as const).map(t => {
                const label = t === 'guaranteed' ? 'Titular' : t === 'probable' ? 'Provável' : 'Incerto'
                return (
                  <button
                    key={t}
                    onClick={() => setTit(t)}
                    className="flex-1 py-2 rounded-lg text-[11px] font-semibold border"
                    style={{
                      background: tit === t ? 'rgba(34,197,94,0.15)' : '#0A0A0A',
                      borderColor: tit === t ? '#22C55E' : '#1F1F1F',
                      color: tit === t ? '#22C55E' : '#A1A1AA',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] font-medium">Bloquear rivais</p>
              <p className="text-[11px] text-faint">Proíbe revenda para times rivais</p>
            </div>
            <button
              onClick={() => setRival(r => !r)}
              className="w-11 h-6 rounded-full relative transition-colors"
              style={{ background: rival ? '#22C55E' : '#2a2a2a' }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                style={{ left: rival ? '24px' : '4px' }}
              />
            </button>
          </div>

          {!canAfford && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle size={13} color="#EF4444" />
              <p className="text-[12px] text-danger">Orçamento insuficiente para esta oferta.</p>
            </div>
          )}

          <button
            disabled={loading || !canAfford}
            onClick={() => onSubmit(fee, wage, seasons, tit, rival)}
            className="w-full py-3.5 rounded-lg text-sm font-bold disabled:opacity-40"
            style={{ background: '#22C55E', color: '#0A0A0A' }}
          >
            {loading ? 'Enviando proposta...' : player.is_free_agent ? 'Contratar Jogador' : 'Enviar Proposta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sell modal ───────────────────────────────────────────────────────────────

interface SellModalProps {
  player: SquadPlayer
  onClose: () => void
  onConfirm: (fee: number, toClub: string) => void
  loading: boolean
}

function SellModal({ player, onClose, onConfirm, loading }: SellModalProps) {
  const [fee, setFee]       = useState(player.market_value_brl)
  const [toClub, setToClub] = useState('Clube Interessado')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-[390px] bg-[#111111] rounded-t-2xl pb-6">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#2a2a2a]" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-ui-border">
          <div>
            <h3 className="text-[15px] font-bold">Vender {player.name}</h3>
            <p className="text-[11px] text-faint">Valor de mercado: {fmtBrl(player.market_value_brl)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md bg-ui-border/40">
            <X size={16} color="#A1A1AA" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
              Valor de Venda (R$)
            </label>
            <input
              type="number"
              value={fee}
              onChange={e => setFee(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium outline-none border border-ui-border"
              style={{ background: '#0A0A0A', color: '#FFFFFF' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1.5 block">
              Clube Comprador
            </label>
            <input
              type="text"
              value={toClub}
              onChange={e => setToClub(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium outline-none border border-ui-border"
              style={{ background: '#0A0A0A', color: '#FFFFFF' }}
            />
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle size={13} color="#EF4444" />
            <p className="text-[12px] text-danger">Esta ação é irreversível. O jogador sairá do seu elenco.</p>
          </div>

          <button
            disabled={loading}
            onClick={() => onConfirm(fee, toClub)}
            className="w-full py-3.5 rounded-lg text-sm font-bold disabled:opacity-40"
            style={{ background: '#EF4444', color: '#FFFFFF' }}
          >
            {loading ? 'Processando...' : `Confirmar venda por ${fmtBrl(fee)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TransfersPage() {
  const { save, refetch: refetchSave } = useSave()
  const { players: squad }             = useSquad(save?.id ?? null)
  const { currentRound }               = useCompetition()

  const [tab, setTab]                             = useState<Tab>('mercado')
  const [search, setSearch]                       = useState('')
  const [posFil, setPosFil]                       = useState<PosFil>('TODOS')
  const [proposalTarget, setProposalTarget]       = useState<MarketPlayer | null>(null)
  const [sellTarget, setSellTarget]               = useState<SquadPlayer | null>(null)
  const [txLoading, setTxLoading]                 = useState(false)
  const [toast, setToast]                         = useState<string | null>(null)

  const season = save?.season_current ?? 1
  const budget = save?.budget_brl ?? 0

  const market = useMemo(() => generateMarketPool(season), [season])

  const filteredMarket = useMemo(() => {
    return market.filter(p => {
      const matchesPos    = posFil === 'TODOS' || p.position === posFil
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchesPos && matchesSearch
    })
  }, [market, search, posFil])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function handlePropose(fee: number, wage: number, seasons: number, tit: 'guaranteed' | 'probable' | 'uncertain', rivalBlock: boolean) {
    if (!proposalTarget || !save) return
    setTxLoading(true)
    const result = await makeTransferOffer({
      saveId: save.id,
      marketPlayer: proposalTarget,
      offerFee: fee,
      offerWage: wage,
      contractSeasons: seasons,
      titularity: tit,
      clauses: { rivalBlock },
      userPrestige: save.prestige,
      userClubId: save.club_id ?? '',
      userClubName: save.club_name,
      season,
      currentRound,
    })
    setTxLoading(false)
    setProposalTarget(null)
    showToast(result.message)
    if (result.status === 'accepted' || result.status === 'free_agent_accepted') {
      refetchSave()
    }
  }

  async function handleSell(fee: number, toClub: string) {
    if (!sellTarget || !save) return
    setTxLoading(true)
    const ok = await sellPlayer({
      saveId: save.id,
      squadId: sellTarget.squad_id,
      playerId: sellTarget.id,
      playerName: sellTarget.name,
      playerWage: sellTarget.wage_brl,
      fee,
      toClubName: toClub,
      season,
    })
    setTxLoading(false)
    setSellTarget(null)
    showToast(ok ? `${sellTarget.name} vendido por ${fmtBrl(fee)}! 💰` : 'Erro ao processar venda.')
    if (ok) refetchSave()
  }

  const POSITIONS: PosFil[] = ['TODOS', 'GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'ATA']

  return (
    <div className="max-w-[390px] mx-auto pt-4 pb-24 lg:max-w-4xl">
      <header className="px-4 mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-0.5">Temporada {season}</p>
        <h1 className="text-[22px] font-bold">Transferências</h1>
        <p className="text-xs text-muted mt-0.5">
          Orçamento: <span className="text-accent font-semibold">{fmtBrl(budget)}</span>
        </p>
      </header>

      <div className="px-4">
        <WindowBanner round={currentRound} />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-ui-border mb-4 px-4">
        {(['mercado', 'vender', 'emprestimos'] as Tab[]).map(t => {
          const labels: Record<Tab, string> = { mercado: 'Mercado', vender: 'Vender', emprestimos: 'Empréstimos' }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-[13px] font-semibold border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t ? '#22C55E' : 'transparent',
                color: tab === t ? '#22C55E' : '#52525B',
              }}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      {tab === 'mercado' && (
        <div className="px-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card border border-ui-border mb-3">
            <Search size={14} color="#52525B" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar jogador..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
            />
            {search && <button onClick={() => setSearch('')}><X size={13} color="#52525B" /></button>}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                onClick={() => setPosFil(pos)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border"
                style={{
                  background: posFil === pos ? 'rgba(34,197,94,0.15)' : 'transparent',
                  borderColor: posFil === pos ? '#22C55E' : '#1F1F1F',
                  color: posFil === pos ? '#22C55E' : '#52525B',
                }}
              >
                {pos}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {filteredMarket.length === 0 ? (
              <p className="text-xs text-faint text-center py-8">Nenhum jogador encontrado.</p>
            ) : (
              filteredMarket.map(p => (
                <MarketCard key={p.id} player={p} onPropose={setProposalTarget} />
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'vender' && (
        <div className="px-4">
          <p className="text-[11px] text-faint mb-3">
            Selecione um jogador do seu elenco para negociar a venda.
          </p>
          <div className="flex flex-col gap-2">
            {squad.length === 0 ? (
              <p className="text-xs text-faint text-center py-8">Elenco vazio.</p>
            ) : (
              squad.map(p => (
                <SellCard key={p.id} player={p} onSell={setSellTarget} />
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'emprestimos' && (
        <div className="px-4">
          {(() => {
            const loans = squad.filter(p => p.loan_from_club_id)
            return loans.length > 0 ? (
              <div className="flex flex-col gap-2">
                {loans.map(p => (
                  <div key={p.id} className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-3 flex items-center gap-3">
                    <PosBadge pos={p.position_main} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{p.name}</p>
                      <p className="text-[11px] text-faint">Por empréstimo · Até T{p.contract_end_season}</p>
                    </div>
                    <span className="text-[18px] font-bold text-white">{p.rating_overall}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted mb-1">Nenhum empréstimo ativo.</p>
                <p className="text-xs text-faint">Envio de jogadores por empréstimo em breve.</p>
              </div>
            )
          })()}
        </div>
      )}

      {proposalTarget && (
        <ProposeModal
          player={proposalTarget}
          budget={budget}
          onClose={() => setProposalTarget(null)}
          onSubmit={handlePropose}
          loading={txLoading}
        />
      )}

      {sellTarget && (
        <SellModal
          player={sellTarget}
          onClose={() => setSellTarget(null)}
          onConfirm={handleSell}
          loading={txLoading}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-[13px] font-medium text-white z-50 shadow-xl max-w-[340px] text-center"
          style={{ background: '#1F1F1F', border: '0.5px solid #2a2a2a' }}
        >
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
