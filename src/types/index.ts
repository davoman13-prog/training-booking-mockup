export type Role = 'delegate' | 'admin'

export type CourseFundingType = 'funded' | 'unfunded'
export type CourseStatus = 'open' | 'awaiting_minimum' | 'at_risk' | 'cancelled' | 'completed'
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'not_required'
export type CertificateStatus = 'available' | 'pending' | 'issued'

export interface Course {
  id: string
  title: string
  category: string
  description: string
  fundingType: CourseFundingType
  status: CourseStatus
  price?: number
  minimumAttendees?: number
  invoiceTriggerDate?: string
  cancellationCutoffDate?: string
  locationId: string
  duration: string
  sessionIds: string[]
  tags: string[]
  isFeatured: boolean
  capacity: number
  attendeeCount: number
  outcomes: string[]
}

export interface Location {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  capacity: number
  notes?: string
}

export interface Session {
  id: string
  courseId: string
  locationId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  trainer?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  availableSeats: number
  attendeeCount: number
}

export interface Delegate {
  id: string
  name: string
  email: string
  organisation: string
  managerName: string
  managerEmail: string
  specialRequirements?: string
  bookingIds: string[]
  certificateIds: string[]
  invoiceIds: string[]
}

export interface Booking {
  id: string
  delegateId: string
  courseId: string
  sessionId: string
  locationId: string
  bookingDate: string
  status: BookingStatus
  paymentRequired: boolean
  termsAccepted: boolean
  specialRequirements?: string
  attendanceMarked: boolean
  invoiceId?: string
  certificateId?: string
}

export interface Invoice {
  id: string
  bookingId: string
  delegateId: string
  courseId: string
  amount: number
  dueDate: string
  issuedDate: string
  status: InvoiceStatus
  isGenerated: boolean
}

export interface Certificate {
  id: string
  bookingId: string
  delegateId: string
  courseId: string
  issuedDate?: string
  status: CertificateStatus
  downloadLink?: string
}

export interface ReportMetric {
  label: string
  value: string
  trend?: string
  detail?: string
}

export interface NavigationItem {
  label: string
  path: string
}

export interface MockUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface MockCredential extends MockUser {
  password: string
}
