import { SelectHTMLAttributes } from 'react'

export default function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" {...props} />
}
