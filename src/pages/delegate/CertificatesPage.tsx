import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { bookings, certificates, courses, delegates, locations, sessions } from '../../data/mockData'
import { formatDate } from '../../utils/formatters'

export default function CertificatesPage() {
  const [searchParams] = useSearchParams()
  const delegate = delegates[0]
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all')
  const [issueState, setIssueState] = useState(searchParams.get('issueState') ?? 'all')
  const [sortBy, setSortBy] = useState('issueDateDesc')

  const rows = useMemo(() => {
    return certificates
      .filter((certificate) => certificate.delegateId === delegate.id)
      .map((certificate) => {
        const booking = bookings.find((item) => item.id === certificate.bookingId)
        const course = courses.find((item) => item.id === certificate.courseId)
        const session = sessions.find((item) => item.id === booking?.sessionId)
        const location = locations.find((item) => item.id === booking?.locationId)
        return { certificate, booking, course, session, location }
      })
  }, [delegate.id])

  const categories = [...new Set(rows.map(({ course }) => course?.category).filter(Boolean))]

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows
      .filter(({ certificate, booking, course, session, location }) => {
        const haystack = [
          certificate.id,
          course?.title,
          certificate.issuedDate,
          session?.startDate,
          location?.name,
          certificate.status,
          booking?.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return (
          (!query || haystack.includes(query)) &&
          (status === 'all' || certificate.status === status || (status === 'downloadable' && ['available', 'issued'].includes(certificate.status))) &&
          (category === 'all' || course?.category === category) &&
          (issueState === 'all' ||
            (issueState === 'issued' && Boolean(certificate.issuedDate)) ||
            (issueState === 'pending' && !certificate.issuedDate))
        )
      })
      .sort((a, b) => {
        if (sortBy === 'courseAsc') return (a.course?.title ?? '').localeCompare(b.course?.title ?? '')
        if (sortBy === 'courseDesc') return (b.course?.title ?? '').localeCompare(a.course?.title ?? '')
        if (sortBy === 'status') return a.certificate.status.localeCompare(b.certificate.status)
        if (sortBy === 'sessionDate') return (a.session?.startDate ?? '').localeCompare(b.session?.startDate ?? '')
        const aDate = a.certificate.issuedDate ?? ''
        const bDate = b.certificate.issuedDate ?? ''
        return sortBy === 'issueDateAsc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate)
      })
  }, [category, issueState, rows, search, sortBy, status])

  const activeFilters = [
    search ? `Search: ${search}` : '',
    status !== 'all' ? `Status: ${status}` : '',
    category !== 'all' ? `Category: ${category}` : '',
    issueState !== 'all' ? `Issue: ${issueState}` : '',
  ].filter(Boolean)

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setCategory('all')
    setIssueState('all')
    setSortBy('issueDateDesc')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Certificates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Certificates and downloads</h1>
        <p className="mt-2 text-sm text-slate-600">Search and preview mock certificates for {delegate.name}.</p>
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <label className="text-sm font-semibold text-slate-700">
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" placeholder="Reference, course, date, location..." />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="issued">Issued</option>
              <option value="downloadable">Available / issued</option>
              <option value="pending">Pending</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Issue state
            <select value={issueState} onChange={(event) => setIssueState(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">Issued and pending</option>
              <option value="issued">Issued</option>
              <option value="pending">Pending issue</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Sort
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="issueDateDesc">Issue date newest</option>
              <option value="issueDateAsc">Issue date oldest</option>
              <option value="courseAsc">Course A-Z</option>
              <option value="courseDesc">Course Z-A</option>
              <option value="status">Certificate status</option>
              <option value="sessionDate">Session date</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">{filteredRows.length} of {rows.length} certificates</p>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>
        </div>
        {activeFilters.length ? <div className="mt-3 flex flex-wrap gap-2">{activeFilters.map((filter) => <Badge key={filter} label={filter} variant="info" />)}</div> : null}
      </Card>

      {filteredRows.length ? (
        <Table headers={['Certificate reference', 'Course', 'Session', 'Location', 'Status']}>
          {filteredRows.map(({ certificate, booking, course, session, location }) => (
            <tr key={certificate.id}>
              <td className="px-4 py-4 text-sm font-semibold">
                <Link to={`/delegate/certificates/${certificate.id}`} className="text-cyan-800 hover:text-cyan-950">{certificate.id}</Link>
                <p className="mt-1 text-xs text-slate-500">Booking {booking?.id}</p>
              </td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/delegate/bookings/${booking?.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title}</Link>
                <p className="mt-1 text-xs text-slate-500">{course?.category}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : 'To be confirmed'}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
              <td className="px-4 py-4 text-sm">
                <Badge label={certificate.status} variant={certificate.status === 'available' || certificate.status === 'issued' ? 'success' : 'warning'} />
                <p className="mt-2 text-xs text-slate-500">{certificate.issuedDate ? `Issued ${formatDate(certificate.issuedDate)}` : 'Issue pending'}</p>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-900">No certificates found</p>
          <p className="mt-1 text-sm text-slate-600">Try another search term or clear the filters.</p>
        </Card>
      )}
    </div>
  )
}
