import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variant === 'secondary'
      ? 'bg-cyan-50 text-cyan-900 ring-1 ring-inset ring-cyan-200 hover:bg-cyan-100'
      : variant === 'ghost'
      ? 'bg-transparent text-slate-700 hover:bg-cyan-50'
      : 'bg-cyan-700 text-white shadow-sm hover:bg-cyan-800'

  return <button className={`${base} ${styles} ${className}`} {...props} />
}
