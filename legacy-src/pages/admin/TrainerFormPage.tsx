import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { Trainer, TrainerStatus } from '../../types'
import { trainerFullName } from '../../utils/trainerUtils'
import useCatalog from '../../hooks/useCatalog'

interface TrainerFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  alternativePhone: string
  organisation: string
  addressLine1: string
  addressLine2: string
  townCity: string
  county: string
  postcode: string
  notes: string
  status: TrainerStatus
  approvedCourseIds: string[]
}

function appendTrainerToReturn(returnTo: string, trainerId: string) {
  const separator = returnTo.includes('?') ? '&' : '?'
  return `${returnTo}${separator}trainerId=${trainerId}`
}

function toFormState(trainer?: Trainer): TrainerFormState {
  return {
    firstName: trainer?.firstName ?? '',
    lastName: trainer?.lastName ?? '',
    email: trainer?.email ?? '',
    phone: trainer?.phone ?? '',
    alternativePhone: trainer?.alternativePhone ?? '',
    organisation: trainer?.organisation ?? '',
    addressLine1: trainer?.addressLine1 ?? '',
    addressLine2: trainer?.addressLine2 ?? '',
    townCity: trainer?.townCity ?? '',
    county: trainer?.county ?? '',
    postcode: trainer?.postcode ?? '',
    notes: trainer?.notes ?? '',
    status: trainer?.status ?? 'active',
    approvedCourseIds: trainer?.approvedCourseIds ?? [],
  }
}

export default function TrainerFormPage() {
  const { trainerId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { courses, trainers, isLive, isLoading, loadError, refresh } = useCatalog()
  const returnTo = searchParams.get('returnTo')
  const trainer = useMemo(() => trainers.find((item) => item.id === trainerId), [trainerId, trainers])
  const editing = Boolean(trainer)
  const [formState, setFormState] = useState<TrainerFormState>(() => toFormState(trainer))
  const [courseSearch, setCourseSearch] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isLive) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormState(toFormState(trainer))
  }, [isLive, trainer])

  const filteredCourses = useMemo(() => {
    const normalisedSearch = courseSearch.trim().toLowerCase()
    return courses.filter((course) => {
      const searchableText = [course.title, course.category, course.fundingType, course.status].join(' ').toLowerCase()
      return !normalisedSearch || searchableText.includes(normalisedSearch)
    })
  }, [courseSearch, courses])

  function updateField<K extends keyof TrainerFormState>(key: K, value: TrainerFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  function toggleCourse(courseId: string) {
    setFormState((current) => ({
      ...current,
      approvedCourseIds: current.approvedCourseIds.includes(courseId)
        ? current.approvedCourseIds.filter((item) => item !== courseId)
        : [...current.approvedCourseIds, courseId],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedMessage('')
    setSaveError('')
    try {
      const response = await fetch(editing ? `/api/trainers/${trainer!.id}` : '/api/trainers', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })
      const result = await response.json() as { trainer?: { id: string }; message?: string }
      if (!response.ok) throw new Error(result.message ?? 'The trainer could not be saved.')
      const savedId = result.trainer?.id
      if (!savedId) throw new Error('The saved trainer identifier was not returned.')
      await refresh()
      setSavedMessage('Trainer saved to the live catalogue.')
      if (returnTo) navigate(appendTrainerToReturn(returnTo, savedId))
      else navigate(`/admin/trainers/${savedId}`)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'The trainer could not be saved.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">{editing ? 'Edit trainer' : 'Add trainer'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{editing ? `Edit Trainer: ${trainerFullName(trainer)}` : 'Create new trainer'}</h1>
          <p className={`mt-1 text-sm font-semibold ${isLive ? 'text-emerald-700' : 'text-amber-700'}`}>{isLive ? 'Connected to the live catalogue' : isLoading ? 'Loading the live catalogue' : 'Live catalogue unavailable'}</p>
        </div>
        <Link to={returnTo ?? '/admin/trainers'}>
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {savedMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{savedMessage}</div> : null}
      {saveError || loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{saveError || loadError}</div> : null}

      {isLoading && !isLive ? <Card><p>Loading the latest trainer details…</p></Card> : isLive ? <Card>
        <form className="space-y-7" onSubmit={handleSubmit}>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Personal details</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">First name</label>
                <Input name="firstName" value={formState.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Last name</label>
                <Input name="lastName" value={formState.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Contact details</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-900">Email</label>
                <Input name="email" type="email" value={formState.email} onChange={(event) => updateField('email', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Phone</label>
                <Input name="phone" value={formState.phone} onChange={(event) => updateField('phone', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Alternative phone</label>
                <Input name="alternativePhone" value={formState.alternativePhone} onChange={(event) => updateField('alternativePhone', event.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Address</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">Organisation/company</label>
                <Input name="organisation" value={formState.organisation} onChange={(event) => updateField('organisation', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Address line 1</label>
                <Input name="addressLine1" value={formState.addressLine1} onChange={(event) => updateField('addressLine1', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Address line 2</label>
                <Input name="addressLine2" value={formState.addressLine2} onChange={(event) => updateField('addressLine2', event.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Town/city</label>
                <Input name="townCity" value={formState.townCity} onChange={(event) => updateField('townCity', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">County</label>
                <Input name="county" value={formState.county} onChange={(event) => updateField('county', event.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Postcode</label>
                <Input name="postcode" value={formState.postcode} onChange={(event) => updateField('postcode', event.target.value)} required />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-950">Other</h2>
            <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
              <div>
                <label className="text-sm font-semibold text-slate-900">Notes</label>
                <Textarea name="notes" value={formState.notes} onChange={(event) => updateField('notes', event.target.value)} rows={5} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Status</label>
                <Select name="status" value={formState.status} onChange={(event) => updateField('status', event.target.value as TrainerStatus)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Approved training courses</h2>
                <p className="mt-1 text-sm text-slate-600">{formState.approvedCourseIds.length} selected</p>
              </div>
              <div className="w-full sm:w-80">
                <label className="text-sm font-semibold text-slate-900">Search courses</label>
                <Input value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder="Course or category" />
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredCourses.map((course) => {
                const selected = formState.approvedCourseIds.includes(course.id)
                return (
                  <label key={course.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <input type="checkbox" checked={selected} onChange={() => toggleCourse(course.id)} className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700" />
                    <span>
                      <span className="font-semibold text-slate-950">{course.title}</span>
                      <span className="mt-1 flex flex-wrap gap-2">
                        <Badge label={course.category} />
                        <Badge label={course.fundingType} variant={course.fundingType === 'funded' ? 'success' : 'warning'} />
                        <Badge label={course.status.replace('_', ' ')} variant={course.status === 'open' ? 'success' : course.status === 'cancelled' ? 'danger' : 'info'} />
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit">{editing ? 'Save trainer' : 'Create trainer'}</Button>
          </div>
        </form>
      </Card> : null}
    </div>
  )
}
