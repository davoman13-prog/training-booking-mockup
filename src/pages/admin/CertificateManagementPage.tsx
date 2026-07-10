import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { bookings, certificates, courses, delegates } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'

const anyValue = 'any'

function certificateEmailed(certificateId: string) {
  return Number(certificateId.replace('cert-', '')) % 2 === 0
}

function certificateVariant(status: string) {
  if (status === 'available' || status === 'issued') return 'success'
  return 'warning'
}

export default function CertificateManagementPage() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? anyValue)
  const [courseId, setCourseId] = useState(searchParams.get('courseId') ?? anyValue)
  const [issueState, setIssueState] = useState(searchParams.get('issueState') ?? anyValue)
  const [attendanceStatus, setAttendanceStatus] = useState(searchParams.get('attendanceStatus') ?? anyValue)
  const [emailStatus, setEmailStatus] = useState(searchParams.get('emailStatus') ?? anyValue)
  const [sortBy, setSortBy] = useState('issue-newest')

  const filteredCertificates = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase()

    return certificates
      .filter((certificate) => {
        const booking = bookings.find((item) => item.id === certificate.bookingId)
        const course = courses.find((item) => item.id === certificate.courseId)
        const delegate = delegates.find((item) => item.id === certificate.delegateId)
        const emailed = certificateEmailed(certificate.id)
        const searchableText = [
          certificate.id,
          delegate?.name,
          course?.title,
          certificate.issuedDate,
          certificate.status,
          certificate.bookingId,
        ].join(' ').toLowerCase()

        const matchesSearch = !normalisedSearch || searchableText.includes(normalisedSearch)
        const matchesStatus = status === anyValue || certificate.status === status || (status === 'downloadable' && ['available', 'issued'].includes(certificate.status))
        const matchesCourse = courseId === anyValue || certificate.courseId === courseId
        const matchesIssueState =
          issueState === anyValue ||
          (issueState === 'issued' && Boolean(certificate.issuedDate)) ||
          (issueState === 'pending_issue' && !certificate.issuedDate)
        const matchesAttendance = attendanceStatus === anyValue || (attendanceStatus === 'attended' ? Boolean(booking?.attendanceMarked) : !booking?.attendanceMarked)
        const matchesEmail = emailStatus === anyValue || (emailStatus === 'emailed' ? emailed : !emailed)

        return matchesSearch && matchesStatus && matchesCourse && matchesIssueState && matchesAttendance && matchesEmail
      })
      .sort((a, b) => {
        const courseA = courses.find((item) => item.id === a.courseId)
        const courseB = courses.find((item) => item.id === b.courseId)
        const delegateA = delegates.find((item) => item.id === a.delegateId)
        const delegateB = delegates.find((item) => item.id === b.delegateId)

        if (sortBy === 'issue-newest') return (b.issuedDate ?? '').localeCompare(a.issuedDate ?? '')
        if (sortBy === 'issue-oldest') return (a.issuedDate ?? '').localeCompare(b.issuedDate ?? '')
        if (sortBy === 'course') return (courseA?.title ?? '').localeCompare(courseB?.title ?? '')
        if (sortBy === 'delegate') return (delegateA?.name ?? '').localeCompare(delegateB?.name ?? '')
        if (sortBy === 'status') return a.status.localeCompare(b.status)
        if (sortBy === 'reference') return a.id.localeCompare(b.id)
        return 0
      })
  }, [attendanceStatus, courseId, emailStatus, issueState, searchTerm, sortBy, status])

  const activeFilterCount = [searchTerm.trim(), status !== anyValue, courseId !== anyValue, issueState !== anyValue, attendanceStatus !== anyValue, emailStatus !== anyValue].filter(Boolean).length

  function clearFilters() {
    setSearchTerm('')
    setStatus(anyValue)
    setCourseId(anyValue)
    setIssueState(anyValue)
    setAttendanceStatus(anyValue)
    setEmailStatus(anyValue)
    setSortBy('issue-newest')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Certificates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Manage certificates</h1>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-semibold text-slate-900">Search</label>
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Certificate, delegate, course, booking..." />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={anyValue}>All statuses</option>
              <option value="available">Available</option>
              <option value="issued">Issued</option>
              <option value="downloadable">Available / issued</option>
              <option value="pending">Pending</option>
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
            <label className="text-sm font-semibold text-slate-900">Issue date</label>
            <Select value={issueState} onChange={(event) => setIssueState(event.target.value)}>
              <option value={anyValue}>Issued + pending</option>
              <option value="issued">Has issue date</option>
              <option value="pending_issue">No issue date</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Attendance</label>
            <Select value={attendanceStatus} onChange={(event) => setAttendanceStatus(event.target.value)}>
              <option value={anyValue}>Attended + not attended</option>
              <option value="attended">Attended</option>
              <option value="not_attended">Not attended / pending</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Sort</label>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="issue-newest">Issue date newest</option>
              <option value="issue-oldest">Issue date oldest</option>
              <option value="course">Course name</option>
              <option value="delegate">Delegate name</option>
              <option value="status">Certificate status</option>
              <option value="reference">Certificate reference</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>
        <div className="mt-4">
          <Select value={emailStatus} onChange={(event) => setEmailStatus(event.target.value)}>
            <option value={anyValue}>Emailed + not emailed</option>
            <option value="emailed">Emailed</option>
            <option value="not_emailed">Not emailed</option>
          </Select>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{filteredCertificates.length} result{filteredCertificates.length === 1 ? '' : 's'}</span>
          {activeFilterCount > 0 ? <Badge label={`${activeFilterCount} active filters`} variant="info" /> : null}
          {searchTerm.trim() ? <Badge label={`Search: ${searchTerm.trim()}`} /> : null}
          {status !== anyValue ? <Badge label={status} /> : null}
          {issueState !== anyValue ? <Badge label={issueState.replace('_', ' ')} /> : null}
          {attendanceStatus !== anyValue ? <Badge label={attendanceStatus === 'attended' ? 'attended' : 'not attended'} /> : null}
          {emailStatus !== anyValue ? <Badge label={emailStatus.replace('_', ' ')} /> : null}
        </div>
      </Card>

      {filteredCertificates.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No certificates found</h2>
            <p className="mt-2 text-sm text-slate-600">Try clearing filters or searching another certificate reference.</p>
            <Button type="button" variant="secondary" onClick={clearFilters} className="mt-5">Clear filters</Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Certificate', 'Delegate', 'Course', 'Booking', 'Issue date', 'Status', 'Attendance', 'Email', 'Action']}>
          {filteredCertificates.map((certificate) => {
            const booking = bookings.find((item) => item.id === certificate.bookingId)
            const course = courses.find((item) => item.id === certificate.courseId)
            const delegate = delegates.find((item) => item.id === certificate.delegateId)
            const bookingLink = `/admin/bookings/${certificate.bookingId}`
            const emailed = certificateEmailed(certificate.id)

            return (
              <tr key={certificate.id} className="border-t border-slate-200">
                <td className="px-4 py-4 text-sm"><Link to={bookingLink} className="font-semibold text-cyan-800 hover:text-cyan-950">{certificate.id}</Link></td>
                <td className="px-4 py-4 text-sm"><Link to={bookingLink} className="font-semibold text-cyan-800 hover:text-cyan-950">{delegate?.name}</Link></td>
                <td className="px-4 py-4 text-sm"><Link to={bookingLink} className="font-semibold text-cyan-800 hover:text-cyan-950">{course?.title}</Link></td>
                <td className="px-4 py-4 text-sm text-slate-700">{certificate.bookingId}</td>
                <td className="px-4 py-4 text-sm text-slate-700">{certificate.issuedDate ? formatDate(certificate.issuedDate) : 'Pending'}</td>
                <td className="px-4 py-4 text-sm"><Badge label={certificate.status} variant={certificateVariant(certificate.status)} /></td>
                <td className="px-4 py-4 text-sm"><Badge label={booking?.attendanceMarked ? 'attended' : 'not attended'} variant={booking?.attendanceMarked ? 'success' : 'warning'} /></td>
                <td className="px-4 py-4 text-sm"><Badge label={emailed ? 'emailed' : 'not emailed'} variant={emailed ? 'success' : 'default'} /></td>
                <td className="px-4 py-4 text-sm"><Button variant={certificate.status === 'available' ? 'primary' : 'secondary'} disabled={certificate.status !== 'available'}>{certificate.status === 'available' ? 'Preview' : 'Pending'}</Button></td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
