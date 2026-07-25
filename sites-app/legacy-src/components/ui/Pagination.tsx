import Button from './Button'
import Select from './Select'
import { PaginationState } from '../../hooks/usePaginatedList'

interface Props {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function Pagination({ pagination, onPageChange, onPageSizeChange }: Props) {
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total)
  return <nav aria-label="List pagination" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm font-semibold text-slate-700">Showing {start}–{end} of {pagination.total.toLocaleString()}</p>
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-slate-600" htmlFor="page-size">Rows</label>
      <Select id="page-size" value={String(pagination.pageSize)} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="w-24">
        <option value="25">25</option><option value="50">50</option><option value="100">100</option>
      </Select>
      <Button type="button" variant="secondary" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Previous</Button>
      <span className="min-w-24 text-center text-sm font-semibold text-slate-700">Page {pagination.page} of {pagination.pageCount}</span>
      <Button type="button" variant="secondary" disabled={pagination.page >= pagination.pageCount} onClick={() => onPageChange(pagination.page + 1)}>Next</Button>
    </div>
  </nav>
}
