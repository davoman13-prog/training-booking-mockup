import { Role } from '../../types'

interface RoleSwitcherProps {
  role: Role
  onRoleChange: (role: Role) => void
}

const roles: { label: string; value: Role }[] = [
  { label: 'Delegate view', value: 'delegate' },
  { label: 'Admin view', value: 'admin' },
]

export default function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 p-1.5 text-sm text-slate-700">
      {roles.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onRoleChange(option.value)}
          className={`rounded-lg px-4 py-2 transition ${
            role === option.value ? 'bg-cyan-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
