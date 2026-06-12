import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { courses } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

export default function CourseFormPage() {
  const { courseId } = useParams()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId])
  const editing = Boolean(course)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{editing ? 'Edit course' : 'Add course'}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{editing ? course?.title : 'Create new course'}</h1>
      </div>
      <Card>
        <form className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Title</label>
              <Input defaultValue={course?.title ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Funding type</label>
              <Select defaultValue={course?.fundingType ?? 'funded'}>
                <option value="funded">Funded</option>
                <option value="unfunded">Unfunded</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Description</label>
            <Textarea defaultValue={course?.description ?? ''} rows={5} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Price</label>
              <Input defaultValue={course?.price?.toString() ?? ''} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Minimum attendees</label>
              <Input defaultValue={course?.minimumAttendees?.toString() ?? ''} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Duration</label>
              <Input defaultValue={course?.duration ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
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
              <label className="text-sm font-semibold text-slate-900">Location ID</label>
              <Input defaultValue={course?.locationId ?? ''} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>{editing ? 'Save changes' : 'Create course'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
