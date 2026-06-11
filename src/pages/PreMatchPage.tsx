import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swords } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { PitchField, getFormationSlots } from '../components/PitchField'
import { PositionBadge } from '../components/PositionBadge'
import { useSave } from '../hooks/useSave'
import { useSquad } from '../hooks/useSquad'
import { useCompetition } from '../hooks/useCompetition'
import { useMatch } from '../hooks/useMatch'
import { simulateMatch, applyMatchEffects } from '../lib/matchEngine'
import { generateAISquad } from '../lib/competition'
import type { Formation, Tactic, RiskLevel, DraftPlayer, SquadPlayer, Position } from '../types'

const FORMATIONS: Formation[] = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2']

const TACTICS: { id: Tactic; label: string; desc: string }[] = [
  { id: 'pressure',   label: 'Pressão',       desc: 'Alta intensidade, pressão alta' },
  { id: 'possession', label: 'Posse',          desc: 'Construção lenta, controle' },
  { id: 'counter',    label: 'Contra-Ataque',  desc: 'Defesa compacta, transição rápida' },
]

const RISKS: { id: RiskLevel; label: string; color: string }[] = [
  { id: 'conservative', label: 'Conservador', color: '#0369A1' },
  { id: 'balanced',     label: 'Equilibrado',  color: '#22C55E' },
  { id: 'allout',       label: 'Arriscar',     color: '#EF4444' },
]

function toSquadAsDraft(p: SquadPlayer): DraftPlayer {
  return {
    localId: p.id,
    name: p.name,
    age: p.age,
    nationality: p.nationality,
    position: p.position_main,
    isYouth: p.is_youth,
    rating_overall: p.rating_overall,
    rating_pace: p.rating_pace,
    rating_shooting: p.rating_shooting,
    rating_passing: p.rating_passing,
    rating_dribbling: p.rating_dribbling,
    rating_defending: p.rating_defending,
    potential: p.potential,
    wage_brl: p.wage_brl,
  }
}

