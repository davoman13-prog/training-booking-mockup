import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { mockUsers } from '../../data/mockAuth'
import { MockUser } from '../../types'

interface LoginPageProps { onLogin: (user: MockUser) => void }

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [secureEmail, setSecureEmail] = useState('')
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminEmail, setAdminEmail] = useState('admin@kalu.test')
  const [adminPassword, setAdminPassword] = useState('Password123')

  async function loadSession() {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' })
      const result = await response.json() as { email?: string; registered?: boolean; user?: MockUser; message?: string }
      if (!response.ok && response.status !== 401) throw new Error(result.message ?? 'Your secure session could not be checked.')
      setSecureEmail(result.email ?? '')
      setRegistered(Boolean(result.registered))
      if (result.registered && result.user) {
        onLogin(result.user)
        navigate('/delegate/dashboard')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your secure session could not be checked.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    // The initial request resolves the identity established by the hosting layer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession()
  // The session is intentionally checked once when the sign-in screen opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const matched = mockUsers.find((user) => user.role === 'admin' && user.email === adminEmail.trim().toLowerCase() && user.password === adminPassword)
    if (!matched) { setError('The administration credentials are incorrect.'); return }
    const admin: MockUser = { id: matched.id, name: matched.name, email: matched.email, role: matched.role }
    onLogin(admin)
    navigate('/admin/dashboard')
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Kalu Training</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in to the training portal</h1>
      <p className="mt-3 text-sm text-slate-600">Delegate access uses your verified ChatGPT sign-in. Kalu never receives or stores your ChatGPT password.</p>
    </div>
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Delegate access</h2>
        <p className="mt-2 text-sm text-slate-600">{loading ? 'Checking your secure sign-in…' : secureEmail ? `Signed in securely as ${secureEmail}.` : 'Secure sign-in is required before entering Kalu.'}</p>
        {!loading && !registered ? <div className="mt-5 rounded-2xl bg-cyan-50 p-4 text-sm text-slate-700">No Kalu delegate profile is linked to this email yet.</div> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          {!registered ? <Link to="/delegate/register"><Button>Create delegate profile</Button></Link> : <Button type="button" onClick={() => void loadSession()}>Continue to Kalu</Button>}
          <a href="/signout-with-chatgpt?return_to=/" className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Use another account</a>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Administration</h2>
        <p className="mt-2 text-sm text-slate-600">Temporary administration access while the production admin identity policy is completed.</p>
        <form className="mt-5 space-y-4" onSubmit={handleAdminLogin}>
          <div><label className="text-sm font-semibold text-slate-900">Admin email</label><Input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required /></div>
          <div><label className="text-sm font-semibold text-slate-900">Admin password</label><Input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required /></div>
          <Button type="submit" className="w-full">Admin login</Button>
        </form>
      </Card>
    </div>
  </div>
}
