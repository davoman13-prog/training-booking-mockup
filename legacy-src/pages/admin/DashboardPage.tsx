import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import SummaryLinkCard from '../../components/ui/SummaryLinkCard'
import { isSessionAtRisk } from '../../utils/sessionRules'
import useCatalog from '../../hooks/useCatalog'

export default function AdminDashboardPage() {
  const { bookings, courses, delegates, locations, sessions, trainers, isLoading, isLive, loadError } = useCatalog()
  if (isLoading) return <Card><p className="text-sm font-semibold text-slate-700">Loading the live administration dashboard...</p></Card>
  if (!isLive) return <Card><h1 className="text-xl font-semibold text-slate-950">Dashboard unavailable</h1><p className="mt-2 text-sm text-rose-700">{loadError || 'The live catalogue could not be loaded.'}</p></Card>

  const currentMonth = new Date().toISOString().slice(0, 7)
  const atRiskSessionCount = sessions.filter((session) => isSessionAtRisk(session, courses.find((course) => course.id === session.courseId))).length
  const bookingsThisMonth = bookings.filter((booking) => booking.bookingDate.startsWith(currentMonth)).length
  const completedSessionCount = sessions.filter((session) => session.status === 'completed').length
  const cancelledSessionCount = sessions.filter((session) => session.status === 'cancelled').length
  const recordedInvoices = bookings.filter((booking) => Boolean(booking.invoiceId)).length
  const recordedCertificates = bookings.filter((booking) => Boolean(booking.certificateId)).length

  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Administration</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Live operations dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">Every figure below is calculated from the current database.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-4">
      <SummaryLinkCard label="Total courses" value={courses.length} detail="Live catalogue records" to="/admin/courses" />
      <SummaryLinkCard label="Upcoming sessions" value={sessions.filter((session) => session.status === 'scheduled').length} detail="Scheduled sessions" to="/admin/sessions?timing=upcoming" />
      <SummaryLinkCard label="Invoices recorded" value={recordedInvoices} detail="Linked to live bookings" to="/admin/invoices" />
      <SummaryLinkCard label="Certificates recorded" value={recordedCertificates} detail="Linked to live bookings" to="/admin/certificates" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryLinkCard label="Sessions at risk" value={atRiskSessionCount} detail="Within 14 days and below minimum" to="/admin/sessions?status=at_risk" />
      <SummaryLinkCard label="Total delegates" value={delegates.length} detail="Live delegate records" to="/admin/delegates" />
      <SummaryLinkCard label="Bookings this month" value={bookingsThisMonth} detail={currentMonth} to="/admin/bookings?timing=current_month" />
      <SummaryLinkCard label="Completed sessions" value={completedSessionCount} detail="Historical sessions" to="/admin/sessions?timing=completed" />
      <SummaryLinkCard label="Cancelled sessions" value={cancelledSessionCount} detail="Cancelled session records" to="/admin/sessions?timing=cancelled" />
      <SummaryLinkCard label="Active trainers" value={trainers.filter((trainer) => trainer.status === 'active').length} detail="Currently selectable trainers" to="/admin/trainers?status=active" />
      <SummaryLinkCard label="Active locations" value={locations.filter((location) => location.isActive).length} detail="Open training venues" to="/admin/locations?status=active" />
      <SummaryLinkCard label="All bookings" value={bookings.length} detail="Live booking records" to="/admin/bookings" />
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {[
        ['Manage courses', 'Add or update live course catalogue records.', '/admin/courses', 'Go to courses'],
        ['Manage sessions', 'Review live sessions, capacity and scheduling.', '/admin/sessions', 'Go to sessions'],
        ['Manage bookings', 'Review current delegate booking records.', '/admin/bookings', 'Go to bookings'],
      ].map(([title, detail, to, action]) => <Card key={to}><div className="flex flex-col gap-4">
        <div><p className="text-sm font-semibold text-slate-900">{title}</p><p className="mt-2 text-sm text-slate-600">{detail}</p></div>
        <Link to={to}><Button variant={to === '/admin/bookings' ? 'secondary' : 'primary'}>{action}</Button></Link>
      </div></Card>)}
    </div>
  </div>
}
