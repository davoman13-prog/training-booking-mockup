import { FormEvent, useEffect, useState } from 'react'
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
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminFirstName, setAdminFirstName] = useState('')
  const [adminLastName, setAdminLastName] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)

  useEffect(() => {
    void fetch('/api/auth/admin/status', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as { setupRequired?: boolean }
        if (!response.ok || typeof result.setupRequired !== 'boolean') throw new Error()
        setSetupRequired(result.setupRequired)
      })
      .catch(() => setError('Administrator login is temporarily unavailable.'))
  }, [])

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

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('')
    try {
      if (setupRequired && adminPassword !== adminConfirmPassword) throw new Error('The administrator passwords do not match.')
      const endpoint = setupRequired ? '/api/auth/admin/setup' : '/api/auth/admin/login'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: adminFirstName, lastName: adminLastName, email: adminEmail, password: adminPassword }),
      })
      const result = await response.json() as { user?: MockUser; message?: string }
      if (!response.ok || !result.user) throw new Error(result.message ?? 'Administrator access could not be completed.')
      onLogin(result.user)
      navigate('/admin/dashboard')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Administrator access could not be completed.')
    } finally { setSubmitting(false) }
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to the training portal</h1>
      <p className="mt-3 text-sm text-slate-600">Sign in with your registered email address and Kalu password. A ChatGPT account is not required.</p>
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
        <h2 className="text-xl font-semibold text-slate-950">{setupRequired ? 'Create first administrator' : 'Administration'}</h2>
        <p className="mt-2 text-sm text-slate-600">{setupRequired ? 'This one-time setup closes permanently after the first administrator is created.' : 'Sign in with your Kalu administrator account.'}</p>
        {setupRequired === null ? <p className="mt-5 text-sm font-semibold text-slate-600">Checking administrator setup…</p> :
          <form className="mt-5 space-y-4" onSubmit={handleAdminLogin}>
            {setupRequired ? <>
              <div><label className="text-sm font-semibold text-slate-900">First name</label><Input value={adminFirstName} onChange={(event) => setAdminFirstName(event.target.value)} autoComplete="given-name" required /></div>
              <div><label className="text-sm font-semibold text-slate-900">Last name</label><Input value={adminLastName} onChange={(event) => setAdminLastName(event.target.value)} autoComplete="family-name" required /></div>
            </> : null}
            <div><label className="text-sm font-semibold text-slate-900">Admin email</label><Input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} autoComplete="username" required /></div>
            <div><label className="text-sm font-semibold text-slate-900">Admin password</label><Input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} autoComplete={setupRequired ? 'new-password' : 'current-password'} minLength={12} required /></div>
            {setupRequired ? <div><label className="text-sm font-semibold text-slate-900">Confirm password</label><Input type="password" value={adminConfirmPassword} onChange={(event) => setAdminConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} required /></div> : null}
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Please wait…' : setupRequired ? 'Create administrator' : 'Admin login'}</Button>
          </form>}
      </Card>
    </div>
  </div>
}
