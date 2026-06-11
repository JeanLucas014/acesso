import type { Formation, PositionSlot, Position, DraftPlayer } from '../types'

const FORMATIONS: Record<Formation, PositionSlot[]> = {
  '4-3-3': [
    { id: 'gk',  label: 'GOL', accepts: ['GOL'],           x: 160, y: 400 },
    { id: 'lb',  label: 'LAT', accepts: ['LAT','ZAG'],     x: 50,  y: 330 },
    { id: 'cb1', label: 'ZAG', accepts: ['ZAG'],           x: 120, y: 340 },
    { id: 'cb2', label: 'ZAG', accepts: ['ZAG'],           x: 200, y: 340 },
    { id: 'rb',  label: 'LAT', accepts: ['LAT','ZAG'],     x: 270, y: 330 },
    { id: 'cm1', label: 'VOL', accepts: ['VOL','MEI'],     x: 90,  y: 240 },
    { id: 'cm2', label: 'MEI', accepts: ['MEI','VOL'],     x: 160, y: 250 },
    { id: 'cm3', label: 'VOL', accepts: ['VOL','MEI'],     x: 230, y: 240 },
    { id: 'lw',  label: 'ATA', accepts: ['ATA','MEI'],     x: 60,  y: 130 },
    { id: 'st',  label: 'ATA', accepts: ['ATA'],           x: 160, y: 110 },
    { id: 'rw',  label: 'ATA', accepts: ['ATA','MEI'],     x: 260, y: 130 },
  ],
  '4-4-2': [
    { id: 'gk',  label: 'GOL', accepts: ['GOL'],           x: 160, y: 400 },
    { id: 'lb',  label: 'LAT', accepts: ['LAT','ZAG'],     x: 50,  y: 330 },
    { id: 'cb1', label: 'ZAG', accepts: ['ZAG'],           x: 120, y: 340 },
    { id: 'cb2', label: 'ZAG', accepts: ['ZAG'],           x: 200, y: 340 },
    { id: 'rb',  label: 'LAT', accepts: ['LAT','ZAG'],     x: 270, y: 330 },
    { id: 'lm',  label: 'MEI', accepts: ['MEI','LAT'],     x: 45,  y: 248 },
    { id: 'cm1', label: 'VOL', accepts: ['VOL','MEI'],     x: 130, y: 255 },
    { id: 'cm2', label: 'VOL', accepts: ['VOL','MEI'],     x: 190, y: 255 },
    { id: 'rm',  label: 'MEI', accepts: ['MEI','LAT'],     x: 275, y: 248 },
    { id: 'st1', label: 'ATA', accepts: ['ATA'],           x: 110, y: 120 },
    { id: 'st2', label: 'ATA', accepts: ['ATA'],           x: 210, y: 120 },
  ],
  '4-2-3-1': [
    { id: 'gk',  label: 'GOL', accepts: ['GOL'],           x: 160, y: 400 },
    { id: 'lb',  label: 'LAT', accepts: ['LAT','ZAG'],     x: 50,  y: 330 },
    { id: 'cb1', label: 'ZAG', accepts: ['ZAG'],           x: 120, y: 340 },
    { id: 'cb2', label: 'ZAG', accepts: ['ZAG'],           x: 200, y: 340 },
    { id: 'rb',  label: 'LAT', accepts: ['LAT','ZAG'],     x: 270, y: 330 },
    { id: 'dm1', label: 'VOL', accepts: ['VOL'],           x: 110, y: 278 },
    { id: 'dm2', label: 'VOL', accepts: ['VOL'],           x: 210, y: 278 },
    { id: 'lw',  label: 'MEI', accepts: ['MEI','ATA'],     x: 60,  y: 190 },
    { id: 'cam', label: 'MEI', accepts: ['MEI'],           x: 160, y: 195 },
    { id: 'rw',  label: 'MEI', accepts: ['MEI','ATA'],     x: 260, y: 190 },
    { id: 'st',  label: 'ATA', accepts: ['ATA'],           x: 160, y: 115 },
  ],
  '3-5-2': [
    { id: 'gk',  label: 'GOL', accepts: ['GOL'],           x: 160, y: 400 },
    { id: 'cb1', label: 'ZAG', accepts: ['ZAG'],           x: 80,  y: 355 },
    { id: 'cb2', label: 'ZAG', accepts: ['ZAG'],           x: 160, y: 360 },
    { id: 'cb3', label: 'ZAG', accepts: ['ZAG'],           x: 240, y: 355 },
    { id: 'lwb', label: 'LAT', accepts: ['LAT','VOL'],     x: 30,  y: 268 },
    { id: 'cm1', label: 'VOL', accepts: ['VOL','MEI'],     x: 110, y: 253 },
    { id: 'cm2', label: 'MEI', accepts: ['MEI','VOL'],     x: 160, y: 248 },
    { id: 'cm3', label: 'VOL', accepts: ['VOL','MEI'],     x: 210, y: 253 },
    { id: 'rwb', label: 'LAT', accepts: ['LAT','VOL'],     x: 290, y: 268 },
    { id: 'st1', label: 'ATA', accepts: ['ATA'],           x: 110, y: 120 },
    { id: 'st2', label: 'ATA', accepts: ['ATA'],           x: 210, y: 120 },
  ],
  '5-3-2': [
    { id: 'gk',  label: 'GOL', accepts: ['GOL'],           x: 160, y: 400 },
    { id: 'lwb', label: 'LAT', accepts: ['LAT'],           x: 30,  y: 330 },
    { id: 'cb1', label: 'ZAG', accepts: ['ZAG'],           x: 90,  y: 345 },
    { id: 'cb2', label: 'ZAG', accepts: ['ZAG'],           x: 160, y: 350 },
    { id: 'cb3', label: 'ZAG', accepts: ['ZAG'],           x: 230, y: 345 },
    { id: 'rwb', label: 'LAT', accepts: ['LAT'],           x: 290, y: 330 },
    { id: 'cm1', label: 'VOL', accepts: ['VOL','MEI'],     x: 90,  y: 240 },
    { id: 'cm2', label: 'MEI', accepts: ['MEI','VOL'],     x: 160, y: 245 },
    { id: 'cm3', label: 'VOL', accepts: ['VOL','MEI'],     x: 230, y: 240 },
    { id: 'st1', label: 'ATA', accepts: ['ATA'],           x: 110, y: 120 },
    { id: 'st2', label: 'ATA', accepts: ['ATA'],           x: 210, y: 120 },
  ],
}

