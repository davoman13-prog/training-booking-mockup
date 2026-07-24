import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courses, locations, sessions, trainers } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'
import { Course, Session, Trainer } from '../../types'
import { trainerFullName } from '../../utils/trainerUtils'

function sessionLocation(session: Session) {
  return locations.find((location) => location.id === session.locationId)?.name ?? 'Location to be confirmed'
}

function sessionCourse(session: Session) {
  return courses.find((course) => course.id === session.courseId)
}

function courseActiveLabel(course: Course) {
  return course.status === 'cancelled' || course.status === 'completed' ? 'inactive' : 'active'
}

function trainerSessions(trainer: Trainer) {
  return sessions.filter((session) => session.trainerId === trainer.id)
}

export default function TrainerDetailPage() {
  const { trainerId } = useParams()
  const trainer = trainers.find((item) => item.id === trainerId)
  const [localStatus, setLocalStatus] = useState(trainer?.status)
  const [deleted, setDeleted] = useState(false)
  const [message, setMessage] = useState('')

  const linkedSessions = useMemo(() => (trainer ? trainerSessions(trainer) : []), [trainer])
  const upcomingSessions = linkedSessions.filter((session) => session.status === 'scheduled')
  const completedSessions = linkedSessions.filter((session) => session.status === 'completed')
  const cancelledSessions = linkedSessions.filter((session) => session.status === 'cancelled')

  const deliveredCourses = useMemo(() => {
    const grouped = new Map<string, Session[]>()
    linkedSessions.forEach((session) => {
      const existing = grouped.get(session.courseId) ?? []
      grouped.set(session.courseId, [...existing, session])
    })

    return Array.from(grouped.entries()).map(([courseId, courseSessions]) => {
      const completed = courseSessions.filter((session) => session.status === 'completed')
      const upcoming = courseSessions.filter((session) => session.status === 'scheduled').sort((a, b) => a.startDate.localeCompare(b.startDate))
      const deliveredOrPast = completed.length ? completed : courseSessions.filter((session) => session.startDate <= '2026-07-10')
      const mostRecent = deliveredOrPast.sort((a, b) => b.startDate.localeCompare(a.startDate))[0]

      return {
        course: courses.find((course) => course.id === courseId),
        deliveredCount: completed.length,
        mostRecentDate: mostRecent?.startDate,
        upcomingDate: upcoming[0]?.startDate,
      }
    })
  }, [linkedSessions])

  if (!trainer || deleted) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Trainer not found in the current prototype list.</p>
  }

  const approvedCourses = trainer.approvedCourseIds
    .map((courseId) => courses.find((course) => course.id === courseId))
    .filter((course): course is Course => Boolean(course))
  const displayTrainer = { ...trainer, status: localStatus ?? trainer.status }

  function deleteTrainer() {
    if (!trainer) return

    if (upcomingSessions.length > 0) {
      const makeInactive = window.confirm('This trainer cannot be deleted because they are assigned to one or more upcoming sessions. Make them inactive instead?')
      if (makeInactive) {
        trainer.status = 'inactive'
        setLocalStatus('inactive')
        setMessage('Trainer marked inactive in this prototype. No database was updated.')
      }
      return
    }

    const confirmed = window.confirm('Mock-only confirmation: delete this trainer? Completed historical sessions will remain visible for reporting.')
    if (confirmed) {
      const index = trainers.findIndex((item) => item.id === trainer.id)
      if (index >= 0) trainers.splice(index, 1)
      setDeleted(true)
    }
  }

  function renderSessionRows(rows: Session[]) {
    if (!rows.length) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No sessions in this category.</div>

    return (
      <Table headers={['Course', 'Date', 'Time', 'Location', 'Booked', 'Status']}>
        {rows.map((session) => {
          const course = sessionCourse(session)
          return (
            <tr key={session.id} className="border-t border-slate-200">
              <td className="px-4 py-4 text-sm"><Link to={`/admin/sessions/${session.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title ?? session.id}</Link></td>
              <td className="px-4 py-4 text-sm text-slate-700">{formatDate(session.startDate)}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{session.startTime} - {session.endTime}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{sessionLocation(session)}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{session.attendeeCount}</td>
              <td className="px-4 py-4 text-sm"><Badge label={session.status} variant={session.status === 'cancelled' ? 'danger' : session.status === 'completed' ? 'success' : 'info'} /></td>
            </tr>
          )
        })}
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Trainer detail</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{trainerFullName(displayTrainer)}</h1>
          <p className="mt-2 text-sm text-slate-600">{displayTrainer.organisation} / {displayTrainer.townCity}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/trainers"><Button variant="secondary">Back to trainers</Button></Link>
          <Link to={`/admin/trainers/${trainer.id}/edit`}><Button>Edit Trainer</Button></Link>
          <Button type="button" variant="ghost" onClick={deleteTrainer}>Delete Trainer</Button>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Status</p><p className="mt-2"><Badge label={displayTrainer.status} variant={displayTrainer.status === 'active' ? 'success' : 'warning'} /></p></Card>
        <Card><p className="text-sm text-slate-500">Approved courses</p><p className="mt-2 text-3xl font-semibold text-slate-950">{approvedCourses.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Upcoming sessions</p><p className="mt-2 text-3xl font-semibold text-slate-950">{upcomingSessions.length}</p></Card>
        <Card><p className="text-sm text-slate-500">Completed sessions</p><p className="mt-2 text-3xl font-semibold text-slate-950">{completedSessions.length}</p></Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Trainer details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="font-semibold text-slate-900">Email</dt><dd className="text-slate-600">{displayTrainer.email}</dd></div>
          <div><dt className="font-semibold text-slate-900">Phone</dt><dd className="text-slate-600">{displayTrainer.phone}</dd></div>
          <div><dt className="font-semibold text-slate-900">Alternative phone</dt><dd className="text-slate-600">{displayTrainer.alternativePhone ?? 'Not recorded'}</dd></div>
          <div><dt className="font-semibold text-slate-900">Organisation</dt><dd className="text-slate-600">{displayTrainer.organisation}</dd></div>
          <div><dt className="font-semibold text-slate-900">Address</dt><dd className="text-slate-600">{[displayTrainer.addressLine1, displayTrainer.addressLine2, displayTrainer.townCity, displayTrainer.county, displayTrainer.postcode].filter(Boolean).join(', ')}</dd></div>
          <div><dt className="font-semibold text-slate-900">Created / updated</dt><dd className="text-slate-600">{formatDate(displayTrainer.createdDate)} / {formatDate(displayTrainer.updatedDate)}</dd></div>
          <div className="lg:col-span-3"><dt className="font-semibold text-slate-900">Notes</dt><dd className="text-slate-600">{displayTrainer.notes}</dd></div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Approved courses</h2>
        <div className="mt-5">
          <Table headers={['Course', 'Category', 'Funding', 'Active status']}>
            {approvedCourses.map((course) => (
              <tr key={course.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm"><Link to={`/admin/courses/${course.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course.title}</Link></td>
                <td className="px-4 py-4 text-sm text-slate-700">{course.category}</td>
                <td className="px-4 py-4 text-sm"><Badge label={course.fundingType} variant={course.fundingType === 'funded' ? 'success' : 'warning'} /></td>
                <td className="px-4 py-4 text-sm"><Badge label={courseActiveLabel(course)} variant={courseActiveLabel(course) === 'active' ? 'success' : 'warning'} /></td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Courses delivered</h2>
        <div className="mt-5">
          {deliveredCourses.length ? (
            <Table headers={['Course', 'Sessions delivered', 'Most recent delivery', 'Upcoming delivery']}>
              {deliveredCourses.map((item) => (
                <tr key={item.course?.id} className="border-t border-slate-200">
                  <td className="px-4 py-4 text-sm text-slate-700">{item.course?.title}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{item.deliveredCount}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{item.mostRecentDate ? formatDate(item.mostRecentDate) : 'No completed delivery'}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{item.upcomingDate ? formatDate(item.upcomingDate) : 'None scheduled'}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No delivered or assigned courses yet.</div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-slate-950">Session history</h2>
        <div className="mt-5 space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Upcoming sessions</h3>
            <div className="mt-3">{renderSessionRows(upcomingSessions)}</div>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Completed sessions</h3>
            <div className="mt-3">{renderSessionRows(completedSessions)}</div>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Cancelled sessions</h3>
            <div className="mt-3">{renderSessionRows(cancelledSessions)}</div>
          </section>
        </div>
      </Card>
    </div>
  )
}
