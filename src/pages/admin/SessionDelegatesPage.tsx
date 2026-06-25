import { Link, useParams } from 'react-router-dom'
import { bookings, certificates, courses, invoices, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { allDelegates } from './delegateUtils'

export default function SessionDelegatesPage() {
  const { sessionId } = useParams()
  const session = sessions.find((item) => item.id === sessionId)

  if (!session) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Session not found.</p>
  }

  const course = courses.find((item) => item.id === session.courseId)
  const location = locations.find((item) => item.id === session.locationId)
  const sessionBookings = bookings.filter((booking) => booking.sessionId === session.id)
  const capacity = session.attendeeCount + session.availableSeats

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Session delegates</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{course?.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{formatDate(session.startDate)} / {session.startTime} - {session.endTime}</p>
        </div>
        <Link to="/admin/sessions">
          <Button variant="secondary">Back to sessions</Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card><p className="text-sm text-slate-500">Location</p><p className="mt-2 text-sm font-semibold text-slate-950">{location?.name}</p></Card>
        <Card><p className="text-sm text-slate-500">Trainer</p><p className="mt-2 text-sm font-semibold text-slate-950">{session.trainer ?? 'To be confirmed'}</p></Card>
        <Card><p className="text-sm text-slate-500">Capacity</p><p className="mt-2 text-3xl font-semibold text-slate-950">{capacity}</p></Card>
        <Card><p className="text-sm text-slate-500">Booked</p><p className="mt-2 text-3xl font-semibold text-slate-950">{sessionBookings.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Spaces</p><p className="mt-2 text-3xl font-semibold text-slate-950">{Math.max(capacity - sessionBookings.length, 0)}</p></Card>
      </div>

      <Table headers={['Delegate', 'Email', 'Phone', 'Practice', 'Manager', 'Booking', 'Booking status', 'Attendance', 'Invoice', 'Certificate']}>
        {sessionBookings.map((booking) => {
          const delegate = allDelegates().find((item) => item.id === booking.delegateId)
          const invoice = invoices.find((item) => item.id === booking.invoiceId)
          const certificate = certificates.find((item) => item.id === booking.certificateId)

          return (
            <tr key={booking.id} className="border-t border-slate-200">
              <td className="px-4 py-4 text-sm"><Link to={`/admin/delegates/${delegate?.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate?.name}</Link></td>
              <td className="px-4 py-4 text-sm text-slate-700">{delegate?.email}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{delegate?.phone}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{delegate?.organisation}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{delegate?.managerName}<p className="mt-1 text-xs text-slate-500">{delegate?.managerEmail}</p></td>
              <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{booking.id}</Link></td>
              <td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={booking.status === 'cancelled' ? 'danger' : booking.status === 'pending' ? 'warning' : 'success'} /></td>
              <td className="px-4 py-4 text-sm"><Badge label={booking.attendanceMarked ? 'attended' : 'not marked'} variant={booking.attendanceMarked ? 'success' : 'warning'} /></td>
              <td className="px-4 py-4 text-sm text-slate-700">{invoice ? `${invoice.status} / ${formatCurrency(invoice.amount)}` : 'not required'}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{certificate?.status ?? 'pending'}</td>
            </tr>
          )
        })}
      </Table>
    </div>
  )
}
