import { certificates, courses, delegates } from '../../data/mockData'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Certificates</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Certificates and downloads</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {certificates.map((certificate) => {
          const delegate = delegates.find((item) => item.id === certificate.delegateId)
          const course = courses.find((item) => item.id === certificate.courseId)

          return (
            <Card key={certificate.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{course?.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{delegate?.name}</p>
                </div>
                <Badge label={certificate.status} variant={certificate.status === 'available' ? 'success' : 'warning'} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">ID: {certificate.id}</span>
                {certificate.issuedDate ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Issued {certificate.issuedDate}</span> : null}
              </div>
              <div className="mt-6">
                <Button variant={certificate.status === 'available' ? 'primary' : 'secondary'} disabled={certificate.status !== 'available'}>
                  {certificate.status === 'available' ? 'Download certificate' : 'Pending issuance'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
