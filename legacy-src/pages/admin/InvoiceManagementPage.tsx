import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'
import useCatalog from '../../hooks/useCatalog'

export default function InvoiceManagementPage() {
  const { bookings, courses, delegates, invoices, refresh, isLoading } = useCatalog()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')
  const rows = useMemo(() => invoices.filter((invoice) => {
    const delegate = delegates.find((item) => item.id === invoice.delegateId)
    const course = courses.find((item) => item.id === invoice.courseId)
    const haystack = `${invoice.id} ${invoice.bookingId} ${delegate?.name ?? ''} ${delegate?.organisation ?? ''} ${course?.title ?? ''}`.toLowerCase()
    return (!search.trim() || haystack.includes(search.trim().toLowerCase())) && (status === 'all' || invoice.status === status)
  }), [courses, delegates, invoices, search, status])

  async function update(invoiceId: string, nextStatus: string) {
    setUpdating(invoiceId); setError('')
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      const result = await response.json() as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The invoice could not be updated.')
      await refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The invoice could not be updated.') }
    finally { setUpdating('') }
  }

  if (isLoading) return <Card><p className="text-sm text-slate-700">Loading live invoices...</p></Card>
  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Invoices</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage invoices</h1><p className="mt-2 text-sm text-slate-600">Invoice status changes are stored immediately.</p></div>
    {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p> : null}
    <Card><div className="grid gap-4 md:grid-cols-[2fr_1fr]"><div><label className="text-sm font-semibold">Search</label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice, delegate, organisation, course or booking" /></div><div><label className="text-sm font-semibold">Status</label><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="issued">Issued</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></Select></div></div></Card>
    {rows.length ? <Table headers={['Invoice', 'Delegate', 'Course / booking', 'Amount', 'Issued / due', 'Status']}>{rows.map((invoice) => {
      const delegate = delegates.find((item) => item.id === invoice.delegateId)
      const course = courses.find((item) => item.id === invoice.courseId)
      const booking = bookings.find((item) => item.id === invoice.bookingId)
      return <tr key={invoice.id}><td className="px-4 py-4 text-sm font-semibold text-slate-900">{invoice.id}</td><td className="px-4 py-4 text-sm text-slate-700">{delegate?.name}<p className="text-xs">{delegate?.organisation}</p></td><td className="px-4 py-4 text-sm"><span>{course?.title}</span><p><Link to={`/admin/bookings/${booking?.id}`} className="font-semibold text-cyan-800">{booking?.id}</Link></p></td><td className="px-4 py-4 text-sm font-semibold">{formatCurrency(invoice.amount)}</td><td className="px-4 py-4 text-sm text-slate-700">{invoice.issuedDate ? formatDate(invoice.issuedDate) : 'Not issued'}<p className="text-xs">Due {formatDate(invoice.dueDate)}</p></td><td className="px-4 py-4 text-sm"><div className="flex items-center gap-3"><Badge label={invoice.status} variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'} /><Select value={invoice.status} disabled={updating === invoice.id} onChange={(event) => void update(invoice.id, event.target.value)}><option value="draft">Draft</option><option value="issued">Issued</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></Select></div></td></tr>
    })}</Table> : <Card><p className="text-sm font-semibold">No invoices match these filters.</p></Card>}
  </div>
}
