import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { locations } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LocationFormPage() {
  const { locationId } = useParams()
  const location = useMemo(() => locations.find((item) => item.id === locationId), [locationId])
  const editing = Boolean(location)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{editing ? 'Edit location' : 'Add location'}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{editing ? location?.name : 'Create new location'}</h1>
      </div>
      <Card>
        <form className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Name</label>
              <Input defaultValue={location?.name ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">City</label>
              <Input defaultValue={location?.city ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Address</label>
              <Input defaultValue={location?.address ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Postcode</label>
              <Input defaultValue={location?.postcode ?? ''} />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Capacity</label>
              <Input defaultValue={location?.capacity.toString() ?? ''} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Notes</label>
              <Input defaultValue={location?.notes ?? ''} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>{editing ? 'Save location' : 'Create location'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