export function getFormationSlots(formation: Formation): PositionSlot[] {
  return FORMATIONS[formation]
}

interface PitchFieldProps {
  formation: Formation
  lineup: Record<string, string>          // slotId → localId
  players: DraftPlayer[]
  primaryColor?: string
  selectedSlot?: string | null
  onSlotClick?: (slotId: string) => void
}

export function PitchField({
  formation,
  lineup,
  players,
  primaryColor = '#22C55E',
  selectedSlot = null,
  onSlotClick,
}: PitchFieldProps) {
  const slots = FORMATIONS[formation]
  const playerMap = Object.fromEntries(players.map((p) => [p.localId, p]))

  function abbrev(name: string): string {
    const parts = name.split(' ')
    return parts[parts.length - 1].slice(0, 4).toUpperCase()
  }

  return (
    <svg viewBox="0 0 320 440" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-[10px]">
      {/* Field */}
      <rect width="320" height="440" fill="#064E3B" rx="6" />
      <rect x="10" y="10" width="300" height="420" fill="none" stroke="#0D7B58" strokeWidth="1.5" rx="2" />
      <line x1="10" y1="220" x2="310" y2="220" stroke="#0D7B58" strokeWidth="1.5" />
      <circle cx="160" cy="220" r="45" fill="none" stroke="#0D7B58" strokeWidth="1.5" />
      <circle cx="160" cy="220" r="3" fill="#0D7B58" />
      {/* Penalty areas */}
      <rect x="80" y="10"  width="160" height="70" fill="none" stroke="#0D7B58" strokeWidth="1.5" />
      <rect x="115" y="10" width="90"  height="30" fill="none" stroke="#0D7B58" strokeWidth="1.5" />
      <rect x="80" y="360" width="160" height="70" fill="none" stroke="#0D7B58" strokeWidth="1.5" />
      <rect x="115" y="400" width="90" height="30" fill="none" stroke="#0D7B58" strokeWidth="1.5" />
      {/* Corner arcs */}
      <path d="M10 18 A8 8 0 0 1 18 10" fill="none" stroke="#0D7B58" strokeWidth="1" />
      <path d="M302 10 A8 8 0 0 1 310 18" fill="none" stroke="#0D7B58" strokeWidth="1" />
      <path d="M10 422 A8 8 0 0 0 18 430" fill="none" stroke="#0D7B58" strokeWidth="1" />
      <path d="M302 430 A8 8 0 0 0 310 422" fill="none" stroke="#0D7B58" strokeWidth="1" />

      {/* Player slots */}
      {slots.map((slot) => {
        const assignedId = lineup[slot.id]
        const player = assignedId ? playerMap[assignedId] : null
        const isSelected = selectedSlot === slot.id
        const isEmpty = !player
        const fill = isEmpty
          ? isSelected ? primaryColor : 'rgba(255,255,255,0.15)'
          : primaryColor
        const stroke = isSelected ? '#FFFFFF' : 'none'

        return (
          <g
            key={slot.id}
            onClick={() => onSlotClick?.(slot.id)}
            style={{ cursor: onSlotClick ? 'pointer' : 'default' }}
          >
            <circle cx={slot.x} cy={slot.y} r={20} fill={fill} fillOpacity={isEmpty ? 0.9 : 0.9} stroke={stroke} strokeWidth={isSelected ? 2 : 0} />
            {player ? (
              <>
                <text x={slot.x} y={slot.y - 4} textAnchor="middle" fill="#0A0A0A" fontFamily="Inter" fontSize="9" fontWeight="700">
                  {slot.label}
                </text>
                <text x={slot.x} y={slot.y + 7} textAnchor="middle" fill="#0A0A0A" fontFamily="Inter" fontSize="8" fontWeight="600">
                  {abbrev(player.name)}
                </text>
              </>
            ) : (
              <>
                <text x={slot.x} y={slot.y - 3} textAnchor="middle" fill={isSelected ? '#0A0A0A' : '#A1A1AA'} fontFamily="Inter" fontSize="9" fontWeight="700">
                  {slot.label}
                </text>
                <text x={slot.x} y={slot.y + 7} textAnchor="middle" fill={isSelected ? '#0A0A0A' : '#52525B'} fontFamily="Inter" fontSize="7" fontWeight="500">
                  vazio
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export { FORMATIONS }
export type { Position }
