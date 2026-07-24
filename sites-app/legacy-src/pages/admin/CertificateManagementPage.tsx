import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'
import useCatalog from '../../hooks/useCatalog'

export default function CertificateManagementPage() {
  const { attendanceRecords, bookings, certificates, courses, delegates, refresh, isLoading } = useCatalog()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')
  const rows = useMemo(() => certificates.filter((certificate) => {
    const delegate = delegates.find((item) => item.id === certificate.delegateId)
    const course = courses.find((item) => item.id === certificate.courseId)
    const haystack = `${certificate.id} ${certificate.bookingId} ${delegate?.name ?? ''} ${course?.title ?? ''}`.toLowerCase()
    return (!search.trim() || haystack.includes(search.trim().toLowerCase())) && (status === 'all' || certificate.status === status)
  }), [certificates, courses, delegates, search, status])

  async function update(certificateId: string, nextStatus: string) {
    setUpdating(certificateId); setError('')
    try {
      const response = await fetch(`/api/certificates/${certificateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The certificate could not be updated.')
      await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The certificate could not be updated.') }
    finally { setUpdating('') }
  }

  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading live certificates...</p></Card>
  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Certificates</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage certificates</h1><p className="mt-2 text-sm text-slate-600">Certificate records are created automatically when attendance is marked attended.</p></div>
    {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
    <Card><div className="grid gap-4 md:grid-cols-[2fr_1fr]"><div><label className="text-sm font-semibold">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Certificate, delegate, course or booking" /></div><div><label className="text-sm font-semibold">Status</label><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="available">Available</option><option value="issued">Issued</option><option value="revoked">Revoked</option></Select></div></div></Card>
    {rows.length ? <Table headers={['Certificate', 'Delegate', 'Course / booking', 'Attendance', 'Issue date', 'Status']}>{rows.map((certificate) => {
      const delegate = delegates.find((item) => item.id === certificate.delegateId)
      const course = courses.find((item) => item.id === certificate.courseId)
      const booking = bookings.find((item) => item.id === certificate.bookingId)
      const attendance = attendanceRecords.find((item) => item.bookingId === certificate.bookingId)
      return <tr key={certificate.id}><td className="px-4 py-4 text-sm font-semibold">{certificate.id}</td><td className="px-4 py-4 text-sm text-slate-700">{delegate?.name}<p className="text-xs">{delegate?.email}</p></td><td className="px-4 py-4 text-sm">{course?.title}<p><Link to={`/admin/bookings/${booking?.id}`} className="font-semibold text-cyan-800">{booking?.id}</Link></p></td><td className="px-4 py-4 text-sm"><Badge label={attendance?.outcome ?? 'pending'} variant={attendance?.outcome === 'attended' ? 'success' : attendance?.outcome === 'absent' ? 'danger' : 'warning'} /></td><td className="px-4 py-4 text-sm text-slate-700">{certificate.issuedDate ? formatDate(certificate.issuedDate) : 'Pending'}</td><td className="px-4 py-4 text-sm"><div className="flex items-center gap-3"><Badge label={certificate.status} variant={certificate.status === 'available' || certificate.status === 'issued' ? 'success' : certificate.status === 'revoked' ? 'danger' : 'warning'} /><Select value={certificate.status} disabled={updating === certificate.id} onChange={(event) => void update(certificate.id, event.target.value)}><option value="pending">Pending</option><option value="available">Available</option><option value="issued">Issued</option><option value="revoked">Revoked</option></Select></div></td></tr>
    })}</Table> : <Card><p className="text-sm font-semibold">No certificates match these filters.</p></Card>}
  </div>
}
