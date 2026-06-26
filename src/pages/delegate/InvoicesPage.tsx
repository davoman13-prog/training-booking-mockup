import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import { bookings, courses, delegates, invoices, sessions } from '../../data/mockData'
import { formatCurrency, formatDate } from '../../utils/formatters'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function invoiceVariant(status: string): BadgeVariant {
  if (status === 'paid' || status === 'not_required') return 'success'
  if (status === 'overdue') return 'danger'
  return 'warning'
}

export default function InvoicesPage() {
  const delegate = delegates[0]
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [paymentState, setPaymentState] = useState('all')
  const [fundingType, setFundingType] = useState('all')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('dueDateAsc')

  const rows = useMemo(() => {
    return invoices
      .filter((invoice) => invoice.delegateId === delegate.id)
      .map((invoice) => {
        const booking = bookings.find((item) => item.id === invoice.bookingId)
        const course = courses.find((item) => item.id === invoice.courseId)
        const session = sessions.find((item) => item.id === booking?.sessionId)
        return { invoice, booking, course, session }
      })
  }, [delegate.id])

  const categories = [...new Set(rows.map(({ course }) => course?.category).filter(Boolean))]

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows
      .filter(({ invoice, booking, course }) => {
        const paymentGroup = invoice.status === 'paid' ? 'paid' : invoice.status === 'overdue' ? 'overdue' : invoice.status === 'not_required' ? 'not issued' : 'unpaid'
        const haystack = [
          invoice.id,
          course?.title,
          invoice.amount.toString(),
          invoice.dueDate,
          invoice.status,
          booking?.id,
          delegate.organisation,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return (
          (!query || haystack.includes(query)) &&
          (status === 'all' || invoice.status === status) &&
          (paymentState === 'all' || paymentState === paymentGroup) &&
          (fundingType === 'all' || course?.fundingType === fundingType) &&
          (category === 'all' || course?.category === category)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'invoiceAsc') return a.invoice.id.localeCompare(b.invoice.id)
        if (sortBy === 'invoiceDesc') return b.invoice.id.localeCompare(a.invoice.id)
        if (sortBy === 'amountAsc') return a.invoice.amount - b.invoice.amount
        if (sortBy === 'amountDesc') return b.invoice.amount - a.invoice.amount
        if (sortBy === 'courseAsc') return (a.course?.title ?? '').localeCompare(b.course?.title ?? '')
        if (sortBy === 'courseDesc') return (b.course?.title ?? '').localeCompare(a.course?.title ?? '')
        if (sortBy === 'status') return a.invoice.status.localeCompare(b.invoice.status)
        return sortBy === 'dueDateDesc' ? b.invoice.dueDate.localeCompare(a.invoice.dueDate) : a.invoice.dueDate.localeCompare(b.invoice.dueDate)
      })
  }, [category, delegate.organisation, fundingType, paymentState, rows, search, sortBy, status])

  const activeFilters = [
    search ? `Search: ${search}` : '',
    status !== 'all' ? `Status: ${status.replace('_', ' ')}` : '',
    paymentState !== 'all' ? `Payment: ${paymentState}` : '',
    fundingType !== 'all' ? `Funding: ${fundingType}` : '',
    category !== 'all' ? `Category: ${category}` : '',
  ].filter(Boolean)

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setPaymentState('all')
    setFundingType('all')
    setCategory('all')
    setSortBy('dueDateAsc')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Invoices</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Invoice overview</h1>
        <p className="mt-2 text-sm text-slate-600">Search and preview mock invoices for {delegate.organisation}.</p>
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <label className="text-sm font-semibold text-slate-700">
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" placeholder="Invoice, course, amount, due date..." />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="not_required">Not required</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Payment
            <select value={paymentState} onChange={(event) => setPaymentState(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All payment states</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="not issued">Not issued</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Funding
            <select value={fundingType} onChange={(event) => setFundingType(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">Funded and unfunded</option>
              <option value="funded">Funded</option>
              <option value="unfunded">Unfunded</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Sort
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="dueDateAsc">Due date oldest</option>
              <option value="dueDateDesc">Due date newest</option>
              <option value="invoiceAsc">Invoice A-Z</option>
              <option value="invoiceDesc">Invoice Z-A</option>
              <option value="amountAsc">Amount low-high</option>
              <option value="amountDesc">Amount high-low</option>
              <option value="courseAsc">Course A-Z</option>
              <option value="courseDesc">Course Z-A</option>
              <option value="status">Invoice status</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">{filteredRows.length} of {rows.length} invoices</p>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>
        </div>
        {activeFilters.length ? <div className="mt-3 flex flex-wrap gap-2">{activeFilters.map((filter) => <Badge key={filter} label={filter} variant="info" />)}</div> : null}
      </Card>

      {filteredRows.length ? (
        <Table headers={['Invoice number', 'Course', 'Session', 'Amount', 'Due date', 'Status']}>
          {filteredRows.map(({ invoice, booking, course, session }) => (
            <tr key={invoice.id}>
              <td className="px-4 py-4 text-sm font-semibold">
                <Link to={`/delegate/invoices/${invoice.id}`} className="text-cyan-800 hover:text-cyan-950">{invoice.id}</Link>
                <p className="mt-1 text-xs text-slate-500">Booking {booking?.id}</p>
              </td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/delegate/bookings/${booking?.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title}</Link>
                <p className="mt-1 text-xs text-slate-500">{course?.category} / {course?.fundingType}</p>
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">{session ? formatDate(session.startDate) : 'To be confirmed'}</td>
              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(invoice.amount)}</td>
              <td className="px-4 py-4 text-sm text-slate-700">{formatDate(invoice.dueDate)}</td>
              <td className="px-4 py-4 text-sm"><Badge label={invoice.status.replace('_', ' ')} variant={invoiceVariant(invoice.status)} /></td>
            </tr>
          ))}
        </Table>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-900">No invoices found</p>
          <p className="mt-1 text-sm text-slate-600">Try another search term or clear the filters.</p>
        </Card>
      )}
    </div>
  )
}
