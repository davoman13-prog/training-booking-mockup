import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import useCatalog from '../../hooks/useCatalog'

export default function LocationFormPage() {
  const { locationId } = useParams()
  const navigate = useNavigate()
  const { locations, sessions, isLive, isLoading, loadError, refresh } = useCatalog()
  const location = useMemo(() => locations.find((item) => item.id === locationId), [locationId, locations])
  const editing = Boolean(location)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const upcomingSessions = location ? sessions.filter((session) => session.locationId === location.id && session.status === 'scheduled').length : 0
  const linkedSessions = location ? sessions.filter((session) => session.locationId === location.id).length : 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    setSaveError('')
    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') ?? ''), roomName: String(form.get('roomName') ?? ''),
      address: String(form.get('address') ?? ''), city: String(form.get('city') ?? ''),
      postcode: String(form.get('postcode') ?? ''), capacity: Number(form.get('capacity') ?? 0),
      isActive: form.get('isActive') === 'active', contactName: String(form.get('contactName') ?? ''),
      contactPhone: String(form.get('contactPhone') ?? ''), contactEmail: String(form.get('contactEmail') ?? ''),
      notes: String(form.get('notes') ?? ''),
    }
    try {
      const response = await fetch(editing ? `/api/locations/${location!.id}` : '/api/locations', {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const result = await response.json() as { location?: { id: string }; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The location could not be saved.')
      await refresh()
      setSaved(true)
      if (!editing && result.location?.id) navigate(`/admin/locations/${result.location.id}/edit`, { replace: true })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The location could not be saved.')
    }
  }

  async function handleRemove() {
    if (!location) return
    setSaveError('')
    try {
      const response = await fetch(`/api/locations/${location.id}`, { method: 'DELETE' })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The location could not be removed.')
      navigate('/admin/locations', { replace: true })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The location could not be removed.')
      setConfirmingRemove(false)
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit location' : 'Add location'}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{editing ? `Edit Location: ${location?.name}` : 'Create new location'}</h1>
        {editing ? <p className="mt-2 text-sm text-slate-600">{upcomingSessions} upcoming session{upcomingSessions === 1 ? '' : 's'} currently linked to this venue.</p> : null}
        <p className={`mt-1 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>{isLive ? 'Connected to the live catalogue' : isLoading ? 'Loading the live catalogue' : 'Live catalogue unavailable'}</p>
      </div>
      <Link to="/admin/locations"><Button variant="secondary">Back to locations</Button></Link>
    </div>
    {saved ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Location saved to the live catalogue.</div> : null}
    {saveError || loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{saveError || loadError}</div> : null}
    {isLoading && !isLive ? <Card><p>Loading the latest location details…</p></Card> : isLive ? <Card>
      <form key={location ? `${location.id}:${location.name}:${location.capacity}:${location.contactEmail}` : 'new-location'} className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div><label className="text-sm font-semibold text-slate-900">Location name</label><Input name="name" required defaultValue={location?.name ?? ''} /></div>
          <div><label className="text-sm font-semibold text-slate-900">Room name</label><Input name="roomName" required defaultValue={location?.roomName ?? ''} /></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div><label className="text-sm font-semibold text-slate-900">Address</label><Input name="address" required defaultValue={location?.address ?? ''} /></div>
          <div><label className="text-sm font-semibold text-slate-900">Town / city</label><Input name="city" required defaultValue={location?.city ?? ''} /></div>
          <div><label className="text-sm font-semibold text-slate-900">Postcode</label><Input name="postcode" required defaultValue={location?.postcode ?? ''} /></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <div><label className="text-sm font-semibold text-slate-900">Room capacity</label><Input name="capacity" required min="1" type="number" defaultValue={location?.capacity.toString() ?? ''} /></div>
          <div><label className="text-sm font-semibold text-slate-900">Active status</label><Select name="isActive" defaultValue={location?.isActive === false ? 'inactive' : 'active'}><option value="active">Active</option><option value="inactive">Inactive</option></Select></div>
          <div><label className="text-sm font-semibold text-slate-900">Contact name</label><Input name="contactName" required defaultValue={location?.contactName ?? ''} /></div>
          <div><label className="text-sm font-semibold text-slate-900">Contact phone</label><Input name="contactPhone" required defaultValue={location?.contactPhone ?? ''} /></div>
        </div>
        <div><label className="text-sm font-semibold text-slate-900">Contact email</label><Input name="contactEmail" required type="email" defaultValue={location?.contactEmail ?? ''} /></div>
        <div><label className="text-sm font-semibold text-slate-900">Parking / access notes</label><Textarea name="notes" defaultValue={location?.notes ?? ''} rows={4} /></div>
        <div className="flex justify-end"><Button type="submit">{editing ? 'Save location' : 'Create location'}</Button></div>
      </form>
    </Card> : null}
    {location ? <Card><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-semibold text-slate-950">Remove location</h2><p className="mt-1 text-sm text-slate-600">{linkedSessions ? 'This location is linked to sessions and cannot be removed.' : 'Removal is available only when no courses or sessions are linked.'}</p></div>
      {confirmingRemove ? <div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setConfirmingRemove(false)}>Cancel</Button><Button type="button" onClick={handleRemove}>Confirm removal</Button></div> : <Button type="button" variant="secondary" onClick={() => setConfirmingRemove(true)}>Remove location</Button>}
    </div></Card> : null}
  </div>
}
