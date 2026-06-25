import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courses, locations, sessions } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

export default function CourseFormPage() {
  const { courseId } = useParams()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId])
  const editing = Boolean(course)
  const [saved, setSaved] = useState(false)
  const categories = useMemo(() => Array.from(new Set(courses.map((item) => item.category))).sort(), [])
  const upcomingSessions = course ? sessions.filter((session) => session.courseId === course.id && session.status === 'scheduled').length : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
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
    </div>
  )
}
