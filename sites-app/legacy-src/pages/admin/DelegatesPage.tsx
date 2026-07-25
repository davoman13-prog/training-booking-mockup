import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import useCatalog from '../../hooks/useCatalog'

export default function DelegatesPage() {
  const { delegates, bookings, sessions, isLive, isLoading, loadError } = useCatalog()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('any')
  const rows = useMemo(() => delegates.filter((delegate) => {
    const text = `${delegate.name} ${delegate.email} ${delegate.phone ?? ''} ${delegate.organisation} ${delegate.managerName}`.toLowerCase()
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (status === 'any' || delegate.accountStatus === status)
  }), [delegates, search, status])

  return <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Delegates</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage delegates</h1>
      <p className={`mt-2 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>{isLoading ? 'Loading the live delegate register' : isLive ? 'Connected to the live delegate register' : loadError}</p>
    </div>
    <Card>
      <div className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
        <div><label className="text-sm font-semibold text-slate-900">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone or practice" /></div>
        <div><label className="text-sm font-semibold text-slate-900">Status</label><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="any">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="anonymised">Anonymised</option></Select></div>
        <Button type="button" variant="secondary" onClick={() => { setSearch(''); setStatus('any') }}>Clear</Button>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{rows.length} result{rows.length === 1 ? '' : 's'}</p>
    </Card>
    <Table headers={['Delegate', 'Practice', 'Manager', 'Bookings', 'Upcoming', 'Sign in', 'Booking', 'Status']}>
      {rows.map((delegate) => {
        const delegateBookings = bookings.filter((booking) => booking.delegateId === delegate.id)
        const upcoming = delegateBookings.filter((booking) => booking.status !== 'cancelled' && sessions.find((session) => session.id === booking.sessionId)?.status === 'scheduled').length
        return <tr key={delegate.id} className="border-t border-slate-200">
          <td className="px-4 py-4 text-sm"><Link to={`/admin/delegates/${delegate.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate.name}</Link><p className="mt-1 text-xs text-slate-500">{delegate.email}</p><p className="mt-1 text-xs text-slate-500">{delegate.phone}</p></td>
          <td className="px-4 py-4 text-sm text-slate-700">{delegate.organisation}</td>
          <td className="px-4 py-4 text-sm text-slate-700">{delegate.managerName}<p className="mt-1 text-xs text-slate-500">{delegate.managerEmail}</p></td>
          <td className="px-4 py-4 text-sm text-slate-700">{delegateBookings.length}</td>
          <td className="px-4 py-4 text-sm text-slate-700">{upcoming}</td>
          <td className="px-4 py-4 text-sm"><Badge label={delegate.canLogin !== false ? 'Allowed' : 'Blocked'} variant={delegate.canLogin !== false ? 'success' : 'danger'} /></td>
          <td className="px-4 py-4 text-sm"><Badge label={delegate.canBook !== false ? 'Allowed' : 'Blocked'} variant={delegate.canBook !== false ? 'success' : 'danger'} /></td>
          <td className="px-4 py-4 text-sm"><Badge label={delegate.accountStatus ?? 'active'} variant={delegate.accountStatus === 'active' ? 'success' : 'warning'} /></td>
        </tr>
      })}
    </Table>
  </div>
}
