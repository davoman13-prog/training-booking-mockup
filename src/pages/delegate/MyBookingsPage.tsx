import { bookings, courses, delegates, invoices, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function MyBookingsPage() {
  const delegate = delegates[0]
  const myBookings = bookings.filter((booking) => booking.delegateId === delegate.id).slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">My bookings</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Upcoming and recent bookings</h1>
        <p className="mt-2 text-sm text-slate-600">Showing mock bookings for {delegate.name}.</p>
      </div>
      <div className="space-y-4">
        {myBookings.map((booking) => {
          const course = courses.find((item) => item.id === booking.courseId)
          const session = sessions.find((item) => item.id === booking.sessionId)
          const location = locations.find((item) => item.id === booking.locationId)
          const invoice = invoices.find((item) => item.id === booking.invoiceId)

          return (
            <Card key={booking.id}>
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
                <div>
                  <p className="text-base font-semibold text-slate-950">{course?.title}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {session ? formatDate(session.startDate) : booking.bookingDate} / {session?.startTime} - {session?.endTime}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{location?.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={booking.status} variant={booking.status === 'confirmed' || booking.status === 'completed' ? 'success' : booking.status === 'pending' ? 'warning' : 'danger'} />
                  {booking.attendanceMarked ? <Badge label="attended" variant="info" /> : null}
                </div>
                <div className="text-sm text-slate-600">
                  {booking.certificateId ? 'Certificate linked' : booking.status === 'completed' ? 'Certificate pending' : 'Certificate after attendance'}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {invoice && invoice.status !== 'not_required' ? `${formatCurrency(invoice.amount)} ${invoice.status}` : 'No invoice'}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
