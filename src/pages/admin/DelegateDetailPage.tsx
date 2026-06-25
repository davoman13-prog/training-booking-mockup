import { FormEvent, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bookings, certificates, courses, delegates, invoices, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import Textarea from '../../components/ui/Textarea'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Delegate } from '../../types'
import { delegateStats, enrichDelegate } from './delegateUtils'

function splitName(name: string) {
  const [firstName, ...rest] = name.split(' ')
  return { firstName, lastName: rest.join(' ') }
}

export default function DelegateDetailPage() {
  const { delegateId } = useParams()
  const baseDelegate = useMemo(() => delegates.find((item) => item.id === delegateId), [delegateId])
  const [delegateOverride, setDelegateOverride] = useState<Delegate | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmAnonymise, setConfirmAnonymise] = useState(false)
  const [deleted, setDeleted] = useState(false)

  if (!baseDelegate) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Delegate not found.</p>
  }

  const delegate = delegateOverride ?? enrichDelegate(baseDelegate)
  const stats = delegateStats(delegate.id)
  const { firstName, lastName } = splitName(delegate.name)
  const delegateBookings = bookings.filter((booking) => booking.delegateId === delegate.id)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
  }

  function handleDelete() {
    setDeleted(true)
    setConfirmDelete(false)
  }

  function handleAnonymise() {
    setDelegateOverride({
      ...delegate,
      name: 'Anonymised Delegate',
      email: `anonymised-${delegate.id}@example.test`,
      phone: 'Removed',
      managerName: 'Removed',
      managerEmail: 'removed@example.test',
      accountStatus: 'anonymised',
      adminNotes: 'Anonymised in mockup. Training history retained for reporting.',
    })
    setConfirmAnonymise(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Delegate detail</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{delegate.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{delegate.organisation} / registered {delegate.registrationDate ? formatDate(delegate.registrationDate) : 'Unknown'}</p>
        </div>
        <Link to="/admin/delegates">
          <Button variant="secondary">Back to delegates</Button>
        </Link>
      </div>

      {deleted ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">Deleted in mockup. No real data was removed.</div> : null}
      {saved ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Mock delegate saved. No backend was updated.</div> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Courses booked</p><p className="mt-2 text-3xl font-semibold text-slate-950">{stats.booked}</p></Card>
        <Card><p className="text-sm text-slate-500">Upcoming</p><p className="mt-2 text-3xl font-semibold text-slate-950">{stats.upcoming}</p></Card>
        <Card><p className="text-sm text-slate-500">Outstanding invoices</p><p className="mt-2 text-3xl font-semibold text-slate-950">{formatCurrency(stats.outstandingInvoiceValue)}</p></Card>
        <Card><p className="text-sm text-slate-500">Certificates available</p><p className="mt-2 text-3xl font-semibold text-slate-950">{stats.certificatesAvailable}</p></Card>
      </div>

      <Card>
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div><label className="text-sm font-semibold text-slate-900">First name</label><Input defaultValue={firstName} /></div>
            <div><label className="text-sm font-semibold text-slate-900">Last name</label><Input defaultValue={lastName} /></div>
            <div><label className="text-sm font-semibold text-slate-900">Account status</label><Select defaultValue={delegate.accountStatus ?? 'active'}><option value="active">Active</option><option value="inactive">Inactive</option><option value="anonymised">Anonymised</option></Select></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div><label className="text-sm font-semibold text-slate-900">Email</label><Input defaultValue={delegate.email} /></div>
            <div><label className="text-sm font-semibold text-slate-900">Phone</label><Input defaultValue={delegate.phone ?? ''} /></div>
            <div><label className="text-sm font-semibold text-slate-900">Practice / organisation</label><Input defaultValue={delegate.organisation} /></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div><label className="text-sm font-semibold text-slate-900">Practice manager name</label><Input defaultValue={delegate.managerName} /></div>
            <div><label className="text-sm font-semibold text-slate-900">Practice manager email</label><Input defaultValue={delegate.managerEmail} /></div>
          </div>
          <div><label className="text-sm font-semibold text-slate-900">Admin notes</label><Textarea rows={4} defaultValue={delegate.adminNotes ?? ''} /></div>
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => setConfirmAnonymise(true)}>Anonymise delegate</Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete delegate</Button>
            </div>
            <Button type="submit">Save delegate</Button>
          </div>
        </form>
      </Card>

      {confirmDelete ? (
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-rose-800">Delete delegate mock action</h2>
            <p className="text-sm text-slate-600">In a real system this would remove the delegate and related personal data. This prototype only shows a mock deleted status.</p>
            <div className="flex gap-3"><Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button type="button" onClick={handleDelete}>Confirm mock delete</Button></div>
          </div>
        </Card>
      ) : null}

      {confirmAnonymise ? (
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-amber-800">Anonymise delegate mock action</h2>
            <p className="text-sm text-slate-600">Personal identifiers will be replaced while non-personal training history remains visible for reporting in this mockup.</p>
            <div className="flex gap-3"><Button type="button" variant="ghost" onClick={() => setConfirmAnonymise(false)}>Cancel</Button><Button type="button" onClick={handleAnonymise}>Confirm anonymise</Button></div>
          </div>
        </Card>
      ) : null}

      <Table headers={['Course', 'Session', 'Location', 'Booking', 'Status', 'Attendance', 'Invoice', 'Certificate', 'Funding']}>
        {delegateBookings.map((booking) => {
          const course = courses.find((item) => item.id === booking.courseId)
          const session = sessions.find((item) => item.id === booking.sessionId)
          const location = locations.find((item) => item.id === booking.locationId)
          const invoice = invoices.find((item) => item.id === booking.invoiceId)
          const certificate = certificates.find((item) => item.id === booking.certificateId)

          return (
            <tr key={booking.id} className="border-t border-slate-200">
              <td className="px-4 py-4 text-sm"><Link to={`/admin/courses/${course?.id}/edit`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title}</Link></td>
              <td className="px-4 py-4 text-sm"><Link to={`/admin/sessions/${session?.id}/delegates`} className="font-semibold text-cyan-800 hover:text-cyan-950">{session ? formatDate(session.startDate) : '-'}</Link></td>
              <td className="px-4 py-4 text-sm text-slate-700">{location?.name}</td>
              <td className="px-4 py-4 text-sm"><Link to={`/admin/bookings/${booking.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{booking.id}</Link></td>
              <td className="px-4 py-4 text-sm"><Badge label={booking.status} variant={booking.status === 'cancelled' ? 'danger' : booking.status === 'pending' ? 'warning' : 'success'} /></td>
              <td className="px-4 py-4 text-sm"><Badge label={booking.attendanceMarked ? 'attended' : 'not marked'} variant={booking.attendanceMarked ? 'success' : 'warning'} /></td>
              <td className="px-4 py-4 text-sm">{invoice?.status ?? 'not required'}</td>
              <td className="px-4 py-4 text-sm">{certificate?.status ?? 'pending'}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{course?.fundingType}{course?.price ? ` / ${formatCurrency(course.price)}` : ''}</td>
            </tr>
          )
        })}
      </Table>
    </div>
  )
}
