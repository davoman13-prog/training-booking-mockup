import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import useCatalog from '../../hooks/useCatalog'

export default function SessionDelegatesPage() {
  const { sessionId } = useParams()
  const { attendanceRecords, bookings, certificates, courses, delegates, invoices, locations, sessions, trainers, isLoading } = useCatalog()
  const session = sessions.find((item) => item.id === sessionId)
  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading live session delegates...</p></Card>
  if (!session) return <Card><p className="text-sm text-slate-700">Session not found.</p></Card>
  const course = courses.find((item) => item.id === session.courseId)
  const location = locations.find((item) => item.id === session.locationId)
  const trainer = trainers.find((item) => item.id === session.trainerId)
  const sessionBookings = bookings.filter((booking) => booking.sessionId === session.id)
  const capacity = session.attendeeCount + session.availableSeats

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Session delegates</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{course?.title}</h1><p className="mt-2 text-sm text-slate-600">{formatDate(session.startDate)} / {session.startTime} - {session.endTime}</p></div><Link to="/admin/sessions"><Button variant="secondary">Back to sessions</Button></Link></div>
    <div className="grid gap-4 lg:grid-cols-5">
      <Card><p className="text-sm text-slate-500">Location</p><p className="mt-2 font-semibold">{location?.name}</p></Card>
      <Card><p className="text-sm text-slate-500">Trainer</p><p className="mt-2 font-semibold">{trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Unassigned'}</p></Card>
      <Card><p className="text-sm text-slate-500">Capacity</p><p className="mt-2 text-3xl font-semibold">{capacity}</p></Card>
      <Card><p className="text-sm text-slate-500">Active bookings</p><p className="mt-2 text-3xl font-semibold">{sessionBookings.filter((booking) => booking.status !== 'cancelled').length}</p></Card>
      <Card><p className="text-sm text-slate-500">Spaces</p><p className="mt-2 text-3xl font-semibold">{session.availableSeats}</p></Card>
    </div>
    <Table headers={['Delegate', 'Practice', 'Booking', 'Status', 'Attendance', 'Invoice', 'Certificate']}>{sessionBookings.map((booking) => {
      const delegate = delegates.find((item) => item.id === booking.delegateId)
      const attendance = attendanceRecords.find((item) => item.bookingId === booking.id)
      const invoice = invoices.find((item) => item.bookingId === booking.id)
      const certificate = certificates.find((item) => item.bookingId === booking.id)
      return <tr key={booking.id}><td className="px-4 py-4 text-sm"><Link to={`/admin/delegates/${delegate?.id}`} className="font-semibold text-cyan-800">{delegate?.name}</Link><p className="text-xs text-slate-500">{delegate?.email} / {delegate?.phone}</p></td><td className="px-4 py-4 text-sm text-slate-700">{delegate?.organisation}<p className="text-xs">{delegate?.managerName}</p></td><td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800">{booking.id}</Link></td><td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={booking.status === 'cancelled' ? 'danger' : booking.status === 'pending' ? 'warning' : 'success'} /></td><td className="px-4 py-4 text-sm"><Badge label={attendance?.outcome ?? 'pending'} variant={attendance?.outcome === 'attended' ? 'success' : attendance?.outcome === 'absent' ? 'danger' : 'warning'} /></td><td className="px-4 py-4 text-sm text-slate-700">{invoice ? `${invoice.status} / ${formatCurrency(invoice.amount)}` : 'Not required'}</td><td className="px-4 py-4 text-sm text-slate-700">{certificate?.status ?? 'Not created'}</td></tr>
    })}</Table>
  </div>
}
