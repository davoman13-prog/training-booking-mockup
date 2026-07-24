import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { bookings, certificates, invoices } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { formatDate } from '../../utils/formatters'
import Table from '../../components/ui/Table'
import { allDelegates } from './delegateUtils'
import { daysUntilSession, riskExplanation, sessionDisplayStatus, statusVariant } from '../../utils/sessionRules'
import { SessionStatus } from '../../types'
import useCatalog from '../../hooks/useCatalog'

interface SessionFormState {
  courseId: string
  locationId: string
  trainerId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  capacity: string
  attendeeCount: string
  status: SessionStatus
}

const draftStorageKey = 'kalu-session-form-draft'

function readDraft() {
  const raw = window.sessionStorage.getItem(draftStorageKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionFormState
  } catch {
    window.sessionStorage.removeItem(draftStorageKey)
    return null
  }
}

export default function SessionFormPage() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const preselectedCourseId = searchParams.get('courseId') ?? undefined
  const returnedTrainerId = searchParams.get('trainerId') ?? undefined
  const { courses, locations, sessions, trainers, isLive, isLoading, loadError, refresh } = useCatalog()
  const session = useMemo(() => sessions.find((item) => item.id === sessionId), [sessionId, sessions])
  const editing = Boolean(session)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [removeError, setRemoveError] = useState('')
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const capacity = session ? session.attendeeCount + session.availableSeats : 0
  const [formState, setFormState] = useState<SessionFormState>(() => {
    const draft = readDraft()
    if (draft && returnedTrainerId) {
      window.sessionStorage.removeItem(draftStorageKey)
      return { ...draft, trainerId: returnedTrainerId }
    }

    return {
      courseId: session?.courseId ?? preselectedCourseId ?? courses[0]?.id ?? '',
      locationId: session?.locationId ?? locations[0]?.id ?? '',
      trainerId: returnedTrainerId ?? session?.trainerId ?? '',
      startDate: session?.startDate ?? '',
      endDate: session?.endDate ?? '',
      startTime: session?.startTime ?? '',
      endTime: session?.endTime ?? '',
      capacity: session ? capacity.toString() : '',
      attendeeCount: session?.attendeeCount.toString() ?? '',
      status: session?.status ?? 'scheduled',
    }
  })
  useEffect(() => {
    if (!isLive) return
    // Live data replaces the prototype seed once the catalogue request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormState(session ? {
        courseId: session.courseId,
        locationId: session.locationId,
        trainerId: session.trainerId ?? '',
        startDate: session.startDate,
        endDate: session.endDate,
        startTime: session.startTime,
        endTime: session.endTime,
        capacity: (session.attendeeCount + session.availableSeats).toString(),
        attendeeCount: session.attendeeCount.toString(),
        status: session.status,
      } : {
        courseId: preselectedCourseId ?? courses[0]?.id ?? '',
        locationId: locations[0]?.id ?? '',
        trainerId: returnedTrainerId ?? '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        capacity: '',
        attendeeCount: '0',
        status: 'scheduled',
      })
  }, [courses, isLive, locations, preselectedCourseId, returnedTrainerId, session])
  const course = courses.find((item) => item.id === formState.courseId)
  const sessionBookings = session ? bookings.filter((booking) => booking.sessionId === session.id) : []
  const spacesRemaining = session?.availableSeats ?? 0
  const findTrainer = (trainerId?: string) => trainers.find((trainer) => trainer.id === trainerId)
  const trainerNameById = (trainerId?: string) => {
    const trainer = findTrainer(trainerId)
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Unassigned'
  }
  const selectedTrainer = findTrainer(formState.trainerId)
  const trainerInvalidForCourse = Boolean(formState.trainerId && (!selectedTrainer || selectedTrainer.status !== 'active' || !selectedTrainer.approvedCourseIds.includes(formState.courseId)))
  const trainerOptions = trainers
    .filter((trainer) => trainer.status === 'active' && trainer.approvedCourseIds.includes(formState.courseId))
    .sort((a, b) => {
      return trainerNameById(a.id).localeCompare(trainerNameById(b.id))
    })

  function updateForm<K extends keyof SessionFormState>(key: K, value: SessionFormState[K]) {
    setFormState((current) => {
      if (key === 'courseId') {
        const nextCourseId = value as string
        const currentTrainer = findTrainer(current.trainerId)
        const trainerStillValid = currentTrainer?.status === 'active' && currentTrainer.approvedCourseIds.includes(nextCourseId)
        return { ...current, courseId: nextCourseId, trainerId: trainerStillValid ? current.trainerId : '' }
      }

      return { ...current, [key]: value }
    })
  }

  function persistDraft() {
    window.sessionStorage.setItem(draftStorageKey, JSON.stringify(formState))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (trainerInvalidForCourse) {
      setSaveError('Choose an active trainer approved for the selected course before saving this session.')
      setSaved(false)
      return
    }
    setSaveError('')
    setSaved(false)

    const payload = {
      courseId: formState.courseId,
      locationId: formState.locationId,
      trainerId: formState.trainerId || null,
      startDate: formState.startDate,
      endDate: formState.endDate,
      startTime: formState.startTime,
      endTime: formState.endTime,
      capacity: Number(formState.capacity),
      attendeeCount: Number(formState.attendeeCount || 0),
      status: formState.status,
    }

    try {
      const response = await fetch(editing ? `/api/sessions/${session!.id}` : '/api/sessions', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json() as { session?: { id: string }; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The session could not be saved.')
      await refresh()
      setSaved(true)
      if (!editing && result.session?.id) {
        navigate(`/admin/sessions/${result.session.id}/edit`, { replace: true })
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The session could not be saved.')
    }
  }

  async function handleRemove() {
    if (!session) return
    if (session.attendeeCount > 0) {
      setRemoveError('This session cannot be removed because it has booked delegates.')
      return
    }
    setRemoveError('')
    try {
      const response = await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The session could not be removed.')
      navigate('/admin/sessions', { replace: true })
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : 'The session could not be removed.')
    }
  }

  function openAddTrainer() {
    persistDraft()
    navigate(`/admin/trainers/new?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`)
  }

  function openEditTrainer() {
    if (!formState.trainerId) return
    persistDraft()
    navigate(`/admin/trainers/${formState.trainerId}/edit?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit session' : 'Add session'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {editing ? `Edit Session: ${course?.title ?? session?.id} - ${session ? formatDate(session.startDate) : ''}` : 'Create new session'}
          </h1>
          <p className={`mt-1 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isLive ? 'Connected to the live catalogue' : isLoading ? 'Loading the live catalogue' : 'Live catalogue unavailable'}
          </p>
          {!editing && course ? <p className="mt-2 text-sm text-slate-600">Creating a mock session for {course.title}.</p> : null}
        </div>
        <Link to={course && !editing ? `/admin/courses/${course.id}/edit` : '/admin/sessions'}>
          <Button variant="secondary">Back to sessions</Button>
        </Link>
      </div>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Session saved to the live catalogue.
          {course ? <Link to={`/admin/courses/${course.id}/edit`} className="ml-2 underline">Return to course page</Link> : null}
        </div>
      ) : null}
      {saveError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{saveError}</div>
      ) : null}
      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{loadError}</div>
      ) : null}
      {removeError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{removeError}</div>
      ) : null}
      {course && !editing ? (
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Selected course</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{course.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{course.category} / {course.fundingType === 'funded' ? 'Funded' : `Unfunded, minimum ${course.minimumAttendees ?? '-'} delegates`}</p>
        </Card>
      ) : null}
      {isLoading && !isLive ? (
        <Card><p className="text-sm text-slate-600">Loading the latest session details…</p></Card>
      ) : isLive ? (
      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Course</label>
              <Select name="courseId" value={formState.courseId} onChange={(event) => updateForm('courseId', event.target.value)}>
                {courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Location</label>
              <Select name="locationId" value={formState.locationId} onChange={(event) => updateForm('locationId', event.target.value)}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Trainer</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select name="trainerId" value={formState.trainerId} onChange={(event) => updateForm('trainerId', event.target.value)}>
                  <option value="">Select active approved trainer</option>
                  {trainerOptions.map((trainer) => {
                    return (
                      <option key={trainer.id} value={trainer.id}>
                        {trainerNameById(trainer.id)} (approved)
                      </option>
                    )
                  })}
                </Select>
                <Button type="button" variant="secondary" onClick={openAddTrainer} className="shrink-0">Add New Trainer</Button>
                <Button type="button" variant="ghost" onClick={openEditTrainer} disabled={!formState.trainerId} className="shrink-0">Edit Selected</Button>
              </div>
              {trainerInvalidForCourse ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">This existing trainer assignment is invalid for the selected course. Choose an active approved trainer before saving.</p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Start date</label>
              <Input name="startDate" required type="date" value={formState.startDate} onChange={(event) => updateForm('startDate', event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">End date</label>
              <Input name="endDate" required type="date" value={formState.endDate} onChange={(event) => updateForm('endDate', event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Start time</label>
              <Input name="startTime" required type="time" value={formState.startTime} onChange={(event) => updateForm('startTime', event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">End time</label>
              <Input name="endTime" required type="time" value={formState.endTime} onChange={(event) => updateForm('endTime', event.target.value)} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Capacity</label>
              <Input name="capacity" required min="1" type="number" value={formState.capacity} onChange={(event) => updateForm('capacity', event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Booked count</label>
              <Input name="attendeeCount" min="0" type="number" value={formState.attendeeCount} onChange={(event) => updateForm('attendeeCount', event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Spaces remaining</label>
              <Input name="availableSeats" type="number" value={Math.max(Number(formState.capacity || 0) - Number(formState.attendeeCount || 0), 0)} disabled aria-label="Spaces remaining is calculated" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <Select name="status" value={formState.status} onChange={(event) => updateForm('status', event.target.value as SessionFormState['status'])}>
                <option value="scheduled">Open / scheduled</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">{editing ? 'Save session' : 'Create session'}</Button>
          </div>
        </form>
      </Card>
      ) : null}
      {session ? (
        <>
          <div className="grid gap-4 lg:grid-cols-5">
            <Card><p className="text-sm text-slate-500">Course</p><p className="mt-2 text-sm font-semibold text-slate-950">{course?.title}</p></Card>
            <Card><p className="text-sm text-slate-500">Capacity</p><p className="mt-2 text-3xl font-semibold text-slate-950">{capacity}</p></Card>
            <Card><p className="text-sm text-slate-500">Booked</p><p className="mt-2 text-3xl font-semibold text-slate-950">{session.attendeeCount}</p></Card>
            <Card><p className="text-sm text-slate-500">Spaces</p><p className="mt-2 text-3xl font-semibold text-slate-950">{spacesRemaining}</p></Card>
            <Card><p className="text-sm text-slate-500">Status</p><p className="mt-2"><Badge label={sessionDisplayStatus(session, course)} variant={statusVariant(sessionDisplayStatus(session, course))} /></p></Card>
          </div>

          <Card>
            <h2 className="text-xl font-semibold text-slate-950">Risk and minimum numbers</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="font-semibold text-slate-900">Active bookings</dt><dd className="text-slate-600">{session.attendeeCount}</dd></div>
              <div><dt className="font-semibold text-slate-900">Minimum attendees</dt><dd className="text-slate-600">{course?.minimumAttendees ?? 'Not required'}</dd></div>
              <div><dt className="font-semibold text-slate-900">Days until session</dt><dd className="text-slate-600">{daysUntilSession(session)}</dd></div>
            </dl>
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{riskExplanation(session, course)}</p>
          </Card>

          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Delegates booked onto this session</h2>
                <p className="mt-1 text-sm text-slate-600">Read-only mock booking records for this session.</p>
              </div>
              <Link to={`/admin/sessions/${session.id}/delegates`}>
                <Button variant="secondary">Open delegates view</Button>
              </Link>
            </div>
            <div className="mt-5">
              {sessionBookings.length ? (
                <Table headers={['Delegate', 'Email', 'Phone', 'Practice', 'Manager', 'Booking', 'Booking status', 'Attendance', 'Invoice', 'Certificate']}>
                  {sessionBookings.map((booking) => {
                    const delegate = allDelegates().find((item) => item.id === booking.delegateId)
                    const invoice = invoices.find((item) => item.id === booking.invoiceId)
                    const certificate = certificates.find((item) => item.id === booking.certificateId)

                    return (
                      <tr key={booking.id} className="border-t border-slate-200">
                        <td className="px-4 py-4 text-sm"><Link to={`/admin/delegates/${delegate?.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate?.name}</Link></td>
                        <td className="px-4 py-4 text-sm text-slate-700">{delegate?.email}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{delegate?.phone ?? 'Not recorded'}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{delegate?.organisation}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{delegate?.managerName}<p className="mt-1 text-xs text-slate-500">{delegate?.managerEmail}</p></td>
                        <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{booking.id}</Link></td>
                        <td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={booking.status === 'cancelled' ? 'danger' : booking.status === 'pending' ? 'warning' : 'success'} /></td>
                        <td className="px-4 py-4 text-sm"><Badge label={booking.attendanceMarked ? 'attended' : 'not marked'} variant={booking.attendanceMarked ? 'success' : 'warning'} /></td>
                        <td className="px-4 py-4 text-sm text-slate-700">{invoice ? invoice.status.replace('_', ' ') : 'not required'}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{certificate?.status ?? 'pending'}</td>
                      </tr>
                    )
                  })}
                </Table>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No delegates are booked onto this session yet.</div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Remove session</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {session.attendeeCount > 0
                    ? 'This session has booked delegates and cannot be removed.'
                    : 'This session has no booked delegates and can be removed.'}
                </p>
              </div>
              {confirmingRemove ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-sm font-semibold text-red-700">Remove this session permanently?</span>
                  <Button type="button" variant="secondary" onClick={() => setConfirmingRemove(false)}>Cancel</Button>
                  <Button type="button" onClick={handleRemove}>Confirm removal</Button>
                </div>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setConfirmingRemove(true)}>Remove session</Button>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
