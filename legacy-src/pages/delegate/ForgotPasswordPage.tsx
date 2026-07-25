import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeRequested, setCodeRequested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function requestCode(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setError('')
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The reset code could not be sent.')
      setCodeRequested(true); setMessage(result.message ?? 'Check your email for the reset code.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The reset code could not be sent.') } finally { setSubmitting(false) }
  }

  async function reset(event: FormEvent) {
    event.preventDefault(); setError('')
    if (password !== confirmPassword) { setError('The password confirmation does not match.'); return }
    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, password }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The password could not be changed.')
      navigate('/login', { replace: true, state: { message: result.message } })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The password could not be changed.') } finally { setSubmitting(false) }
  }

  return <div className="mx-auto max-w-xl space-y-6">
    <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Account recovery</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Reset your password</h1><p className="mt-2 text-sm text-slate-600">This works for delegate and administrator accounts through the same secure process.</p></div>
    <Card>{error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}{message ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div> : null}
      {!codeRequested ? <form className="space-y-5" onSubmit={requestCode}><div><label className="text-sm font-semibold">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div><Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Sending...' : 'Send reset code'}</Button></form> :
      <form className="space-y-5" onSubmit={reset}><div><label className="text-sm font-semibold">Email address</label><Input type="email" value={email} readOnly /></div><div><label className="text-sm font-semibold">Six-digit code</label><Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required /></div><div><label className="text-sm font-semibold">New password</label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} autoComplete="new-password" required /></div><div><label className="text-sm font-semibold">Confirm new password</label><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} autoComplete="new-password" required /></div><Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>{submitting ? 'Changing password...' : 'Change password'}</Button></form>}
      <div className="mt-5 text-right"><Link to="/login" className="text-sm font-semibold text-cyan-800">Back to sign in</Link></div>
    </Card>
  </div>
}