export function PreMatchPage() {
  const navigate = useNavigate()
  const { save } = useSave()
  const { players } = useSquad(save?.id ?? null)
  const { nextFixture, loading: compLoading } = useCompetition()
  const { saveResult, loading: saving } = useMatch()

  const [formation, setFormation] = useState<Formation>('4-3-3')
  const [lineup, setLineup] = useState<Record<string, string>>({})
  const [tactic, setTactic] = useState<Tactic>('possession')
  const [risk, setRisk] = useState<RiskLevel>('balanced')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)

  const slots     = getFormationSlots(formation)
  const filled    = slots.filter(s => lineup[s.id]).length
  const allFilled = filled === 11

  const pitchPlayers = players.map(toSquadAsDraft)
  const assigned     = Object.values(lineup)

  function handleSlotClick(slotId: string) {
    setSelectedSlot(prev => prev === slotId ? null : slotId)
  }

  function handleAssign(p: DraftPlayer) {
    if (!selectedSlot) return
    const prevEntry = Object.entries(lineup).find(([, id]) => id === p.localId)
    const next = { ...lineup }
    if (prevEntry) delete next[prevEntry[0]]
    next[selectedSlot] = p.localId
    setLineup(next)
    setSelectedSlot(null)
  }

  function handleUnassign(slotId: string) {
    const next = { ...lineup }
    delete next[slotId]
    setLineup(next)
  }

  function changeFormation(f: Formation) {
    setFormation(f)
    setLineup({})
    setSelectedSlot(null)
  }

  const handleSimulate = useCallback(async () => {
    if (!allFilled || !nextFixture || !save?.club_id || !save?.id) return
    setSimulating(true)

    const starterIds = Object.values(lineup)
    const starters = starterIds.map(id => players.find(p => p.id === id)).filter(Boolean) as SquadPlayer[]
    if (starters.length !== 11) { setSimulating(false); return }

    const { fixture, competition, opponentReputation, opponentName } = nextFixture
    const isUserHome = fixture.home_club_id === save.club_id
    const opponentId = isUserHome ? fixture.away_club_id : fixture.home_club_id
    const aiSquad = generateAISquad(opponentId ?? opponentName, opponentReputation)

    const result = simulateMatch({
      homeSquad:     isUserHome ? starters : aiSquad,
      awaySquad:     isUserHome ? aiSquad  : starters,
      homeFormation: isUserHome ? formation : '4-3-3',
      awayFormation: isUserHome ? '4-3-3'  : formation,
      homeTactic:    isUserHome ? tactic    : 'possession',
      awayTactic:    isUserHome ? 'possession' : tactic,
      homeRisk:      isUserHome ? risk      : 'balanced',
      isUserHome,
    })

    const squadUpdates = applyMatchEffects(
      players, starterIds, isUserHome,
      result.homeGoals, result.awayGoals, result.events
    )

    const matchId = await saveResult({
      result,
      squadUpdates,
      fixtureId: fixture.id,
      saveId: save.id,
      season: save.season_current ?? 1,
      competition: competition.type,
      round: fixture.round,
      homeClubId:   isUserHome ? save.club_id : (opponentId ?? ''),
      homeClubName: isUserHome ? save.club_name : opponentName,
      awayClubId:   isUserHome ? (opponentId ?? '') : save.club_id,
      awayClubName: isUserHome ? opponentName : save.club_name,
      isUserHome,
      formationUsed: formation,
      tacticUsed: tactic,
    })

    setSimulating(false)
    if (matchId) {
      navigate('/match/post', {
        state: { matchId, isUserHome, userClubName: save.club_name, opponentName, round: fixture.round, result },
      })
    }
  }, [allFilled, nextFixture, save, lineup, players, formation, tactic, risk, saveResult, navigate])

  const activeSlot      = selectedSlot ? slots.find(s => s.id === selectedSlot) : null
  const eligiblePlayers = activeSlot
    ? pitchPlayers.filter(p => {
        const sp = players.find(sq => sq.id === p.localId)
        return (activeSlot.accepts as Position[]).includes(p.position)
          && (sp?.injury_games_out ?? 0) === 0
          && (sp?.suspension_games_out ?? 0) === 0
      })
    : []

  if (compLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-accent font-semibold">Carregando campeonato...</p>
      </div>
    )
  }

  if (!nextFixture) {
    return (
      <div className="max-w-[390px] mx-auto px-4 pt-16 pb-24 text-center">
        <p className="text-4xl mb-4">🏆</p>
        <h2 className="text-lg font-bold mb-2">Campeonato encerrado!</h2>
        <p className="text-sm text-muted">Todos os jogos foram disputados esta temporada.</p>
        <BottomNav />
      </div>
    )
  }

  const { fixture, competition, opponentName, opponentReputation } = nextFixture
  const isUserHome   = fixture.home_club_id === save?.club_id
  const homeTeamName = isUserHome ? (save?.club_name ?? 'Meu Clube') : opponentName
  const awayTeamName = isUserHome ? opponentName : (save?.club_name ?? 'Meu Clube')

  const userAvgRating = players.length
    ? Math.round(players.reduce((s, p) => s + p.rating_overall, 0) / players.length)
    : 60
  const difficultyLabel =
    opponentReputation >= userAvgRating + 8 ? 'Perigoso' :
    opponentReputation <= userAvgRating - 8 ? 'Favorito' : 'Equilibrado'
  const difficultyColor =
    difficultyLabel === 'Perigoso' ? '#EF4444' :
    difficultyLabel === 'Favorito' ? '#22C55E' : '#EAB308'

  return (
    <div className="max-w-[390px] mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <header className="mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1">
          {competition.type === 'estadual' ? 'Campeonato Estadual' : competition.type} · Rodada {fixture.round}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold">Pré-Jogo</h1>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ background: `${difficultyColor}20`, color: difficultyColor }}
          >
            {difficultyLabel}
          </span>
        </div>
        <p className="text-sm text-muted mt-0.5">{homeTeamName} × {awayTeamName}</p>
      </header>

      {/* Formation pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FORMATIONS.map(f => (
          <button
            key={f}
            onClick={() => changeFormation(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border-[0.5px] transition-all"
            style={{ background: formation === f ? '#22C55E' : '#111111', color: formation === f ? '#0A0A0A' : '#FFFFFF', borderColor: formation === f ? '#22C55E' : '#1F1F1F' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Filled counter */}
      <div className="flex justify-between text-xs mb-2">
        <span className="text-muted">Titulares</span>
        <span className={allFilled ? 'text-accent font-semibold' : 'text-warn'}>{filled}/11</span>
      </div>

      {/* Pitch */}
      <div className="mb-4 rounded-[10px] overflow-hidden">
        <PitchField
          formation={formation}
          lineup={lineup}
          players={pitchPlayers}
          primaryColor={save?.club_primary_color ?? '#22C55E'}
          selectedSlot={selectedSlot}
          onSlotClick={handleSlotClick}
        />
      </div>

      {/* Player picker */}
      {selectedSlot && activeSlot && (
        <div className="bg-card border-[0.5px] border-accent/30 rounded-[10px] p-3 mb-4">
          <p className="text-xs text-muted mb-2">
            Escalando <span className="text-accent font-semibold">{activeSlot.label}</span>:
          </p>
          <div className="flex flex-col gap-1 max-h-44 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {eligiblePlayers.length === 0 && (
              <p className="text-xs text-faint">Nenhum jogador elegível disponível.</p>
            )}
            {eligiblePlayers.map(p => {
              const isAlreadyAssigned = assigned.includes(p.localId) && lineup[selectedSlot] !== p.localId
              return (
                <button
                  key={p.localId}
                  onClick={() => handleAssign(p)}
                  disabled={isAlreadyAssigned}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left disabled:opacity-40 transition-colors"
                  style={{ background: '#1A1A1A', border: '0.5px solid #2A2A2A' }}
                >
                  <PositionBadge position={p.position} />
                  <span className="flex-1 text-xs font-medium truncate">{p.name}</span>
                  <span className="text-[11px] text-faint">{p.age}a · {p.rating_overall}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Assigned list */}
      {filled > 0 && !selectedSlot && (
        <div className="flex flex-col gap-1 mb-4">
          {slots.filter(s => lineup[s.id]).map(slot => {
            const player = pitchPlayers.find(p => p.localId === lineup[slot.id])
            if (!player) return null
            return (
              <div key={slot.id} className="flex items-center gap-2 px-2.5 py-2 bg-card border-[0.5px] border-ui-border rounded-lg">
                <PositionBadge position={player.position} />
                <span className="flex-1 text-xs font-medium truncate">{player.name}</span>
                <span className="text-[11px] text-faint mr-2">{slot.label}</span>
                <button onClick={() => handleUnassign(slot.id)} className="text-faint hover:text-white text-base px-1">×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Tactic */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Tática</p>
        <div className="grid grid-cols-3 gap-2">
          {TACTICS.map(t => (
            <button
              key={t.id}
              onClick={() => setTactic(t.id)}
              className="py-3 px-2 rounded-[10px] border-[0.5px] text-center transition-all"
              style={{ background: tactic === t.id ? 'rgba(34,197,94,0.1)' : '#111111', borderColor: tactic === t.id ? '#22C55E' : '#1F1F1F' }}
            >
              <p className="text-xs font-semibold mb-0.5" style={{ color: tactic === t.id ? '#22C55E' : '#FFFFFF' }}>{t.label}</p>
              <p className="text-[10px] text-faint leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Risk */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Postura</p>
        <div className="flex gap-2">
          {RISKS.map(r => (
            <button
              key={r.id}
              onClick={() => setRisk(r.id)}
              className="flex-1 py-2 rounded-lg border-[0.5px] text-xs font-semibold transition-all"
              style={{ background: risk === r.id ? `${r.color}20` : 'transparent', borderColor: risk === r.id ? r.color : '#1F1F1F', color: risk === r.id ? r.color : '#A1A1AA' }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulate */}
      <button
        onClick={handleSimulate}
        disabled={!allFilled || simulating || saving}
        className="w-full py-4 rounded-lg text-sm font-bold bg-accent text-[#0A0A0A] disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        <Swords size={16} />
        {simulating || saving ? 'Simulando...' : 'Simular Jogo'}
      </button>

      <BottomNav />
    </div>
  )
}
