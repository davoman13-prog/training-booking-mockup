import { invoices, courses, delegates } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../utils/formatters'

export default function InvoiceManagementPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Invoices</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage invoice status</h1>
      </div>
      <div className="space-y-4">
        {invoices.map((invoice) => {
          const delegate = delegates.find((item) => item.id === invoice.delegateId)
          const course = courses.find((item) => item.id === invoice.courseId)

          return (
            <Card key={invoice.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{invoice.id}</p>
                  <p className="mt-1 text-sm text-slate-600">{course?.title} · {delegate?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    label={invoice.status.replace('_', ' ')}
                    variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'}
                  />
                  <Button variant="secondary">Mark paid</Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amount</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(invoice.amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Issued</p>
                  <p className="mt-2 text-sm text-slate-700">{invoice.issuedDate}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Due</p>
                  <p className="mt-2 text-sm text-slate-700">{invoice.dueDate}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
