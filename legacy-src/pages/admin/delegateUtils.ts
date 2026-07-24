import { bookings, certificates, courses, delegates, invoices, sessions } from '../../data/mockData'
import { Delegate } from '../../types'

export const delegateProfiles: Record<string, Pick<Delegate, 'phone' | 'accountStatus' | 'registrationDate' | 'adminNotes'>> = {
  'del-1': { phone: '07700 900101', accountStatus: 'active', registrationDate: '2025-11-12', adminNotes: 'Primary contact for Greenfield Surgery training.' },
  'del-2': { phone: '07700 900102', accountStatus: 'active', registrationDate: '2025-12-04', adminNotes: 'Prefers Birmingham sessions where possible.' },
  'del-3': { phone: '07700 900103', accountStatus: 'inactive', registrationDate: '2026-01-16', adminNotes: 'Account inactive after organisation change.' },
  'del-4': { phone: '07700 900104', accountStatus: 'active', registrationDate: '2026-02-01', adminNotes: 'Interested in leadership and first aid pathways.' },
  'del-5': { phone: '07700 900105', accountStatus: 'active', registrationDate: '2026-02-20', adminNotes: 'Has outstanding funded/unfunded booking queries.' },
  'del-6': { phone: '07700 900106', accountStatus: 'active', registrationDate: '2026-03-05', adminNotes: 'Often books leadership sessions.' },
  'del-7': { phone: '07700 900107', accountStatus: 'active', registrationDate: '2026-03-12', adminNotes: 'Certificate downloads enabled.' },
  'del-8': { phone: '07700 900108', accountStatus: 'active', registrationDate: '2026-03-28', adminNotes: 'Invoice reminder mock pending.' },
  'del-9': { phone: '07700 900109', accountStatus: 'active', registrationDate: '2026-04-02', adminNotes: 'Multiple completed courses.' },
  'del-10': { phone: '07700 900110', accountStatus: 'active', registrationDate: '2026-04-12', adminNotes: 'Has cancelled course history.' },
  'del-11': { phone: '07700 900111', accountStatus: 'active', registrationDate: '2026-05-01', adminNotes: 'New delegate with unpaid invoice example.' },
  'del-12': { phone: 'Removed', accountStatus: 'anonymised', registrationDate: '2026-05-08', adminNotes: 'Anonymised record retained for reporting only.' },
}

export function enrichDelegate(delegate: Delegate): Delegate {
  const profile = delegateProfiles[delegate.id]

  if (profile?.accountStatus === 'anonymised') {
    return {
      ...delegate,
      ...profile,
      name: 'Anonymised Delegate',
      email: `anonymised-${delegate.id}@example.test`,
      phone: 'Removed',
      managerName: 'Removed',
      managerEmail: 'removed@example.test',
    }
  }

  return { ...delegate, ...profile, accountStatus: profile?.accountStatus ?? 'active' }
}

export function delegateBookings(delegateId: string) {
  return bookings.filter((booking) => booking.delegateId === delegateId)
}

export function delegateStats(delegateId: string) {
  const rows = delegateBookings(delegateId)
  const upcoming = rows.filter((booking) => sessions.find((session) => session.id === booking.sessionId)?.status === 'scheduled').length
  const completed = rows.filter((booking) => booking.status === 'completed' || sessions.find((session) => session.id === booking.sessionId)?.status === 'completed').length
  const cancelled = rows.filter((booking) => booking.status === 'cancelled' || sessions.find((session) => session.id === booking.sessionId)?.status === 'cancelled').length
  const outstandingInvoices = invoices.filter((invoice) => invoice.delegateId === delegateId && (invoice.status === 'unpaid' || invoice.status === 'overdue'))
  const certificatesAvailable = certificates.filter((certificate) => certificate.delegateId === delegateId && certificate.status === 'available').length

  return {
    booked: rows.length,
    upcoming,
    completed,
    cancelled,
    outstandingInvoiceCount: outstandingInvoices.length,
    outstandingInvoiceValue: outstandingInvoices.reduce((total, invoice) => total + invoice.amount, 0),
    certificatesAvailable,
  }
}

export function bookedCourseNames(delegateId: string) {
  return delegateBookings(delegateId)
    .map((booking) => courses.find((course) => course.id === booking.courseId)?.title)
    .filter(Boolean)
    .join(' ')
}

export function allDelegates() {
  return delegates.map(enrichDelegate)
}
