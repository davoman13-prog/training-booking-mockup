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

interface DelegateListRow {
  id: string
  name: string
  email: string
  phone?: string
  organisation: string
  managerName: string
  managerEmail: string
  accountStatus: 'active' | 'inactive' | 'anonymised'
  canLogin: number
  canBook: number
  bookingCount: number
  upcomingCount: number
  staffType: 'manager' | 'office' | 'clinical'
}

export default function DelegatesPage() {
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
  const { items: rows, pagination, isLoading, error } = usePaginatedList<DelegateListRow>('delegates', filters, page, pageSize)

  function clear() {
    setSearch(''); setDebouncedSearch(''); setStatus('any'); setPage(1)
  }

  return <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Delegates</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage delegates</h1>
      <p className={`mt-2 text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>{isLoading ? 'Loading the delegate register' : error || 'Connected to the live delegate register'}</p>
    </div>
    <Card>
      <div className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-end">
        <div><label className="text-sm font-semibold text-slate-900">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone or practice" /></div>
        <div><label className="text-sm font-semibold text-slate-900">Status</label><Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="any">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="anonymised">Anonymised</option></Select></div>
        <Button type="button" variant="secondary" onClick={clear}>Clear</Button>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{pagination.total.toLocaleString()} result{pagination.total === 1 ? '' : 's'}</p>
    </Card>
    <Table headers={['Delegate', 'Staff type', 'Practice', 'Manager', 'Bookings', 'Upcoming', 'Sign in', 'Booking', 'Status']}>
      {rows.map((delegate) => <tr key={delegate.id} className="border-t border-slate-200">
        <td className="px-4 py-4 text-sm"><Link to={`/admin/delegates/${delegate.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate.name}</Link><p className="mt-1 text-xs text-slate-500">{delegate.email}</p><p className="mt-1 text-xs text-slate-500">{delegate.phone}</p></td>
        <td className="px-4 py-4 text-sm text-slate-700">{delegate.staffType === 'office' ? 'Office staff' : delegate.staffType[0].toUpperCase() + delegate.staffType.slice(1)}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{delegate.organisation}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{delegate.managerName}<p className="mt-1 text-xs text-slate-500">{delegate.managerEmail}</p></td>
        <td className="px-4 py-4 text-sm text-slate-700">{Number(delegate.bookingCount)}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{Number(delegate.upcomingCount)}</td>
        <td className="px-4 py-4 text-sm"><Badge label={delegate.canLogin ? 'Allowed' : 'Blocked'} variant={delegate.canLogin ? 'success' : 'danger'} /></td>
        <td className="px-4 py-4 text-sm"><Badge label={delegate.canBook ? 'Allowed' : 'Blocked'} variant={delegate.canBook ? 'success' : 'danger'} /></td>
        <td className="px-4 py-4 text-sm"><Badge label={delegate.accountStatus} variant={delegate.accountStatus === 'active' ? 'success' : 'warning'} /></td>
      </tr>)}
    </Table>
    <Pagination pagination={pagination} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />
  </div>
}
