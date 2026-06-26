import { Link, useParams } from 'react-router-dom'
import { bookings, certificates, courses, invoices, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatCurrency, formatDate } from '../../utils/formatters'

function statusVariant(status?: string) {
  if (status === 'confirmed' || status === 'completed' || status === 'available' || status === 'paid' || status === 'not_required') return 'success'
  if (status === 'cancelled' || status === 'overdue') return 'danger'
  return 'warning'
}

export default function TrainingDetailPage() {
  const { bookingId } = useParams()
  const booking = bookings.find((item) => item.id === bookingId)

  if (!booking) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Booking not found.</p>
  }

  const course = courses.find((item) => item.id === booking.courseId)
  const session = sessions.find((item) => item.id === booking.sessionId)
  const location = locations.find((item) => item.id === booking.locationId)
  const invoice = invoices.find((item) => item.id === booking.invoiceId)
  const certificate = certificates.find((item) => item.id === booking.certificateId)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Training details</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{course?.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">{course?.description}</p>
          </div>
          <Badge label={booking.status} variant={statusVariant(booking.status)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Course</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-semibold text-slate-900">Category</dt><dd className="text-slate-600">{course?.category}</dd></div>
            <div><dt className="font-semibold text-slate-900">Duration</dt><dd className="text-slate-600">{course?.duration}</dd></div>
            <div><dt className="font-semibold text-slate-900">Funding</dt><dd className="text-slate-600">{course?.fundingType === 'funded' ? 'Funded - no payment required' : `Unfunded - ${formatCurrency(course?.price ?? 0)}`}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Session</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-semibold text-slate-900">Date</dt><dd className="text-slate-600">{session ? formatDate(session.startDate) : 'To be confirmed'}</dd></div>
            <div><dt className="font-semibold text-slate-900">Time</dt><dd className="text-slate-600">{session?.startTime} - {session?.endTime}</dd></div>
            <div><dt className="font-semibold text-slate-900">Location</dt><dd className="text-slate-600">{location?.name}</dd></div>
            <div><dt className="font-semibold text-slate-900">Trainer</dt><dd className="text-slate-600">{session?.trainer ?? 'To be confirmed'}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Booking</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-semibold text-slate-900">Reference</dt><dd className="text-slate-600">{booking.id}</dd></div>
            <div><dt className="font-semibold text-slate-900">Booking status</dt><dd><Badge label={booking.status} variant={statusVariant(booking.status)} /></dd></div>
            <div><dt className="font-semibold text-slate-900">Attendance</dt><dd><Badge label={booking.attendanceMarked ? 'attended' : 'not marked'} variant={booking.attendanceMarked ? 'success' : 'warning'} /></dd></div>
            <div><dt className="font-semibold text-slate-900">Terms summary</dt><dd className="text-slate-600">{booking.termsAccepted ? 'Terms and conditions accepted for this mock booking.' : 'Terms acceptance not recorded.'}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Invoice</h2>
          {invoice && invoice.status !== 'not_required' ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Status: <span className="font-semibold text-slate-900">{invoice.status}</span></p>
              <p>Amount: <span className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</span></p>
              <p>Due: {formatDate(invoice.dueDate)}</p>
              <Button variant="secondary">View invoice</Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No invoice is required for this booking.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">Certificate</h2>
          {certificate ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Status: <span className="font-semibold text-slate-900">{certificate.status}</span></p>
              <p>Issued: {certificate.issuedDate ? formatDate(certificate.issuedDate) : 'Pending'}</p>
              <Button disabled={certificate.status !== 'available'}>{certificate.status === 'available' ? 'Download certificate' : 'Certificate pending'}</Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Certificate status will appear after completed attendance.</p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/delegate/dashboard"><Button variant="secondary">Return to dashboard</Button></Link>
        <Link to="/delegate/bookings"><Button variant="ghost">View all bookings</Button></Link>
        {invoice && invoice.status !== 'not_required' ? <Link to="/delegate/invoices"><Button variant="ghost">Invoices</Button></Link> : null}
        {certificate?.status === 'available' ? <Link to="/delegate/certificates"><Button variant="ghost">Certificates</Button></Link> : null}
      </div>
    </div>
  )
}
