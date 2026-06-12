import { courses, bookings, invoices, certificates, reportMetrics } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Link } from 'react-router-dom'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Courses</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{courses.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Bookings</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{bookings.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Invoices</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{invoices.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Certificates</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{certificates.length}</p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {reportMetrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            {metric.detail ? <p className="mt-2 text-sm text-slate-600">{metric.detail}</p> : null}
          </Card>
        ))}
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
