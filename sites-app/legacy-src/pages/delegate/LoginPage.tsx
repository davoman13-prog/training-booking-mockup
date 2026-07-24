import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { MockUser } from '../../types'

interface LoginPageProps { onLogin: (user: MockUser) => void }

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json() as { user?: MockUser; message?: string }
      if (!response.ok || !result.user) throw new Error(result.message ?? 'Sign-in could not be completed.')
      onLogin(result.user)
      navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/delegate/dashboard')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in could not be completed.')
    } finally { setSubmitting(false) }
  }

  return <div className="mx-auto max-w-xl space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to the training portal</h1>
      <p className="mt-3 text-sm text-slate-600">Use your registered email address and Kalu password. A ChatGPT account is not required.</p>
    </div>
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
    <Card>
      <h2 className="text-xl font-semibold text-slate-950">Sign in</h2>
      <form className="mt-5 space-y-4" onSubmit={handleLogin}>
        <div><label className="text-sm font-semibold text-slate-900">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="username" required /></div>
        <div><label className="text-sm font-semibold text-slate-900">Password</label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div>
        <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <div className="mt-5 rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">New to Kalu Training? <Link to="/delegate/register" className="font-semibold text-cyan-800">Create an account</Link></div>
    </Card>
  </div>
}
