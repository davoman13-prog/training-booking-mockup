import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { bookings, certificates, courses, delegates, locations, sessions } from '../../data/mockData'
import { formatDate } from '../../utils/formatters'

export default function CertificateDetailPage() {
  const { certificateId } = useParams()
  const certificate = certificates.find((item) => item.id === certificateId)

  if (!certificate) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Certificate not found.</p>
  }

  const booking = bookings.find((item) => item.id === certificate.bookingId)
  const delegate = delegates.find((item) => item.id === certificate.delegateId)
  const course = courses.find((item) => item.id === certificate.courseId)
  const session = sessions.find((item) => item.id === booking?.sessionId)
  const location = locations.find((item) => item.id === booking?.locationId)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Certificate preview</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{certificate.id}</h1>
            <p className="mt-2 text-sm text-slate-600">Read-only mock certificate details.</p>
          </div>
          <Badge label={certificate.status} variant={certificate.status === 'available' || certificate.status === 'issued' ? 'success' : 'warning'} />
        </div>
      </div>

      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="font-semibold text-slate-900">Certificate reference</dt><dd className="text-slate-600">{certificate.id}</dd></div>
          <div><dt className="font-semibold text-slate-900">Delegate</dt><dd className="text-slate-600">{delegate?.name}</dd></div>
          <div><dt className="font-semibold text-slate-900">Course</dt><dd className="text-slate-600">{course?.title}</dd></div>
          <div><dt className="font-semibold text-slate-900">Completion date</dt><dd className="text-slate-600">{session ? formatDate(session.startDate) : 'To be confirmed'}</dd></div>
          <div><dt className="font-semibold text-slate-900">Issue date</dt><dd className="text-slate-600">{certificate.issuedDate ? formatDate(certificate.issuedDate) : 'Pending'}</dd></div>
          <div><dt className="font-semibold text-slate-900">Status</dt><dd><Badge label={certificate.status} variant={certificate.status === 'available' || certificate.status === 'issued' ? 'success' : 'warning'} /></dd></div>
          <div><dt className="font-semibold text-slate-900">Location</dt><dd className="text-slate-600">{location?.name}</dd></div>
          <div><dt className="font-semibold text-slate-900">Trainer</dt><dd className="text-slate-600">{session?.trainer ?? 'To be confirmed'}</dd></div>
          <div><dt className="font-semibold text-slate-900">Booking reference</dt><dd className="text-slate-600">{booking?.id}</dd></div>
        </dl>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to="/delegate/certificates"><Button variant="secondary">Back to certificates</Button></Link>
        {booking ? <Link to={`/delegate/bookings/${booking.id}`}><Button variant="ghost">View booking details</Button></Link> : null}
        <Button disabled={certificate.status !== 'available'}>{certificate.status === 'available' ? 'Download certificate' : 'Certificate pending'}</Button>
      </div>
    </div>
  )
}
