import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Role } from '../../types'

interface RegisterPageProps {
  onRoleChange: (role: Role) => void
}

export default function RegisterPage({ onRoleChange }: RegisterPageProps) {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    onRoleChange('delegate')
    window.setTimeout(() => navigate('/delegate/dashboard'), 900)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training registration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create a delegate account</h1>
        <p className="mt-3 text-sm text-slate-600">This mock form stores nothing and simply demonstrates the registration journey.</p>
      </div>
      <Card>
        {submitted ? (
          <div className="space-y-4 rounded-2xl bg-emerald-50 p-6 text-center">
            <p className="text-xl font-semibold text-slate-900">Account created</p>
            <p className="text-sm text-slate-600">Mock registration successful. Taking you to the delegate dashboard.</p>
            <Link to="/delegate/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">First name</label>
                <Input placeholder="Alice" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Last name</label>
                <Input placeholder="Marshall" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <Input type="email" placeholder="alice@example.com" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Phone</label>
                <Input type="tel" placeholder="07700 900123" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Practice / organisation name</label>
                <Input placeholder="Greenfield Surgery" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Practice manager name</label>
                <Input placeholder="Emma Harris" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Practice manager email</label>
                <Input type="email" placeholder="manager@example.com" required />
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
              <span>I accept the mock terms and conditions for delegate registration.</span>
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={!termsAccepted}>Register and continue</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
