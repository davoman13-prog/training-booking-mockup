import { Link, useSearchParams } from 'react-router-dom'
import { courses, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { trainerNameById } from '../../utils/trainerUtils'

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams()
  const course = courses.find((item) => item.id === searchParams.get('courseId'))
  const session = sessions.find((item) => item.id === searchParams.get('sessionId'))
  const location = locations.find((item) => item.id === session?.locationId)

  return (
    <Card>
      <div className="space-y-6 text-center">
        <Badge label="Booking confirmed" variant="success" />
        <h1 className="text-3xl font-semibold text-slate-950">Your course booking is confirmed</h1>
        <p className="mx-auto max-w-xl text-sm text-slate-600">
          Your booking has been saved to the live training register.
        </p>
        {course && session ? (
          <div className="mx-auto max-w-3xl rounded-2xl bg-slate-50 p-5 text-left">
            <h2 className="text-lg font-semibold text-slate-950">{course.title}</h2>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-900">Date</dt><dd>{formatDate(session.startDate)}</dd></div>
              <div><dt className="font-semibold text-slate-900">Time</dt><dd>{session.startTime} - {session.endTime}</dd></div>
              <div><dt className="font-semibold text-slate-900">Location</dt><dd>{location?.name}</dd></div>
              <div><dt className="font-semibold text-slate-900">Trainer</dt><dd>{trainerNameById(session.trainerId)}</dd></div>
              <div><dt className="font-semibold text-slate-900">Funding</dt><dd>{course.fundingType === 'funded' ? 'Funded - no invoice' : `Unfunded - ${formatCurrency(course.price ?? 0)}`}</dd></div>
              <div><dt className="font-semibold text-slate-900">Status</dt><dd>{session.status}</dd></div>
            </dl>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/delegate/bookings">
            <Button variant="secondary" className="w-full">View my bookings</Button>
          </Link>
          <Link to="/delegate/browse">
            <Button className="w-full">Browse more courses</Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
