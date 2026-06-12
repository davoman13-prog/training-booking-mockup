import { useMemo, useState } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import { Role } from './types'
import './index.css'

function App() {
  const [role, setRole] = useState<Role>('delegate')

  const navItems = useMemo(
    () =>
      role === 'delegate'
        ? [
            { label: 'Dashboard', path: '/delegate/dashboard' },
            { label: 'Browse Courses', path: '/delegate/browse' },
            { label: 'My Bookings', path: '/delegate/bookings' },
            { label: 'Certificates', path: '/delegate/certificates' },
            { label: 'Invoices', path: '/delegate/invoices' },
          ]
        : [
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Courses', path: '/admin/courses' },
            { label: 'Sessions', path: '/admin/sessions' },
            { label: 'Locations', path: '/admin/locations' },
            { label: 'Bookings', path: '/admin/bookings' },
            { label: 'Attendance', path: '/admin/attendance' },
            { label: 'Certificates', path: '/admin/certificates' },
            { label: 'Invoices', path: '/admin/invoices' },
            { label: 'Reports', path: '/admin/reports' },
          ],
    [role],
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Header role={role} onRoleChange={setRole} navItems={navItems} />
      <div className="lg:flex lg:items-start lg:gap-6 px-4 py-6 sm:px-6">
        <Sidebar role={role} navItems={navItems} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/*" element={<AppRoutes role={role} onRoleChange={setRole} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
