import { Link } from 'react-router-dom'
import { courses, sessions } from '../../data/mockData'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { formatCurrency } from '../../utils/formatters'

export default function BrowseCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Course browsing</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Browse available training</h1>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const firstAvailableSession = sessions.find((session) => session.courseId === course.id && session.status === 'scheduled')

          return (
            <Card key={course.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{course.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{course.description}</p>
                </div>
                <Badge
                  label={course.status.replace('_', ' ')}
                  variant={course.status === 'open' ? 'success' : course.status === 'cancelled' ? 'danger' : 'warning'}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.duration}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.fundingType === 'funded' ? 'Funded' : 'Unfunded'}</span>
                {course.price ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{formatCurrency(course.price)}</span> : null}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Link to={`/delegate/courses/${course.id}`} className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
                  View details
                </Link>
                <Link to={firstAvailableSession ? `/delegate/book/${course.id}/${firstAvailableSession.id}` : `/delegate/courses/${course.id}`}>
                  <Button disabled={!firstAvailableSession}>Book now</Button>
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
