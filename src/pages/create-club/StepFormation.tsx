import { useState } from 'react'
import type { Formation, DraftPlayer, Position } from '../../types'
import { PitchField, getFormationSlots } from '../../components/PitchField'
import { PositionBadge } from '../../components/PositionBadge'
import type { WizardData } from '../CreateClubPage'

const FORMATIONS: Formation[] = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2']

interface Props {
  data: WizardData
  onChange: (update: Partial<WizardData>) => void
  onFinish: () => void
  onBack: () => void
  saving: boolean
}

export function StepFormation({ data, onChange, onFinish, onBack, saving }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const slots = getFormationSlots(data.formation)
  const assigned = Object.values(data.lineup)
  const filled = slots.filter((s) => data.lineup[s.id]).length
  const allFilled = filled === 11

  function handleSlotClick(slotId: string) {
    setSelectedSlot(selectedSlot === slotId ? null : slotId)
  }

  function handleAssign(player: DraftPlayer) {
    if (!selectedSlot) return
    // Un-assign from any previous slot
    const prevEntry = Object.entries(data.lineup).find(([, id]) => id === player.localId)
    const newLineup = { ...data.lineup }
    if (prevEntry) delete newLineup[prevEntry[0]]
    newLineup[selectedSlot] = player.localId
    onChange({ lineup: newLineup })
    setSelectedSlot(null)
  }

  function handleUnassign(slotId: string) {
    const newLineup = { ...data.lineup }
    delete newLineup[slotId]
    onChange({ lineup: newLineup })
  }

  const activeSlot = selectedSlot ? slots.find((s) => s.id === selectedSlot) : null
  const eligiblePlayers = activeSlot
    ? data.selectedPlayers.filter(
        (p) => (activeSlot.accepts as Position[]).includes(p.position)
      )
    : []

  return (
    <div>
      <h2 className="text-[18px] font-bold leading-snug mb-1">Escolha a formação</h2>
      <p className="text-xs text-muted mb-4">Posicione seus 11 titulares no campo.</p>

      {/* Formation selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FORMATIONS.map((f) => (
          <button
            key={f}
            onClick={() => { onChange({ formation: f, lineup: {} }); setSelectedSlot(null) }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border-[0.5px] transition-all"
            style={{
              background: data.formation === f ? '#22C55E' : '#111111',
              color: data.formation === f ? '#0A0A0A' : '#FFFFFF',
              borderColor: data.formation === f ? '#22C55E' : '#1F1F1F',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex justify-between text-xs mb-2">
        <span className="text-muted">Escalados</span>
        <span className={allFilled ? 'text-accent font-semibold' : 'text-warn'}>{filled}/11</span>
      </div>

      {/* Pitch */}
      <div className="mb-4 rounded-[10px] overflow-hidden">
        <PitchField
          formation={data.formation}
          lineup={data.lineup}
          players={data.selectedPlayers}
          primaryColor={data.primaryColor}
          selectedSlot={selectedSlot}
          onSlotClick={handleSlotClick}
        />
      </div>

      {/* Selected slot instruction */}
      {selectedSlot && activeSlot && (
        <div className="bg-card border-[0.5px] border-accent/30 rounded-[10px] p-3 mb-4">
          <p className="text-xs text-muted mb-2">
            Escalando posição <span className="text-accent font-semibold">{activeSlot.label}</span> — escolha um jogador:
          </p>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {eligiblePlayers.length === 0 && (
              <p className="text-xs text-faint">Nenhum jogador elegível disponível.</p>
            )}
            {eligiblePlayers.map((p) => {
              const isAssigned = assigned.includes(p.localId) && data.lineup[selectedSlot] !== p.localId
              return (
                <button
                  key={p.localId}
                  onClick={() => handleAssign(p)}
                  disabled={isAssigned}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left disabled:opacity-40 transition-colors"
                  style={{ background: '#1A1A1A', border: '0.5px solid #2A2A2A' }}
                >
                  <PositionBadge position={p.position} />
                  <span className="flex-1 text-xs font-medium truncate">{p.name}</span>
                  <span className="text-[11px] text-faint">{p.age}a · OVR {p.rating_overall}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Assigned list */}
      {filled > 0 && !selectedSlot && (
        <div className="flex flex-col gap-1 mb-4">
          {slots.filter((s) => data.lineup[s.id]).map((slot) => {
            const player = data.selectedPlayers.find((p) => p.localId === data.lineup[slot.id])
            if (!player) return null
            return (
              <div key={slot.id} className="flex items-center gap-2 px-2.5 py-2 bg-card border-[0.5px] border-ui-border rounded-lg">
                <PositionBadge position={player.position} />
                <span className="flex-1 text-xs font-medium truncate">{player.name}</span>
                <span className="text-[11px] text-faint">{slot.label}</span>
                <button
                  onClick={() => handleUnassign(slot.id)}
                  className="text-faint hover:text-white text-base px-1 transition-colors"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-lg text-sm font-medium text-muted border-[0.5px] border-ui-border">
          ← Voltar
        </button>
        <button
          onClick={onFinish}
          disabled={!allFilled || saving}
          className="flex-1 py-3.5 rounded-lg text-sm font-bold bg-accent text-[#0A0A0A] disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Salvando...' : 'Tá escalado! Bora jogar 🟢'}
        </button>
      </div>
    </div>
  )
}
