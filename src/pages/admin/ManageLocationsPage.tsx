import { Link } from 'react-router-dom'
import { locations } from '../../data/mockData'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Card from '../../components/ui/Card'

export default function ManageLocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Locations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage locations</h1>
        </div>
        <Link to="/admin/locations/new">
          <Button>Add new location</Button>
        </Link>
      </div>
      <Table headers={['Name', 'City', 'Capacity', 'Actions']}>
        {locations.map((location) => (
          <tr key={location.id} className="border-t border-slate-200">
            <td className="px-4 py-4 text-sm text-slate-700">{location.name}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{location.city}</td>
            <td className="px-4 py-4 text-sm text-slate-700">{location.capacity}</td>
            <td className="px-4 py-4 text-sm text-right">
              <Link to={`/admin/locations/${location.id}/edit`} className="text-slate-900 hover:text-slate-700">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
