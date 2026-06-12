import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courses, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId])

  if (!course) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Course not found.</p>
  }

  const courseSessions = sessions.filter((session) => session.courseId === course.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Course details</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{course.title}</h1>
            <p className="mt-3 text-sm text-slate-600">{course.description}</p>
          </div>
          <Badge label={course.status.replace('_', ' ')} variant={course.status === 'open' ? 'success' : course.status === 'cancelled' ? 'danger' : 'warning'} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Delivery</p>
            <p className="mt-2 text-sm text-slate-600">{course.duration}</p>
            <p className="mt-1 text-sm text-slate-500">{courseSessions.length} session option{courseSessions.length === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Funding</p>
            <p className="mt-2 text-sm text-slate-600">
              {course.fundingType === 'funded' ? 'Funded - no payment required' : 'Unfunded - invoice may be issued'}
            </p>
            {course.price ? <p className="mt-2 text-sm text-slate-900">Price: {formatCurrency(course.price)}</p> : null}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Minimum numbers</p>
            <p className="mt-2 text-sm text-slate-600">
              {course.fundingType === 'unfunded' ? `${course.minimumAttendees} delegates minimum` : 'Not required for funded places'}
            </p>
            {course.status === 'at_risk' ? <p className="mt-2 text-sm font-semibold text-amber-700">Cancellation risk flagged</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950">Choose a session</h2>
          {courseSessions.map((session) => {
            const location = locations.find((item) => item.id === session.locationId)
            const unavailable = session.status === 'cancelled'

            return (
              <Card key={session.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{formatDate(session.startDate)}</p>
                      <Badge label={session.status} variant={session.status === 'scheduled' ? 'info' : session.status === 'completed' ? 'success' : 'danger'} />
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div><dt className="font-semibold text-slate-900">Time</dt><dd>{session.startTime} - {session.endTime}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Location</dt><dd>{location?.name}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Trainer</dt><dd>{session.trainer ?? 'To be confirmed'}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Capacity</dt><dd>{session.attendeeCount + session.availableSeats} capacity / {session.availableSeats} spaces remaining</dd></div>
                      <div><dt className="font-semibold text-slate-900">Funding</dt><dd>{course.fundingType === 'funded' ? 'Funded - no payment required' : `Unfunded - ${formatCurrency(course.price ?? 0)}`}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Minimum attendees</dt><dd>{course.fundingType === 'unfunded' ? course.minimumAttendees : 'Not applicable'}</dd></div>
                    </dl>
                    {course.status === 'at_risk' || course.status === 'awaiting_minimum' ? (
                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                        {course.status === 'at_risk' ? 'This session is currently at risk of cancellation.' : 'This session is awaiting minimum numbers.'}
                      </div>
                    ) : null}
                  </div>
                  <Link to={`/delegate/book/${course.id}/${session.id}`}>
                    <Button disabled={unavailable}>Book this session</Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </section>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Course outcomes</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {course.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-700" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
