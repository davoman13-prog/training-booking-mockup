export type Role = 'delegate' | 'admin'

export type CourseFundingType = 'funded' | 'unfunded'
export type CourseStatus = 'open' | 'awaiting_minimum' | 'at_risk' | 'cancelled' | 'completed'
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
export type CertificateStatus = 'available' | 'pending' | 'issued' | 'revoked'
export type TrainerStatus = 'active' | 'inactive'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'on_hold'

export interface Course {
  id: string
  title: string
  category: string
    description: string
    joiningInstructions?: string
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
  roomName: string
  capacity: number
  contactName: string
  contactEmail: string
  contactPhone: string
  isActive: boolean
  notes?: string
}

export interface Trainer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternativePhone?: string
  organisation: string
  addressLine1: string
  addressLine2?: string
  townCity: string
  county: string
  postcode: string
  notes: string
  status: TrainerStatus
  approvedCourseIds: string[]
  createdDate: string
  updatedDate: string
}

export interface Session {
  id: string
  courseId: string
  locationId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  trainerId?: string
  status: SessionStatus
  availableSeats: number
  attendeeCount: number
}

export interface Delegate {
  id: string
  name: string
  email: string
  phone?: string
  organisation: string
  managerName: string
  managerEmail: string
  accountStatus?: 'active' | 'inactive' | 'anonymised'
  registrationDate?: string
  adminNotes?: string
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

export interface AttendanceRecord {
  bookingId: string
  outcome: 'pending' | 'attended' | 'absent'
  notes: string
  markedByUserId?: string
  markedAt?: string
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
