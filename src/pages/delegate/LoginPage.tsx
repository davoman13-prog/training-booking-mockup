import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Role } from '../../types'

interface LoginPageProps {
  onRoleChange: (role: Role) => void
}

export default function LoginPage({ onRoleChange }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('delegate@example.com')
  const [password, setPassword] = useState('password')

  function handleLogin(role: Role) {
    onRoleChange(role)
    navigate(role === 'admin' ? '/admin/dashboard' : '/delegate/dashboard')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to the training portal</h1>
        <p className="mt-3 text-sm text-slate-600">
          Choose a mock role to explore either the delegate journey or admin tools. No real authentication is performed.
        </p>
      </div>
      <Card>
        <form className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={() => handleLogin('delegate')} className="w-full">
              Login as Delegate
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleLogin('admin')} className="w-full">
              Login as Admin
            </Button>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">
            New delegate?{' '}
            <Link to="/delegate/register" className="font-semibold text-cyan-800 hover:text-cyan-950">
              Register as a new delegate
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
