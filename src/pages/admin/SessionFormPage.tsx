import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courses, locations, sessions } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { formatDate } from '../../utils/formatters'

export default function SessionFormPage() {
  const { sessionId } = useParams()
  const session = useMemo(() => sessions.find((item) => item.id === sessionId), [sessionId])
  const course = courses.find((item) => item.id === session?.courseId)
  const editing = Boolean(session)
  const [saved, setSaved] = useState(false)
  const capacity = session ? session.attendeeCount + session.availableSeats : ''

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
        </div>
        <Link to="/admin/sessions">
          <Button variant="secondary">Back to sessions</Button>
        </Link>
      </div>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Mock session saved. No database was updated.
        </div>
      ) : null}
      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Course</label>
              <Select defaultValue={session?.courseId ?? courses[0]?.id}>
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
              <Input type="number" defaultValue={capacity.toString()} />
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
    </div>
  )
}
