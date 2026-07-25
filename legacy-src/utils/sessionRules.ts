import { Course, Session } from '../types'

export type SessionDisplayStatus = 'Cancelled' | 'Completed' | 'On Hold' | 'Full' | 'At risk' | 'Confirmed' | 'Open'

export function daysUntilSession(session: Session) {
  const start = new Date(`${session.startDate}T00:00:00`)
  const now = new Date()
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((start.getTime() - current.getTime()) / 86_400_000)
}

export function isPastSession(session: Session) {
  return daysUntilSession(session) < 0
}

export function isSessionAtRisk(session: Session, course?: Course) {
  const minimum = course?.minimumAttendees
  const daysUntil = daysUntilSession(session)

  return Boolean(
    minimum &&
      session.status !== 'cancelled' &&
      session.status !== 'completed' &&
      session.status !== 'on_hold' &&
      daysUntil >= 0 &&
      daysUntil <= 14 &&
      session.attendeeCount < minimum,
  )
}

export function sessionDisplayStatus(session: Session, course?: Course): SessionDisplayStatus {
  if (session.status === 'cancelled') return 'Cancelled'
  if (session.status === 'completed') return 'Completed'
  if (session.status === 'on_hold') return 'On Hold'
  if (session.availableSeats <= 0) return 'Full'
  if (isSessionAtRisk(session, course)) return 'At risk'
  if (course?.minimumAttendees && session.attendeeCount >= course.minimumAttendees) return 'Confirmed'
  return 'Open'
}

export function riskExplanation(session: Session, course?: Course) {
  const minimum = course?.minimumAttendees
  const activeCount = session.attendeeCount
  const days = daysUntilSession(session)

  if (!minimum) return 'No minimum attendee requirement for this course.'
  if (isSessionAtRisk(session, course)) {
    return `At risk: ${activeCount} of ${minimum} minimum places booked, ${days} day${days === 1 ? '' : 's'} remaining.`
  }
  if (session.status === 'on_hold') return 'Not at risk while on hold.'
  if (session.status === 'cancelled' || session.status === 'completed') return 'Risk not calculated for cancelled or completed sessions.'
  if (days > 14 && activeCount < minimum) return `${activeCount} of ${minimum} minimum places booked, but the session is more than 14 days away.`
  return `${activeCount} of ${minimum} minimum places booked, ${days} day${days === 1 ? '' : 's'} remaining.`
}

export function statusVariant(status: SessionDisplayStatus) {
  if (status === 'Cancelled') return 'danger'
  if (status === 'Completed' || status === 'Confirmed') return 'success'
  if (status === 'At risk' || status === 'On Hold') return 'warning'
  return 'info'
}

export function delegateSessionAvailabilityMessage(session: Session, course?: Course) {
  if (course?.status === 'cancelled') return 'This course has been cancelled - no new bookings'
  if (course?.status === 'completed') return 'This course has completed - no new bookings'
  if (isPastSession(session)) return 'This session date has passed - no new bookings'
  if (session.status === 'on_hold') return 'On Hold - no new bookings'
  if (isSessionAtRisk(session, course)) return 'This session is not yet confirmed'
  if (course?.minimumAttendees && session.attendeeCount < course.minimumAttendees) return 'Awaiting minimum numbers'
  return ''
}

export function canBookSession(session: Session, course?: Course) {
  return (
    session.status === 'scheduled' &&
    !isPastSession(session) &&
    course?.status !== 'cancelled' &&
    course?.status !== 'completed' &&
    session.availableSeats > 0
  )
}
