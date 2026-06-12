import { Link } from 'react-router-dom'
import { courses } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'

export default function ManageCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Courses</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage course catalogue</h1>
        </div>
        <Link to="/admin/courses/new">
          <Button>Add new course</Button>
        </Link>
      </div>
      <Table headers={['Title', 'Funding', 'Status', 'Location', 'Actions']}>
        {courses.map((course) => (
          <tr key={course.id} className="border-t border-slate-200">
            <td className="px-4 py-4 text-sm text-slate-700">{course.title}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{course.fundingType}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{course.status.replace('_', ' ')}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{course.locationId}</td>
            <td className="px-4 py-4 text-sm text-right">
              <Link to={`/admin/courses/${course.id}/edit`} className="text-slate-900 hover:text-slate-700">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
