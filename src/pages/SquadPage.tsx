import { useState } from 'react'
import { BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { PositionBadge } from '../components/PositionBadge'
import { useSave } from '../hooks/useSave'
import { useSquad } from '../hooks/useSquad'
import type { Position, SquadPlayer } from '../types'

type FilterPos = Position | 'ALL'

const FILTERS: FilterPos[] = ['ALL','GOL','ZAG','LAT','VOL','MEI','ATA']

function ratingColor(r: number) {
  if (r > 75) return '#22C55E'
  if (r >= 60) return '#EAB308'
  return '#EF4444'
}

function moralColor(m: number) {
  if (m > 70) return '#22C55E'
  if (m >= 40) return '#EAB308'
  return '#EF4444'
}

function FatigueIcon({ fatigue }: { fatigue: number }) {
  if (fatigue < 30) return <BatteryFull size={14} className="text-accent" />
  if (fatigue < 65) return <BatteryMedium size={14} className="text-warn" />
  return <BatteryLow size={14} className="text-danger" />
}

function formatWage(n: number) {
  return n >= 1000 ? `R$${(n/1000).toFixed(1)}k/mês` : `R$${n}/mês`
}

function PlayerCard({ player }: { player: SquadPlayer }) {
  return (
    <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        {/* Number + position */}
        <div className="flex flex-col items-center gap-1 w-9 shrink-0">
          <span className="text-sm font-bold text-faint leading-none">
            #{player.shirt_number ?? '–'}
          </span>
          <PositionBadge position={player.position_main} size="sm" />
        </div>

        {/* Name + morale bar */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-none mb-1.5">{player.name}</p>
          <div className="flex items-center gap-2">
            <div className="max-w-[100px] flex-1 h-1 bg-ui-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${player.morale}%`, background: moralColor(player.morale) }}
              />
            </div>
            <FatigueIcon fatigue={player.fatigue} />
          </div>
        </div>

        {/* Rating */}
        <span className="text-[22px] font-bold shrink-0" style={{ color: ratingColor(player.rating_overall) }}>
          {player.rating_overall}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-ui-border">
        <span className="text-[11px] text-faint">{formatWage(player.wage_brl)}</span>
        <div className="flex items-center gap-2">
          {player.fatigue >= 80 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
              Cansado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function SquadPage() {
  const [filter, setFilter] = useState<FilterPos>('ALL')
  const { save, loading: saveLoading } = useSave()
  const { players, loading: squadLoading } = useSquad(save?.id ?? null)

  const loading = saveLoading || squadLoading

  const filtered = filter === 'ALL'
    ? players
    : players.filter((p) => p.position_main === filter)

  return (
    <div className="max-w-[390px] mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <header className="flex items-baseline justify-between mb-4">
        <h1 className="text-[22px] font-bold">Elenco</h1>
        <span className="text-sm text-muted font-medium">{players.length} jogadores</span>
      </header>

      {/* Filter pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 mb-4"
        role="tablist"
        style={{ scrollbarWidth: 'none' }}
      >
        {FILTERS.map((pos) => (
          <button
            key={pos}
            role="tab"
            aria-selected={filter === pos}
            onClick={() => setFilter(pos)}
            className="flex-shrink-0 px-3.5 py-[7px] rounded-full text-xs font-semibold border-[0.5px] transition-all"
            style={{
              background: filter === pos ? '#22C55E' : 'transparent',
              color: filter === pos ? '#0A0A0A' : '#FFFFFF',
              borderColor: filter === pos ? '#22C55E' : '#1F1F1F',
            }}
          >
            {pos === 'ALL' ? 'Todos' : pos}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-muted text-sm py-12">Carregando elenco...</p>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-4xl">⚽</p>
          <p className="text-sm text-muted">Nenhum jogador ainda. Cria seu clube primeiro!</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted text-sm py-12">Nenhum {filter} no elenco.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((player) => (
            <PlayerCard key={player.squad_id} player={player} />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
