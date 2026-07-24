import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SummaryLinkCard from '../../components/ui/SummaryLinkCard'
import { formatDate } from '../../utils/formatters'
import useCatalog from '../../hooks/useCatalog'
import { MockUser } from '../../types'

function bookingVariant(status: string) {
  if (status === 'confirmed' || status === 'completed') return 'success'
  if (status === 'cancelled') return 'danger'
  return 'warning'
}

export default function DelegateDashboardPage({ currentUser }: { currentUser: MockUser }) {
  const { bookings, courses, delegates, locations, sessions } = useCatalog()
  const delegate = delegates.find((item) => item.id === currentUser.id)
  if (!delegate) return <Card><p className="text-sm font-semibold text-slate-900">Your delegate profile could not be loaded.</p></Card>
  const courseRows = bookings
    .filter((booking) => booking.delegateId === delegate.id)
    .sort((a, b) => {
      const priority = { confirmed: 0, pending: 1, completed: 2, cancelled: 3 }
      return priority[a.status] - priority[b.status]
    })
    .slice(0, 5)
    .map((booking) => {
      const course = courses.find((item) => item.id === booking.courseId)
      const session = sessions.find((item) => item.id === booking.sessionId)
      const location = locations.find((item) => item.id === booking.locationId)
      return { booking, course, session, location }
    })

  const delegateBookings = bookings.filter((booking) => booking.delegateId === delegate.id)
  const summaryCards = [
    { label: 'Total courses booked', value: delegateBookings.length, detail: 'All booking records', to: '/delegate/bookings' },
    { label: 'Upcoming courses', value: delegateBookings.filter((booking) => sessions.find((session) => session.id === booking.sessionId)?.status === 'scheduled' && booking.status !== 'cancelled').length, detail: 'Scheduled bookings', to: '/delegate/bookings?stage=upcoming' },
    { label: 'Completed courses', value: delegateBookings.filter((booking) => booking.status === 'completed' || sessions.find((session) => session.id === booking.sessionId)?.status === 'completed').length, detail: 'Completed live booking records', to: '/delegate/bookings?stage=completed' },
    { label: 'Certificates recorded', value: delegateBookings.filter((booking) => Boolean(booking.certificateId)).length, detail: 'Certificates linked to bookings', to: '/delegate/certificates' },
    { label: 'Invoices recorded', value: delegateBookings.filter((booking) => Boolean(booking.invoiceId)).length, detail: 'Invoices linked to bookings', to: '/delegate/invoices' },
    { label: 'Cancelled bookings', value: delegateBookings.filter((booking) => booking.status === 'cancelled' || sessions.find((session) => session.id === booking.sessionId)?.status === 'cancelled').length, detail: 'Cancelled booking records', to: '/delegate/bookings?stage=cancelled' },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Delegate dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Welcome, {delegate.name}</h1>
            <p className="mt-3 text-sm text-slate-600">Your Kalu Training profile and course activity.</p>
          </div>
          <Link to="/delegate/browse">
            <Button>Browse courses</Button>
          </Link>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ['Name', delegate.name],
            ['Email', delegate.email],
            ['Practice / organisation', delegate.organisation],
            ['Practice manager', delegate.managerName],
            ['Manager email', delegate.managerEmail],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
              <dd className="mt-2 text-sm font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">My Courses</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Upcoming and recent training</h2>
          </div>
          <Link to="/delegate/bookings" className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
            View all bookings
          </Link>
        </div>
        <div className="space-y-3">
          {courseRows.map(({ booking, course, session, location }) => (
            <Card key={booking.id}>
              <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_auto] xl:items-center">
                <div>
                  <Link to={`/delegate/bookings/${booking.id}`} className="text-lg font-semibold text-cyan-800 hover:text-cyan-950">
                    {course?.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {session ? formatDate(session.startDate) : 'Date to be confirmed'} at {location?.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={booking.status} variant={bookingVariant(booking.status)} />
                  {session?.status === 'cancelled' ? <Badge label="session cancelled" variant="danger" /> : null}
                </div>
                <div className="text-sm text-slate-600">
                  {booking.status === 'completed' ? (
                    <span>{booking.attendanceMarked ? 'Attended' : 'Attendance pending'} / {booking.certificateId ? 'Certificate recorded' : 'Certificate not issued'}</span>
                  ) : (
                    <span>{session?.availableSeats ?? 0} spaces remaining</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {booking.invoiceId ? 'Invoice recorded' : booking.paymentRequired ? 'Invoice not generated' : 'No invoice required'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Browse courses</p>
              <p className="mt-2 text-sm text-slate-600">Find funded and unfunded training options.</p>
            </div>
            <Link to="/delegate/browse">
              <Button variant="secondary">Browse</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">My bookings</p>
              <p className="mt-2 text-sm text-slate-600">Review upcoming and completed bookings.</p>
            </div>
            <Link to="/delegate/bookings">
              <Button variant="secondary">View bookings</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Certificates</p>
              <p className="mt-2 text-sm text-slate-600">Download your available certificates.</p>
            </div>
            <Link to="/delegate/certificates">
              <Button variant="secondary">View</Button>
            </Link>
          </div>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((metric) => (
          <SummaryLinkCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} to={metric.to} />
        ))}
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Featured courses</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recommended for you</h2>
          </div>
          <Link to="/delegate/browse" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            View all courses
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {courses.filter((course) => course.isFeatured).slice(0, 3).map((course) => (
            <Card key={course.id}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{course.duration} · {course.fundingType === 'funded' ? 'Funded' : 'Unfunded'}</p>
                </div>
                <Badge label={course.status.replace('_', ' ')} variant={course.status === 'open' ? 'success' : course.status === 'completed' ? 'info' : 'warning'} />
              </div>
              <p className="mt-4 text-sm text-slate-600">{course.description}</p>
              <div className="mt-6 flex items-center justify-between">
                <Link to={`/delegate/courses/${course.id}`}>
                  <Button variant="secondary">View course</Button>
                </Link>
                {course.fundingType === 'funded' ? (
                  <Badge label="No payment required" variant="success" />
                ) : (
                  <span className="text-sm font-semibold text-slate-900">£{course.price}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
