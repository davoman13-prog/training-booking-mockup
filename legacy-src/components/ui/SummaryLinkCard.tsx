import { Link } from 'react-router-dom'

interface SummaryLinkCardProps {
  label: string
  value: string | number
  detail?: string
  to: string
}

export default function SummaryLinkCard({ label, value, detail, to }: SummaryLinkCardProps) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
      <p className="mt-4 text-sm font-semibold text-cyan-800">View details</p>
    </Link>
  )
}
