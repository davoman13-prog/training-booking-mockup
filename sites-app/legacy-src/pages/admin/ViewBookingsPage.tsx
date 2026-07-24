import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import useCatalog from '../../hooks/useCatalog'
import { formatDate } from '../../utils/formatters'

export default function ViewBookingsPage() {
  const { bookings, delegates, courses, sessions, locations, isLive, isLoading, loadError } = useCatalog()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('any')
  const rows = useMemo(() => bookings.filter((booking) => {
    const delegate = delegates.find((item) => item.id === booking.delegateId)
    const course = courses.find((item) => item.id === booking.courseId)
    const text = `${booking.id} ${delegate?.name ?? ''} ${delegate?.email ?? ''} ${course?.title ?? ''}`.toLowerCase()
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (status === 'any' || booking.status === status)
  }).sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)), [bookings, courses, delegates, search, status])

  return <div className="space-y-6">
    <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Bookings</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">View all bookings</h1><p className={`mt-2 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>{isLoading ? 'Loading live bookings' : isLive ? 'Connected to live bookings' : loadError}</p></div>
    <Card><div className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
      <div><label className="text-sm font-semibold text-slate-900">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, delegate or course" /></div>
      <div><label className="text-sm font-semibold text-slate-900">Status</label><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="any">All statuses</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Select></div>
      <Button type="button" variant="secondary" onClick={() => { setSearch(''); setStatus('any') }}>Clear</Button>
    </div><p className="mt-4 text-sm font-semibold text-slate-900">{rows.length} result{rows.length === 1 ? '' : 's'}</p></Card>
    <Table headers={['Reference', 'Delegate', 'Organisation', 'Course', 'Session', 'Location', 'Status', 'Payment']}>
      {rows.map((booking) => {
        const delegate = delegates.find((item) => item.id === booking.delegateId)
        const course = courses.find((item) => item.id === booking.courseId)
        const session = sessions.find((item) => item.id === booking.sessionId)
        const location = locations.find((item) => item.id === booking.locationId)
        return <tr key={booking.id} className="border-t border-slate-200">
          <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{booking.id}</Link></td>
          <td className="px-4 py-4 text-sm text-slate-700">{delegate?.name}<p className="mt-1 text-xs text-slate-500">{delegate?.email}</p></td>
          <td className="px-4 py-4 text-sm text-slate-700">{delegate?.organisation}</td>
          <td className="px-4 py-4 text-sm text-slate-700">{course?.title}</td>
          <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : '-'}</td>
          <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
          <td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'} /></td>
          <td className="px-4 py-4 text-sm"><Badge label={booking.paymentRequired ? 'Payment required' : 'Funded'} variant={booking.paymentRequired ? 'warning' : 'success'} /></td>
        </tr>
      })}
    </Table>
  </div>
}
