import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { formatCurrency, formatDate } from '../../utils/formatters'
import useCatalog from '../../hooks/useCatalog'

const anyValue = 'any'

export default function BrowseCoursesPage() {
  const { courses, locations, sessions, isLive } = useCatalog()
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState(anyValue)
  const [funding, setFunding] = useState(anyValue)
  const [locationId, setLocationId] = useState(anyValue)
  const [availability, setAvailability] = useState(anyValue)

  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category))).sort(), [courses])
  const activeFilterCount = [searchTerm.trim(), category !== anyValue, funding !== anyValue, locationId !== anyValue, availability !== anyValue].filter(Boolean).length

  const filteredCourses = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return courses.filter((course) => {
      const courseSessions = sessions.filter((session) => session.courseId === course.id)
      const searchableText = [course.title, course.description, course.category, course.tags.join(' ')].join(' ').toLowerCase()
      const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
      const matchesCategory = category === anyValue || course.category === category
      const matchesFunding = funding === anyValue || course.fundingType === funding
      const matchesLocation = locationId === anyValue || course.locationId === locationId || courseSessions.some((session) => session.locationId === locationId)
      const matchesAvailability =
        availability === anyValue ||
        (availability === 'available' && courseSessions.some((session) => session.status === 'scheduled' && session.availableSeats > 0)) ||
        (availability === 'cancelled' && courseSessions.some((session) => session.status === 'cancelled')) ||
        (availability === 'completed' && courseSessions.some((session) => session.status === 'completed'))

      return matchesSearch && matchesCategory && matchesFunding && matchesLocation && matchesAvailability
    })
  }, [availability, category, courses, funding, locationId, searchTerm, sessions])

  function clearFilters() {
    setSearchTerm('')
    setCategory(anyValue)
    setFunding(anyValue)
    setLocationId(anyValue)
    setAvailability(anyValue)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Course browsing</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Browse available training</h1>
          <p className="mt-2 text-sm text-slate-600">
            Search across {courses.length} courses and choose a session to book.
            <span className={`ml-2 font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isLive ? 'Live catalogue' : 'Loading catalogue'}
            </span>
          </p>
        </div>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title, description, category or tags"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Category</label>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value={anyValue}>All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
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
            <label className="text-sm font-semibold text-slate-900">Location</label>
            <Select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value={anyValue}>All locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sessions</label>
            <Select value={availability} onChange={(event) => setAvailability(event.target.value)}>
              <option value={anyValue}>Any status</option>
              <option value="available">Available spaces</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredCourses.length} result{filteredCourses.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} variant="default" /> : null}
          {category !== anyValue ? <Badge label={category} variant="default" /> : null}
          {funding !== anyValue ? <Badge label={funding} variant="default" /> : null}
          {locationId !== anyValue ? <Badge label={locations.find((location) => location.id === locationId)?.name ?? 'Location'} variant="default" /> : null}
          {availability !== anyValue ? <Badge label={availability === 'available' ? 'Available spaces' : availability} variant="default" /> : null}
        </div>
      </Card>

      {filteredCourses.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No results found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching for another topic.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const courseSessions = sessions.filter((session) => session.courseId === course.id)
            const firstAvailableSession = courseSessions.find((session) => session.status === 'scheduled' && session.availableSeats > 0)
            const courseLocation = locations.find((location) => location.id === course.locationId)

            return (
              <Card key={course.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">{course.category}</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">{course.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{course.description}</p>
                  </div>
                  <Badge
                    label={course.status.replace('_', ' ')}
                    variant={course.status === 'open' ? 'success' : course.status === 'cancelled' ? 'danger' : 'warning'}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.duration}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.fundingType === 'funded' ? 'Funded' : 'Unfunded'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{courseLocation?.name}</span>
                  {course.price ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{formatCurrency(course.price)}</span> : null}
                </div>
                <div className="mt-4 rounded-2xl bg-cyan-50 p-3 text-sm text-slate-700">
                  {firstAvailableSession ? (
                    <span>Next session: {formatDate(firstAvailableSession.startDate)} / {firstAvailableSession.availableSeats} spaces</span>
                  ) : (
                    <span>No available scheduled sessions</span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{tag}</span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Link to={`/delegate/courses/${course.id}`} className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
                    View details
                  </Link>
                  <Link to={firstAvailableSession ? `/delegate/book/${course.id}/${firstAvailableSession.id}` : `/delegate/courses/${course.id}`}>
                    <Button disabled={!firstAvailableSession}>Book now</Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
