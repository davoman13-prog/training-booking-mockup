import { Navigate, Route, Routes } from 'react-router-dom'
import { Role } from '../types'
import DelegateDashboardPage from '../pages/delegate/DashboardPage'
import RegisterPage from '../pages/delegate/RegisterPage'
import LoginPage from '../pages/delegate/LoginPage'
import BrowseCoursesPage from '../pages/delegate/BrowseCoursesPage'
import CourseDetailPage from '../pages/delegate/CourseDetailPage'
import BookingFormPage from '../pages/delegate/BookingFormPage'
import BookingConfirmationPage from '../pages/delegate/BookingConfirmationPage'
import MyBookingsPage from '../pages/delegate/MyBookingsPage'
import CertificatesPage from '../pages/delegate/CertificatesPage'
import InvoicesPage from '../pages/delegate/InvoicesPage'
import AdminDashboardPage from '../pages/admin/DashboardPage'
import ManageCoursesPage from '../pages/admin/ManageCoursesPage'
import CourseFormPage from '../pages/admin/CourseFormPage'
import ManageSessionsPage from '../pages/admin/ManageSessionsPage'
import SessionFormPage from '../pages/admin/SessionFormPage'
import ManageLocationsPage from '../pages/admin/ManageLocationsPage'
import LocationFormPage from '../pages/admin/LocationFormPage'
import ViewBookingsPage from '../pages/admin/ViewBookingsPage'
import BookingDetailPage from '../pages/admin/BookingDetailPage'
import AttendancePage from '../pages/admin/AttendancePage'
import CertificateManagementPage from '../pages/admin/CertificateManagementPage'
import InvoiceManagementPage from '../pages/admin/InvoiceManagementPage'
import ReportsPage from '../pages/admin/ReportsPage'
import NotFoundPage from '../pages/NotFoundPage'

interface AppRoutesProps {
  role: Role
  onRoleChange: (role: Role) => void
}

export default function AppRoutes({ role, onRoleChange }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="login" element={<LoginPage onRoleChange={onRoleChange} />} />
      <Route path="delegate/login" element={<LoginPage onRoleChange={onRoleChange} />} />
      <Route path="delegate/register" element={<RegisterPage onRoleChange={onRoleChange} />} />
      {role === 'delegate' ? (
        <>
          <Route path="delegate/dashboard" element={<DelegateDashboardPage />} />
          <Route path="delegate/browse" element={<BrowseCoursesPage />} />
          <Route path="delegate/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="delegate/book/:courseId/:sessionId" element={<BookingFormPage />} />
          <Route path="delegate/book/:courseId" element={<BookingFormPage />} />
          <Route path="delegate/confirmation" element={<BookingConfirmationPage />} />
          <Route path="delegate/bookings" element={<MyBookingsPage />} />
          <Route path="delegate/certificates" element={<CertificatesPage />} />
          <Route path="delegate/invoices" element={<InvoicesPage />} />
          <Route path="*" element={<Navigate to="/delegate/dashboard" replace />} />
        </>
      ) : (
        <>
          <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="admin/courses" element={<ManageCoursesPage />} />
          <Route path="admin/courses/new" element={<CourseFormPage />} />
          <Route path="admin/courses/:courseId/edit" element={<CourseFormPage />} />
          <Route path="admin/sessions" element={<ManageSessionsPage />} />
          <Route path="admin/sessions/new" element={<SessionFormPage />} />
          <Route path="admin/sessions/:sessionId/edit" element={<SessionFormPage />} />
          <Route path="admin/locations" element={<ManageLocationsPage />} />
          <Route path="admin/locations/new" element={<LocationFormPage />} />
          <Route path="admin/locations/:locationId/edit" element={<LocationFormPage />} />
          <Route path="admin/bookings" element={<ViewBookingsPage />} />
          <Route path="admin/bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="admin/attendance" element={<AttendancePage />} />
          <Route path="admin/certificates" element={<CertificateManagementPage />} />
          <Route path="admin/invoices" element={<InvoiceManagementPage />} />
          <Route path="admin/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </>
      )}
    </Routes>
  )
}
