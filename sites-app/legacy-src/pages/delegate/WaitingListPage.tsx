import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import useCatalog from '../../hooks/useCatalog'
import { formatDate } from '../../utils/formatters'

export default function WaitingListPage() {
  const { courses, waitingListEntries, refresh, isLoading } = useCatalog()
  const [removing, setRemoving] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function remove(entryId: string) {
    if (!window.confirm('Leave this course waiting list?')) return
    setRemoving(entryId); setError(''); setMessage('')
    try {
      const response = await fetch(`/api/waiting-list/${entryId}`, { method: 'DELETE' })
      const result = await response.json() as { emailSent?: boolean; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The waiting-list entry could not be removed.')
      await refresh()
      setMessage(result.emailSent ? 'You have left the waiting list and a confirmation email has been sent.' : 'You have left the waiting list, but the confirmation email could not be sent.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The waiting-list entry could not be removed.')
    } finally { setRemoving('') }
  }

  if (isLoading) return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Loading your waiting lists...</p>

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">My waiting lists</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Courses I am waiting for</h1>
        <p className="mt-2 text-sm text-slate-600">The training team can offer you a place when a suitable new session is created.</p>
      </div>
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p> : null}
      {waitingListEntries.length === 0 ? (
        <Card><p className="text-slate-700">You are not currently on any course waiting lists.</p><Link to="/delegate/browse"><Button className="mt-4">Browse courses</Button></Link></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {waitingListEntries.map((entry) => {
            const course = courses.find((item) => item.id === entry.courseId)
            return <Card key={entry.id}>
              <h2 className="text-xl font-semibold text-slate-950">{course?.title ?? 'Course'}</h2>
              <p className="mt-2 text-sm text-slate-600">Joined {formatDate(entry.createdAt.slice(0, 10))}</p>
              <div className="mt-5 flex gap-3">
                <Link to={`/delegate/courses/${entry.courseId}`}><Button variant="ghost">View course</Button></Link>
                <Button variant="secondary" disabled={removing === entry.id} onClick={() => void remove(entry.id)}>{removing === entry.id ? 'Removing...' : 'Leave waiting list'}</Button>
              </div>
            </Card>
          })}
        </div>
      )}
    </div>
  )
}
