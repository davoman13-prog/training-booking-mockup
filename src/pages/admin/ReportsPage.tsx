import { reportMetrics, bookings, invoices, certificates } from '../../data/mockData'
import Card from '../../components/ui/Card'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Reports</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Admin reporting</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportMetrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            {metric.trend ? <p className="mt-2 text-sm text-slate-600">{metric.trend}</p> : null}
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-slate-900">Booking summary</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{bookings.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-900">Invoice total</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{invoices.filter((invoice) => invoice.status !== 'not_required').length}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-900">Certificates ready</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{certificates.filter((certificate) => certificate.status === 'available').length}</p>
        </Card>
      </div>
    </div>
  )
}
