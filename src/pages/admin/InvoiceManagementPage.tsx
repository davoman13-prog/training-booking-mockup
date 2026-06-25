import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookings, courses, delegates, invoices } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'

const anyValue = 'any'

function invoiceVariant(status: string) {
  if (status === 'paid' || status === 'not_required') return 'success'
  if (status === 'overdue') return 'danger'
  return 'warning'
}

export default function InvoiceManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState(anyValue)
  const [courseId, setCourseId] = useState(anyValue)
  const [funding, setFunding] = useState(anyValue)
  const [paymentGroup, setPaymentGroup] = useState(anyValue)
  const [dateState, setDateState] = useState(anyValue)
  const [sortBy, setSortBy] = useState('due-oldest')

  const filteredInvoices = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return invoices
      .filter((invoice) => {
        const delegate = delegates.find((item) => item.id === invoice.delegateId)
        const course = courses.find((item) => item.id === invoice.courseId)
        const booking = bookings.find((item) => item.id === invoice.bookingId)
        const searchableText = [
          invoice.id,
          delegate?.name,
          delegate?.organisation,
          course?.title,
          invoice.amount.toString(),
          invoice.status,
          invoice.dueDate,
          invoice.bookingId,
        ].join(' ').toLowerCase()

        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesStatus = status === anyValue || invoice.status === status
        const matchesCourse = courseId === anyValue || invoice.courseId === courseId
        const matchesFunding = funding === anyValue || course?.fundingType === funding
        const matchesPaymentGroup =
          paymentGroup === anyValue ||
          (paymentGroup === 'paid' && invoice.status === 'paid') ||
          (paymentGroup === 'unpaid' && invoice.status === 'unpaid') ||
          (paymentGroup === 'overdue' && invoice.status === 'overdue')
        const matchesDateState =
          dateState === anyValue ||
          (dateState === 'issued' && invoice.isGenerated) ||
          (dateState === 'not_generated' && !invoice.isGenerated) ||
          (dateState === 'has_booking' && Boolean(booking))

        return matchesSearch && matchesStatus && matchesCourse && matchesFunding && matchesPaymentGroup && matchesDateState
      })
      .sort((a, b) => {
        const delegateA = delegates.find((item) => item.id === a.delegateId)
        const delegateB = delegates.find((item) => item.id === b.delegateId)
        const courseA = courses.find((item) => item.id === a.courseId)
        const courseB = courses.find((item) => item.id === b.courseId)

        if (sortBy === 'invoice') return a.id.localeCompare(b.id)
        if (sortBy === 'due-oldest') return a.dueDate.localeCompare(b.dueDate)
        if (sortBy === 'due-newest') return b.dueDate.localeCompare(a.dueDate)
        if (sortBy === 'amount') return b.amount - a.amount
        if (sortBy === 'delegate') return (delegateA?.name ?? '').localeCompare(delegateB?.name ?? '')
        if (sortBy === 'course') return (courseA?.title ?? '').localeCompare(courseB?.title ?? '')
        if (sortBy === 'status') return a.status.localeCompare(b.status)
        return 0
      })
  }, [courseId, dateState, funding, paymentGroup, searchTerm, sortBy, status])

  const activeFilterCount = [searchTerm.trim(), status !== anyValue, courseId !== anyValue, funding !== anyValue, paymentGroup !== anyValue, dateState !== anyValue].filter(Boolean).length

  function clearFilters() {
    setSearchTerm('')
    setStatus(anyValue)
    setCourseId(anyValue)
    setFunding(anyValue)
    setPaymentGroup(anyValue)
    setDateState(anyValue)
    setSortBy('due-oldest')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Invoices</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage invoice status</h1>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Invoice, delegate, organisation, course..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Invoice status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="not_required">Not required</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Course</label>
            <Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value={anyValue}>All courses</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
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
            <label className="text-sm font-semibold text-slate-900">Payment</label>
            <Select value={paymentGroup} onChange={(event) => setPaymentGroup(event.target.value)}>
              <option value={anyValue}>Paid + unpaid</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="invoice">Invoice number</option>
              <option value="due-oldest">Due date oldest</option>
              <option value="due-newest">Due date newest</option>
              <option value="amount">Amount</option>
              <option value="delegate">Delegate name</option>
              <option value="course">Course name</option>
              <option value="status">Invoice status</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-4">
          <Select value={dateState} onChange={(event) => setDateState(event.target.value)}>
            <option value={anyValue}>All invoice records</option>
            <option value="issued">Generated / issued</option>
            <option value="not_generated">Not generated</option>
            <option value="has_booking">Linked to booking</option>
          </Select>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredInvoices.length} result{filteredInvoices.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {status !== anyValue ? <Badge label={status.replace('_', ' ')} /> : null}
          {funding !== anyValue ? <Badge label={funding} /> : null}
          {paymentGroup !== anyValue ? <Badge label={paymentGroup} /> : null}
          {dateState !== anyValue ? <Badge label={dateState.replace('_', ' ')} /> : null}
        </div>
      </Card>

      {filteredInvoices.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No invoices found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another invoice, course, or delegate.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Invoice', 'Delegate', 'Organisation', 'Course', 'Booking', 'Amount', 'Issued', 'Due', 'Status', 'Action']}>
          {filteredInvoices.map((invoice) => {
            const delegate = delegates.find((item) => item.id === invoice.delegateId)
            const course = courses.find((item) => item.id === invoice.courseId)
            const bookingLink = `/admin/bookings/${invoice.bookingId}`

            return (
              <tr key={invoice.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm"><Link to={bookingLink} className="font-semibold text-cyan-800 hover:text-cyan-950">{invoice.id}</Link></td>
                <td className="px-4 py-4 text-sm"><Link to={bookingLink} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate?.name}</Link></td>
                <td className="px-4 py-4 text-sm text-slate-700">{delegate?.organisation}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{course?.title}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{invoice.bookingId}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(invoice.amount)}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{invoice.issuedDate ? formatDate(invoice.issuedDate) : 'Not generated'}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-4 text-sm"><Badge label={invoice.status.replace('_', ' ')} variant={invoiceVariant(invoice.status)} /></td>
                <td className="px-4 py-4 text-sm"><Button variant="secondary" disabled={invoice.status === 'paid' || invoice.status === 'not_required'}>Mark paid</Button></td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
