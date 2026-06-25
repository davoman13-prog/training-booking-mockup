import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { locations, sessions } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'

export default function LocationFormPage() {
  const { locationId } = useParams()
  const location = useMemo(() => locations.find((item) => item.id === locationId), [locationId])
  const editing = Boolean(location)
  const [saved, setSaved] = useState(false)
  const upcomingSessions = location ? sessions.filter((session) => session.locationId === location.id && session.status === 'scheduled').length : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit location' : 'Add location'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{editing ? `Edit Location: ${location?.name}` : 'Create new location'}</h1>
          {editing ? <p className="mt-2 text-sm text-slate-600">{upcomingSessions} upcoming session{upcomingSessions === 1 ? '' : 's'} currently linked to this venue.</p> : null}
        </div>
        <Link to="/admin/locations">
          <Button variant="secondary">Back to locations</Button>
        </Link>
      </div>
      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Mock location saved. No database was updated.
        </div>
      ) : null}
      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Location name</label>
              <Input defaultValue={location?.name ?? ''} placeholder="Leicester Training Centre" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Room name</label>
              <Input defaultValue={location?.roomName ?? ''} placeholder="Riverside Training Suite" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-900">Address</label>
              <Input defaultValue={location?.address ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Town / city</label>
              <Input defaultValue={location?.city ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Postcode</label>
              <Input defaultValue={location?.postcode ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Room capacity</label>
              <Input type="number" defaultValue={location?.capacity.toString() ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Active status</label>
              <Select defaultValue={location?.isActive ? 'active' : 'inactive'}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Contact name</label>
              <Input defaultValue={location?.contactName ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Contact phone</label>
              <Input defaultValue={location?.contactPhone ?? ''} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Contact email</label>
            <Input type="email" defaultValue={location?.contactEmail ?? ''} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Parking / access notes</label>
            <Textarea defaultValue={location?.notes ?? ''} rows={4} />
          </div>
          <div className="flex justify-end">
            <Button type="submit">{editing ? 'Save location' : 'Create location'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
