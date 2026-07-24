import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import useCatalog from '../../hooks/useCatalog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { MockUser } from '../../types'

export default function InvoicesPage({ currentUser }: { currentUser: MockUser }) {
  const { bookings, courses, sessions, isLoading } = useCatalog()
  const rows = bookings
    .filter((booking) => booking.delegateId === currentUser.id && booking.invoiceId)
    .map((booking) => ({
      booking,
      course: courses.find((course) => course.id === booking.courseId),
      session: sessions.find((session) => session.id === booking.sessionId),
    }))

  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading invoice records...</p></Card>
  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Invoices</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">My invoices</h1>
      <p className="mt-2 text-sm text-slate-600">Only invoices genuinely linked to your live booking records are shown.</p>
    </div>
    {rows.length ? <Table headers={['Invoice reference', 'Course', 'Session', 'Amount', 'Booking', 'Status']}>
      {rows.map(({ booking, course, session }) => <tr key={booking.invoiceId}>
        <td className="px-4 py-4 text-sm font-semibold text-slate-900">{booking.invoiceId}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{course?.title}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : 'To be confirmed'}</td>
        <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(course?.price ?? 0)}</td>
        <td className="px-4 py-4 text-sm"><Link to={`/delegate/bookings/${booking.id}`} className="font-semibold text-cyan-800">{booking.id}</Link></td>
        <td className="px-4 py-4 text-sm"><Badge label="recorded" variant="info" /></td>
      </tr>)}
    </Table> : <Card>
      <h2 className="text-lg font-semibold text-slate-950">No invoices generated</h2>
      <p className="mt-2 text-sm text-slate-600">Funded bookings do not require an invoice. Any future generated invoices will appear here.</p>
    </Card>}
  </div>
}
