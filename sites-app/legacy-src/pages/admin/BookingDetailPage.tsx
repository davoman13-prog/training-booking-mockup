import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import useCatalog from '../../hooks/useCatalog'
import { BookingStatus } from '../../types'
import { formatDate } from '../../utils/formatters'

export default function BookingDetailPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { bookings, delegates, courses, sessions, locations, isLoading, refresh } = useCatalog()
  const booking = bookings.find((item) => item.id === bookingId)
  const [status, setStatus] = useState<BookingStatus>('confirmed')
  const [requirements, setRequirements] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (booking) {
      // Hydrate the controlled form whenever a refreshed database record arrives.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(booking.status)
      setRequirements(booking.specialRequirements ?? '')
    }
  }, [booking])

  if (isLoading) return <p className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700">Loading the live booking...</p>
  if (!booking) return <p className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700">Booking not found.</p>

  const course = courses.find((item) => item.id === booking.courseId)
  const delegate = delegates.find((item) => item.id === booking.delegateId)
  const session = sessions.find((item) => item.id === booking.sessionId)
  const location = locations.find((item) => item.id === booking.locationId)

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, specialRequirements: requirements }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The booking could not be updated.')
      await refresh()
      setMessage('Booking saved and session capacity refreshed from the live database.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The booking could not be updated.')
    } finally { setSaving(false) }
  }

  async function handleRemove() {
    setSaving(true); setError('')
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The booking could not be removed.')
      await refresh()
      navigate('/admin/bookings')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The booking could not be removed.')
      setSaving(false)
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Booking detail</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{booking.id}</h1></div><Link to="/admin/bookings"><Button variant="secondary">Back to bookings</Button></Link></div>
    {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div> : null}
    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}
    <div className="grid gap-4 lg:grid-cols-4">
      <Card><p className="text-sm text-slate-500">Delegate</p><p className="mt-2 font-semibold text-slate-950">{delegate?.name}</p><p className="mt-1 text-sm text-slate-600">{delegate?.organisation}</p></Card>
      <Card><p className="text-sm text-slate-500">Course</p><p className="mt-2 font-semibold text-slate-950">{course?.title}</p><p className="mt-1 text-sm text-slate-600">{course?.fundingType}</p></Card>
      <Card><p className="text-sm text-slate-500">Session</p><p className="mt-2 font-semibold text-slate-950">{session ? formatDate(session.startDate) : '-'}</p><p className="mt-1 text-sm text-slate-600">{location?.name}</p></Card>
      <Card><p className="text-sm text-slate-500">Payment</p><p className="mt-2"><Badge label={booking.paymentRequired ? 'Required' : 'Funded'} variant={booking.paymentRequired ? 'warning' : 'success'} /></p></Card>
    </div>
    <Card><form className="space-y-6" onSubmit={handleSave}>
      <div><label className="text-sm font-semibold text-slate-900">Booking status</label><Select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus)}><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Select><p className="mt-2 text-sm text-slate-600">Cancelling releases the session place. Restoring a cancelled booking uses a place and is blocked if the session is full or unavailable.</p></div>
      <div><label className="text-sm font-semibold text-slate-900">Special requirements</label><Textarea rows={4} value={requirements} onChange={(event) => setRequirements(event.target.value)} /></div>
      <div className="flex flex-wrap justify-between gap-3"><Button type="button" variant="ghost" onClick={() => setConfirmRemove(true)}>Remove booking</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save booking'}</Button></div>
    </form></Card>
    {confirmRemove ? <Card><h2 className="text-xl font-semibold text-rose-800">Remove booking?</h2><p className="mt-2 text-sm text-slate-600">The record will be removed and any occupied session place will be released.</p><div className="mt-4 flex gap-3"><Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)}>Keep booking</Button><Button type="button" onClick={handleRemove} disabled={saving}>Confirm removal</Button></div></Card> : null}
  </div>
}
