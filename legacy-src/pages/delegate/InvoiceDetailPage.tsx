import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { bookings, courses, delegates, invoices, sessions } from '../../data/mockData'
import { formatCurrency, formatDate } from '../../utils/formatters'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function invoiceVariant(status: string): BadgeVariant {
  if (status === 'paid' || status === 'not_required') return 'success'
  if (status === 'overdue') return 'danger'
  return 'warning'
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams()
  const invoice = invoices.find((item) => item.id === invoiceId)

  if (!invoice) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Invoice not found.</p>
  }

  const booking = bookings.find((item) => item.id === invoice.bookingId)
  const delegate = delegates.find((item) => item.id === invoice.delegateId)
  const course = courses.find((item) => item.id === invoice.courseId)
  const session = sessions.find((item) => item.id === booking?.sessionId)
  const paymentNote =
    invoice.status === 'paid'
      ? 'Paid in full in this mock record.'
      : invoice.status === 'overdue'
      ? 'Payment is overdue in this mock record.'
      : invoice.status === 'not_required'
      ? 'No payment is required because the course is funded.'
      : 'Payment is outstanding in this mock record.'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Invoice preview</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Invoice {invoice.id}</h1>
            <p className="mt-2 text-sm text-slate-600">Read-only mock invoice details.</p>
          </div>
          <Badge label={invoice.status.replace('_', ' ')} variant={invoiceVariant(invoice.status)} />
        </div>
      </div>

      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="font-semibold text-slate-900">Invoice number</dt><dd className="text-slate-600">{invoice.id}</dd></div>
          <div><dt className="font-semibold text-slate-900">Booking reference</dt><dd className="text-slate-600">{booking?.id}</dd></div>
          <div><dt className="font-semibold text-slate-900">Delegate</dt><dd className="text-slate-600">{delegate?.name}</dd></div>
          <div><dt className="font-semibold text-slate-900">Practice / organisation</dt><dd className="text-slate-600">{delegate?.organisation}</dd></div>
          <div><dt className="font-semibold text-slate-900">Course</dt><dd className="text-slate-600">{course?.title}</dd></div>
          <div><dt className="font-semibold text-slate-900">Session date</dt><dd className="text-slate-600">{session ? formatDate(session.startDate) : 'To be confirmed'}</dd></div>
          <div><dt className="font-semibold text-slate-900">Amount</dt><dd className="text-slate-600">{formatCurrency(invoice.amount)}</dd></div>
          <div><dt className="font-semibold text-slate-900">Due date</dt><dd className="text-slate-600">{formatDate(invoice.dueDate)}</dd></div>
          <div><dt className="font-semibold text-slate-900">Issued date</dt><dd className="text-slate-600">{formatDate(invoice.issuedDate)}</dd></div>
          <div><dt className="font-semibold text-slate-900">Invoice status</dt><dd><Badge label={invoice.status.replace('_', ' ')} variant={invoiceVariant(invoice.status)} /></dd></div>
          <div className="sm:col-span-2"><dt className="font-semibold text-slate-900">Payment note/status</dt><dd className="text-slate-600">{paymentNote}</dd></div>
        </dl>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to="/delegate/invoices"><Button variant="secondary">Back to invoices</Button></Link>
        {booking ? <Link to={`/delegate/bookings/${booking.id}`}><Button variant="ghost">View booking details</Button></Link> : null}
        <Button disabled={!invoice.isGenerated}>{invoice.isGenerated ? 'Download invoice' : 'No invoice document'}</Button>
      </div>
    </div>
  )
}
