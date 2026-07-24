import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { canBookSession, delegateSessionAvailabilityMessage } from '../../utils/sessionRules'
import { trainerNameById } from '../../utils/trainerUtils'
import useCatalog from '../../hooks/useCatalog'

export default function BookingFormPage() {
  const { courseId, sessionId } = useParams()
  const navigate = useNavigate()
  const { courses, delegates, locations, sessions, refresh, isLive } = useCatalog()
  const course = useMemo(() => courses.find((item) => item.id === courseId), [courseId, courses])
  const courseSessions = useMemo(() => sessions.filter((item) => item.courseId === courseId), [courseId, sessions])
  const selectedSession = useMemo(
    () => courseSessions.find((item) => item.id === sessionId) ?? courseSessions.find((item) => item.status === 'scheduled'),
    [courseSessions, sessionId],
  )
  const selectedLocation = locations.find((item) => item.id === selectedSession?.locationId)
  const [delegateId, setDelegateId] = useState(delegates[0]?.id ?? '')
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (!course || !selectedSession) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Course or session not found.</p>
  }

  const delegate = delegates.find((item) => item.id === delegateId)
  const bookingBlocked = !canBookSession(selectedSession)
  const blockedMessage =
    selectedSession.status === 'on_hold'
      ? 'This session is On Hold - no new bookings can be made. Existing bookings remain visible.'
      : selectedSession.status === 'cancelled'
      ? 'This session has been cancelled and cannot accept new bookings.'
      : selectedSession.status === 'completed'
      ? 'This session has completed and cannot accept new bookings.'
      : selectedSession.availableSeats <= 0
      ? 'This session is full and cannot accept new bookings.'
      : ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!course || !selectedSession || bookingBlocked || !delegateId) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegateId, courseId: course.id, sessionId: selectedSession.id, specialRequirements, termsAccepted }),
      })
      const result = await response.json() as { booking?: { id: string }; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The booking could not be created.')
      await refresh()
      navigate(`/delegate/confirmation?courseId=${course.id}&sessionId=${selectedSession.id}&bookingId=${result.booking?.id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The booking could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Booking form</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{course.title}</h1>
            <p className="mt-2 text-sm text-slate-600">Confirm the selected session to create a live booking.</p>
          </div>
          <Badge label={course.fundingType === 'funded' ? 'No payment required' : 'Unfunded course'} variant={course.fundingType === 'funded' ? 'success' : 'warning'} />
        </div>
      </div>

      <Card>
        {bookingBlocked ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{blockedMessage}</div>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Selected session</h2>
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-900">Date</dt><dd>{formatDate(selectedSession.startDate)}</dd></div>
              <div><dt className="font-semibold text-slate-900">Time</dt><dd>{selectedSession.startTime} - {selectedSession.endTime}</dd></div>
              <div><dt className="font-semibold text-slate-900">Location</dt><dd>{selectedLocation?.name}</dd></div>
              <div><dt className="font-semibold text-slate-900">Trainer</dt><dd>{trainerNameById(selectedSession.trainerId)}</dd></div>
              <div><dt className="font-semibold text-slate-900">Spaces remaining</dt><dd>{selectedSession.availableSeats}</dd></div>
              <div><dt className="font-semibold text-slate-900">Funding</dt><dd>{course.fundingType === 'funded' ? 'Funded - no invoice' : `Unfunded - ${formatCurrency(course.price ?? 0)}`}</dd></div>
            </dl>
            {delegateSessionAvailabilityMessage(selectedSession, course) ? (
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">{delegateSessionAvailabilityMessage(selectedSession, course)}</p>
            ) : null}
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
          {!isLive ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">The live booking service is not connected. Please reload before booking.</div> : null}
          {submitError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{submitError}</div> : null}
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
            <div className="text-sm text-slate-600">The booking and session capacity will update immediately. Payment and email follow in later production stages.</div>
            <Button type="submit" disabled={!termsAccepted || bookingBlocked || submitting || !isLive}>
              {bookingBlocked ? 'Booking unavailable' : submitting ? 'Creating booking...' : 'Confirm booking'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
