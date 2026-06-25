import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookings, certificates, courses, delegates, invoices, locations, sessions } from '../../data/mockData'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { formatDate } from '../../utils/formatters'

const anyValue = 'any'

function bookingVariant(status: string) {
  if (status === 'confirmed' || status === 'completed') return 'success'
  if (status === 'cancelled') return 'danger'
  return 'warning'
}

function invoiceVariant(status: string) {
  if (status === 'paid' || status === 'not_required') return 'success'
  if (status === 'overdue') return 'danger'
  return 'warning'
}

export default function ViewBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [bookingStatus, setBookingStatus] = useState(anyValue)
  const [courseId, setCourseId] = useState(anyValue)
  const [locationId, setLocationId] = useState(anyValue)
  const [funding, setFunding] = useState(anyValue)
  const [invoiceStatus, setInvoiceStatus] = useState(anyValue)
  const [certificateStatus, setCertificateStatus] = useState(anyValue)
  const [attendanceStatus, setAttendanceStatus] = useState(anyValue)
  const [timing, setTiming] = useState(anyValue)
  const [sortBy, setSortBy] = useState('booking-newest')

  const filteredBookings = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return bookings
      .filter((booking) => {
        const delegate = delegates.find((item) => item.id === booking.delegateId)
        const course = courses.find((item) => item.id === booking.courseId)
        const session = sessions.find((item) => item.id === booking.sessionId)
        const location = locations.find((item) => item.id === booking.locationId)
        const invoice = invoices.find((item) => item.id === booking.invoiceId)
        const certificate = certificates.find((item) => item.id === booking.certificateId)
        const invoiceLabel = invoice?.status ?? (booking.paymentRequired ? 'not generated' : 'not_required')
        const certificateLabel = certificate?.status ?? 'not issued'
        const searchableText = [
          booking.id,
          delegate?.name,
          delegate?.email,
          delegate?.organisation,
          course?.title,
          location?.name,
          booking.status,
          invoiceLabel,
          certificateLabel,
        ].join(' ').toLowerCase()

        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesBookingStatus = bookingStatus === anyValue || booking.status === bookingStatus
        const matchesCourse = courseId === anyValue || booking.courseId === courseId
        const matchesLocation = locationId === anyValue || booking.locationId === locationId || session?.locationId === locationId
        const matchesFunding = funding === anyValue || course?.fundingType === funding
        const matchesInvoice = invoiceStatus === anyValue || invoiceLabel === invoiceStatus
        const matchesCertificate = certificateStatus === anyValue || certificateLabel === certificateStatus
        const matchesAttendance = attendanceStatus === anyValue || (attendanceStatus === 'attended' ? booking.attendanceMarked : !booking.attendanceMarked)
        const matchesTiming =
          timing === anyValue ||
          (timing === 'upcoming' && session?.status === 'scheduled') ||
          (timing === 'completed' && (session?.status === 'completed' || booking.status === 'completed')) ||
          (timing === 'cancelled' && (session?.status === 'cancelled' || booking.status === 'cancelled'))

        return matchesSearch && matchesBookingStatus && matchesCourse && matchesLocation && matchesFunding && matchesInvoice && matchesCertificate && matchesAttendance && matchesTiming
      })
      .sort((a, b) => {
        const courseA = courses.find((item) => item.id === a.courseId)
        const courseB = courses.find((item) => item.id === b.courseId)
        const delegateA = delegates.find((item) => item.id === a.delegateId)
        const delegateB = delegates.find((item) => item.id === b.delegateId)
        const sessionA = sessions.find((item) => item.id === a.sessionId)
        const sessionB = sessions.find((item) => item.id === b.sessionId)
        const invoiceA = invoices.find((item) => item.id === a.invoiceId)
        const invoiceB = invoices.find((item) => item.id === b.invoiceId)

        if (sortBy === 'booking-newest') return b.bookingDate.localeCompare(a.bookingDate)
        if (sortBy === 'booking-oldest') return a.bookingDate.localeCompare(b.bookingDate)
        if (sortBy === 'course') return (courseA?.title ?? '').localeCompare(courseB?.title ?? '')
        if (sortBy === 'delegate') return (delegateA?.name ?? '').localeCompare(delegateB?.name ?? '')
        if (sortBy === 'session') return (sessionA?.startDate ?? '').localeCompare(sessionB?.startDate ?? '')
        if (sortBy === 'booking-status') return a.status.localeCompare(b.status)
        if (sortBy === 'invoice-status') return (invoiceA?.status ?? '').localeCompare(invoiceB?.status ?? '')
        return 0
      })
  }, [attendanceStatus, bookingStatus, certificateStatus, courseId, funding, invoiceStatus, locationId, searchTerm, sortBy, timing])

  const activeFilterCount = [searchTerm.trim(), bookingStatus !== anyValue, courseId !== anyValue, locationId !== anyValue, funding !== anyValue, invoiceStatus !== anyValue, certificateStatus !== anyValue, attendanceStatus !== anyValue, timing !== anyValue].filter(Boolean).length

  function clearFilters() {
    setSearchTerm('')
    setBookingStatus(anyValue)
    setCourseId(anyValue)
    setLocationId(anyValue)
    setFunding(anyValue)
    setInvoiceStatus(anyValue)
    setCertificateStatus(anyValue)
    setAttendanceStatus(anyValue)
    setTiming(anyValue)
    setSortBy('booking-newest')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Bookings</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">View all bookings</h1>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Reference, delegate, course, invoice..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Booking status</label>
            <Select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Course</label>
            <Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value={anyValue}>All courses</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Location</label>
            <Select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value={anyValue}>All locations</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Funding</label>
            <Select value={funding} onChange={(event) => setFunding(event.target.value)}>
              <option value={anyValue}>All funding</option>
              <option value="funded">Funded</option>
              <option value="unfunded">Unfunded</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Invoice</label>
            <Select value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)}>
              <option value={anyValue}>All invoices</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="not_required">Not required</option>
              <option value="not generated">Not generated</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="booking-newest">Booking date newest</option>
              <option value="booking-oldest">Booking date oldest</option>
              <option value="course">Course name</option>
              <option value="delegate">Delegate name</option>
              <option value="session">Session date</option>
              <option value="booking-status">Booking status</option>
              <option value="invoice-status">Invoice status</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Select value={certificateStatus} onChange={(event) => setCertificateStatus(event.target.value)}>
            <option value={anyValue}>All certificate statuses</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="pending">Pending</option>
            <option value="not issued">Not issued</option>
          </Select>
          <Select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value)}>
            <option value={anyValue}>All attendance</option>
            <option value="attended">Attended</option>
            <option value="not_attended">Not marked</option>
          </Select>
          <Select value={timing} onChange={(event) => setTiming(event.target.value)}>
            <option value={anyValue}>All sessions</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredBookings.length} result{filteredBookings.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {bookingStatus !== anyValue ? <Badge label={bookingStatus} /> : null}
          {funding !== anyValue ? <Badge label={funding} /> : null}
          {invoiceStatus !== anyValue ? <Badge label={`invoice ${invoiceStatus}`} /> : null}
          {certificateStatus !== anyValue ? <Badge label={`certificate ${certificateStatus}`} /> : null}
          {attendanceStatus !== anyValue ? <Badge label={attendanceStatus === 'attended' ? 'attended' : 'not marked'} /> : null}
        </div>
      </Card>

      {filteredBookings.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No bookings found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another delegate, course, or reference.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Reference', 'Delegate', 'Organisation', 'Course', 'Session', 'Location', 'Booking', 'Invoice', 'Certificate', 'Attendance']}>
          {filteredBookings.map((booking) => {
            const delegate = delegates.find((item) => item.id === booking.delegateId)
            const course = courses.find((item) => item.id === booking.courseId)
            const session = sessions.find((item) => item.id === booking.sessionId)
            const location = locations.find((item) => item.id === booking.locationId)
            const invoice = invoices.find((item) => item.id === booking.invoiceId)
            const certificate = certificates.find((item) => item.id === booking.certificateId)
            const invoiceLabel = invoice?.status ?? (booking.paymentRequired ? 'not generated' : 'not_required')

            return (
              <tr key={booking.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{booking.id}</Link></td>
                <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate?.name}</Link><p className="mt-1 text-xs text-slate-500">{delegate?.email}</p></td>
                <td className="px-4 py-4 text-sm text-slate-700">{delegate?.organisation}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{course?.title}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
                <td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={bookingVariant(booking.status)} /></td>
                <td className="px-4 py-4 text-sm"><Badge label={invoiceLabel.replace('_', ' ')} variant={invoiceVariant(invoiceLabel)} /></td>
                <td className="px-4 py-4 text-sm"><Badge label={certificate?.status ?? 'not issued'} variant={certificate?.status === 'available' || certificate?.status === 'issued' ? 'success' : 'warning'} /></td>
                <td className="px-4 py-4 text-sm"><Badge label={booking.attendanceMarked ? 'attended' : 'not marked'} variant={booking.attendanceMarked ? 'success' : 'warning'} /></td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
