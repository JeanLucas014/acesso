import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Play, SkipForward, ChevronRight } from 'lucide-react'
import type { MatchEvent } from '../types'

interface StarterInfo { id: string; name: string; position: string }

interface LocationState {
  matchId: string
  isUserHome: boolean
  userClubName: string
  opponentName: string
  round: number
  result: { homeGoals: number; awayGoals: number }
  starterInfo?: StarterInfo[]
}

// Field dimensions (viewBox 0 0 300 420)
const FIELD_W = 300
const FIELD_H = 420
const CX = FIELD_W / 2   // 150
const CY = FIELD_H / 2   // 210

// Ball positions for events
function ballPosForEvent(ev: MatchEvent, isUserHome: boolean): { x: number; y: number } {
  const userTeam = isUserHome ? 'home' : 'away'
  // home attacks toward top (y ≈ 60), away attacks toward bottom (y ≈ 360)
  if (ev.type === 'goal') {
    if (ev.team === 'home') return { x: CX + (Math.random() * 30 - 15), y: 65 }
    return { x: CX + (Math.random() * 30 - 15), y: 355 }
  }
  if (ev.type === 'yellow_card' || ev.type === 'red_card') {
    const side = ev.team === userTeam ? -1 : 1
    return { x: CX + side * 50, y: CY + (Math.random() * 60 - 30) }
  }
  if (ev.type === 'injury') {
    const side = ev.team === userTeam ? -1 : 1
    return { x: CX + side * 60, y: CY + (Math.random() * 80 - 40) }
  }
  return { x: CX, y: CY }
}

function eventLabel(ev: MatchEvent): string {
  switch (ev.type) {
    case 'goal':        return `⚽ Gol — ${ev.playerName} (${ev.minute}')`
    case 'yellow_card': return `🟨 Cartão — ${ev.playerName} (${ev.minute}')`
    case 'red_card':    return `🟥 Expulsão — ${ev.playerName} (${ev.minute}')`
    case 'injury':      return `🤕 Lesão — ${ev.playerName} (${ev.minute}')`
    default:            return `${ev.minute}'`
  }
}

// Simplified field SVG
function FieldSVG({ ballX, ballY, events, currentIndex }: {
  ballX: number; ballY: number; currentIndex: number; events: MatchEvent[]
}) {
  const currentEvent = currentIndex >= 0 && currentIndex < events.length ? events[currentIndex] : null

  return (
    <svg
      viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
      className="w-full rounded-[10px]"
      style={{ background: '#064E3B', maxHeight: '360px' }}
    >
      {/* Field markings */}
      {/* Outer boundary */}
      <rect x="10" y="10" width={FIELD_W - 20} height={FIELD_H - 20} fill="none" stroke="#065F46" strokeWidth="1.5" rx="2" />
      {/* Center line */}
      <line x1="10" y1={CY} x2={FIELD_W - 10} y2={CY} stroke="#065F46" strokeWidth="1" />
      {/* Center circle */}
      <circle cx={CX} cy={CY} r="35" fill="none" stroke="#065F46" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="2" fill="#065F46" />
      {/* Penalty areas */}
      <rect x="75" y="10" width="150" height="55" fill="none" stroke="#065F46" strokeWidth="1" />
      <rect x="75" y={FIELD_H - 65} width="150" height="55" fill="none" stroke="#065F46" strokeWidth="1" />
      {/* Goal boxes */}
      <rect x="110" y="10" width="80" height="22" fill="none" stroke="#065F46" strokeWidth="1" />
      <rect x="110" y={FIELD_H - 32} width="80" height="22" fill="none" stroke="#065F46" strokeWidth="1" />
      {/* Goals */}
      <rect x="120" y="6" width="60" height="8" fill="none" stroke="#065F46" strokeWidth="1.5" />
      <rect x="120" y={FIELD_H - 14} width="60" height="8" fill="none" stroke="#065F46" strokeWidth="1.5" />

      {/* Past event dots */}
      {events.slice(0, Math.max(0, currentIndex)).map((ev, i) => {
        const pos = ballPosForEvent(ev, true)
        const color = ev.type === 'goal' ? '#22C55E' : ev.type === 'yellow_card' ? '#EAB308' : ev.type === 'red_card' ? '#EF4444' : '#94A3B8'
        return <circle key={i} cx={pos.x} cy={pos.y} r="3" fill={color} opacity="0.5" />
      })}

      {/* Ball with CSS transition */}
      <circle
        cx={ballX}
        cy={ballY}
        r="7"
        fill="white"
        stroke="#064E3B"
        strokeWidth="1"
        style={{ transition: 'cx 0.8s ease-in-out, cy 0.8s ease-in-out' }}
      />
      {/* Shadow */}
      <ellipse cx={ballX} cy={ballY + 9} rx="5" ry="2" fill="rgba(0,0,0,0.2)" />

      {/* Event label */}
      {currentEvent && (
        <g>
          <rect x="10" y={FIELD_H - 38} width={FIELD_W - 20} height="26" rx="4" fill="rgba(0,0,0,0.6)" />
          <text
            x={CX} y={FIELD_H - 20}
            textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="11" fontFamily="Inter, system-ui, sans-serif"
          >
            {eventLabel(currentEvent).slice(0, 40)}
          </text>
        </g>
      )}
    </svg>
  )
}

