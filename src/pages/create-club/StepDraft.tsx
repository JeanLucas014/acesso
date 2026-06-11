import { useState } from 'react'
import { useDraft, REQUIRED } from '../../hooks/useDraft'
import { PositionBadge } from '../../components/PositionBadge'
import type { DraftPlayer, Position } from '../../types'
import type { WizardData } from '../CreateClubPage'

const ATTR_LABELS = ['RIT','FIN','PAS','DRI','DEF'] as const
type AttrKey = 'rating_pace' | 'rating_shooting' | 'rating_passing' | 'rating_dribbling' | 'rating_defending'
const ATTR_KEYS: AttrKey[] = ['rating_pace','rating_shooting','rating_passing','rating_dribbling','rating_defending']

function attrColor(v: number) {
  if (v >= 70) return '#22C55E'
  if (v >= 55) return '#EAB308'
  return '#EF4444'
}

function formatWage(n: number) {
  return n >= 1000 ? `R$${(n/1000).toFixed(1)}k` : `R$${n}`
}

interface Props {
  data: WizardData
  onChange: (update: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

export function StepDraft({ data, onChange, onNext, onBack }: Props) {
  const { pool, selected, totalWage, posCount, isComplete, addPlayer, removePlayer } = useDraft()
  const [almanac, setAlmanac] = useState(false)
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL')

  const wageLimit = data.wageLimit
  const wagePct = wageLimit > 0 ? Math.round((totalWage / wageLimit) * 100) : 0
  const wageColor = wagePct < 70 ? '#22C55E' : wagePct <= 85 ? '#EAB308' : '#EF4444'

  const positions: Array<Position | 'ALL'> = ['ALL','GOL','ZAG','LAT','VOL','MEI','ATA']
  const filtered = posFilter === 'ALL'
    ? pool.filter((p) => !selected.find((s) => s.localId === p.localId))
    : pool.filter((p) => p.position === posFilter && !selected.find((s) => s.localId === p.localId))

  function handleAdd(player: DraftPlayer) {
    addPlayer(player)
    onChange({ selectedPlayers: [...selected, player] })
  }

  function handleRemove(localId: string) {
    removePlayer(localId)
    onChange({ selectedPlayers: selected.filter((p) => p.localId !== localId) })
  }

  const positionStatus = (pos: Position) => {
    const have = posCount[pos] ?? 0
    const need = REQUIRED[pos]
    if (have >= need) return 'done'
    if (have > 0) return 'partial'
    return 'empty'
  }

  return (
    <div>
      <h2 className="text-[18px] font-bold leading-snug mb-1">
        Monte seu time dos sonhos
      </h2>
      <p className="text-xs text-muted mb-4">(com o orçamento que você tem 😅)</p>

      {/* Wage bar */}
      <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] px-4 py-3 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted">Folha mensal</span>
          <span className="font-semibold">{formatWage(totalWage)} / {formatWage(wageLimit)}</span>
        </div>
        <div className="h-1.5 bg-ui-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(wagePct, 100)}%`, background: wageColor }}
          />
        </div>
      </div>

      {/* Position requirements */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {(Object.entries(REQUIRED) as [Position, number][]).map(([pos, req]) => {
          const have = posCount[pos] ?? 0
          const status = positionStatus(pos)
          return (
            <span
              key={pos}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: status === 'done' ? 'rgba(34,197,94,0.15)' : status === 'partial' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.1)',
                color: status === 'done' ? '#22C55E' : status === 'partial' ? '#EAB308' : '#EF4444',
              }}
            >
              {pos} {have}/{req}
            </span>
          )
        })}
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ background: '#1F1F1F', color: '#A1A1AA' }}>
          {selected.length}/22
        </span>
      </div>

      {/* Almanac toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Jogadores disponíveis</p>
        <button
          onClick={() => setAlmanac(!almanac)}
          className="text-[11px] font-medium px-2 py-1 rounded transition-colors"
          style={{
            background: almanac ? 'rgba(34,197,94,0.1)' : '#111111',
            color: almanac ? '#22C55E' : '#A1A1AA',
            border: '0.5px solid #1F1F1F',
          }}
        >
          {almanac ? 'Modo Almanaque' : 'Modo Clássico'}
        </button>
      </div>

      {/* Position filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>
        {positions.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-[0.5px] transition-all"
            style={{
              background: posFilter === pos ? '#22C55E' : 'transparent',
              color: posFilter === pos ? '#0A0A0A' : '#FFFFFF',
              borderColor: posFilter === pos ? '#22C55E' : '#1F1F1F',
            }}
          >
            {pos === 'ALL' ? 'Todos' : pos}
          </button>
        ))}
      </div>

      {/* Pool grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {filtered.map((player) => (
          <div
            key={player.localId}
            className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-3"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <PositionBadge position={player.position} />
              <span className="text-xs font-semibold flex-1 truncate">{player.name}</span>
              <span className="text-[11px] text-faint">{player.age}</span>
            </div>

            {!almanac && (
              <div className="flex flex-col gap-1 mb-2.5">
                {ATTR_LABELS.map((label, i) => {
                  const val = player[ATTR_KEYS[i]]
                  return (
                    <div key={label} className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold text-faint w-[22px] shrink-0">{label}</span>
                      <div className="flex-1 h-[3px] bg-ui-border rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${val}%`, background: attrColor(val) }} />
                      </div>
                      <span className="text-[9px] text-muted w-4 text-right">{val}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {almanac && (
              <p className="text-[10px] text-muted mb-2.5">
                {player.nationality} · Pot. {player.potential}
                {player.isYouth && ' · Jovem'}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-faint">{formatWage(player.wage_brl)}/mês</span>
              <button
                onClick={() => handleAdd(player)}
                disabled={selected.length >= 22}
                className="w-7 h-7 rounded-full flex items-center justify-center text-base font-semibold disabled:opacity-40 transition-opacity"
                style={{ border: '0.5px solid #22C55E', background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected roster */}
      {selected.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Meu elenco</p>
            <p className="text-xs text-faint">{selected.length}/22 jogadores</p>
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto mb-5" style={{ scrollbarWidth: 'thin' }}>
            {selected.map((p) => (
              <div
                key={p.localId}
                className="flex items-center gap-2 px-2.5 py-2 bg-card border-[0.5px] border-ui-border rounded-lg"
              >
                <PositionBadge position={p.position} />
                <span className="flex-1 text-xs font-medium truncate">{p.name}</span>
                <span className="text-[11px] text-faint">{formatWage(p.wage_brl)}</span>
                <button
                  onClick={() => handleRemove(p.localId)}
                  className="text-faint hover:text-white text-base px-1 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-lg text-sm font-medium text-muted border-[0.5px] border-ui-border">
          ← Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!isComplete}
          className="flex-1 py-3.5 rounded-lg text-sm font-semibold bg-accent text-[#0A0A0A] disabled:opacity-40 transition-opacity"
        >
          Próximo: Formação →
        </button>
      </div>
    </div>
  )
}
