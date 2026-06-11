import type { Position } from '../types'

const BG: Record<Position, string> = {
  GOL: '#7C3AED',
  ZAG: '#1D4ED8',
  LAT: '#0369A1',
  VOL: '#065F46',
  MEI: '#854D0E',
  ATA: '#9A3412',
}

interface PositionBadgeProps {
  position: Position
  size?: 'sm' | 'md'
}

export function PositionBadge({ position, size = 'sm' }: PositionBadgeProps) {
  const px = size === 'md' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[9px]'
  return (
    <span
      className={`inline-flex items-center rounded-[3px] font-bold text-white tracking-wide leading-none ${px}`}
      style={{ background: BG[position] }}
    >
      {position}
    </span>
  )
}
