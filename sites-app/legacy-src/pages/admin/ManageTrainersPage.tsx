import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { courses, sessions, trainers as initialTrainers } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { Trainer } from '../../types'
import { courseNameById, trainerFullName, trainerSessionCounts } from '../../utils/trainerUtils'

const anyValue = 'any'

function hasUpcomingSessions(trainer: Trainer) {
  return sessions.some((session) => session.trainerId === trainer.id && session.status === 'scheduled')
}

function hasCompletedSessions(trainer: Trainer) {
  return sessions.some((session) => session.trainerId === trainer.id && session.status === 'completed')
}

export default function ManageTrainersPage() {
  const [searchParams] = useSearchParams()
  const [trainerRows, setTrainerRows] = useState(initialTrainers)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? anyValue)
  const [townCity, setTownCity] = useState(searchParams.get('townCity') ?? anyValue)
  const [organisation, setOrganisation] = useState(searchParams.get('organisation') ?? anyValue)
  const [upcoming, setUpcoming] = useState(searchParams.get('upcoming') ?? anyValue)
  const [completed, setCompleted] = useState(searchParams.get('completed') ?? anyValue)
  const [courseFilter, setCourseFilter] = useState(searchParams.get('courseFilter') ?? anyValue)
  const [sortBy, setSortBy] = useState('name')
  const [message, setMessage] = useState('')

  const towns = useMemo(() => Array.from(new Set(trainerRows.map((trainer) => trainer.townCity))).sort(), [trainerRows])
  const organisations = useMemo(() => Array.from(new Set(trainerRows.map((trainer) => trainer.organisation))).sort(), [trainerRows])
  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category))).sort(), [])
  const activeFilterCount = [
    searchTerm.trim(),
    status !== anyValue,
    townCity !== anyValue,
    organisation !== anyValue,
    upcoming !== anyValue,
    completed !== anyValue,
    courseFilter !== anyValue,
  ].filter(Boolean).length

  const filteredTrainers = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return trainerRows
      .filter((trainer) => {
        const approvedNames = trainer.approvedCourseIds.map(courseNameById)
        const approvedCategories = trainer.approvedCourseIds
          .map((courseId) => courses.find((course) => course.id === courseId)?.category)
          .filter(Boolean)
        const searchableText = [
          trainer.firstName,
          trainer.lastName,
          trainerFullName(trainer),
          trainer.email,
          trainer.phone,
          trainer.organisation,
          trainer.townCity,
          trainer.notes,
          approvedNames.join(' '),
        ].join(' ').toLowerCase()

        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesStatus = status === anyValue || trainer.status === status
        const matchesTown = townCity === anyValue || trainer.townCity === townCity
        const matchesOrganisation = organisation === anyValue || trainer.organisation === organisation
        const matchesUpcoming = upcoming === anyValue || (upcoming === 'yes' ? hasUpcomingSessions(trainer) : !hasUpcomingSessions(trainer))
        const matchesCompleted = completed === anyValue || (completed === 'yes' ? hasCompletedSessions(trainer) : !hasCompletedSessions(trainer))
        const matchesCourse =
          courseFilter === anyValue ||
          trainer.approvedCourseIds.includes(courseFilter) ||
          approvedCategories.includes(courseFilter)

        return matchesSearch && matchesStatus && matchesTown && matchesOrganisation && matchesUpcoming && matchesCompleted && matchesCourse
      })
      .sort((a, b) => {
        const countsA = trainerSessionCounts(a.id)
        const countsB = trainerSessionCounts(b.id)

        if (sortBy === 'name') return trainerFullName(a).localeCompare(trainerFullName(b))
        if (sortBy === 'town') return a.townCity.localeCompare(b.townCity) || trainerFullName(a).localeCompare(trainerFullName(b))
        if (sortBy === 'organisation') return a.organisation.localeCompare(b.organisation) || trainerFullName(a).localeCompare(trainerFullName(b))
        if (sortBy === 'approved') return b.approvedCourseIds.length - a.approvedCourseIds.length
        if (sortBy === 'upcoming') return countsB.upcoming - countsA.upcoming
        if (sortBy === 'completed') return countsB.completed - countsA.completed
        if (sortBy === 'status') return a.status.localeCompare(b.status) || trainerFullName(a).localeCompare(trainerFullName(b))
        return 0
      })
  }, [completed, courseFilter, organisation, searchTerm, sortBy, status, townCity, trainerRows, upcoming])

  function clearFilters() {
    setSearchTerm('')
    setStatus(anyValue)
    setTownCity(anyValue)
    setOrganisation(anyValue)
    setUpcoming(anyValue)
    setCompleted(anyValue)
    setCourseFilter(anyValue)
    setSortBy('name')
  }

  function deleteTrainer(trainer: Trainer) {
    if (hasUpcomingSessions(trainer)) {
      const makeInactive = window.confirm('This trainer cannot be deleted because they are assigned to one or more upcoming sessions. Make them inactive instead?')
      if (makeInactive) {
        setTrainerRows((current) => current.map((item) => (item.id === trainer.id ? { ...item, status: 'inactive' } : item)))
        setMessage(`${trainerFullName(trainer)} was marked inactive in this prototype. No database was updated.`)
      }
      return
    }

    const confirmed = window.confirm(`Mock-only confirmation: delete ${trainerFullName(trainer)}? Historical completed sessions will remain visible for reporting.`)
    if (confirmed) {
      setTrainerRows((current) => current.filter((item) => item.id !== trainer.id))
      setMessage(`${trainerFullName(trainer)} was deleted from the local prototype list. Historical records remain in mock session history.`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Trainers</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage trainers</h1>
        </div>
        <Link to="/admin/trainers/new">
          <Button>Add Trainer</Button>
        </Link>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div> : null}

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1fr_0.8fr_0.8fr_1fr_0.9fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, email, phone, notes or courses" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Town/city</label>
            <Select value={townCity} onChange={(event) => setTownCity(event.target.value)}>
              <option value={anyValue}>All towns</option>
              {towns.map((town) => <option key={town} value={town}>{town}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Organisation</label>
            <Select value={organisation} onChange={(event) => setOrganisation(event.target.value)}>
              <option value={anyValue}>All organisations</option>
              {organisations.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Upcoming</label>
            <Select value={upcoming} onChange={(event) => setUpcoming(event.target.value)}>
              <option value={anyValue}>Any</option>
              <option value="yes">Has upcoming</option>
              <option value="no">No upcoming</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Completed</label>
            <Select value={completed} onChange={(event) => setCompleted(event.target.value)}>
              <option value={anyValue}>Any</option>
              <option value="yes">Has completed</option>
              <option value="no">No completed</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Course/category</label>
            <Select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
              <option value={anyValue}>All courses/categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name">Trainer name</option>
              <option value="town">Town/city</option>
              <option value="organisation">Organisation</option>
              <option value="approved">Approved courses</option>
              <option value="upcoming">Upcoming sessions</option>
              <option value="completed">Completed sessions</option>
              <option value="status">Active status</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredTrainers.length} result{filteredTrainers.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {status !== anyValue ? <Badge label={status} /> : null}
          {townCity !== anyValue ? <Badge label={townCity} /> : null}
          {organisation !== anyValue ? <Badge label={organisation} /> : null}
          {courseFilter !== anyValue ? <Badge label={courses.find((course) => course.id === courseFilter)?.title ?? courseFilter} /> : null}
        </div>
      </Card>

      {filteredTrainers.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No trainers found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another course, town, organisation, or trainer note.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Trainer', 'Email', 'Phone', 'Organisation', 'Town/city', 'Status', 'Approved', 'Upcoming', 'Completed', 'Actions']}>
          {filteredTrainers.map((trainer) => {
            const counts = trainerSessionCounts(trainer.id)

            return (
              <tr key={trainer.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm">
                  <Link to={`/admin/trainers/${trainer.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{trainerFullName(trainer)}</Link>
                  <p className="mt-1 text-xs text-slate-500">{trainer.firstName} / {trainer.lastName}</p>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{trainer.email}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{trainer.phone}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{trainer.organisation}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{trainer.townCity}</td>
                <td className="px-4 py-4 text-sm"><Badge label={trainer.status} variant={trainer.status === 'active' ? 'success' : 'warning'} /></td>
                <td className="px-4 py-4 text-sm text-slate-700">{trainer.approvedCourseIds.length}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{counts.upcoming}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{counts.completed}</td>
                <td className="px-4 py-4 text-right text-sm">
                  <div className="flex justify-end gap-3">
                    <Link to={`/admin/trainers/${trainer.id}/edit`} className="font-semibold text-slate-900 hover:text-cyan-800">Edit</Link>
                    <button type="button" className="font-semibold text-rose-700 hover:text-rose-900" onClick={() => deleteTrainer(trainer)}>Delete</button>
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
