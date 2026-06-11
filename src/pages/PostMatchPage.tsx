import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useMatch } from '../hooks/useMatch'
import { useCompetition } from '../hooks/useCompetition'
import type { Match, MatchEvent } from '../types'

function ratingColor(r: number) {
  if (r >= 7.5) return '#22C55E'
  if (r >= 6.0) return '#EAB308'
  return '#EF4444'
}

function eventIcon(type: MatchEvent['type']) {
  switch (type) {
    case 'goal':        return '⚽'
    case 'yellow_card': return '🟨'
    case 'red_card':    return '🟥'
    case 'injury':      return '🤕'
    default:            return '•'
  }
}

function eventDotColor(type: MatchEvent['type']) {
  switch (type) {
    case 'goal':        return '#22C55E'
    case 'yellow_card': return '#EAB308'
    case 'red_card':    return '#EF4444'
    default:            return '#52525B'
  }
}

interface LocationState {
  matchId: string
  isUserHome: boolean
  userClubName: string
  opponentName: string
  round: number
  result: { homeGoals: number; awayGoals: number }
}

export function PostMatchPage() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const state         = location.state as LocationState | null
  const { getMatch }  = useMatch()
  const { simulateCurrentRoundAI, competition, refresh } = useCompetition()

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!state?.matchId) { setLoading(false); return }
    getMatch(state.matchId).then(m => { setMatch(m); setLoading(false) })
  }, [state?.matchId, getMatch])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-accent font-semibold">Carregando resultado...</p>
      </div>
    )
  }

  if (!match || !state) {
    return (
      <div className="max-w-[390px] mx-auto px-4 pt-16 pb-24 text-center">
        <p className="text-sm text-muted">Nenhum jogo encontrado.</p>
        <button onClick={() => navigate('/competition')} className="mt-4 text-accent text-sm font-semibold">
          Ver campeonato →
        </button>
        <BottomNav />
      </div>
    )
  }

  const { isUserHome, userClubName, opponentName } = state
  const userGoals = isUserHome ? match.home_goals! : match.away_goals!
  const oppGoals  = isUserHome ? match.away_goals! : match.home_goals!
  const diff      = userGoals - oppGoals
  const isWin     = diff > 0
  const isDraw    = diff === 0

  const resultLabel = isWin ? 'VITÓRIA' : isDraw ? 'EMPATE' : 'DERROTA'
  const resultBg    = isWin ? 'rgba(34,197,94,0.1)' : isDraw ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)'
  const resultColor = isWin ? '#22C55E' : isDraw ? '#EAB308' : '#EF4444'

  const homeClubName = isUserHome ? userClubName : opponentName
  const awayClubName = isUserHome ? opponentName : userClubName
  const homeGoals    = match.home_goals!
  const awayGoals    = match.away_goals!

  const events = match.events ?? []

  // User players who started (have ratings)
  const userTeam = isUserHome ? 'home' : 'away'
  const userPlayerIds = Object.keys(match.ratings).filter(id => {
    const ev = events.find(e => e.playerId === id)
    return ev ? ev.team === userTeam : true
  })

  // Build sorted ratings list for user players
  const userRatings = userPlayerIds
    .map(id => ({ id, rating: match.ratings[id] ?? 6.0 }))
    .sort((a, b) => b.rating - a.rating)

  // Morale info
  const moraleDelta = isWin ? 8 : isDraw ? 2 : -6
  const moraleLabel = isWin ? `Moral +${moraleDelta} (vitória)` : isDraw ? `Moral +${moraleDelta} (empate)` : `Moral ${moraleDelta} (derrota)`
  const moraleEmoji = isWin ? '😄' : isDraw ? '😐' : '😟'

  // Injuries
  const injuryEvents = events.filter(e => e.type === 'injury' && e.team === userTeam)

  // Player name from ratings (we only have IDs; the match stores playerName in events)
  function playerNameForId(id: string): string {
    const ev = events.find(e => e.playerId === id)
    return ev?.playerName ?? id.slice(0, 8)
  }

  function playerPosForId(id: string): string {
    const goalEv = events.find(e => e.type === 'goal' && e.playerId === id)
    if (goalEv) return goalEv.team === userTeam ? 'ATA' : 'ATA'
    return '–'
  }

  async function handleNextRound() {
    await simulateCurrentRoundAI()
    await refresh()
    navigate('/competition')
  }

  return (
    <div className="max-w-[390px] mx-auto px-4 pt-4 pb-24">
      {/* Scoreboard */}
      <div className="text-center pt-2 pb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-3">
          {competition?.type === 'estadual' ? 'Campeonato Estadual' : 'Competição'} · Rodada {match.round}
        </p>
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold leading-snug">{homeClubName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[36px] font-bold leading-none">{homeGoals}</span>
            <span className="text-base text-faint font-bold">×</span>
            <span className="text-[36px] font-bold leading-none text-muted">{awayGoals}</span>
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-muted leading-snug">{awayClubName}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold"
          style={{ background: resultBg, color: resultColor }}
        >
          {isWin ? '🏆' : isDraw ? '🤝' : '💔'} {resultLabel}
        </span>
      </div>

      {/* Event timeline */}
      <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4 mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-3">Lance a Lance</p>
        {events.length === 0 ? (
          <p className="text-xs text-faint">Jogo sem grandes lances.</p>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-1 top-1 bottom-1 w-[1.5px] bg-ui-border" />
            {events.map((ev, i) => (
              <div key={i} className="relative flex items-start gap-2.5 py-2">
                <div
                  className="absolute -left-5 top-3 w-2 h-2 rounded-full border-2"
                  style={{ background: eventDotColor(ev.type), borderColor: '#111111', zIndex: 1 }}
                />
                <span className="text-[12px] font-bold text-faint min-w-[28px] flex-shrink-0">{ev.minute}'</span>
                <span className="text-sm flex-shrink-0">{eventIcon(ev.type)}</span>
                <div className="flex-1">
                  <p className={`text-[13px] font-medium leading-tight ${ev.team !== userTeam ? 'text-muted' : ''}`}>
                    {ev.type === 'goal' ? `Gol — ${ev.playerName}` :
                     ev.type === 'yellow_card' ? `Cartão Amarelo — ${ev.playerName}` :
                     ev.type === 'red_card' ? `Cartão Vermelho — ${ev.playerName}` :
                     `Lesão — ${ev.playerName}`}
                  </p>
                  {ev.assistPlayerName && (
                    <p className="text-[11px] text-faint mt-0.5">Assist: {ev.assistPlayerName}</p>
                  )}
                  {ev.team !== userTeam && (
                    <p className="text-[11px] text-faint mt-0.5">{opponentName}</p>
                  )}
                  {ev.severity && (
                    <p className="text-[11px] text-danger mt-0.5">Lesão {ev.severity} — afastado</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual ratings */}
      {userRatings.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Notas individuais</p>
          <div className="grid grid-cols-2 gap-1.5">
            {userRatings.map(({ id, rating }) => (
              <div
                key={id}
                className="bg-card border-[0.5px] border-ui-border rounded-lg px-3 py-2.5 flex items-center justify-between"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[12px] font-medium truncate">{playerNameForId(id)}</span>
                  <span className="text-[10px] text-faint">{playerPosForId(id)}</span>
                </div>
                <span className="text-[18px] font-bold flex-shrink-0" style={{ color: ratingColor(rating) }}>
                  {rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Squad impact */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Impacto no elenco</p>
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4 mb-2">
          <p className="text-[13px] font-semibold mb-2">{moraleEmoji} {moraleLabel}</p>
          <p className="text-[12px] text-muted">
            {isWin ? 'Elenco animado com a vitória! Moral e confiança em alta.' :
             isDraw ? 'Resultado regular. Elenco sem grandes mudanças no ânimo.' :
             'Derrota pesa no vestiário. Recuperar a confiança vai levar tempo.'}
          </p>
        </div>

        {injuryEvents.map((ev, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)' }}
          >
            <span className="text-base">🤕</span>
            <p className="text-[12px] text-danger font-medium">
              {ev.playerName} saiu machucado — Lesão {ev.severity ?? 'leve'}
            </p>
          </div>
        ))}
      </div>

      {/* Next round CTA */}
      <button
        onClick={handleNextRound}
        className="w-full py-4 rounded-lg text-sm font-bold bg-accent text-[#0A0A0A] flex items-center justify-center gap-2"
      >
        Próxima rodada →
      </button>

      <BottomNav />
    </div>
  )
}
