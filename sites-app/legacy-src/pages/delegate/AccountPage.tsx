import { FormEvent, useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

interface ProfileRow {
  first_name: string; last_name: string; email: string; phone: string | null; organisation: string;
  manager_name: string; manager_email: string; special_requirements: string | null;
  staff_type: 'manager' | 'office' | 'clinical';
}

export default function AccountPage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', organisation: '', managerName: '', managerEmail: '', staffType: 'clinical', specialRequirements: '' })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    void fetch('/api/account/profile', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as { profile?: ProfileRow; message?: string }
      if (!response.ok || !result.profile) throw new Error(result.message ?? 'Your profile could not be loaded.')
      setProfile(result.profile)
      setForm({
        firstName: result.profile.first_name, lastName: result.profile.last_name, phone: result.profile.phone ?? '',
        organisation: result.profile.organisation, managerName: result.profile.manager_name,
        managerEmail: result.profile.manager_email, staffType: result.profile.staff_type, specialRequirements: result.profile.special_requirements ?? '',
      })
    }).catch((error) => setProfileError(error instanceof Error ? error.message : 'Your profile could not be loaded.'))
  }, [])

  function field(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })) }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setProfileError(''); setProfileMessage('')
    try {
      const response = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json() as { profile?: ProfileRow; message?: string }
      if (!response.ok || !result.profile) throw new Error(result.message ?? 'Your profile could not be updated.')
      setProfile(result.profile); setProfileMessage('Your details have been saved.')
    } catch (error) { setProfileError(error instanceof Error ? error.message : 'Your profile could not be updated.') }
    finally { setSaving(false) }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setChanging(true); setPasswordError(''); setPasswordMessage('')
    try {
      if (passwords.newPassword !== passwords.confirmPassword) throw new Error('The new passwords do not match.')
      const response = await fetch('/api/account/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
      })
      const result = await response.json() as { changed?: boolean; message?: string }
      if (!response.ok || !result.changed) throw new Error(result.message ?? 'Your password could not be changed.')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Your password has been changed. Other signed-in sessions have been closed.')
    } catch (error) { setPasswordError(error instanceof Error ? error.message : 'Your password could not be changed.') }
    finally { setChanging(false) }
  }

  return <div className="space-y-6">
    <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">My account</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">Personal and security details</h1>
      <p className="mt-2 text-sm text-slate-600">Keep your contact and practice information up to date.</p>
    </div>
    <Card>
      <h2 className="text-xl font-semibold text-slate-950">My details</h2>
      {profileError ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{profileError}</p> : null}
      {profileMessage ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{profileMessage}</p> : null}
      {!profile ? <p className="mt-4 text-sm text-slate-600">Loading your details...</p> :
        <form className="mt-5 space-y-5" onSubmit={saveProfile}>
          <div className="grid gap-5 md:grid-cols-2">
            <div><label className="text-sm font-semibold">First name</label><Input value={form.firstName} onChange={(event) => field('firstName', event.target.value)} required /></div>
            <div><label className="text-sm font-semibold">Last name</label><Input value={form.lastName} onChange={(event) => field('lastName', event.target.value)} required /></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div><label className="text-sm font-semibold">Login email</label><Input value={profile.email} readOnly /><p className="mt-1 text-xs text-slate-500">Email changes will be enabled with email verification.</p></div>
            <div><label className="text-sm font-semibold">Phone</label><Input value={form.phone} onChange={(event) => field('phone', event.target.value)} /></div>
          </div>
          <div><label className="text-sm font-semibold">Practice / organisation</label><Input value={form.organisation} onChange={(event) => field('organisation', event.target.value)} required /></div>
          <div><label className="text-sm font-semibold">My staff type</label><Select value={form.staffType} onChange={(event) => field('staffType', event.target.value)} required><option value="manager">Manager</option><option value="office">Office staff</option><option value="clinical">Clinical</option></Select><p className="mt-1 text-xs text-slate-500">Changing this updates which courses are available to you.</p></div>
          <div className="grid gap-5 md:grid-cols-2">
            <div><label className="text-sm font-semibold">Practice manager</label><Input value={form.managerName} onChange={(event) => field('managerName', event.target.value)} required /></div>
            <div><label className="text-sm font-semibold">Manager email</label><Input type="email" value={form.managerEmail} onChange={(event) => field('managerEmail', event.target.value)} required /></div>
          </div>
          <div><label className="text-sm font-semibold">Special requirements</label><Textarea value={form.specialRequirements} onChange={(event) => field('specialRequirements', event.target.value)} rows={4} /></div>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save details'}</Button>
        </form>}
    </Card>
    <Card>
      <h2 className="text-xl font-semibold text-slate-950">Change password</h2>
      <p className="mt-2 text-sm text-slate-600">Use at least 12 characters including upper-case, lower-case and numeric characters.</p>
      {passwordError ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{passwordError}</p> : null}
      {passwordMessage ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{passwordMessage}</p> : null}
      <form className="mt-5 grid gap-5 md:grid-cols-3" onSubmit={changePassword}>
        <div><label className="text-sm font-semibold">Current password</label><Input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} autoComplete="current-password" required /></div>
        <div><label className="text-sm font-semibold">New password</label><Input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} autoComplete="new-password" minLength={12} required /></div>
        <div><label className="text-sm font-semibold">Confirm new password</label><Input type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} autoComplete="new-password" minLength={12} required /></div>
        <div className="md:col-span-3"><Button type="submit" disabled={changing}>{changing ? 'Changing...' : 'Change password'}</Button></div>
      </form>
    </Card>
  </div>
}
