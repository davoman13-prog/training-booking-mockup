import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { daysUntilSession, riskExplanation, sessionDisplayStatus as calculatedSessionStatus, statusVariant as calculatedStatusVariant } from '../../utils/sessionRules'
import { Course, Session } from '../../types'
import useCatalog from '../../hooks/useCatalog'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function isActive(course: Course) {
  return course.status !== 'cancelled' && course.status !== 'completed'
}

function sessionCapacity(session: Session) {
  return session.attendeeCount + session.availableSeats
}

function sessionDisplayStatus(session: Session, course?: Course) {
  return calculatedSessionStatus(session, course)
}

function statusVariant(status: string): BadgeVariant {
  if (['Cancelled', 'Completed', 'Confirmed', 'Open', 'Full', 'At risk', 'On Hold'].includes(status)) {
    return calculatedStatusVariant(status as ReturnType<typeof calculatedSessionStatus>)
  }
  if (status === 'Cancelled') return 'danger'
  if (status === 'Completed' || status === 'Confirmed' || status === 'active') return 'success'
  if (status === 'At risk' || status === 'inactive') return 'warning'
  return 'info'
}

export default function CourseFormPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { courses, locations, sessions, trainers, bookings, isLive, isLoading, loadError, refresh } = useCatalog()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId, courses])
  const editing = Boolean(course)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [removeMessage, setRemoveMessage] = useState('')
  const [removeSuccess, setRemoveSuccess] = useState(false)
  const categories = useMemo(() => Array.from(new Set(courses.map((item) => item.category))).sort(), [courses])
  const linkedSessions = useMemo(() => course ? sessions.filter((session) => session.courseId === course.id) : [], [course, sessions])
  const linkedBookings = useMemo(() => course ? bookings.filter((booking) => booking.courseId === course.id) : [], [bookings, course])
  const trainerNameById = (trainerId?: string) => {
    const trainer = trainers.find((item) => item.id === trainerId)
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Unassigned'
  }
  const upcomingSessions = linkedSessions.filter((session) => session.status === 'scheduled').length
  const canRemoveCourse = editing && linkedBookings.length === 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setSaveError('')

    const form = new FormData(event.currentTarget)
    const optionalNumber = (name: string) => {
      const value = String(form.get(name) ?? '').trim()
      return value ? Number(value) : null
    }
    const payload = {
      title: String(form.get('title') ?? ''),
      category: String(form.get('category') ?? ''),
      description: String(form.get('description') ?? ''),
      fundingType: String(form.get('fundingType') ?? 'funded'),
      price: optionalNumber('price'),
      minimumAttendees: optionalNumber('minimumAttendees'),
      capacity: Number(form.get('capacity') ?? 0),
      duration: String(form.get('duration') ?? ''),
      status: String(form.get('status') ?? 'open'),
      locationId: String(form.get('locationId') ?? ''),
      tags: String(form.get('tags') ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    try {
      const response = await fetch(editing ? `/api/courses/${course!.id}` : '/api/courses', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json() as { course?: { id: string }; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The course could not be saved.')

      await refresh()
      setSaved(true)
      if (!editing && result.course?.id) {
        navigate(`/admin/courses/${result.course.id}/edit`, { replace: true })
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The course could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  function handleRemoveCourse() {
    if (!course) return

    if (!canRemoveCourse) {
      setRemoveSuccess(false)
      setRemoveMessage('This course cannot be removed because delegates are booked onto one or more sessions.')
      return
    }

    const confirmed = window.confirm(`Remove "${course.title}" from the live course catalogue?`)
    if (!confirmed) return

    fetch(`/api/courses/${course.id}`, { method: 'DELETE' })
      .then(async (response) => {
        const result = await response.json() as { message?: string }
        if (!response.ok) throw new Error(result.message ?? 'The course could not be removed.')
        setRemoveSuccess(true)
        setRemoveMessage(`Course "${course.title}" was removed from the live catalogue.`)
      })
      .catch((error: unknown) => {
        setRemoveSuccess(false)
        setRemoveMessage(error instanceof Error ? error.message : 'The course could not be removed.')
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit course' : 'Add course'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{editing ? `Edit Course: ${course?.title}` : 'Create new course'}</h1>
          {editing ? <p className="mt-2 text-sm text-slate-600">{upcomingSessions} upcoming session{upcomingSessions === 1 ? '' : 's'} linked to this course.</p> : null}
          <p className={`mt-1 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>{isLive ? 'Connected to the live catalogue' : isLoading ? 'Loading the live catalogue' : 'Live catalogue unavailable'}</p>
        </div>
        <Link to="/admin/courses">
          <Button variant="secondary">Back to courses</Button>
        </Link>
      </div>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Course saved to the live catalogue.
        </div>
      ) : null}
      {saveError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {saveError}
        </div>
      ) : null}
      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {loadError}
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
      {isLoading && !isLive ? (
        <Card>
          <p className="text-sm text-slate-600">Loading the latest course details…</p>
        </Card>
      ) : isLive && (course || !courseId) ? (
      <Card>
        <form
          key={course ? [
            course.id,
            course.title,
            course.category,
            course.fundingType,
            course.price ?? '',
            course.minimumAttendees ?? '',
            course.capacity,
            course.duration,
            course.status,
            course.locationId,
            course.tags.join('|'),
          ].join(':') : 'new-course'}
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Course name</label>
              <Input name="title" required defaultValue={course?.title ?? ''} placeholder="Emergency First Aid at Work" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Category</label>
              <Select name="category" required defaultValue={course?.category ?? categories[0]}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Description</label>
            <Textarea name="description" required defaultValue={course?.description ?? ''} rows={5} />
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Funding type</label>
              <Select name="fundingType" defaultValue={course?.fundingType ?? 'funded'}>
                <option value="funded">Funded</option>
                <option value="unfunded">Unfunded</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Price</label>
              <Input name="price" type="number" min="0" step="0.01" defaultValue={course?.price?.toString() ?? ''} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Minimum attendees</label>
              <Input name="minimumAttendees" type="number" min="1" defaultValue={course?.minimumAttendees?.toString() ?? ''} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Maximum attendees</label>
              <Input name="capacity" required type="number" min="1" defaultValue={course?.capacity.toString() ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Duration</label>
              <Input name="duration" required defaultValue={course?.duration ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <Select name="status" defaultValue={course?.status ?? 'open'}>
                <option value="open">Open</option>
                <option value="awaiting_minimum">Awaiting minimum</option>
                <option value="at_risk">At risk</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Active state</label>
              <Select value={course && course.status !== 'cancelled' && course.status !== 'completed' ? 'active' : 'inactive'} disabled aria-label="Active state is derived from status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Primary location</label>
              <Select name="locationId" required defaultValue={course?.locationId ?? locations[0]?.id}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Tags / keywords</label>
            <Input name="tags" defaultValue={course?.tags.join(', ') ?? ''} placeholder="First aid, clinical, emergency" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create course'}</Button>
          </div>
        </form>
      </Card>
      ) : null}
      {course ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Associated sessions</h2>
              <p className="mt-1 text-sm text-slate-600">All sessions linked to {course.title}.</p>
            </div>
            <Link to={`/admin/sessions/new?courseId=${course.id}`}>
              <Button>Add Session for this Course</Button>
            </Link>
          </div>
          <div className="mt-5">
            {linkedSessions.length ? (
              <Table headers={['Session date', 'Time', 'Location', 'Trainer', 'Capacity', 'Active bookings', 'Spaces', 'Status', 'Risk', 'Minimum']}>
                {linkedSessions.map((session) => {
                  const location = locations.find((item) => item.id === session.locationId)
                  const displayStatus = sessionDisplayStatus(session, course)
                  const activeBookings = session.attendeeCount
                  const minimumMet = !course.minimumAttendees || activeBookings >= course.minimumAttendees

                  return (
                    <tr key={session.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 text-sm">
                        <Link to={`/admin/sessions/${session.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">{formatDate(session.startDate)}</Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{session.startTime} - {session.endTime}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{trainerNameById(session.trainerId)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{sessionCapacity(session)}</td>
                      <td className="px-4 py-4 text-sm"><Link to={`/admin/sessions/${session.id}/delegates`} className="font-semibold text-cyan-800 hover:text-cyan-950">{activeBookings}</Link></td>
                      <td className="px-4 py-4 text-sm text-slate-700">{session.availableSeats}</td>
                      <td className="px-4 py-4 text-sm"><Badge label={displayStatus} variant={statusVariant(displayStatus)} /></td>
                      <td className="px-4 py-4 text-sm text-slate-700"><p>{daysUntilSession(session)} days</p><p className="mt-1 max-w-xs text-xs text-slate-500">{riskExplanation(session, course)}</p></td>
                      <td className="px-4 py-4 text-sm">
                        {course.fundingType === 'unfunded' ? (
                          <Badge label={minimumMet ? `${activeBookings}/${course.minimumAttendees} minimum met` : `${activeBookings}/${course.minimumAttendees} below minimum`} variant={minimumMet ? 'success' : 'warning'} />
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
                  ? 'This course has no delegate bookings and can be removed if it has no linked sessions.'
                  : 'This course has delegate bookings and cannot be removed.'}
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
