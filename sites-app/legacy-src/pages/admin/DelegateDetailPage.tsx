import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import Textarea from '../../components/ui/Textarea'
import useCatalog from '../../hooks/useCatalog'
import { formatDate } from '../../utils/formatters'

export default function DelegateDetailPage() {
  const { delegateId } = useParams()
  const { delegates, bookings, courses, sessions, isLoading, refresh } = useCatalog()
  const delegate = delegates.find((item) => item.id === delegateId)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', organisation: '', managerName: '', managerEmail: '', accountStatus: 'active', adminNotes: '', specialRequirements: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!delegate) return
    const [firstName, ...lastName] = delegate.name.split(' ')
    // Hydrate the controlled form whenever a refreshed database record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ firstName, lastName: lastName.join(' '), email: delegate.email, phone: delegate.phone ?? '', organisation: delegate.organisation, managerName: delegate.managerName, managerEmail: delegate.managerEmail, accountStatus: delegate.accountStatus ?? 'active', adminNotes: delegate.adminNotes ?? '', specialRequirements: delegate.specialRequirements ?? '' })
  }, [delegate])

  if (isLoading) return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Loading the live delegate...</p>
  if (!delegate) return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Delegate not found.</p>
  const delegateBookings = bookings.filter((booking) => booking.delegateId === delegate.id)
  const upcoming = delegateBookings.filter((booking) => booking.status !== 'cancelled' && sessions.find((session) => session.id === booking.sessionId)?.status === 'scheduled').length

  function field(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })) }
  async function handleSave(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try {
      const response = await fetch(`/api/delegates/${delegate.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The delegate could not be saved.')
      await refresh()
      setMessage('Delegate saved and read back from the live database.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The delegate could not be saved.') } finally { setSaving(false) }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Delegate detail</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{delegate.name}</h1><p className="mt-2 text-sm text-slate-600">{delegate.organisation} / registered {delegate.registrationDate ? formatDate(delegate.registrationDate) : 'Unknown'}</p></div><Link to="/admin/delegates"><Button variant="secondary">Back to delegates</Button></Link></div>
    {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div> : null}
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
    <div className="grid gap-4 md:grid-cols-3"><Card><p className="text-sm text-slate-500">Bookings</p><p className="mt-2 text-3xl font-semibold">{delegateBookings.length}</p></Card><Card><p className="text-sm text-slate-500">Upcoming</p><p className="mt-2 text-3xl font-semibold">{upcoming}</p></Card><Card><p className="text-sm text-slate-500">Status</p><p className="mt-3"><Badge label={delegate.accountStatus ?? 'active'} variant={delegate.accountStatus === 'active' ? 'success' : 'warning'} /></p></Card></div>
    <Card><form className="space-y-6" onSubmit={handleSave}>
      <div className="grid gap-5 md:grid-cols-3"><div><label className="text-sm font-semibold">First name</label><Input value={form.firstName} onChange={(e) => field('firstName', e.target.value)} required /></div><div><label className="text-sm font-semibold">Last name</label><Input value={form.lastName} onChange={(e) => field('lastName', e.target.value)} required /></div><div><label className="text-sm font-semibold">Status</label><Select value={form.accountStatus} onChange={(e) => field('accountStatus', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="anonymised">Anonymised</option></Select></div></div>
      <div className="grid gap-5 md:grid-cols-3"><div><label className="text-sm font-semibold">Email</label><Input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} required /></div><div><label className="text-sm font-semibold">Phone</label><Input value={form.phone} onChange={(e) => field('phone', e.target.value)} /></div><div><label className="text-sm font-semibold">Practice / organisation</label><Input value={form.organisation} onChange={(e) => field('organisation', e.target.value)} required /></div></div>
      <div className="grid gap-5 md:grid-cols-2"><div><label className="text-sm font-semibold">Practice manager</label><Input value={form.managerName} onChange={(e) => field('managerName', e.target.value)} required /></div><div><label className="text-sm font-semibold">Manager email</label><Input type="email" value={form.managerEmail} onChange={(e) => field('managerEmail', e.target.value)} required /></div></div>
      <div><label className="text-sm font-semibold">Admin notes</label><Textarea rows={3} value={form.adminNotes} onChange={(e) => field('adminNotes', e.target.value)} /></div>
      <div><label className="text-sm font-semibold">Standing special requirements</label><Textarea rows={3} value={form.specialRequirements} onChange={(e) => field('specialRequirements', e.target.value)} /></div>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save delegate'}</Button></div>
    </form></Card>
    <Table headers={['Reference', 'Course', 'Session', 'Status', 'Payment']}>{delegateBookings.map((booking) => {
      const course = courses.find((item) => item.id === booking.courseId); const session = sessions.find((item) => item.id === booking.sessionId)
      return <tr key={booking.id} className="border-t border-slate-200"><td className="px-4 py-4 text-sm"><Link className="font-semibold text-cyan-800" to={`/admin/bookings/${booking.id}`}>{booking.id}</Link></td><td className="px-4 py-4 text-sm">{course?.title}</td><td className="px-4 py-4 text-sm">{session ? formatDate(session.startDate) : '-'}</td><td className="px-4 py-4 text-sm"><Badge label={booking.status} /></td><td className="px-4 py-4 text-sm">{booking.paymentRequired ? 'Required' : 'Funded'}</td></tr>
    })}</Table>
  </div>
}
