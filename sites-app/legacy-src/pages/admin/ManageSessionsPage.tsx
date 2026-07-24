import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'
import { daysUntilSession, riskExplanation, sessionDisplayStatus, statusVariant } from '../../utils/sessionRules'
import { Session } from '../../types'
import useCatalog from '../../hooks/useCatalog'

const anyValue = 'any'

function sessionCapacity(session: Session) {
  return session.attendeeCount + session.availableSeats
}

export default function ManageSessionsPage() {
  const { courses, locations, sessions, trainers, isLive, isLoading } = useCatalog()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
  const [locationId, setLocationId] = useState(searchParams.get('locationId') ?? anyValue)
  const [trainerId, setTrainerId] = useState(searchParams.get('trainerId') ?? anyValue)
  const [status, setStatus] = useState(statusParam === 'at_risk' ? 'At risk' : searchParams.get('displayStatus') ?? anyValue)
  const [funding, setFunding] = useState(searchParams.get('funding') ?? anyValue)
  const [timing, setTiming] = useState(['upcoming', 'completed', 'cancelled'].includes(statusParam ?? '') ? statusParam ?? anyValue : searchParams.get('timing') ?? anyValue)
  const [sortBy, setSortBy] = useState('date-oldest')

  const statuses = ['Open', 'Confirmed', 'Full', 'At risk', 'On Hold', 'Cancelled', 'Completed']
  const trainerNameById = useCallback((trainerId?: string) => {
    const trainer = trainers.find((item) => item.id === trainerId)
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Unassigned'
  }, [trainers])
  const activeFilterCount = [searchTerm.trim(), locationId !== anyValue, trainerId !== anyValue, status !== anyValue, funding !== anyValue, timing !== anyValue].filter(Boolean).length

  const filteredSessions = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return sessions
      .filter((session) => {
        const course = courses.find((item) => item.id === session.courseId)
        const location = locations.find((item) => item.id === session.locationId)
        const derivedStatus = sessionDisplayStatus(session, course)
        const trainerName = trainerNameById(session.trainerId)
        const searchableText = [course?.title, trainerName, location?.name, derivedStatus].join(' ').toLowerCase()
        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesLocation = locationId === anyValue || session.locationId === locationId
        const matchesTrainer = trainerId === anyValue || session.trainerId === trainerId
        const matchesStatus = status === anyValue || derivedStatus === status
        const matchesFunding = funding === anyValue || course?.fundingType === funding
        const matchesTiming =
          timing === anyValue ||
          (timing === 'upcoming' && session.status === 'scheduled') ||
          (timing === 'completed' && session.status === 'completed') ||
          (timing === 'cancelled' && session.status === 'cancelled')

        return matchesSearch && matchesLocation && matchesTrainer && matchesStatus && matchesFunding && matchesTiming
      })
      .sort((a, b) => {
        const courseA = courses.find((item) => item.id === a.courseId)
        const courseB = courses.find((item) => item.id === b.courseId)
        const locationA = locations.find((item) => item.id === a.locationId)
        const locationB = locations.find((item) => item.id === b.locationId)

        if (sortBy === 'date-oldest') return a.startDate.localeCompare(b.startDate)
        if (sortBy === 'date-newest') return b.startDate.localeCompare(a.startDate)
        if (sortBy === 'course') return (courseA?.title ?? '').localeCompare(courseB?.title ?? '')
        if (sortBy === 'trainer') return trainerNameById(a.trainerId).localeCompare(trainerNameById(b.trainerId))
        if (sortBy === 'location') return (locationA?.name ?? '').localeCompare(locationB?.name ?? '')
        if (sortBy === 'booked') return b.attendeeCount - a.attendeeCount
        if (sortBy === 'spaces') return b.availableSeats - a.availableSeats
        if (sortBy === 'status') return sessionDisplayStatus(a, courseA).localeCompare(sessionDisplayStatus(b, courseB))
        return 0
      })
  }, [courses, funding, locationId, locations, searchTerm, sessions, sortBy, status, timing, trainerId, trainerNameById])

  function clearFilters() {
    setSearchTerm('')
    setLocationId(anyValue)
    setTrainerId(anyValue)
    setStatus(anyValue)
    setFunding(anyValue)
    setTiming(anyValue)
    setSortBy('date-oldest')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Sessions</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage course sessions</h1>
          <p className={`mt-2 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isLive ? 'Connected to the live catalogue' : isLoading ? 'Loading the live catalogue' : 'Live catalogue unavailable'}
          </p>
        </div>
        <Link to="/admin/sessions/new">
          <Button>Add new session</Button>
        </Link>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Course, trainer, location or status" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Location</label>
            <Select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value={anyValue}>All locations</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Trainer</label>
            <Select value={trainerId} onChange={(event) => setTrainerId(event.target.value)}>
              <option value={anyValue}>All trainers</option>
              {trainers.map((item) => <option key={item.id} value={item.id}>{trainerNameById(item.id)}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Funding</label>
            <Select value={funding} onChange={(event) => setFunding(event.target.value)}>
              <option value={anyValue}>All funding</option>
              <option value="funded">Funded</option>
              <option value="unfunded">Unfunded</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Timing</label>
            <Select value={timing} onChange={(event) => setTiming(event.target.value)}>
              <option value={anyValue}>All dates</option>
              <option value="upcoming">Upcoming/open</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="date-oldest">Date oldest</option>
              <option value="date-newest">Date newest</option>
              <option value="course">Course name</option>
              <option value="trainer">Trainer</option>
              <option value="location">Location</option>
              <option value="booked">Booked count</option>
              <option value="spaces">Spaces remaining</option>
              <option value="status">Status</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredSessions.length} result{filteredSessions.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {locationId !== anyValue ? <Badge label={locations.find((location) => location.id === locationId)?.name ?? 'Location'} /> : null}
          {trainerId !== anyValue ? <Badge label={trainerNameById(trainerId)} /> : null}
          {status !== anyValue ? <Badge label={status} /> : null}
          {funding !== anyValue ? <Badge label={funding} /> : null}
          {timing !== anyValue ? <Badge label={timing} /> : null}
        </div>
      </Card>

      {filteredSessions.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No sessions found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another trainer, location, or course.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Session / Course', 'Date', 'Location', 'Trainer', 'Capacity', 'Active bookings', 'Spaces', 'Status', 'Risk', 'Minimum', 'Actions']}>
          {filteredSessions.map((session) => {
            const course = courses.find((item) => item.id === session.courseId)
            const location = locations.find((item) => item.id === session.locationId)
            const derivedStatus = sessionDisplayStatus(session, course)
            const activeBookings = session.attendeeCount
            const minimumMet = !course?.minimumAttendees || activeBookings >= course.minimumAttendees

            return (
              <tr key={session.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm">
                  <Link to={`/admin/sessions/${session.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">
                    {course?.title ?? session.id}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{session.startTime} - {session.endTime}</p>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{formatDate(session.startDate)}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{trainerNameById(session.trainerId)}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{sessionCapacity(session)}</td>
                <td className="px-4 py-4 text-sm"><Link to={`/admin/sessions/${session.id}/delegates`} className="font-semibold text-cyan-800 hover:text-cyan-950">{activeBookings}</Link></td>
                <td className="px-4 py-4 text-sm text-slate-700">{session.availableSeats}</td>
                <td className="px-4 py-4 text-sm"><Badge label={derivedStatus} variant={statusVariant(derivedStatus)} /></td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <p>{daysUntilSession(session)} days</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">{riskExplanation(session, course)}</p>
                </td>
                <td className="px-4 py-4 text-sm">
                  {course?.fundingType === 'unfunded' ? (
                    <Badge label={minimumMet ? `${activeBookings}/${course.minimumAttendees} minimum met` : `${activeBookings}/${course.minimumAttendees} below minimum`} variant={minimumMet ? 'success' : 'warning'} />
                  ) : (
                    <span className="text-slate-500">Not required</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right text-sm">
                  <div className="flex justify-end gap-3">
                    <Link to={`/admin/sessions/${session.id}/delegates`} className="font-semibold text-cyan-800 hover:text-cyan-950">View delegates</Link>
                    <Link to={`/admin/sessions/${session.id}/edit`} className="font-semibold text-slate-900 hover:text-cyan-800">Edit</Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
