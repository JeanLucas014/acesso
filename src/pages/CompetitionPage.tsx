import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { useCompetition } from '../hooks/useCompetition'
import { useSave } from '../hooks/useSave'
import type { Fixture } from '../types'

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const isUserGame = fixture.is_user_game
  const homeWon    = fixture.is_played && fixture.home_goals! > fixture.away_goals!
  const awayWon    = fixture.is_played && fixture.away_goals! > fixture.home_goals!

  return (
    <div
      className="flex items-center gap-2 py-2.5 px-3 rounded-lg border-[0.5px]"
      style={{ borderColor: isUserGame ? '#22C55E40' : '#1F1F1F', background: isUserGame ? 'rgba(34,197,94,0.04)' : '#111111' }}
    >
      <span
        className="flex-1 text-xs font-medium text-right truncate"
        style={{ color: homeWon ? '#FFFFFF' : awayWon ? '#A1A1AA' : '#FFFFFF' }}
      >
        {fixture.home_club_name}
      </span>
      <div className="flex-shrink-0 text-center min-w-[48px]">
        {fixture.is_played ? (
          <span className="text-sm font-bold text-white">{fixture.home_goals} × {fixture.away_goals}</span>
        ) : (
          <span className="text-xs font-semibold text-faint">vs</span>
        )}
      </div>
      <span
        className="flex-1 text-xs font-medium truncate"
        style={{ color: awayWon ? '#FFFFFF' : homeWon ? '#A1A1AA' : '#FFFFFF' }}
      >
        {fixture.away_club_name}
      </span>
    </div>
  )
}

export function CompetitionPage() {
  const navigate = useNavigate()
  const { save } = useSave()
  const {
    competition,
    standings,
    nextFixture,
    currentRound,
    roundFixtures,
    loading,
    error,
  } = useCompetition()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-accent font-semibold">Criando campeonato...</p>
      </div>
    )
  }

  if (error || !competition) {
    return (
      <div className="flex items-center justify-center min-h-dvh px-6 text-center">
        <div>
          <p className="text-sm text-muted mb-2">Erro ao carregar campeonato.</p>
          <p className="text-xs text-faint">{error}</p>
        </div>
      </div>
    )
  }

  const userClubId   = save?.club_id
  const totalRounds  = 14
  const progressPct  = Math.round(((currentRound - 1) / totalRounds) * 100)
  const userPosition = standings.findIndex(s => s.club_id === userClubId) + 1

  return (
    <div className="max-w-[390px] md:max-w-4xl mx-auto px-4 pt-4 pb-24 md:pb-8">
      {/* Header */}
      <header className="mb-5">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-1">
          Temporada {competition.season}
        </p>
        <h1 className="text-[22px] font-bold">Campeonato Estadual</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1.5 bg-ui-border rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-muted flex-shrink-0">Rodada {currentRound}/14</span>
        </div>
      </header>

      {/* User position highlight */}
      {userPosition > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-4 border-[0.5px]"
          style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }}
        >
          <span className="text-[28px] font-black text-accent leading-none">{userPosition}º</span>
          <div>
            <p className="text-sm font-semibold">{save?.club_name}</p>
            <p className="text-xs text-muted">
              {standings[userPosition - 1]?.points ?? 0} pts ·{' '}
              {standings[userPosition - 1]?.played ?? 0} jogos
            </p>
          </div>
        </div>
      )}

      {/* Next match CTA */}
      {nextFixture && (
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4 mb-5">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">
            Próximo jogo · Rodada {nextFixture.fixture.round}
          </p>
          <p className="text-sm font-semibold mb-3 text-white">
            {nextFixture.fixture.home_club_id === userClubId
              ? `${save?.club_name} × ${nextFixture.opponentName}`
              : `${nextFixture.opponentName} × ${save?.club_name}`}
          </p>
          <button
            onClick={() => navigate('/match/pre')}
            className="w-full py-2.5 rounded-lg text-sm font-bold bg-accent text-[#0A0A0A]"
          >
            Escalar e Jogar
          </button>
        </div>
      )}

      {/* Standings table */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Classificação</p>
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center px-3 py-2 border-b border-ui-border">
            <span className="w-6 text-[10px] text-faint text-center">#</span>
            <span className="flex-1 text-[10px] text-faint ml-2">Clube</span>
            <span className="w-7 text-[10px] text-faint text-center">J</span>
            <span className="w-7 text-[10px] text-faint text-center">V</span>
            <span className="w-7 text-[10px] text-faint text-center">E</span>
            <span className="w-7 text-[10px] text-faint text-center">D</span>
            <span className="w-8 text-[10px] text-faint text-center">SG</span>
            <span className="w-8 text-[10px] font-bold text-faint text-center">Pts</span>
          </div>
          {standings.length === 0 ? (
            <p className="text-xs text-faint text-center py-6">Nenhum resultado ainda. Bora jogar!</p>
          ) : (
            standings.map((s, idx) => {
              const isUser = s.club_id === userClubId
              return (
                <div
                  key={s.club_id}
                  className="flex items-center px-3 py-2.5 border-b border-ui-border last:border-0"
                  style={{ background: isUser ? 'rgba(34,197,94,0.05)' : 'transparent' }}
                >
                  <span
                    className="w-6 text-xs font-bold text-center"
                    style={{ color: idx < 3 ? '#22C55E' : '#52525B' }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="flex-1 text-xs font-medium ml-2 truncate"
                    style={{ color: isUser ? '#22C55E' : '#FFFFFF' }}
                  >
                    {s.club_name}
                  </span>
                  <span className="w-7 text-xs text-faint text-center">{s.played}</span>
                  <span className="w-7 text-xs text-faint text-center">{s.won}</span>
                  <span className="w-7 text-xs text-faint text-center">{s.drawn}</span>
                  <span className="w-7 text-xs text-faint text-center">{s.lost}</span>
                  <span className="w-8 text-xs text-faint text-center">
                    {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
                  </span>
                  <span className="w-8 text-xs font-bold text-center" style={{ color: isUser ? '#22C55E' : '#FFFFFF' }}>
                    {s.points}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Current round fixtures */}
      <div>
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">
          Rodada {currentRound}
        </p>
        <div className="flex flex-col gap-1.5">
          {roundFixtures.length === 0 ? (
            <p className="text-xs text-faint text-center py-4">Nenhum jogo nesta rodada.</p>
          ) : (
            roundFixtures.map(fix => (
              <FixtureRow key={fix.id} fixture={fix} />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

