import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bookings, courses, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Course, Session } from '../../types'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function isActive(course: Course) {
  return course.status !== 'cancelled' && course.status !== 'completed'
}

function sessionCapacity(session: Session) {
  return session.attendeeCount + session.availableSeats
}

function sessionDisplayStatus(session: Session, course?: Course) {
  if (session.status === 'cancelled') return 'Cancelled'
  if (session.status === 'completed') return 'Completed'
  if (session.availableSeats <= 0) return 'Full'
  if (course?.status === 'at_risk' || course?.status === 'awaiting_minimum') return 'At risk'
  if (course?.minimumAttendees && session.attendeeCount >= course.minimumAttendees) return 'Confirmed'
  return 'Open'
}

function statusVariant(status: string): BadgeVariant {
  if (status === 'Cancelled') return 'danger'
  if (status === 'Completed' || status === 'Confirmed' || status === 'active') return 'success'
  if (status === 'At risk' || status === 'inactive') return 'warning'
  return 'info'
}

export default function CourseFormPage() {
  const { courseId } = useParams()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId])
  const editing = Boolean(course)
  const [saved, setSaved] = useState(false)
  const [removeMessage, setRemoveMessage] = useState('')
  const [removeSuccess, setRemoveSuccess] = useState(false)
  const categories = useMemo(() => Array.from(new Set(courses.map((item) => item.category))).sort(), [])
  const linkedSessions = useMemo(() => course ? sessions.filter((session) => session.courseId === course.id) : [], [course])
  const linkedBookings = useMemo(() => course ? bookings.filter((booking) => booking.courseId === course.id) : [], [course])
  const upcomingSessions = linkedSessions.filter((session) => session.status === 'scheduled').length
  const canRemoveCourse = editing && linkedBookings.length === 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

  function handleRemoveCourse() {
    if (!course) return

    if (!canRemoveCourse) {
      setRemoveSuccess(false)
      setRemoveMessage('This course cannot be removed because delegates are booked onto one or more sessions.')
      return
    }

    const confirmed = window.confirm(`Mock-only confirmation: remove/archive "${course.title}" from the course list? No real data will be deleted.`)
    if (confirmed) {
      setRemoveSuccess(true)
      setRemoveMessage(`Mock course "${course.title}" removed. No database was updated.`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit course' : 'Add course'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{editing ? `Edit Course: ${course?.title}` : 'Create new course'}</h1>
          {editing ? <p className="mt-2 text-sm text-slate-600">{upcomingSessions} upcoming session{upcomingSessions === 1 ? '' : 's'} linked to this mock course.</p> : null}
        </div>
        <Link to="/admin/courses">
          <Button variant="secondary">Back to courses</Button>
        </Link>
      </div>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Mock course saved. No database was updated.
        </div>
      ) : null}
      {removeMessage ? (
        <div className={`rounded-2xl border p-4 text-sm font-semibold ${removeSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {removeMessage}
          {removeSuccess ? <Link to="/admin/courses" className="ml-2 underline">Return to course list</Link> : null}
        </div>
      ) : null}
      {course ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card><p className="text-sm text-slate-500">Funding</p><p className="mt-2 text-sm font-semibold text-slate-950">{course.fundingType === 'funded' ? 'Funded' : `Unfunded / ${formatCurrency(course.price ?? 0)}`}</p></Card>
          <Card><p className="text-sm text-slate-500">Minimum</p><p className="mt-2 text-3xl font-semibold text-slate-950">{course.minimumAttendees ?? '-'}</p></Card>
          <Card><p className="text-sm text-slate-500">Capacity</p><p className="mt-2 text-3xl font-semibold text-slate-950">{course.capacity}</p></Card>
          <Card><p className="text-sm text-slate-500">Active state</p><p className="mt-2"><Badge label={isActive(course) ? 'active' : 'inactive'} variant={statusVariant(isActive(course) ? 'active' : 'inactive')} /></p></Card>
          <Card><p className="text-sm text-slate-500">Booked delegates</p><p className="mt-2 text-3xl font-semibold text-slate-950">{linkedBookings.length}</p></Card>
        </div>
      ) : null}
      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Course name</label>
              <Input defaultValue={course?.title ?? ''} placeholder="Emergency First Aid at Work" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Category</label>
              <Select defaultValue={course?.category ?? categories[0]}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Description</label>
            <Textarea defaultValue={course?.description ?? ''} rows={5} />
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Funding type</label>
              <Select defaultValue={course?.fundingType ?? 'funded'}>
                <option value="funded">Funded</option>
                <option value="unfunded">Unfunded</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Price</label>
              <Input type="number" defaultValue={course?.price?.toString() ?? ''} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Minimum attendees</label>
              <Input type="number" defaultValue={course?.minimumAttendees?.toString() ?? ''} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Maximum attendees</label>
              <Input type="number" defaultValue={course?.capacity.toString() ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Duration</label>
              <Input defaultValue={course?.duration ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <Select defaultValue={course?.status ?? 'open'}>
                <option value="open">Open</option>
                <option value="awaiting_minimum">Awaiting minimum</option>
                <option value="at_risk">At risk</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Active state</label>
              <Select defaultValue={course && course.status !== 'cancelled' && course.status !== 'completed' ? 'active' : 'inactive'}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Primary location</label>
              <Select defaultValue={course?.locationId ?? locations[0]?.id}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Tags / keywords</label>
            <Input defaultValue={course?.tags.join(', ') ?? ''} placeholder="First aid, clinical, emergency" />
          </div>
          <div className="flex justify-end">
            <Button type="submit">{editing ? 'Save changes' : 'Create course'}</Button>
          </div>
        </form>
      </Card>
      {course ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Associated sessions</h2>
              <p className="mt-1 text-sm text-slate-600">All mock sessions linked to {course.title}.</p>
            </div>
            <Link to={`/admin/sessions/new?courseId=${course.id}`}>
              <Button>Add Session for this Course</Button>
            </Link>
          </div>
          <div className="mt-5">
            {linkedSessions.length ? (
              <Table headers={['Session date', 'Time', 'Location', 'Trainer', 'Capacity', 'Booked', 'Spaces', 'Status', 'Minimum']}>
                {linkedSessions.map((session) => {
                  const location = locations.find((item) => item.id === session.locationId)
                  const displayStatus = sessionDisplayStatus(session, course)
                  const minimumMet = !course.minimumAttendees || session.attendeeCount >= course.minimumAttendees

                  return (
                    <tr key={session.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 text-sm">
                        <Link to={`/admin/sessions/${session.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">{formatDate(session.startDate)}</Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{session.startTime} - {session.endTime}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{session.trainer ?? 'To be confirmed'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{sessionCapacity(session)}</td>
                      <td className="px-4 py-4 text-sm"><Link to={`/admin/sessions/${session.id}/delegates`} className="font-semibold text-cyan-800 hover:text-cyan-950">{session.attendeeCount}</Link></td>
                      <td className="px-4 py-4 text-sm text-slate-700">{session.availableSeats}</td>
                      <td className="px-4 py-4 text-sm"><Badge label={displayStatus} variant={statusVariant(displayStatus)} /></td>
                      <td className="px-4 py-4 text-sm">
                        {course.fundingType === 'unfunded' ? (
                          <Badge label={minimumMet ? 'minimum met' : 'below minimum'} variant={minimumMet ? 'success' : 'warning'} />
                        ) : (
                          <span className="text-slate-500">Not required</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </Table>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No sessions are linked to this course yet.</div>
            )}
          </div>
        </Card>
      ) : null}
      {course ? (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Remove course</h2>
              <p className="mt-1 text-sm text-slate-600">
                {canRemoveCourse
                  ? 'This mock course has no delegate bookings and can be removed in the prototype.'
                  : 'This mock course has delegate bookings and cannot be removed.'}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={handleRemoveCourse}>
              Remove Course
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
