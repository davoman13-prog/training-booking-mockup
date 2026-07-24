import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatCurrency } from '../../utils/formatters'
import { allDelegates, bookedCourseNames, delegateStats } from './delegateUtils'

const anyValue = 'any'

export default function DelegatesPage() {
  const [searchParams] = useSearchParams()
  const delegates = allDelegates()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
  const [accountStatus, setAccountStatus] = useState(searchParams.get('status') ?? anyValue)
  const [organisation, setOrganisation] = useState(searchParams.get('organisation') ?? anyValue)
  const [hasUpcoming, setHasUpcoming] = useState(searchParams.get('hasUpcoming') ?? anyValue)
  const [hasCompleted, setHasCompleted] = useState(searchParams.get('hasCompleted') ?? anyValue)
  const [hasInvoices, setHasInvoices] = useState(searchParams.get('hasInvoices') ?? anyValue)
  const [hasCertificates, setHasCertificates] = useState(searchParams.get('hasCertificates') ?? anyValue)
  const [hasCancelled, setHasCancelled] = useState(searchParams.get('hasCancelled') ?? anyValue)
  const [sortBy, setSortBy] = useState('name')

  const organisations = useMemo(() => Array.from(new Set(delegates.map((delegate) => delegate.organisation))).sort(), [delegates])

  const filteredDelegates = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return delegates
      .filter((delegate) => {
        const stats = delegateStats(delegate.id)
        const searchableText = [
          delegate.name,
          delegate.email,
          delegate.phone,
          delegate.organisation,
          delegate.managerName,
          delegate.managerEmail,
          bookedCourseNames(delegate.id),
        ].join(' ').toLowerCase()

        return (
          (!normalisedSearch || searchableText.includes(normalisedSearch)) &&
          (accountStatus === anyValue || delegate.accountStatus === accountStatus) &&
          (organisation === anyValue || delegate.organisation === organisation) &&
          (hasUpcoming === anyValue || (hasUpcoming === 'yes' ? stats.upcoming > 0 : stats.upcoming === 0)) &&
          (hasCompleted === anyValue || (hasCompleted === 'yes' ? stats.completed > 0 : stats.completed === 0)) &&
          (hasInvoices === anyValue || (hasInvoices === 'yes' ? stats.outstandingInvoiceCount > 0 : stats.outstandingInvoiceCount === 0)) &&
          (hasCertificates === anyValue || (hasCertificates === 'yes' ? stats.certificatesAvailable > 0 : stats.certificatesAvailable === 0)) &&
          (hasCancelled === anyValue || (hasCancelled === 'yes' ? stats.cancelled > 0 : stats.cancelled === 0))
        )
      })
      .sort((a, b) => {
        const statsA = delegateStats(a.id)
        const statsB = delegateStats(b.id)
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'organisation') return a.organisation.localeCompare(b.organisation)
        if (sortBy === 'booked') return statsB.booked - statsA.booked
        if (sortBy === 'upcoming') return statsB.upcoming - statsA.upcoming
        if (sortBy === 'completed') return statsB.completed - statsA.completed
        if (sortBy === 'invoice-value') return statsB.outstandingInvoiceValue - statsA.outstandingInvoiceValue
        if (sortBy === 'status') return (a.accountStatus ?? '').localeCompare(b.accountStatus ?? '')
        return 0
      })
  }, [accountStatus, delegates, hasCancelled, hasCertificates, hasCompleted, hasInvoices, hasUpcoming, organisation, searchTerm, sortBy])

  const activeFilterCount = [searchTerm.trim(), accountStatus !== anyValue, organisation !== anyValue, hasUpcoming !== anyValue, hasCompleted !== anyValue, hasInvoices !== anyValue, hasCertificates !== anyValue, hasCancelled !== anyValue].filter(Boolean).length

  function clearFilters() {
    setSearchTerm('')
    setAccountStatus(anyValue)
    setOrganisation(anyValue)
    setHasUpcoming(anyValue)
    setHasCompleted(anyValue)
    setHasInvoices(anyValue)
    setHasCertificates(anyValue)
    setHasCancelled(anyValue)
    setSortBy('name')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Delegates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage delegates</h1>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, email, phone, practice, manager, course..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <Select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="anonymised">Anonymised</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Practice</label>
            <Select value={organisation} onChange={(event) => setOrganisation(event.target.value)}>
              <option value={anyValue}>All practices</option>
              {organisations.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Outstanding invoices</label>
            <Select value={hasInvoices} onChange={(event) => setHasInvoices(event.target.value)}>
              <option value={anyValue}>Any invoice status</option>
              <option value="yes">Has outstanding</option>
              <option value="no">No outstanding</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name">Delegate name</option>
              <option value="organisation">Practice / organisation</option>
              <option value="booked">Courses booked</option>
              <option value="upcoming">Upcoming courses</option>
              <option value="completed">Completed courses</option>
              <option value="invoice-value">Outstanding invoice value</option>
              <option value="status">Account status</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <Select value={hasUpcoming} onChange={(event) => setHasUpcoming(event.target.value)}>
            <option value={anyValue}>Upcoming + none</option>
            <option value="yes">Has upcoming</option>
            <option value="no">No upcoming</option>
          </Select>
          <Select value={hasCompleted} onChange={(event) => setHasCompleted(event.target.value)}>
            <option value={anyValue}>Completed + none</option>
            <option value="yes">Has completed</option>
            <option value="no">No completed</option>
          </Select>
          <Select value={hasCertificates} onChange={(event) => setHasCertificates(event.target.value)}>
            <option value={anyValue}>Certificates + none</option>
            <option value="yes">Has certificates</option>
            <option value="no">No certificates</option>
          </Select>
          <Select value={hasCancelled} onChange={(event) => setHasCancelled(event.target.value)}>
            <option value={anyValue}>Cancelled + none</option>
            <option value="yes">Has cancelled</option>
            <option value="no">No cancelled</option>
          </Select>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredDelegates.length} result{filteredDelegates.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {accountStatus !== anyValue ? <Badge label={accountStatus} /> : null}
          {organisation !== anyValue ? <Badge label={organisation} /> : null}
        </div>
      </Card>

      {filteredDelegates.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No delegates found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another delegate or practice.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Delegate', 'Practice', 'Manager', 'Booked', 'Upcoming', 'Completed', 'Cancelled', 'Invoices', 'Certificates', 'Status']}>
          {filteredDelegates.map((delegate) => {
            const stats = delegateStats(delegate.id)
            return (
              <tr key={delegate.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm">
                  <Link to={`/admin/delegates/${delegate.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate.name}</Link>
                  <p className="mt-1 text-xs text-slate-500">{delegate.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{delegate.phone}</p>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{delegate.organisation}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{delegate.managerName}<p className="mt-1 text-xs text-slate-500">{delegate.managerEmail}</p></td>
                <td className="px-4 py-4 text-sm text-slate-700">{stats.booked}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{stats.upcoming}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{stats.completed}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{stats.cancelled}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{stats.outstandingInvoiceCount} / {formatCurrency(stats.outstandingInvoiceValue)}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{stats.certificatesAvailable}</td>
                <td className="px-4 py-4 text-sm"><Badge label={delegate.accountStatus ?? 'active'} variant={delegate.accountStatus === 'anonymised' ? 'warning' : delegate.accountStatus === 'inactive' ? 'default' : 'success'} /></td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
