import { NavLink, Outlet } from 'react-router-dom'
import { House, Users, Trophy, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { useSave } from '../hooks/useSave'
import { ClubCrest } from './ClubCrest'

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Início',   Icon: House },
  { to: '/squad',       label: 'Elenco',   Icon: Users },
  { to: '/competition', label: 'Jogos',    Icon: Trophy },
  { to: '/transfers',   label: 'Mercado',  Icon: ArrowLeftRight },
  { to: '/finances',    label: 'Finanças', Icon: TrendingUp },
] as const

export function AppLayout() {
  const { save } = useSave()

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar — desktop only */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 z-40 border-r"
        style={{ background: '#0A0A0A', borderColor: '#1F1F1F' }}
      >
        {/* Club identity */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: '#1F1F1F' }}>
          <ClubCrest
            name={save?.club_name ?? 'AC'}
            primaryColor={save?.club_primary_color ?? '#22C55E'}
            template={save?.club_crest_template ?? 1}
            size={36}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-bold truncate leading-tight">{save?.club_name ?? 'Acesso'}</p>
            <p className="text-[10px] text-faint">Temporada {save?.season_current ?? 1}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors no-underline ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-faint hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-accent' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#1F1F1F' }}>
          <p className="text-[10px] text-faint">Acesso · Beta</p>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 md:ml-56 w-full">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
