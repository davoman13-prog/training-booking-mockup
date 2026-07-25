import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import usePaginatedList from '../../hooks/usePaginatedList'
import { formatDate } from '../../utils/formatters'

interface BookingListRow {
  id: string
  bookingDate: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  paymentRequired: number
  delegateName: string
  delegateEmail: string
  organisation: string
  courseTitle: string
  sessionDate: string
  locationName: string
}

export default function ViewBookingsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('any')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])
  const filters = useMemo(() => ({ search: debouncedSearch, status }), [debouncedSearch, status])
  const { items: rows, pagination, isLoading, error } = usePaginatedList<BookingListRow>('bookings', filters, page, pageSize)

  function clear() {
    setSearch(''); setDebouncedSearch(''); setStatus('any'); setPage(1)
  }

  return <div className="space-y-6">
    <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Bookings</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">View all bookings</h1><p className={`mt-2 text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>{isLoading ? 'Loading live bookings' : error || 'Connected to live bookings'}</p></div>
    <Card><div className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
      <div><label className="text-sm font-semibold text-slate-900">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, delegate or course" /></div>
      <div><label className="text-sm font-semibold text-slate-900">Status</label><Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="any">All statuses</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Select></div>
      <Button type="button" variant="secondary" onClick={clear}>Clear</Button>
    </div><p className="mt-4 text-sm font-semibold text-slate-900">{pagination.total.toLocaleString()} result{pagination.total === 1 ? '' : 's'}</p></Card>
    <Table headers={['Reference', 'Delegate', 'Organisation', 'Course', 'Session', 'Location', 'Status', 'Payment']}>
      {rows.map((booking) => <tr key={booking.id} className="border-t border-slate-200">
        <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{booking.id}</Link></td>
        <td className="px-4 py-4 text-sm text-slate-700">{booking.delegateName}<p className="mt-1 text-xs text-slate-500">{booking.delegateEmail}</p></td>
        <td className="px-4 py-4 text-sm text-slate-700">{booking.organisation}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{booking.courseTitle}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{formatDate(booking.sessionDate)}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{booking.locationName}</td>
        <td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'} /></td>
        <td className="px-4 py-4 text-sm"><Badge label={booking.paymentRequired ? 'Payment required' : 'Funded'} variant={booking.paymentRequired ? 'warning' : 'success'} /></td>
      </tr>)}
    </Table>
    <Pagination pagination={pagination} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />
  </div>
}
