import { Link } from 'react-router-dom'
import { bookings, courses, delegates, sessions } from '../../data/mockData'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

export default function ViewBookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Bookings</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">View all bookings</h1>
        </div>
      </div>
      <Table headers={['Delegate', 'Course', 'Session', 'Status', 'Actions']}>
        {bookings.slice(0, 10).map((booking) => {
          const delegate = delegates.find((item) => item.id === booking.delegateId)
          const course = courses.find((item) => item.id === booking.courseId)
          const session = sessions.find((item) => item.id === booking.sessionId)
          return (
            <tr key={booking.id} className="border-t border-slate-200">
              <td className="px-4 py-4 text-sm text-slate-700">{delegate?.name}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{course?.title}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{session?.startDate}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{booking.status}</td>
              <td className="px-4 py-4 text-sm text-right">
                <Link to={`/admin/bookings/${booking.id}`} className="text-slate-900 hover:text-slate-700">
                  View
                </Link>
              </td>
            </tr>
          )
        })}
      </Table>
    </div>
  )
}
