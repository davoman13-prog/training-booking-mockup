import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookings, courses, delegates, locations, sessions } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'

const anyValue = 'any'

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [courseId, setCourseId] = useState(anyValue)
  const [sessionId, setSessionId] = useState(anyValue)
  const [locationId, setLocationId] = useState(anyValue)
  const [trainer, setTrainer] = useState(anyValue)
  const [attendanceStatus, setAttendanceStatus] = useState(anyValue)
  const [timing, setTiming] = useState(anyValue)
  const [sortBy, setSortBy] = useState('session-date')

  const trainers = useMemo(() => Array.from(new Set(sessions.map((session) => session.trainer).filter(Boolean))).sort(), [])

  const filteredRows = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return bookings
      .filter((booking) => {
        const delegate = delegates.find((item) => item.id === booking.delegateId)
        const course = courses.find((item) => item.id === booking.courseId)
        const session = sessions.find((item) => item.id === booking.sessionId)
        const location = locations.find((item) => item.id === booking.locationId)
        const attendanceLabel = booking.attendanceMarked ? 'attended marked present' : 'pending not marked'
        const searchableText = [delegate?.name, course?.title, session?.startDate, location?.name, session?.trainer, attendanceLabel].join(' ').toLowerCase()

        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesCourse = courseId === anyValue || booking.courseId === courseId
        const matchesSession = sessionId === anyValue || booking.sessionId === sessionId
        const matchesLocation = locationId === anyValue || booking.locationId === locationId
        const matchesTrainer = trainer === anyValue || session?.trainer === trainer
        const matchesAttendance = attendanceStatus === anyValue || (attendanceStatus === 'attended' ? booking.attendanceMarked : !booking.attendanceMarked)
        const matchesTiming =
          timing === anyValue ||
          (timing === 'upcoming' && session?.status === 'scheduled') ||
          (timing === 'completed' && (session?.status === 'completed' || booking.status === 'completed')) ||
          (timing === 'cancelled' && session?.status === 'cancelled')

        return matchesSearch && matchesCourse && matchesSession && matchesLocation && matchesTrainer && matchesAttendance && matchesTiming
      })
      .sort((a, b) => {
        const delegateA = delegates.find((item) => item.id === a.delegateId)
        const delegateB = delegates.find((item) => item.id === b.delegateId)
        const courseA = courses.find((item) => item.id === a.courseId)
        const courseB = courses.find((item) => item.id === b.courseId)
        const sessionA = sessions.find((item) => item.id === a.sessionId)
        const sessionB = sessions.find((item) => item.id === b.sessionId)
        const locationA = locations.find((item) => item.id === a.locationId)
        const locationB = locations.find((item) => item.id === b.locationId)

        if (sortBy === 'session-date') return (sessionA?.startDate ?? '').localeCompare(sessionB?.startDate ?? '')
        if (sortBy === 'course') return (courseA?.title ?? '').localeCompare(courseB?.title ?? '')
        if (sortBy === 'delegate') return (delegateA?.name ?? '').localeCompare(delegateB?.name ?? '')
        if (sortBy === 'attendance') return Number(a.attendanceMarked) - Number(b.attendanceMarked)
        if (sortBy === 'location') return (locationA?.name ?? '').localeCompare(locationB?.name ?? '')
        return 0
      })
  }, [attendanceStatus, courseId, locationId, searchTerm, sessionId, sortBy, timing, trainer])

  const activeFilterCount = [searchTerm.trim(), courseId !== anyValue, sessionId !== anyValue, locationId !== anyValue, trainer !== anyValue, attendanceStatus !== anyValue, timing !== anyValue].filter(Boolean).length

  function clearFilters() {
    setSearchTerm('')
    setCourseId(anyValue)
    setSessionId(anyValue)
    setLocationId(anyValue)
    setTrainer(anyValue)
    setAttendanceStatus(anyValue)
    setTiming(anyValue)
    setSortBy('session-date')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Attendance</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Mark attendance</h1>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Delegate, course, date, location, trainer..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Course</label>
            <Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value={anyValue}>All courses</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Session</label>
            <Select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
              <option value={anyValue}>All sessions</option>
              {sessions.map((session) => {
                const course = courses.find((item) => item.id === session.courseId)
                return <option key={session.id} value={session.id}>{course?.title} / {session.startDate}</option>
              })}
            </Select>
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
            <Select value={trainer} onChange={(event) => setTrainer(event.target.value)}>
              <option value={anyValue}>All trainers</option>
              {trainers.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="session-date">Session date</option>
              <option value="course">Course name</option>
              <option value="delegate">Delegate name</option>
              <option value="attendance">Attendance status</option>
              <option value="location">Location</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value)}>
            <option value={anyValue}>All attendance statuses</option>
            <option value="attended">Attended</option>
            <option value="pending">Pending / not marked</option>
          </Select>
          <Select value={timing} onChange={(event) => setTiming(event.target.value)}>
            <option value={anyValue}>All session timing</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredRows.length} result{filteredRows.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {attendanceStatus !== anyValue ? <Badge label={attendanceStatus === 'attended' ? 'attended' : 'pending'} /> : null}
          {trainer !== anyValue ? <Badge label={trainer} /> : null}
          {timing !== anyValue ? <Badge label={timing} /> : null}
        </div>
      </Card>

      {filteredRows.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No attendance records found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another delegate, course, or trainer.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Delegate', 'Course / Session', 'Date', 'Location', 'Trainer', 'Attendance', 'Action']}>
          {filteredRows.map((booking) => {
            const delegate = delegates.find((item) => item.id === booking.delegateId)
            const course = courses.find((item) => item.id === booking.courseId)
            const session = sessions.find((item) => item.id === booking.sessionId)
            const location = locations.find((item) => item.id === booking.locationId)

            return (
              <tr key={booking.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate?.name}</Link></td>
                <td className="px-4 py-4 text-sm"><Link to={`/admin/sessions/${session?.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title}</Link><p className="mt-1 text-xs text-slate-500">{session?.startTime} - {session?.endTime}</p></td>
                <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{session?.trainer ?? 'To be confirmed'}</td>
                <td className="px-4 py-4 text-sm"><Badge label={booking.attendanceMarked ? 'Marked' : 'Pending'} variant={booking.attendanceMarked ? 'success' : 'warning'} /></td>
                <td className="px-4 py-4 text-sm"><Button variant={booking.attendanceMarked ? 'secondary' : 'primary'}>{booking.attendanceMarked ? 'Update' : 'Mark attendance'}</Button></td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
