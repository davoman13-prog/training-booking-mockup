import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'

const anyValue = 'any'

function upcomingSessionCount(locationId: string) {
  return sessions.filter((session) => session.locationId === locationId && session.status === 'scheduled').length
}

function capacityBand(capacity: number) {
  if (capacity < 20) return 'small'
  if (capacity <= 30) return 'medium'
  return 'large'
}

export default function ManageLocationsPage() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') ?? anyValue)
  const [city, setCity] = useState(searchParams.get('city') ?? anyValue)
  const [capacity, setCapacity] = useState(searchParams.get('capacity') ?? anyValue)
  const [sessionAvailability, setSessionAvailability] = useState(searchParams.get('sessions') ?? anyValue)
  const [sortBy, setSortBy] = useState('name-az')

  const cities = useMemo(() => Array.from(new Set(locations.map((location) => location.city))).sort(), [])
  const activeFilterCount = [searchTerm.trim(), activeStatus !== anyValue, city !== anyValue, capacity !== anyValue, sessionAvailability !== anyValue].filter(Boolean).length

  const filteredLocations = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return locations
      .filter((location) => {
        const upcoming = upcomingSessionCount(location.id)
        const searchableText = [
          location.name,
          location.address,
          location.city,
          location.postcode,
          location.roomName,
          location.contactName,
          location.contactEmail,
          location.notes,
        ].join(' ').toLowerCase()

        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesActive = activeStatus === anyValue || (activeStatus === 'active' ? location.isActive : !location.isActive)
        const matchesCity = city === anyValue || location.city === city
        const matchesCapacity = capacity === anyValue || capacityBand(location.capacity) === capacity
        const matchesSessions =
          sessionAvailability === anyValue ||
          (sessionAvailability === 'has_upcoming' && upcoming > 0) ||
          (sessionAvailability === 'none_upcoming' && upcoming === 0)

        return matchesSearch && matchesActive && matchesCity && matchesCapacity && matchesSessions
      })
      .sort((a, b) => {
        if (sortBy === 'name-az') return a.name.localeCompare(b.name)
        if (sortBy === 'name-za') return b.name.localeCompare(a.name)
        if (sortBy === 'city') return a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
        if (sortBy === 'capacity') return b.capacity - a.capacity
        if (sortBy === 'active') return Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)
        if (sortBy === 'sessions') return upcomingSessionCount(b.id) - upcomingSessionCount(a.id)
        return 0
      })
  }, [activeStatus, capacity, city, searchTerm, sessionAvailability, sortBy])

  function clearFilters() {
    setSearchTerm('')
    setActiveStatus(anyValue)
    setCity(anyValue)
    setCapacity(anyValue)
    setSessionAvailability(anyValue)
    setSortBy('name-az')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Locations</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage locations</h1>
        </div>
        <Link to="/admin/locations/new">
          <Button>Add new location</Button>
        </Link>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, address, room, contact, access notes..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <Select value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)}>
              <option value={anyValue}>Active + inactive</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Town / city</label>
            <Select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value={anyValue}>All towns/cities</option>
              {cities.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Capacity</label>
            <Select value={capacity} onChange={(event) => setCapacity(event.target.value)}>
              <option value={anyValue}>All capacities</option>
              <option value="small">Small (&lt;20)</option>
              <option value="medium">Medium (20-30)</option>
              <option value="large">Large (31+)</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sessions</label>
            <Select value={sessionAvailability} onChange={(event) => setSessionAvailability(event.target.value)}>
              <option value={anyValue}>Any session count</option>
              <option value="has_upcoming">Has upcoming sessions</option>
              <option value="none_upcoming">No upcoming sessions</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name-az">Location name A-Z</option>
              <option value="name-za">Location name Z-A</option>
              <option value="city">Town / city</option>
              <option value="capacity">Capacity</option>
              <option value="active">Active status</option>
              <option value="sessions">Upcoming sessions</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredLocations.length} result{filteredLocations.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {activeStatus !== anyValue ? <Badge label={activeStatus} /> : null}
          {city !== anyValue ? <Badge label={city} /> : null}
          {capacity !== anyValue ? <Badge label={`${capacity} capacity`} /> : null}
          {sessionAvailability !== anyValue ? <Badge label={sessionAvailability.replace('_', ' ')} /> : null}
        </div>
      </Card>

      {filteredLocations.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No locations found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another town, contact, or room.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Location', 'Town / city', 'Room', 'Capacity', 'Contact', 'Access notes', 'Status', 'Upcoming', 'Actions']}>
          {filteredLocations.map((location) => (
            <tr key={location.id} className="border-t border-slate-200">
              <td className="px-4 py-4 text-sm">
                <Link to={`/admin/locations/${location.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">
                  {location.name}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{location.address}, {location.postcode}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">{location.city}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{location.roomName}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{location.capacity}</td>
              <td className="px-4 py-4 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{location.contactName}</span>
                <p className="mt-1 text-xs text-slate-500">{location.contactEmail}</p>
                <p className="mt-1 text-xs text-slate-500">{location.contactPhone}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">{location.notes}</td>
              <td className="px-4 py-4 text-sm"><Badge label={location.isActive ? 'active' : 'inactive'} variant={location.isActive ? 'success' : 'default'} /></td>
              <td className="px-4 py-4 text-sm text-slate-700">{upcomingSessionCount(location.id)}</td>
              <td className="px-4 py-4 text-right text-sm">
                <Link to={`/admin/locations/${location.id}/edit`} className="font-semibold text-slate-900 hover:text-cyan-800">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
