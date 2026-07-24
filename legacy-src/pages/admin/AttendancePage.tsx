import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'
import useCatalog from '../../hooks/useCatalog'

export default function AttendancePage() {
  const { attendanceRecords, bookings, courses, delegates, locations, sessions, trainers, refresh, isLoading } = useCatalog()
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('all')
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')

  const rows = useMemo(() => bookings.filter((booking) => booking.status !== 'cancelled').filter((booking) => {
    const delegate = delegates.find((item) => item.id === booking.delegateId)
    const course = courses.find((item) => item.id === booking.courseId)
    const session = sessions.find((item) => item.id === booking.sessionId)
    const record = attendanceRecords.find((item) => item.bookingId === booking.id)
    const currentOutcome = record?.outcome ?? (booking.attendanceMarked ? 'attended' : 'pending')
    const haystack = `${booking.id} ${delegate?.name ?? ''} ${course?.title ?? ''} ${session?.startDate ?? ''}`.toLowerCase()
    return (!search.trim() || haystack.includes(search.trim().toLowerCase())) && (outcome === 'all' || currentOutcome === outcome)
  }), [attendanceRecords, bookings, courses, delegates, outcome, search, sessions])

  async function updateAttendance(bookingId: string, nextOutcome: string) {
    setUpdating(bookingId); setError('')
    try {
      const response = await fetch(`/api/attendance/${bookingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: nextOutcome }),
      })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Attendance could not be updated.')
      await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Attendance could not be updated.') }
    finally { setUpdating('') }
  }

  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading live attendance records...</p></Card>
  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Attendance</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Mark attendance</h1>
      <p className="mt-2 text-sm text-slate-600">Changes are saved immediately to the booking’s attendance record.</p>
    </div>
    {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
    <Card><div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <div><label className="text-sm font-semibold">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Delegate, booking, course or date" /></div>
      <div><label className="text-sm font-semibold">Attendance outcome</label><Select value={outcome} onChange={(event) => setOutcome(event.target.value)}>
        <option value="all">All outcomes</option><option value="pending">Pending</option><option value="attended">Attended</option><option value="absent">Absent</option>
      </Select></div>
    </div></Card>
    {rows.length ? <Table headers={['Delegate', 'Course / session', 'Location / trainer', 'Booking', 'Attendance']}>
      {rows.map((booking) => {
        const delegate = delegates.find((item) => item.id === booking.delegateId)
        const course = courses.find((item) => item.id === booking.courseId)
        const session = sessions.find((item) => item.id === booking.sessionId)
        const location = locations.find((item) => item.id === booking.locationId)
        const trainer = trainers.find((item) => item.id === session?.trainerId)
        const record = attendanceRecords.find((item) => item.bookingId === booking.id)
        const currentOutcome = record?.outcome ?? (booking.attendanceMarked ? 'attended' : 'pending')
        return <tr key={booking.id}>
          <td className="px-4 py-4 text-sm"><Link to={`/admin/delegates/${delegate?.id}`} className="font-semibold text-cyan-800">{delegate?.name}</Link><p className="mt-1 text-xs text-slate-500">{delegate?.email}</p></td>
          <td className="px-4 py-4 text-sm text-slate-700">{course?.title}<p className="mt-1 text-xs">{session ? formatDate(session.startDate) : 'Date unavailable'} / {session?.startTime}</p></td>
          <td className="px-4 py-4 text-sm text-slate-700">{location?.name}<p className="mt-1 text-xs">{trainer ? `${trainer.firstName} ${trainer.lastName}` : 'Unassigned'}</p></td>
          <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800">{booking.id}</Link></td>
          <td className="px-4 py-4 text-sm"><div className="flex items-center gap-3">
            <Badge label={currentOutcome} variant={currentOutcome === 'attended' ? 'success' : currentOutcome === 'absent' ? 'danger' : 'warning'} />
            <Select value={currentOutcome} disabled={updating === booking.id} onChange={(event) => void updateAttendance(booking.id, event.target.value)}>
              <option value="pending">Pending</option><option value="attended">Attended</option><option value="absent">Absent</option>
            </Select>
          </div></td>
        </tr>
      })}
    </Table> : <Card><p className="text-sm font-semibold text-slate-900">No attendance records match these filters.</p></Card>}
  </div>
}
