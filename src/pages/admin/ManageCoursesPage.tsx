import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { courses, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Course } from '../../types'

const anyValue = 'any'

const lastUpdatedByCourse: Record<string, string> = {
  'course-1': '2026-06-04',
  'course-2': '2026-06-08',
  'course-3': '2026-06-01',
  'course-4': '2026-04-22',
  'course-5': '2026-05-30',
  'course-6': '2026-06-10',
}

function isActive(course: Course) {
  return course.status !== 'cancelled' && course.status !== 'completed'
}

function upcomingSessionCount(course: Course) {
  return sessions.filter((session) => session.courseId === course.id && session.status === 'scheduled').length
}

function lastUpdated(course: Course) {
  const courseNumber = Number(course.id.replace('course-', ''))
  return lastUpdatedByCourse[course.id] ?? `2026-06-${String((courseNumber % 20) + 1).padStart(2, '0')}`
}

function durationSortValue(duration: string) {
  if (duration.includes('half')) return 0.5
  const number = Number.parseFloat(duration)
  return Number.isNaN(number) ? 0 : number
}

export default function ManageCoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState(anyValue)
  const [funding, setFunding] = useState(anyValue)
  const [active, setActive] = useState(anyValue)
  const [status, setStatus] = useState(anyValue)
  const [sortBy, setSortBy] = useState('name-az')

  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category))).sort(), [])
  const statuses = useMemo(() => Array.from(new Set(courses.map((course) => course.status))).sort(), [])
  const activeFilterCount = [searchTerm.trim(), category !== anyValue, funding !== anyValue, active !== anyValue, status !== anyValue].filter(Boolean).length

  const filteredCourses = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return courses
      .filter((course) => {
        const searchableText = [course.title, course.category, course.description, course.tags.join(' ')].join(' ').toLowerCase()
        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesCategory = category === anyValue || course.category === category
        const matchesFunding = funding === anyValue || course.fundingType === funding
        const matchesActive = active === anyValue || (active === 'active' ? isActive(course) : !isActive(course))
        const matchesStatus = status === anyValue || course.status === status

        return matchesSearch && matchesCategory && matchesFunding && matchesActive && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'name-az') return a.title.localeCompare(b.title)
        if (sortBy === 'name-za') return b.title.localeCompare(a.title)
        if (sortBy === 'category') return a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
        if (sortBy === 'price') return (a.price ?? 0) - (b.price ?? 0)
        if (sortBy === 'duration') return durationSortValue(a.duration) - durationSortValue(b.duration)
        if (sortBy === 'minimum') return (a.minimumAttendees ?? 0) - (b.minimumAttendees ?? 0)
        if (sortBy === 'sessions') return upcomingSessionCount(b) - upcomingSessionCount(a)
        if (sortBy === 'updated') return lastUpdated(b).localeCompare(lastUpdated(a))
        return 0
      })
  }, [active, category, funding, searchTerm, sortBy, status])

  function clearFilters() {
    setSearchTerm('')
    setCategory(anyValue)
    setFunding(anyValue)
    setActive(anyValue)
    setStatus(anyValue)
    setSortBy('name-az')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Courses</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage course catalogue</h1>
        </div>
        <Link to="/admin/courses/new">
          <Button>Add new course</Button>
        </Link>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Course name, category, description or tag" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Category</label>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value={anyValue}>All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
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
            <label className="text-sm font-semibold text-slate-900">Active</label>
            <Select value={active} onChange={(event) => setActive(event.target.value)}>
              <option value={anyValue}>Active + inactive</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name-az">Course name A-Z</option>
              <option value="name-za">Course name Z-A</option>
              <option value="category">Category</option>
              <option value="price">Price</option>
              <option value="duration">Duration</option>
              <option value="minimum">Minimum attendees</option>
              <option value="sessions">Upcoming sessions</option>
              <option value="updated">Last updated</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredCourses.length} result{filteredCourses.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {category !== anyValue ? <Badge label={category} /> : null}
          {funding !== anyValue ? <Badge label={funding} /> : null}
          {active !== anyValue ? <Badge label={active} /> : null}
          {status !== anyValue ? <Badge label={status.replace('_', ' ')} /> : null}
        </div>
      </Card>

      {filteredCourses.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No courses found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or changing the search term.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Course', 'Category', 'Funding', 'Duration', 'Min / Max', 'Active', 'Upcoming', 'Status', 'Updated', 'Actions']}>
          {filteredCourses.map((course) => (
            <tr key={course.id} className="border-t border-slate-200">
              <td className="px-4 py-4 text-sm">
                <Link to={`/admin/courses/${course.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">
                  {course.title}
                </Link>
                <p className="mt-1 max-w-xs text-xs text-slate-500">{course.description}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">{course.category}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{course.fundingType === 'funded' ? 'Funded' : formatCurrency(course.price ?? 0)}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{course.duration}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{course.minimumAttendees ?? '-'} / {course.capacity}</td>
              <td className="px-4 py-4 text-sm"><Badge label={isActive(course) ? 'active' : 'inactive'} variant={isActive(course) ? 'success' : 'default'} /></td>
              <td className="px-4 py-4 text-sm text-slate-700">{upcomingSessionCount(course)}</td>
              <td className="px-4 py-4 text-sm"><Badge label={course.status.replace('_', ' ')} variant={course.status === 'open' ? 'success' : course.status === 'cancelled' ? 'danger' : 'warning'} /></td>
              <td className="px-4 py-4 text-sm text-slate-700">{formatDate(lastUpdated(course))}</td>
              <td className="px-4 py-4 text-right text-sm">
                <Link to={`/admin/courses/${course.id}/edit`} className="font-semibold text-slate-900 hover:text-cyan-800">Edit</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
