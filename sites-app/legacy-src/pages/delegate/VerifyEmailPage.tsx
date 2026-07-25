import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { MockUser } from '../../types'

export default function VerifyEmailPage({ onLogin }: { onLogin: (user: MockUser) => void }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('Enter the six-digit code sent to your email address.')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function verify(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setError('')
    try {
      const response = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
      const result = await response.json() as { user?: MockUser; message?: string }
      if (!response.ok || !result.user) throw new Error(result.message ?? 'The code could not be verified.')
      onLogin(result.user)
      navigate('/delegate/dashboard', { replace: true })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The code could not be verified.') } finally { setSubmitting(false) }
  }

  async function resend() {
    setSubmitting(true); setError('')
    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'A new code could not be sent.')
      setMessage(result.message ?? 'A new code has been sent.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'A new code could not be sent.') } finally { setSubmitting(false) }
  }

  return <div className="mx-auto max-w-xl space-y-6">
    <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Account security</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Confirm your email address</h1><p className="mt-2 text-sm text-slate-600">{message}</p></div>
    <Card><form className="space-y-5" onSubmit={verify}>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
      <div><label className="text-sm font-semibold">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <div><label className="text-sm font-semibold">Six-digit code</label><Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required /></div>
      <Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>{submitting ? 'Checking...' : 'Confirm email'}</Button>
    </form><div className="mt-5 flex items-center justify-between gap-3 text-sm"><Button type="button" variant="secondary" onClick={resend} disabled={submitting}>Send another code</Button><Link to="/login" className="font-semibold text-cyan-800">Back to sign in</Link></div></Card>
  </div>
}
