import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { MockUser } from '../../types'

interface RegisterPageProps {
  onLogin: (user: MockUser) => void
}

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [managerName, setManagerName] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, organisation, managerName, managerEmail, accountStatus: 'active' }),
      })
      const result = await response.json() as { delegate?: { id: string }; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The delegate account could not be created.')
    const mockUser: MockUser = {
      id: result.delegate!.id,
      name: `${firstName} ${lastName}`.trim() || 'New Delegate',
      email: email || 'new.delegate@kalu.test',
      role: 'delegate',
    }

    setSubmitted(true)
    onLogin(mockUser)
    window.setTimeout(() => navigate('/delegate/dashboard'), 700)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The delegate account could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training registration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create a delegate account</h1>
        <p className="mt-3 text-sm text-slate-600">Your delegate profile is stored in the live training register.</p>
      </div>
      <Card>
        {submitted ? (
          <div className="space-y-4 rounded-2xl bg-emerald-50 p-6 text-center">
            <p className="text-xl font-semibold text-slate-900">Account created</p>
            <p className="text-sm text-slate-600">Registration successful. Taking you to the delegate dashboard.</p>
            <Link to="/delegate/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">First name</label>
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Alice" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Last name</label>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Marshall" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="alice@example.com" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Phone</label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder="07700 900123" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Practice / organisation name</label>
                <Input value={organisation} onChange={(event) => setOrganisation(event.target.value)} placeholder="Greenfield Surgery" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Practice manager name</label>
                <Input value={managerName} onChange={(event) => setManagerName(event.target.value)} placeholder="Emma Harris" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Practice manager email</label>
                <Input value={managerEmail} onChange={(event) => setManagerEmail(event.target.value)} type="email" placeholder="manager@example.com" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Password</label>
                <Input type="password" placeholder="Create a password" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Confirm password</label>
                <Input type="password" placeholder="Confirm password" required />
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700"
                required
              />
              <span>I accept the terms and conditions for delegate registration.</span>
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={!termsAccepted || submitting}>{submitting ? 'Registering...' : 'Register and continue'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
