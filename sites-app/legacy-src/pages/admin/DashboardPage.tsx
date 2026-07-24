import { bookings, certificates, courses, delegates, invoices, locations, sessions, trainers } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Link } from 'react-router-dom'
import SummaryLinkCard from '../../components/ui/SummaryLinkCard'
import { isSessionAtRisk } from '../../utils/sessionRules'

export default function AdminDashboardPage() {
  const atRiskSessionCount = sessions.filter((session) => isSessionAtRisk(session, courses.find((course) => course.id === session.courseId))).length
  const outstandingInvoiceCount = invoices.filter((invoice) => invoice.status === 'unpaid' || invoice.status === 'overdue').length
  const pendingCertificateCount = certificates.filter((certificate) => certificate.status === 'pending').length
  const bookingsThisMonth = bookings.filter((booking) => booking.bookingDate.startsWith('2026-07')).length
  const completedSessionCount = sessions.filter((session) => session.status === 'completed').length
  const cancelledSessionCount = sessions.filter((session) => session.status === 'cancelled').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryLinkCard label="Total courses" value={courses.length} detail="All catalogue records" to="/admin/courses" />
        <SummaryLinkCard label="Upcoming sessions" value={sessions.filter((session) => session.status === 'scheduled').length} detail="Scheduled sessions" to="/admin/sessions?timing=upcoming" />
        <SummaryLinkCard label="Outstanding invoices" value={outstandingInvoiceCount} detail="Unpaid and overdue" to="/admin/invoices?paymentGroup=outstanding" />
        <SummaryLinkCard label="Certificates pending" value={pendingCertificateCount} detail="Awaiting issue" to="/admin/certificates?status=pending" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryLinkCard label="Sessions at risk" value={atRiskSessionCount} detail="Calculated from date and minimum numbers" to="/admin/sessions?status=at_risk" />
        <SummaryLinkCard label="Total delegates" value={delegates.length} detail="All delegate records" to="/admin/delegates" />
        <SummaryLinkCard label="Bookings this month" value={bookingsThisMonth} detail="Current month bookings" to="/admin/bookings?timing=current_month" />
        <SummaryLinkCard label="Completed sessions" value={completedSessionCount} detail="Historical sessions" to="/admin/sessions?timing=completed" />
        <SummaryLinkCard label="Cancelled sessions" value={cancelledSessionCount} detail="Cancelled session records" to="/admin/sessions?timing=cancelled" />
        <SummaryLinkCard label="Active trainers" value={trainers.filter((trainer) => trainer.status === 'active').length} detail="Currently selectable trainers" to="/admin/trainers?status=active" />
        <SummaryLinkCard label="Active locations" value={locations.filter((location) => location.isActive).length} detail="Open training venues" to="/admin/locations?status=active" />
        <SummaryLinkCard label="All bookings" value={bookings.length} detail="Booking management list" to="/admin/bookings" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Manage courses</p>
              <p className="mt-2 text-sm text-slate-600">Add or update course details in the mock interface.</p>
            </div>
            <Link to="/admin/courses">
              <Button>Go to courses</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Manage sessions</p>
              <p className="mt-2 text-sm text-slate-600">Review course sessions and schedule updates.</p>
            </div>
            <Link to="/admin/sessions">
              <Button>Go to sessions</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Reports</p>
              <p className="mt-2 text-sm text-slate-600">View enterprise summaries and booking metrics.</p>
            </div>
            <Link to="/admin/reports">
              <Button variant="secondary">View reports</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
