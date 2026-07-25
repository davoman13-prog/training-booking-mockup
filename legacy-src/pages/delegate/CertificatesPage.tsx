import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import useCatalog from '../../hooks/useCatalog'
import { formatDate } from '../../utils/formatters'
import { MockUser } from '../../types'

export default function CertificatesPage({ currentUser }: { currentUser: MockUser }) {
  const { bookings, certificates, courses, sessions, isLoading } = useCatalog()
  const rows = certificates
    .filter((certificate) => certificate.delegateId === currentUser.id)
    .map((certificate) => {
      const booking = bookings.find((item) => item.id === certificate.bookingId)
      return {
      certificate,
      booking,
      course: courses.find((course) => course.id === certificate.courseId),
      session: sessions.find((session) => session.id === booking?.sessionId),
    }
    })

  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading certificate records...</p></Card>
  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Certificates</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">My certificates</h1>
      <p className="mt-2 text-sm text-slate-600">Only certificates genuinely linked to your live booking records are shown.</p>
    </div>
    {rows.length ? <Table headers={['Certificate reference', 'Course', 'Session', 'Booking', 'Status', 'PDF']}>
      {rows.map(({ certificate, booking, course, session }) => <tr key={certificate.id}>
        <td className="px-4 py-4 text-sm font-semibold text-slate-900">{certificate.id}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{course?.title}</td>
        <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : 'To be confirmed'}</td>
        <td className="px-4 py-4 text-sm">{booking ? <Link to={`/delegate/bookings/${booking.id}`} className="font-semibold text-cyan-800">{booking.id}</Link> : '-'}</td>
        <td className="px-4 py-4 text-sm"><Badge label={certificate.status} variant={certificate.status === 'available' || certificate.status === 'issued' ? 'success' : certificate.status === 'revoked' ? 'danger' : 'warning'} /></td>
        <td className="px-4 py-4 text-sm">{certificate.downloadLink ? <a className="font-semibold text-cyan-800" href={certificate.downloadLink}>Download certificate</a> : <span className="text-slate-500">Not available yet</span>}</td>
      </tr>)}
    </Table> : <Card>
      <h2 className="text-lg font-semibold text-slate-950">No certificates issued yet</h2>
      <p className="mt-2 text-sm text-slate-600">Certificates will appear here when they are generated following completed attendance.</p>
    </Card>}
  </div>
}
