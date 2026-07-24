import SummaryLinkCard from '../../components/ui/SummaryLinkCard'
import Card from '../../components/ui/Card'
import useCatalog from '../../hooks/useCatalog'

export default function ReportsPage() {
  const { bookings, certificates, courses, invoices, locations, attendanceRecords, isLoading, loadError } = useCatalog()
  const fundedBookingCount = bookings.filter((booking) => courses.find((course) => course.id === booking.courseId)?.fundingType === 'funded').length
  const unfundedBookingCount = bookings.filter((booking) => courses.find((course) => course.id === booking.courseId)?.fundingType === 'unfunded').length
  const paidInvoiceCount = invoices.filter((invoice) => invoice.status === 'paid').length
  const overdueInvoiceCount = invoices.filter((invoice) => invoice.status === 'overdue').length
  const issuedCertificateCount = certificates.filter((certificate) => certificate.status === 'issued' || certificate.status === 'available').length
  const attendanceCompleteCount = attendanceRecords.filter((record) => record.outcome !== 'pending').length
  const invoiceValue = invoices.filter((invoice) => invoice.status !== 'cancelled').reduce((total, invoice) => total + invoice.amount, 0)

  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading live reporting data...</p></Card>

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Reports</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Admin reporting</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryLinkCard label="Total bookings" value={bookings.length} detail="All booking records" to="/admin/bookings" />
        <SummaryLinkCard label="Funded bookings" value={fundedBookingCount} detail="Bookings on funded courses" to="/admin/bookings?funding=funded" />
        <SummaryLinkCard label="Unfunded bookings" value={unfundedBookingCount} detail="Bookings on unfunded courses" to="/admin/bookings?funding=unfunded" />
        <SummaryLinkCard label="Paid invoices" value={paidInvoiceCount} detail="Invoices marked paid" to="/admin/invoices?status=paid" />
        <SummaryLinkCard label="Overdue invoices" value={overdueInvoiceCount} detail="Invoices past due" to="/admin/invoices?status=overdue" />
        <SummaryLinkCard label="Certificates issued" value={issuedCertificateCount} detail="Available or issued certificates" to="/admin/certificates?status=downloadable" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <SummaryLinkCard label="Invoice value" value={`£${invoiceValue.toFixed(2)}`} detail={`${invoices.length} database invoice records`} to="/admin/invoices" />
        <SummaryLinkCard label="Attendance complete" value={attendanceCompleteCount} detail="Bookings with attendance recorded" to="/admin/attendance?attendanceStatus=attended" />
        <SummaryLinkCard label="Courses by active location" value={locations.filter((location) => location.isActive).length} detail="Active venues with session context" to="/admin/locations?status=active" />
      </div>
      {loadError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{loadError}</div> : null}
    </div>
  )
}
