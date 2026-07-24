import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import { MockUser } from './types'

const storageKey = 'kalu-training-admin-demo'

function getStoredUser() {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    const user = JSON.parse(raw) as MockUser
    return user.role === 'admin' ? user : null
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(getStoredUser)
  const [authLoading, setAuthLoading] = useState(!getStoredUser())

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      return
    }
    const controller = new AbortController()
    void fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { registered?: boolean; user?: MockUser }
        if (response.ok && result.registered && result.user) setCurrentUser(result.user)
      })
      .catch(() => undefined)
      .finally(() => setAuthLoading(false))
    return () => controller.abort()
  }, [currentUser?.role])

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
    if (user.role === 'admin') window.localStorage.setItem(storageKey, JSON.stringify(user))
  }

  function handleLogout() {
    if (currentUser?.role === 'delegate') {
      window.location.assign('/signout-with-chatgpt?return_to=/')
      return
    }
    setCurrentUser(null)
    window.localStorage.removeItem(storageKey)
  }

  if (authLoading) return <div className="min-h-screen bg-slate-50 p-8 text-sm font-semibold text-slate-600">Checking your secure Kalu session…</div>

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
