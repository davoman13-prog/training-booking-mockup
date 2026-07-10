import { useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import { MockUser } from './types'
import './index.css'

const storageKey = 'kalu-training-mock-user'

function getStoredUser() {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as MockUser
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(getStoredUser)

  const navItems = useMemo(
    () =>
      currentUser?.role === 'admin'
        ? [
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Courses', path: '/admin/courses' },
            { label: 'Sessions', path: '/admin/sessions' },
            { label: 'Locations', path: '/admin/locations' },
            { label: 'Trainers', path: '/admin/trainers' },
            { label: 'Delegates', path: '/admin/delegates' },
            { label: 'Bookings', path: '/admin/bookings' },
            { label: 'Attendance', path: '/admin/attendance' },
            { label: 'Certificates', path: '/admin/certificates' },
            { label: 'Invoices', path: '/admin/invoices' },
            { label: 'Reports', path: '/admin/reports' },
          ]
        : [
            { label: 'Dashboard', path: '/delegate/dashboard' },
            { label: 'Browse Courses', path: '/delegate/browse' },
            { label: 'My Bookings', path: '/delegate/bookings' },
            { label: 'Certificates', path: '/delegate/certificates' },
            { label: 'Invoices', path: '/delegate/invoices' },
          ],
    [currentUser?.role],
  )

  function handleLogin(user: MockUser) {
    setCurrentUser(user)
    window.localStorage.setItem(storageKey, JSON.stringify(user))
  }

  function handleLogout() {
    setCurrentUser(null)
    window.localStorage.removeItem(storageKey)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentUser={currentUser} navItems={currentUser ? navItems : []} onLogout={handleLogout} />
      <div className={currentUser ? 'px-4 py-6 sm:px-6 lg:flex lg:items-start lg:gap-6' : 'px-4 py-8 sm:px-6'}>
        {currentUser ? <Sidebar role={currentUser.role} navItems={navItems} onLogout={handleLogout} /> : null}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to={currentUser ? `/${currentUser.role}/dashboard` : '/login'} replace />} />
            <Route path="/*" element={<AppRoutes currentUser={currentUser} onLogin={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
