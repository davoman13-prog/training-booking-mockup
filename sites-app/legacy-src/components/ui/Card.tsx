import { PropsWithChildren } from 'react'

export default function Card({ children }: PropsWithChildren) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
}
