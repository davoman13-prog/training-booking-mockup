import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import useCatalog from '../../hooks/useCatalog'
import { canBookSession } from '../../utils/sessionRules'
import { formatDate } from '../../utils/formatters'

export default function WaitingListsPage() {
  const [searchParams] = useSearchParams()
  const { courses, delegates, sessions, waitingListEntries, refresh, isLoading } = useCatalog()
  const initialCourseId = searchParams.get('courseId') ?? ''
  const initialSessionId = searchParams.get('sessionId') ?? ''
  const [courseId, setCourseId] = useState(initialCourseId)
  const [sessionId, setSessionId] = useState(initialSessionId)
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const courseEntries = useMemo(() => waitingListEntries.filter((entry) => entry.courseId === courseId), [courseId, waitingListEntries])
  const course = courses.find((item) => item.id === courseId)
  const eligibleSessions = sessions.filter((session) => session.courseId === courseId && canBookSession(session, course))
  const waitingCourses = courses
    .map((item) => ({ course: item, count: waitingListEntries.filter((entry) => entry.courseId === item.id).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.course.title.localeCompare(b.course.title))

  function chooseCourse(nextCourseId: string) {
    setCourseId(nextCourseId); setSessionId(''); setSelected([]); setMessage(''); setError('')
  }

  async function bookSelected() {
    if (!sessionId || !selected.length) return
    setSaving(true); setMessage(''); setError('')
    try {
      const response = await fetch('/api/waiting-list/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, delegateIds: selected }),
      })
      const result = await response.json() as { booked?: number; emailsSent?: number; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The waiting delegates could not be booked.')
      await refresh()
      setSelected([])
      setMessage(`${result.booked ?? 0} delegate${result.booked === 1 ? '' : 's'} booked; ${result.emailsSent ?? 0} confirmation email${result.emailsSent === 1 ? '' : 's'} sent.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The waiting delegates could not be booked.')
    } finally { setSaving(false) }
  }

  if (isLoading) return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Loading waiting lists...</p>

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Waiting lists</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Course demand</h1><p className="mt-2 text-sm text-slate-600">See demand immediately and offer suitable session places to selected delegates.</p></div>
      <Badge label={`${waitingListEntries.length} waiting`} variant={waitingListEntries.length ? 'warning' : 'success'} />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {waitingCourses.map(({ course: item, count }) => <button type="button" key={item.id} onClick={() => chooseCourse(item.id)} className={`rounded-2xl text-left ${courseId === item.id ? 'ring-2 ring-cyan-500 ring-offset-2' : ''}`}><Card><p className="text-sm text-slate-500">Waiting delegates</p><p className="mt-2 text-3xl font-semibold text-slate-950">{count}</p><p className="mt-2 font-semibold text-cyan-800">{item.title}</p></Card></button>)}
    </div>
    {waitingCourses.length === 0 ? <Card><p className="text-slate-700">No delegates are currently waiting for a course.</p></Card> : null}
    {courseId ? <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">{course?.title}</h2><p className="mt-1 text-sm text-slate-600">{courseEntries.length} waiting delegate{courseEntries.length === 1 ? '' : 's'}</p></div><Link to={`/admin/sessions/new?courseId=${courseId}`}><Button>Create another session</Button></Link></div>
      <div className="mt-5"><label className="text-sm font-semibold text-slate-900">Session to offer</label><Select value={sessionId} onChange={(event) => setSessionId(event.target.value)}><option value="">Choose a suitable session</option>{eligibleSessions.map((session) => <option key={session.id} value={session.id}>{formatDate(session.startDate)} · {session.startTime} · {session.availableSeats} spaces</option>)}</Select></div>
      <div className="mt-5 space-y-3">{courseEntries.map((entry) => { const delegate = delegates.find((item) => item.id === entry.delegateId); return <label key={entry.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><input type="checkbox" className="mt-1 h-4 w-4" checked={selected.includes(entry.delegateId)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, entry.delegateId] : current.filter((id) => id !== entry.delegateId))} /><span><span className="font-semibold text-slate-950">{delegate?.name}</span><span className="block text-sm text-slate-600">{delegate?.email} · {delegate?.organisation}</span></span></label> })}</div>
      {message ? <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
      <div className="mt-5"><Button disabled={!sessionId || !selected.length || saving} onClick={() => void bookSelected()}>{saving ? 'Booking delegates...' : `Book selected delegates (${selected.length})`}</Button></div>
    </Card> : null}
  </div>
}
