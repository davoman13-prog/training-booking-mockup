import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { bookings, certificates, courses, delegates, invoices, locations, sessions } from '../../data/mockData'
import { formatCurrency, formatDate } from '../../utils/formatters'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function statusVariant(status?: string): BadgeVariant {
  if (status === 'confirmed' || status === 'completed' || status === 'available' || status === 'paid' || status === 'not_required') return 'success'
  if (status === 'cancelled' || status === 'overdue') return 'danger'
  return 'warning'
}

function attendanceLabel(marked: boolean) {
  return marked ? 'attended' : 'not marked'
}

export default function MyBookingsPage() {
  const delegate = delegates[0]
  const [search, setSearch] = useState('')
  const [bookingStatus, setBookingStatus] = useState('all')
  const [attendanceStatus, setAttendanceStatus] = useState('all')
  const [fundingType, setFundingType] = useState('all')
  const [invoiceStatus, setInvoiceStatus] = useState('all')
  const [certificateStatus, setCertificateStatus] = useState('all')
  const [trainingStage, setTrainingStage] = useState('all')
  const [sortBy, setSortBy] = useState('sessionDateAsc')

  const rows = useMemo(() => {
    return bookings
      .filter((booking) => booking.delegateId === delegate.id)
      .map((booking) => {
        const course = courses.find((item) => item.id === booking.courseId)
        const session = sessions.find((item) => item.id === booking.sessionId)
        const location = locations.find((item) => item.id === booking.locationId)
        const invoice = invoices.find((item) => item.id === booking.invoiceId)
        const certificate = certificates.find((item) => item.id === booking.certificateId)
        return { booking, course, session, location, invoice, certificate }
      })
  }, [delegate.id])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows
      .filter(({ booking, course, session, location, invoice, certificate }) => {
        const certificateText = certificate?.status ?? (booking.certificateId ? 'linked' : 'not issued')
        const invoiceText = invoice?.status ?? (booking.paymentRequired ? 'not generated' : 'not_required')
        const haystack = [
          booking.id,
          course?.title,
          session?.startDate,
          location?.name,
          booking.status,
          attendanceLabel(booking.attendanceMarked),
          invoiceText,
          certificateText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const isUpcoming = session ? new Date(session.startDate) >= new Date('2026-06-26') && booking.status !== 'cancelled' : false
        const isCompleted = booking.status === 'completed' || session?.status === 'completed'
        const isCancelled = booking.status === 'cancelled' || session?.status === 'cancelled'

        return (
          (!query || haystack.includes(query)) &&
          (bookingStatus === 'all' || booking.status === bookingStatus) &&
          (attendanceStatus === 'all' || (attendanceStatus === 'attended' ? booking.attendanceMarked : !booking.attendanceMarked)) &&
          (fundingType === 'all' || course?.fundingType === fundingType) &&
          (invoiceStatus === 'all' || invoiceText === invoiceStatus) &&
          (certificateStatus === 'all' || certificateText === certificateStatus) &&
          (trainingStage === 'all' ||
            (trainingStage === 'upcoming' && isUpcoming) ||
            (trainingStage === 'completed' && isCompleted) ||
            (trainingStage === 'cancelled' && isCancelled))
        )
      })
      .sort((a, b) => {
        if (sortBy === 'courseAsc') return (a.course?.title ?? '').localeCompare(b.course?.title ?? '')
        if (sortBy === 'courseDesc') return (b.course?.title ?? '').localeCompare(a.course?.title ?? '')
        if (sortBy === 'status') return a.booking.status.localeCompare(b.booking.status)
        if (sortBy === 'location') return (a.location?.name ?? '').localeCompare(b.location?.name ?? '')
        const aDate = a.session?.startDate ?? a.booking.bookingDate
        const bDate = b.session?.startDate ?? b.booking.bookingDate
        return sortBy === 'sessionDateDesc' ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate)
      })
  }, [attendanceStatus, bookingStatus, certificateStatus, fundingType, invoiceStatus, rows, search, sortBy, trainingStage])

  const activeFilters = [
    search ? `Search: ${search}` : '',
    bookingStatus !== 'all' ? `Booking: ${bookingStatus}` : '',
    attendanceStatus !== 'all' ? `Attendance: ${attendanceStatus}` : '',
    fundingType !== 'all' ? `Funding: ${fundingType}` : '',
    invoiceStatus !== 'all' ? `Invoice: ${invoiceStatus.replace('_', ' ')}` : '',
    certificateStatus !== 'all' ? `Certificate: ${certificateStatus}` : '',
    trainingStage !== 'all' ? `Stage: ${trainingStage}` : '',
  ].filter(Boolean)

  const clearFilters = () => {
    setSearch('')
    setBookingStatus('all')
    setAttendanceStatus('all')
    setFundingType('all')
    setInvoiceStatus('all')
    setCertificateStatus('all')
    setTrainingStage('all')
    setSortBy('sessionDateAsc')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">My bookings</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Upcoming and recent bookings</h1>
        <p className="mt-2 text-sm text-slate-600">Showing mock bookings for {delegate.name}.</p>
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <label className="text-sm font-semibold text-slate-700">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="Reference, course, location, status..."
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Booking status
            <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Attendance
            <select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All attendance</option>
              <option value="attended">Attended</option>
              <option value="not_marked">Not marked</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Funding
            <select value={fundingType} onChange={(event) => setFundingType(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">Funded and unfunded</option>
              <option value="funded">Funded</option>
              <option value="unfunded">Unfunded</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Invoice
            <select value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All invoices</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="not_required">Not required</option>
              <option value="not generated">Not generated</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Certificate
            <select value={certificateStatus} onChange={(event) => setCertificateStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All certificates</option>
              <option value="available">Available</option>
              <option value="issued">Issued</option>
              <option value="pending">Pending</option>
              <option value="not issued">Not issued</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Stage
            <select value={trainingStage} onChange={(event) => setTrainingStage(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All stages</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Sort
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="sessionDateAsc">Session date oldest</option>
              <option value="sessionDateDesc">Session date newest</option>
              <option value="courseAsc">Course A-Z</option>
              <option value="courseDesc">Course Z-A</option>
              <option value="status">Booking status</option>
              <option value="location">Location</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">{filteredRows.length} of {rows.length} bookings</p>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>
        </div>
        {activeFilters.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => <Badge key={filter} label={filter} variant="info" />)}
          </div>
        ) : null}
      </Card>

      {filteredRows.length ? (
        <Table headers={['Booking reference', 'Course', 'Session', 'Status', 'Invoice', 'Certificate']}>
          {filteredRows.map(({ booking, course, session, location, invoice, certificate }) => (
            <tr key={booking.id}>
              <td className="px-4 py-4 text-sm font-semibold">
                <Link to={`/delegate/bookings/${booking.id}`} className="text-cyan-800 hover:text-cyan-950">{booking.id}</Link>
              </td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/delegate/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title}</Link>
                <p className="mt-1 text-xs text-slate-500">{course?.fundingType} {course?.fundingType === 'unfunded' ? `/ ${formatCurrency(course.price ?? 0)}` : ''}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">
                <p>{session ? formatDate(session.startDate) : 'To be confirmed'}</p>
                <p className="mt-1 text-xs text-slate-500">{session?.startTime} - {session?.endTime} / {location?.name}</p>
              </td>
              <td className="px-4 py-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge label={booking.status} variant={statusVariant(booking.status)} />
                  <Badge label={attendanceLabel(booking.attendanceMarked)} variant={booking.attendanceMarked ? 'success' : 'warning'} />
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">{invoice ? invoice.status.replace('_', ' ') : booking.paymentRequired ? 'Not generated' : 'Not required'}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{certificate?.status ?? 'Not issued'}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-900">No bookings found</p>
          <p className="mt-1 text-sm text-slate-600">Try changing the search term or clearing the active filters.</p>
        </Card>
      )}
    </div>
  )
}
