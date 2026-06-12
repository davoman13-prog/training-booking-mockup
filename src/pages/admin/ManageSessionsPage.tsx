import { Link } from 'react-router-dom'
import { sessions } from '../../data/mockData'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'

export default function ManageSessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Sessions</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage course sessions</h1>
        </div>
        <Link to="/admin/sessions/new">
          <Button>Add new session</Button>
        </Link>
      </div>
      <Table headers={['Session', 'Course', 'Date', 'Status', 'Actions']}>
        {sessions.map((session) => (
          <tr key={session.id} className="border-t border-slate-200">
            <td className="px-4 py-4 text-sm text-slate-700">{session.id}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{session.courseId}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{session.startDate}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{session.status}</td>
            <td className="px-4 py-4 text-sm text-right">
              <Link to={`/admin/sessions/${session.id}/edit`} className="text-slate-900 hover:text-slate-700">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
