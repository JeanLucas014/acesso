import { NavLink } from 'react-router-dom'
import { House, Users, Trophy, ArrowLeftRight, TrendingUp } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Início', Icon: House },
  { to: '/squad', label: 'Elenco', Icon: Users },
  { to: '/competition', label: 'Jogos', Icon: Trophy },
  { to: '/transfers', label: 'Mercado', Icon: ArrowLeftRight },
  { to: '/finances', label: 'Finanças', Icon: TrendingUp },
] as const

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0A0A0A] flex justify-around pb-5 pt-2 z-50"
      style={{ borderTop: '0.5px solid #1F1F1F' }}
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-[3px] text-[10px] font-medium no-underline transition-colors ${
              isActive ? 'text-accent' : 'text-faint'
            }`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
