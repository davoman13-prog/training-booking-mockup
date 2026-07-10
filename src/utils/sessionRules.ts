import { bookings, courses } from '../data/mockData'
import { Course, Session } from '../types'

export const mockCurrentDate = '2026-07-10'

export type SessionDisplayStatus = 'Cancelled' | 'Completed' | 'On Hold' | 'Full' | 'At risk' | 'Confirmed' | 'Open'

export function activeBookingCount(sessionId: string) {
  return bookings.filter((booking) => booking.sessionId === sessionId && ['confirmed', 'pending'].includes(booking.status)).length
}

export function daysUntilSession(session: Session) {
  const start = new Date(`${session.startDate}T00:00:00`)
  const current = new Date(`${mockCurrentDate}T00:00:00`)
  return Math.ceil((start.getTime() - current.getTime()) / 86_400_000)
}

export function isSessionAtRisk(session: Session, course = courses.find((item) => item.id === session.courseId)) {
  const minimum = course?.minimumAttendees
  const daysUntil = daysUntilSession(session)

  return Boolean(
    minimum &&
      session.status !== 'cancelled' &&
      session.status !== 'completed' &&
      session.status !== 'on_hold' &&
      daysUntil >= 0 &&
      daysUntil <= 14 &&
      activeBookingCount(session.id) < minimum,
  )
}

export function sessionDisplayStatus(session: Session, course = courses.find((item) => item.id === session.courseId)): SessionDisplayStatus {
  if (session.status === 'cancelled') return 'Cancelled'
  if (session.status === 'completed') return 'Completed'
  if (session.status === 'on_hold') return 'On Hold'
  if (session.availableSeats <= 0) return 'Full'
  if (isSessionAtRisk(session, course)) return 'At risk'
  if (course?.minimumAttendees && activeBookingCount(session.id) >= course.minimumAttendees) return 'Confirmed'
  return 'Open'
}

export function riskExplanation(session: Session, course?: Course) {
  const minimum = course?.minimumAttendees
  const activeCount = activeBookingCount(session.id)
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
  if (session.status === 'on_hold') return 'On Hold - no new bookings'
  if (isSessionAtRisk(session, course)) return 'This session is not yet confirmed'
  if (course?.minimumAttendees && activeBookingCount(session.id) < course.minimumAttendees) return 'Awaiting minimum numbers'
  return ''
}

export function canBookSession(session: Session) {
  return session.status === 'scheduled' && session.availableSeats > 0
}
