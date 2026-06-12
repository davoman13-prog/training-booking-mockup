import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { sessions } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

export default function SessionFormPage() {
  const { sessionId } = useParams()
  const session = useMemo(() => sessions.find((item) => item.id === sessionId), [sessionId])
  const editing = Boolean(session)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{editing ? 'Edit session' : 'Add session'}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{editing ? session?.id : 'Create new session'}</h1>
      </div>
      <Card>
        <form className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Course ID</label>
              <Input defaultValue={session?.courseId ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Location ID</label>
              <Input defaultValue={session?.locationId ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Status</label>
              <Select defaultValue={session?.status ?? 'scheduled'}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Start date</label>
              <Input type="date" defaultValue={session?.startDate ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">End date</label>
              <Input type="date" defaultValue={session?.endDate ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Available seats</label>
              <Input defaultValue={session?.availableSeats.toString() ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Start time</label>
              <Input type="time" defaultValue={session?.startTime ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">End time</label>
              <Input type="time" defaultValue={session?.endTime ?? ''} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>{editing ? 'Save session' : 'Create session'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
