import { NavigationItem, Role } from '../../types'
import { NavLink } from 'react-router-dom'

interface SidebarProps {
  role: Role
  navItems: NavigationItem[]
}

export default function Sidebar({ role, navItems }: SidebarProps) {
  return (
    <aside className="mb-6 w-full max-w-xs shrink-0 rounded-2xl border border-cyan-900/10 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-800">{role === 'admin' ? 'Admin Menu' : 'Delegate Menu'}</h2>
      <div className="mt-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium ${
                isActive ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