export function MatchViewPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const state     = location.state as LocationState | null

  const [ballX, setBallX]           = useState(CX)
  const [ballY, setBallY]           = useState(CY)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [finished, setFinished]     = useState(false)
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const events: MatchEvent[] = (state?.result as unknown as { events?: MatchEvent[] })?.events ?? []

  function goToPost() {
    if (timerRef.current) clearTimeout(timerRef.current)
    navigate('/match/post', { state })
  }

  function advanceEvent(idx: number) {
    if (idx >= events.length) {
      setFinished(true)
      setIsPlaying(false)
      return
    }
    setCurrentIndex(idx)
    const pos = ballPosForEvent(events[idx], state?.isUserHome ?? true)
    setBallX(pos.x)
    setBallY(pos.y)
    timerRef.current = setTimeout(() => advanceEvent(idx + 1), 1600)
  }

  function handlePlay() {
    if (isPlaying) return
    setIsPlaying(true)
    setFinished(false)
    setBallX(CX)
    setBallY(CY)
    setCurrentIndex(-1)
    timerRef.current = setTimeout(() => advanceEvent(0), 800)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <button onClick={() => navigate('/competition')} className="text-accent text-sm font-semibold">
          Voltar ao campeonato
        </button>
      </div>
    )
  }

  const { isUserHome, userClubName, opponentName, result } = state
  const homeGoals = result.homeGoals
  const awayGoals = result.awayGoals
  const homeClub  = isUserHome ? userClubName : opponentName
  const awayClub  = isUserHome ? opponentName : userClubName
  const userGoals = isUserHome ? homeGoals : awayGoals
  const oppGoals  = isUserHome ? awayGoals : homeGoals
  const isWin = userGoals > oppGoals
  const isDraw = userGoals === oppGoals

  const resultColor = isWin ? '#22C55E' : isDraw ? '#EAB308' : '#EF4444'
  const resultLabel = isWin ? 'VITÓRIA' : isDraw ? 'EMPATE' : 'DERROTA'

  return (
    <div className="max-w-[390px] md:max-w-2xl mx-auto px-4 pt-4 pb-8">
      {/* Header scoreboard */}
      <div className="text-center mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">
          Campeonato Estadual · Rodada {state.round}
        </p>
        <div className="flex items-center justify-center gap-4 mb-2">
          <p className="text-sm font-semibold flex-1 text-right">{homeClub}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[32px] font-black leading-none">{homeGoals}</span>
            <span className="text-base text-faint font-bold">×</span>
            <span className="text-[32px] font-black leading-none text-muted">{awayGoals}</span>
          </div>
          <p className="text-sm font-semibold flex-1 text-muted">{awayClub}</p>
        </div>
        <span
          className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold"
          style={{ background: `${resultColor}18`, color: resultColor }}
        >
          {resultLabel}
        </span>
      </div>

      {/* Animated field */}
      <div className="mb-4">
        <FieldSVG ballX={ballX} ballY={ballY} currentIndex={currentIndex} events={events} />
      </div>

      {/* Controls */}
      {!finished ? (
        <div className="flex gap-3 mb-4">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold disabled:opacity-40"
            style={{ background: '#22C55E', color: '#0A0A0A' }}
          >
            <Play size={16} />
            {isPlaying ? `Reproduzindo... (${currentIndex + 1}/${events.length})` : 'Reproduzir'}
          </button>
          <button
            onClick={goToPost}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg text-sm font-semibold border border-ui-border text-muted"
          >
            <SkipForward size={15} />
            Pular
          </button>
        </div>
      ) : (
        <button
          onClick={goToPost}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg text-sm font-bold mb-4"
          style={{ background: '#22C55E', color: '#0A0A0A' }}
        >
          Ver relatório completo
          <ChevronRight size={16} />
        </button>
      )}

      {/* Event timeline text */}
      {events.length > 0 && (
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-3">Eventos</p>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {events.map((ev, i) => {
              const isPast = i < currentIndex
              const isCurrent = i === currentIndex
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[12px] transition-opacity"
                  style={{ opacity: isCurrent ? 1 : isPast ? 0.6 : 0.3 }}
                >
                  <span className="font-bold text-faint min-w-[28px]">{ev.minute}'</span>
                  <span>{ev.type === 'goal' ? '⚽' : ev.type === 'yellow_card' ? '🟨' : ev.type === 'red_card' ? '🟥' : '🤕'}</span>
                  <span className={isCurrent ? 'font-semibold text-white' : ''}>
                    {ev.playerName ?? '–'}
                    {ev.type === 'goal' && ev.assistPlayerName ? ` (${ev.assistPlayerName})` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
