import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { courses, delegates, locations, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function BookingFormPage() {
  const { courseId, sessionId } = useParams()
  const navigate = useNavigate()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId])
  const courseSessions = useMemo(() => sessions.filter((item) => item.courseId === courseId), [courseId])
  const selectedSession = useMemo(
    () => courseSessions.find((item) => item.id === sessionId) ?? courseSessions.find((item) => item.status === 'scheduled'),
    [courseSessions, sessionId],
  )
  const selectedLocation = locations.find((item) => item.id === selectedSession?.locationId)
  const [delegateId, setDelegateId] = useState(delegates[0]?.id ?? '')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  if (!course || !selectedSession) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Course or session not found.</p>
  }

  const delegate = delegates.find((item) => item.id === delegateId)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!course || !selectedSession) return
    navigate(`/delegate/confirmation?courseId=${course.id}&sessionId=${selectedSession.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Booking form</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{course.title}</h1>
            <p className="mt-2 text-sm text-slate-600">Confirm the selected session before completing this mock booking.</p>
          </div>
          <Badge label={course.fundingType === 'funded' ? 'No payment required' : 'Unfunded course'} variant={course.fundingType === 'funded' ? 'success' : 'warning'} />
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Selected session</h2>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-900">Date</dt><dd>{formatDate(selectedSession.startDate)}</dd></div>
              <div><dt className="font-semibold text-slate-900">Time</dt><dd>{selectedSession.startTime} - {selectedSession.endTime}</dd></div>
              <div><dt className="font-semibold text-slate-900">Location</dt><dd>{selectedLocation?.name}</dd></div>
              <div><dt className="font-semibold text-slate-900">Trainer</dt><dd>{selectedSession.trainer ?? 'To be confirmed'}</dd></div>
              <div><dt className="font-semibold text-slate-900">Spaces remaining</dt><dd>{selectedSession.availableSeats}</dd></div>
              <div><dt className="font-semibold text-slate-900">Funding</dt><dd>{course.fundingType === 'funded' ? 'Funded - no invoice' : `Unfunded - ${formatCurrency(course.price ?? 0)}`}</dd></div>
            </dl>
            {course.fundingType === 'unfunded' ? (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                Minimum attendees: {course.minimumAttendees}. Invoice is only mocked when minimum numbers are met.
              </p>
            ) : null}
          </div>
          <Link to={`/delegate/courses/${course.id}`} className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
            Choose another session
          </Link>
        </div>
      </Card>

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Delegate</label>
              <Select value={delegateId} onChange={(event) => setDelegateId(event.target.value)}>
                {delegates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.organisation})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Practice / organisation</label>
              <Input value={delegate?.organisation ?? ''} readOnly />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Practice manager name</label>
              <Input value={delegate?.managerName ?? ''} readOnly />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Practice manager email</label>
              <Input value={delegate?.managerEmail ?? ''} readOnly />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-900">Special requirements</label>
            <Textarea
              value={specialRequirements}
              onChange={(event) => setSpecialRequirements(event.target.value)}
              rows={4}
            />
          </div>
          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-900">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-700" />
            I accept the terms and conditions for booking this course.
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">No real booking, payment, email, or PDF will be created.</div>
            <Button type="submit" disabled={!termsAccepted}>
              Confirm booking
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
