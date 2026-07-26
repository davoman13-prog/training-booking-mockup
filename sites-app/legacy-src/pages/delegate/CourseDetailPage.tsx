import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { canBookSession, delegateSessionAvailabilityMessage } from '../../utils/sessionRules'
import useCatalog from '../../hooks/useCatalog'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const { courses, locations, sessions, trainers, delegates, bookings, waitingListEntries, isLoading, refresh } = useCatalog()
  const [waitingError, setWaitingError] = useState('')
  const [waitingMessage, setWaitingMessage] = useState('')
  const [waiting, setWaiting] = useState(false)
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId, courses])

  if (isLoading) return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Loading the latest course details...</p>
  if (!course) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Course not found.</p>
  }

  const courseSessions = sessions.filter((session) => session.courseId === course.id)
  const eligible = !delegates[0]?.staffType || course.audienceTypes.includes(delegates[0].staffType)
  const waitingEntry = waitingListEntries.find((entry) => entry.courseId === course.id)
  const activeBooking = bookings.some((booking) => booking.courseId === course.id && booking.status !== 'cancelled' && booking.status !== 'completed')
  const waitingListAvailable = eligible && course.status !== 'cancelled' && course.status !== 'completed' && !activeBooking

  async function joinWaitingList() {
    setWaiting(true); setWaitingError(''); setWaitingMessage('')
    try {
      const response = await fetch('/api/waiting-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id }),
      })
      const result = await response.json() as { emailSent?: boolean; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The waiting list could not be updated.')
      await refresh()
      setWaitingMessage(result.emailSent ? 'You are confirmed on this course waiting list and a confirmation email has been sent.' : 'You are confirmed on this course waiting list, but the confirmation email could not be sent.')
    } catch (caught) {
      setWaitingError(caught instanceof Error ? caught.message : 'The waiting list could not be updated.')
    } finally { setWaiting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        {!eligible ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">This course is not available for your staff type. You can review your staff type in My Account.</div> : null}
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
            const unavailable = !eligible || !canBookSession(session, course)
            const availabilityMessage = delegateSessionAvailabilityMessage(session, course)

            return (
              <Card key={session.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{formatDate(session.startDate)}</p>
                      <Badge label={session.status.replace('_', ' ')} variant={session.status === 'scheduled' ? 'info' : session.status === 'completed' ? 'success' : session.status === 'on_hold' ? 'warning' : 'danger'} />
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div><dt className="font-semibold text-slate-900">Time</dt><dd>{session.startTime} - {session.endTime}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Location</dt><dd>{location?.name}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Trainer</dt><dd>{(() => { const trainer = trainers.find((item) => item.id === session.trainerId); return trainer ? `${trainer.firstName} ${trainer.lastName}` : 'To be confirmed' })()}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Capacity</dt><dd>{session.attendeeCount + session.availableSeats} capacity / {session.availableSeats} spaces remaining</dd></div>
                      <div><dt className="font-semibold text-slate-900">Funding</dt><dd>{course.fundingType === 'funded' ? 'Funded - no payment required' : `Unfunded - ${formatCurrency(course.price ?? 0)}`}</dd></div>
                      <div><dt className="font-semibold text-slate-900">Minimum attendees</dt><dd>{course.fundingType === 'unfunded' ? course.minimumAttendees : 'Not applicable'}</dd></div>
                    </dl>
                    {availabilityMessage ? (
                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                        {availabilityMessage}
                      </div>
                    ) : null}
                  </div>
                  {unavailable ? (
                    <Button disabled>{session.status === 'on_hold' ? 'On Hold - no bookings' : 'Booking unavailable'}</Button>
                  ) : (
                    <Link to={`/delegate/book/${course.id}/${session.id}`}>
                      <Button>Book this session</Button>
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </section>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Waiting list</h2>
          {waitingEntry ? <><p className="mt-3 text-sm font-semibold text-emerald-700">You are confirmed on this course waiting list.</p><Link to="/delegate/waiting-lists"><Button variant="secondary" className="mt-4">Manage my waiting lists</Button></Link></> : waitingListAvailable ? <><p className="mt-3 text-sm text-slate-600">Join if the current dates are full or not suitable. The training team can offer you a future session.</p><Button className="mt-4" disabled={waiting} onClick={() => void joinWaitingList()}>{waiting ? 'Joining...' : 'Join waiting list'}</Button></> : <p className="mt-3 text-sm text-slate-600">{activeBooking ? 'You already have an active booking for this course.' : 'A waiting list is not available for this course.'}</p>}
          {waitingMessage ? <p className="mt-3 text-sm font-semibold text-emerald-700">{waitingMessage}</p> : null}
          {waitingError ? <p className="mt-3 text-sm font-semibold text-rose-700">{waitingError}</p> : null}
          <h2 className="mt-8 text-lg font-semibold text-slate-900">Course outcomes</h2>
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
