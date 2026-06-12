import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { bookings, courses, delegates, sessions, invoices, certificates } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../utils/formatters'

export default function BookingDetailPage() {
  const { bookingId } = useParams()
  const booking = useMemo(() => bookings.find((item) => item.id === bookingId), [bookingId])

  if (!booking) {
    return <p className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-700">Booking not found.</p>
  }

  const course = courses.find((item) => item.id === booking.courseId)
  const delegate = delegates.find((item) => item.id === booking.delegateId)
  const session = sessions.find((item) => item.id === booking.sessionId)
  const invoice = invoices.find((item) => item.id === booking.invoiceId)
  const certificate = certificates.find((item) => item.id === booking.certificateId)

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Booking detail</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{booking.id}</p>
            <Badge label={booking.status} variant={booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'danger'} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Delegate</p>
            <p className="mt-2 text-sm text-slate-900">{delegate?.name}</p>
            <p className="mt-1 text-sm text-slate-600">{delegate?.organisation}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Course</p>
            <p className="mt-2 text-sm text-slate-900">{course?.title}</p>
            <p className="mt-1 text-sm text-slate-600">{session?.startDate}</p>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-slate-900">Invoice</p>
          {invoice ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600">Status: {invoice.status}</p>
              <p className="text-sm text-slate-600">Amount: {formatCurrency(invoice.amount)}</p>
              <p className="text-sm text-slate-600">Due date: {invoice.dueDate}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No invoice generated for this booking.</p>
          )}
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-900">Certificate</p>
          {certificate ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600">Status: {certificate.status}</p>
              <p className="text-sm text-slate-600">Issued: {certificate.issuedDate ?? 'Pending'}</p>
              <Button variant={certificate.status === 'available' ? 'primary' : 'secondary'} disabled={certificate.status !== 'available'}>
                {certificate.status === 'available' ? 'Download' : 'Pending'}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No certificate associated.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
