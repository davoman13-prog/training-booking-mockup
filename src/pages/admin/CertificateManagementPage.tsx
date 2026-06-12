import { certificates, courses, delegates } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function CertificateManagementPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Certificates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage certificates</h1>
      </div>
      <div className="space-y-4">
        {certificates.map((certificate) => {
          const course = courses.find((item) => item.id === certificate.courseId)
          const delegate = delegates.find((item) => item.id === certificate.delegateId)
          return (
            <Card key={certificate.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{course?.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{delegate?.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge label={certificate.status} variant={certificate.status === 'available' ? 'success' : 'warning'} />
                  <Button variant={certificate.status === 'available' ? 'primary' : 'secondary'} disabled={certificate.status !== 'available'}>
                    {certificate.status === 'available' ? 'Download' : 'Pending'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
