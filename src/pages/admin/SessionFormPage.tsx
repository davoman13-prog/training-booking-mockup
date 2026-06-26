import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { bookings, certificates, courses, invoices, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { formatDate } from '../../utils/formatters'
import Table from '../../components/ui/Table'
import { allDelegates } from './delegateUtils'

export default function SessionFormPage() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const preselectedCourseId = searchParams.get('courseId') ?? undefined
  const session = useMemo(() => sessions.find((item) => item.id === sessionId), [sessionId])
  const course = courses.find((item) => item.id === (session?.courseId ?? preselectedCourseId))
  const editing = Boolean(session)
  const [saved, setSaved] = useState(false)
  const capacity = session ? session.attendeeCount + session.availableSeats : 0
  const sessionBookings = session ? bookings.filter((booking) => booking.sessionId === session.id) : []
  const spacesRemaining = session ? Math.max(capacity - sessionBookings.length, 0) : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit session' : 'Add session'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {editing ? `Edit Session: ${course?.title ?? session?.id} - ${session ? formatDate(session.startDate) : ''}` : 'Create new session'}
          </h1>
          {!editing && course ? <p className="mt-2 text-sm text-slate-600">Creating a mock session for {course.title}.</p> : null}
        </div>
        <Link to={course && !editing ? `/admin/courses/${course.id}/edit` : '/admin/sessions'}>
          <Button variant="secondary">Back to sessions</Button>
        </Link>
      </div>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Mock session saved. No database was updated.
          {course ? <Link to={`/admin/courses/${course.id}/edit`} className="ml-2 underline">Return to course page</Link> : null}
        </div>
      ) : null}
      {course && !editing ? (
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Selected course</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{course.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{course.category} / {course.fundingType === 'funded' ? 'Funded' : `Unfunded, minimum ${course.minimumAttendees ?? '-'} delegates`}</p>
        </Card>
      ) : null}
      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Course</label>
              <Select defaultValue={session?.courseId ?? preselectedCourseId ?? courses[0]?.id}>
                {courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Location</label>
              <Select defaultValue={session?.locationId ?? locations[0]?.id}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Trainer</label>
              <Input defaultValue={session?.trainer ?? ''} placeholder="Trainer name" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Start date</label>
              <Input type="date" defaultValue={session?.startDate ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">End date</label>
              <Input type="date" defaultValue={session?.endDate ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Start time</label>
              <Input type="time" defaultValue={session?.startTime ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">End time</label>
              <Input type="time" defaultValue={session?.endTime ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Capacity</label>
              <Input type="number" defaultValue={session ? capacity.toString() : ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Booked count</label>
              <Input type="number" defaultValue={session?.attendeeCount.toString() ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Spaces remaining</label>
              <Input type="number" defaultValue={session?.availableSeats.toString() ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <Select defaultValue={session?.status ?? 'scheduled'}>
                <option value="scheduled">Open / scheduled</option>
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
      {session ? (
        <>
          <div className="grid gap-4 lg:grid-cols-5">
            <Card><p className="text-sm text-slate-500">Course</p><p className="mt-2 text-sm font-semibold text-slate-950">{course?.title}</p></Card>
            <Card><p className="text-sm text-slate-500">Capacity</p><p className="mt-2 text-3xl font-semibold text-slate-950">{capacity}</p></Card>
            <Card><p className="text-sm text-slate-500">Booked</p><p className="mt-2 text-3xl font-semibold text-slate-950">{sessionBookings.length}</p></Card>
            <Card><p className="text-sm text-slate-500">Spaces</p><p className="mt-2 text-3xl font-semibold text-slate-950">{spacesRemaining}</p></Card>
            <Card><p className="text-sm text-slate-500">Status</p><p className="mt-2"><Badge label={session.status} variant={session.status === 'cancelled' ? 'danger' : session.status === 'completed' ? 'success' : 'info'} /></p></Card>
          </div>

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
        </>
      ) : null}
    </div>
  )
}
