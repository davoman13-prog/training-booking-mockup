import { Link } from 'react-router-dom'
import { NavigationItem, Role } from '../../types'
import RoleSwitcher from './RoleSwitcher'

interface HeaderProps {
  role: Role
  onRoleChange: (role: Role) => void
  navItems: NavigationItem[]
}

export default function Header({ role, onRoleChange, navItems }: HeaderProps) {
  return (
    <header className="border-b border-cyan-900/10 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-base font-bold text-white shadow-sm">
            KT
          </Link>
          <div>
            <Link to="/" className="text-xl font-semibold tracking-tight text-slate-950">
              Kalu Training
            </Link>
            <p className="mt-1 text-sm text-slate-500">Static delegate and admin prototype.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <RoleSwitcher role={role} onRoleChange={onRoleChange} />
          <nav className="hidden gap-3 md:flex">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
