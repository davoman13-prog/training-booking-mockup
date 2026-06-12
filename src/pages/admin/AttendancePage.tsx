import { bookings, courses, delegates, sessions } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Attendance</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Mark attendance</h1>
      </div>
      <div className="space-y-4">
        {bookings.slice(0, 5).map((booking) => {
          const delegate = delegates.find((item) => item.id === booking.delegateId)
          const course = courses.find((item) => item.id === booking.courseId)
          const session = sessions.find((item) => item.id === booking.sessionId)

          return (
            <Card key={booking.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{delegate?.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{course?.title} · {session?.startDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={booking.attendanceMarked ? 'Marked' : 'Pending'} variant={booking.attendanceMarked ? 'success' : 'warning'} />
                  <Button variant={booking.attendanceMarked ? 'secondary' : 'primary'}>
                    {booking.attendanceMarked ? 'Update' : 'Mark attendance'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
