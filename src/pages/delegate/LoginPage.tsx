import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { mockUsers } from '../../data/mockAuth'
import { MockUser } from '../../types'

interface LoginPageProps {
  onLogin: (user: MockUser) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('delegate@kalu.test')
  const [password, setPassword] = useState('Password123')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const matchedUser = mockUsers.find((user) => user.email === email.trim().toLowerCase() && user.password === password)

    if (!matchedUser) {
      setError('Those demo credentials do not match a mock user.')
      return
    }

    const { password: _password, ...mockUser } = matchedUser
    onLogin(mockUser)
    navigate(mockUser.role === 'admin' ? '/admin/dashboard' : '/delegate/dashboard')
  }

  function fillDemo(userEmail: string) {
    setEmail(userEmail)
    setPassword('Password123')
    setError('')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to the training portal</h1>
        <p className="mt-3 text-sm text-slate-600">
          Use a demo account to enter the mock delegate or admin area. No real authentication is performed.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
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
            {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
            <Button type="submit" className="w-full">
              Login
            </Button>
            <div className="rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">
              New delegate?{' '}
              <Link to="/delegate/register" className="font-semibold text-cyan-800 hover:text-cyan-950">
                Register as a new delegate
              </Link>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Demo credentials</h2>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => fillDemo('delegate@kalu.test')}
              className="w-full rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-left text-sm hover:bg-cyan-100"
            >
              <span className="block font-semibold text-cyan-900">Delegate demo login</span>
              <span className="mt-1 block text-slate-700">delegate@kalu.test / Password123</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@kalu.test')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm hover:bg-slate-100"
            >
              <span className="block font-semibold text-slate-950">Admin demo login</span>
              <span className="mt-1 block text-slate-700">admin@kalu.test / Password123</span>
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">Demo buttons fill the form only. Click Login to continue.</p>
        </Card>
      </div>
    </div>
  )
}
