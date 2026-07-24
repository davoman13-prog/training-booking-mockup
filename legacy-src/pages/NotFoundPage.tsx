import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Page not found</p>
      <h1 className="mt-6 text-4xl font-semibold text-slate-900">We couldn’t find that page</h1>
      <p className="mt-4 text-slate-600">Use the navigation to return to the delegate or admin area.</p>
      <div className="mt-8">
        <Link to="/">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  )
}
