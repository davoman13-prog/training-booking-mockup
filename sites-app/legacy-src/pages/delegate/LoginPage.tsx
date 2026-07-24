import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { mockUsers } from '../../data/mockAuth'
import { MockUser } from '../../types'

interface LoginPageProps { onLogin: (user: MockUser) => void }

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [adminEmail, setAdminEmail] = useState('admin@kalu.test')
  const [adminPassword, setAdminPassword] = useState('Password123')

  async function handleDelegateLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const result = await response.json() as { user?: MockUser; message?: string }
      if (!response.ok || !result.user) throw new Error(result.message ?? 'Login could not be completed.')
      onLogin(result.user)
      navigate('/delegate/dashboard')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login could not be completed.')
    } finally { setSubmitting(false) }
  }

  function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const matched = mockUsers.find((user) => user.role === 'admin' && user.email === adminEmail.trim().toLowerCase() && user.password === adminPassword)
    if (!matched) { setError('The administration credentials are incorrect.'); return }
    onLogin({ id: matched.id, name: matched.name, email: matched.email, role: matched.role })
    navigate('/admin/dashboard')
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to the training portal</h1>
      <p className="mt-3 text-sm text-slate-600">Delegates sign in with their registered email address and Kalu password. A ChatGPT account is not required.</p>
    </div>
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Delegate login</h2>
        <form className="mt-5 space-y-4" onSubmit={handleDelegateLogin}>
          <div><label className="text-sm font-semibold text-slate-900">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
          <div><label className="text-sm font-semibold text-slate-900">Password</label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
        </form>
        <div className="mt-5 rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">New delegate? <Link to="/delegate/register" className="font-semibold text-cyan-800">Create an account</Link></div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Administration</h2>
        <p className="mt-2 text-sm text-slate-600">Temporary administration access while production administrator accounts are completed.</p>
        <form className="mt-5 space-y-4" onSubmit={handleAdminLogin}>
          <div><label className="text-sm font-semibold text-slate-900">Admin email</label><Input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required /></div>
          <div><label className="text-sm font-semibold text-slate-900">Admin password</label><Input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required /></div>
          <Button type="submit" className="w-full">Admin login</Button>
        </form>
      </Card>
    </div>
  </div>
}
