import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { ClubCrest } from '../components/ClubCrest'
import { useSave } from '../hooks/useSave'
import { useSquad } from '../hooks/useSquad'
import { useGameStore } from '../store/useGameStore'

function formatBRL(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(v)
}

function moralEmoji(avg: number) {
  if (avg >= 80) return '😄'
  if (avg >= 60) return '😐'
  return '😟'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const store = useGameStore()
  const { save, loading: saveLoading } = useSave()
  const { players, loading: squadLoading } = useSquad(save?.id ?? null)

  if (saveLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-accent font-semibold">Carregando...</p>
      </div>
    )
  }

  // No save → redirect to create club
  if (!save) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6 text-center max-w-[390px] mx-auto">
        <ClubCrest name="AC" primaryColor="#22C55E" size={56} />
        <h2 className="text-xl font-bold">Nenhum clube encontrado</h2>
        <p className="text-sm text-muted">Cria seu clube pra começar a jornada!</p>
        <button
          onClick={() => navigate('/create-club')}
          className="bg-accent text-[#0A0A0A] font-semibold px-6 py-3 rounded-lg"
        >
          Criar clube agora
        </button>
      </div>
    )
  }

  const avgMorale = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + p.morale, 0) / players.length)
    : 0
  const available = players.filter((p) => p.fatigue < 80).length
  const season = save.season_current ?? 1
  const expiringPlayers = players.filter((p) => p.contract_end_season <= season + 1)

  const clubName = save.club_name ?? store.clubName ?? 'Meu Clube'
  const primaryColor = save.club_primary_color ?? store.clubPrimaryColor ?? '#22C55E'
  const crestTemplate = save.club_crest_template ?? store.clubCrestTemplate ?? 1

  return (
    <div className="max-w-[390px] md:max-w-4xl mx-auto px-4 pt-4 pb-24 md:pb-8">
      {/* Club header */}
      <header className="flex items-center gap-3 mb-6">
        <ClubCrest name={clubName} primaryColor={primaryColor} template={crestTemplate} size={48} />
        <div>
          <h1 className="text-[20px] font-bold leading-snug">{clubName}</h1>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
            Temporada {season}
          </span>
        </div>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        <StatCard
          icon="💰"
          value={`R$${formatBRL(save.budget_brl ?? 0)}`}
          label="Saldo"
          color="#22C55E"
        />
        <StatCard
          icon={moralEmoji(avgMorale)}
          value={squadLoading ? '–' : `${avgMorale}%`}
          label="Moral médio"
          color={avgMorale >= 70 ? '#22C55E' : avgMorale >= 40 ? '#EAB308' : '#EF4444'}
        />
        <StatCard
          icon="👕"
          value={squadLoading ? '–' : `${available}/22`}
          label="Disponíveis"
          color="#FFFFFF"
        />
      </section>

      {/* Next match */}
      <section className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4 mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-3">Próximo jogo</p>
        <div className="flex items-center justify-center gap-4 py-2 mb-2">
          <div className="flex flex-col items-center gap-2 flex-1">
            <ClubCrest name={clubName} primaryColor={primaryColor} template={crestTemplate} size={36} />
            <p className="text-xs font-semibold text-center leading-snug">{clubName}</p>
          </div>
          <span className="text-base font-bold text-faint tracking-widest">VS</span>
          <div className="flex flex-col items-center gap-2 flex-1">
            <svg width="36" height="39" viewBox="0 0 48 52" fill="none">
              <path d="M24 3L43 12V28C43 37 35 44 24 49C13 44 5 37 5 28V12L24 3Z" fill="#1F1F1F" stroke="#52525B" strokeWidth="1" />
              <text x="24" y="30" textAnchor="middle" dominantBaseline="middle" fill="#A1A1AA" fontFamily="Inter" fontSize="14" fontWeight="700">?</text>
            </svg>
            <p className="text-xs font-semibold text-muted text-center">A definir</p>
          </div>
        </div>
        <p className="text-xs text-muted text-center">Campeonato Estadual · Rodada 1 · Em breve</p>
      </section>

      {/* Last results */}
      <section className="mb-4">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wide mb-2">Últimos resultados</p>
        <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] p-4">
          <p className="text-sm text-muted text-center">Nenhum jogo ainda. Bora começar! ⚽</p>
        </div>
      </section>

      {/* Contract warnings */}
      {expiringPlayers.length > 0 && (
        <section className="bg-card border-[0.5px] border-warn/30 rounded-[10px] p-4 flex gap-3">
          <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted leading-relaxed">
              Contrato de{' '}
              <strong className="text-white">{expiringPlayers[0].name}</strong>
              {expiringPlayers.length > 1 && ` e mais ${expiringPlayers.length - 1}`}{' '}
              vence em breve. Renove antes que entre em pré-contrato!
            </p>
            <button className="text-accent text-xs font-semibold mt-2 flex items-center gap-1">
              Ver contratos →
            </button>
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="bg-card border-[0.5px] border-ui-border rounded-[10px] py-3.5 px-2 text-center">
      <p className="text-[22px] mb-1.5">{icon}</p>
      <p className="text-[18px] font-bold leading-none mb-1" style={{ color }}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}
