import { Navigate, Route, Routes } from 'react-router-dom'
import { MockUser } from '../types'
import DelegateDashboardPage from '../pages/delegate/DashboardPage'
import RegisterPage from '../pages/delegate/RegisterPage'
import LoginPage from '../pages/delegate/LoginPage'
import BrowseCoursesPage from '../pages/delegate/BrowseCoursesPage'
import CourseDetailPage from '../pages/delegate/CourseDetailPage'
import BookingFormPage from '../pages/delegate/BookingFormPage'
import BookingConfirmationPage from '../pages/delegate/BookingConfirmationPage'
import MyBookingsPage from '../pages/delegate/MyBookingsPage'
import TrainingDetailPage from '../pages/delegate/TrainingDetailPage'
import CertificatesPage from '../pages/delegate/CertificatesPage'
import InvoicesPage from '../pages/delegate/InvoicesPage'
import AccountPage from '../pages/delegate/AccountPage'
import AdminDashboardPage from '../pages/admin/DashboardPage'
import ManageCoursesPage from '../pages/admin/ManageCoursesPage'
import CourseFormPage from '../pages/admin/CourseFormPage'
import ManageSessionsPage from '../pages/admin/ManageSessionsPage'
import SessionFormPage from '../pages/admin/SessionFormPage'
import ManageLocationsPage from '../pages/admin/ManageLocationsPage'
import LocationFormPage from '../pages/admin/LocationFormPage'
import ManageTrainersPage from '../pages/admin/ManageTrainersPage'
import TrainerDetailPage from '../pages/admin/TrainerDetailPage'
import TrainerFormPage from '../pages/admin/TrainerFormPage'
import DelegatesPage from '../pages/admin/DelegatesPage'
import DelegateDetailPage from '../pages/admin/DelegateDetailPage'
import SessionDelegatesPage from '../pages/admin/SessionDelegatesPage'
import ViewBookingsPage from '../pages/admin/ViewBookingsPage'
import BookingDetailPage from '../pages/admin/BookingDetailPage'
import AttendancePage from '../pages/admin/AttendancePage'
import CertificateManagementPage from '../pages/admin/CertificateManagementPage'
import InvoiceManagementPage from '../pages/admin/InvoiceManagementPage'
import ReportsPage from '../pages/admin/ReportsPage'

interface AppRoutesProps {
  currentUser: MockUser | null
  onLogin: (user: MockUser) => void
}

export default function AppRoutes({ currentUser, onLogin }: AppRoutesProps) {
  const homePath = currentUser ? `/${currentUser.role}/dashboard` : '/login'

  return (
    <Routes>
      <Route path="login" element={currentUser ? <Navigate to={homePath} replace /> : <LoginPage onLogin={onLogin} />} />
      <Route path="delegate/login" element={<Navigate to="/login" replace />} />
      <Route path="delegate/register" element={<RegisterPage onLogin={onLogin} />} />

      {!currentUser ? (
        <>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : currentUser.role === 'delegate' ? (
        <>
          <Route path="delegate/dashboard" element={<DelegateDashboardPage currentUser={currentUser} />} />
          <Route path="delegate/browse" element={<BrowseCoursesPage />} />
          <Route path="delegate/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="delegate/book/:courseId/:sessionId" element={<BookingFormPage currentUser={currentUser} />} />
          <Route path="delegate/book/:courseId" element={<BookingFormPage currentUser={currentUser} />} />
          <Route path="delegate/confirmation" element={<BookingConfirmationPage />} />
          <Route path="delegate/bookings/:bookingId" element={<TrainingDetailPage currentUser={currentUser} />} />
          <Route path="delegate/bookings" element={<MyBookingsPage currentUser={currentUser} />} />
          <Route path="delegate/certificates/:certificateId" element={<Navigate to="/delegate/certificates" replace />} />
          <Route path="delegate/certificates" element={<CertificatesPage currentUser={currentUser} />} />
          <Route path="delegate/invoices/:invoiceId" element={<Navigate to="/delegate/invoices" replace />} />
          <Route path="delegate/invoices" element={<InvoicesPage currentUser={currentUser} />} />
          <Route path="delegate/account" element={<AccountPage />} />
          <Route path="admin/*" element={<Navigate to="/delegate/dashboard" replace />} />
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
          <Route path="admin/sessions/:sessionId/delegates" element={<SessionDelegatesPage />} />
          <Route path="admin/sessions/:sessionId/edit" element={<SessionFormPage />} />
          <Route path="admin/locations" element={<ManageLocationsPage />} />
          <Route path="admin/locations/new" element={<LocationFormPage />} />
          <Route path="admin/locations/:locationId/edit" element={<LocationFormPage />} />
          <Route path="admin/trainers" element={<ManageTrainersPage />} />
          <Route path="admin/trainers/new" element={<TrainerFormPage />} />
          <Route path="admin/trainers/:trainerId" element={<TrainerDetailPage />} />
          <Route path="admin/trainers/:trainerId/edit" element={<TrainerFormPage />} />
          <Route path="admin/delegates" element={<DelegatesPage />} />
          <Route path="admin/delegates/:delegateId" element={<DelegateDetailPage />} />
          <Route path="admin/bookings" element={<ViewBookingsPage />} />
          <Route path="admin/bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="admin/attendance" element={<AttendancePage />} />
          <Route path="admin/certificates" element={<CertificateManagementPage />} />
          <Route path="admin/invoices" element={<InvoiceManagementPage />} />
          <Route path="admin/reports" element={<ReportsPage />} />
          <Route path="delegate/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </>
      )}
    </Routes>
  )
}
