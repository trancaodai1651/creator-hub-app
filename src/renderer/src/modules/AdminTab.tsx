import React, { useEffect, useMemo, useState } from 'react'
import { accountService } from '../utils/accountService'
import type { AccessCodeRecord, ActivityRecord, HubPermission, HubSession } from '../types/auth'

const permissionLabels: Record<HubPermission, string> = { download: 'Tải video', joiner: 'Gộp video', short_export: 'Bản ngắn', view_activity: 'Xem activity', manage_access_codes: 'Quản lý mã' }
const userPermissions: HubPermission[] = ['download', 'joiner', 'short_export']

interface AdminTabProps {
  session: HubSession
  isDark: boolean
}

export const AdminTab: React.FC<AdminTabProps> = ({ session, isDark }) => {
  const [codes, setCodes] = useState<AccessCodeRecord[]>([])
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [expiresDays, setExpiresDays] = useState('')
  const [permissions, setPermissions] = useState<HubPermission[]>(['download'])
  const [view, setView] = useState<'overview' | 'codes' | 'activity'>('overview')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const [nextCodes, nextActivity] = await Promise.all([accountService.listAccessCodes(session), accountService.listActivity(session)])
    setCodes(nextCodes)
    setActivity(nextActivity)
  }
  useEffect(() => { void load().catch(error => setMessage(error.message)) }, [])

  const activeCodes = useMemo(() => codes.filter(code => !code.revokedAt && (!code.expiresAt || new Date(code.expiresAt) > new Date())).length, [codes])
  const totalUses = useMemo(() => codes.reduce((total, code) => total + code.useCount, 0), [codes])

  const createCode = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const expiresAt = expiresDays ? new Date(Date.now() + Number(expiresDays) * 86400000).toISOString() : undefined
      const created = await accountService.createAccessCode(session, { code, label, permissions, expiresAt })
      setCode(''); setLabel(''); setExpiresDays(''); setCodes(current => [created, ...current]); setMessage(`Đã tạo mã: ${created.code}`); setView('codes')
    } catch (error: any) { setMessage(error.message || String(error)) } finally { setBusy(false) }
  }

  const togglePermission = (permission: HubPermission) => setPermissions(current => current.includes(permission) ? current.filter(item => item !== permission) : [...current, permission])
  const revoke = async (code: AccessCodeRecord) => { await accountService.revokeAccessCode(session, code.id); setCodes(current => current.map(item => item.id === code.id ? { ...item, revokedAt: new Date().toISOString() } : item)) }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">Admin console</p><h2 className="mt-1 text-2xl font-semibold">Quản trị workspace</h2><p className="mt-1 text-xs opacity-50">Theo dõi người dùng, quyền truy cập và hoạt động trong app.</p></div>
        <button onClick={() => void load()} className="rounded-full border border-current/10 px-4 py-2 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10">Làm mới</button>
      </header>
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-current/10 pb-2">
        {(['overview', 'codes', 'activity'] as const).map(item => <button key={item} onClick={() => setView(item)} className={`rounded-full px-4 py-2 text-xs font-medium transition ${view === item ? 'bg-red-500 text-white' : 'opacity-55 hover:opacity-100'}`}>{item === 'overview' ? 'Tổng quan' : item === 'codes' ? 'Access codes' : 'Activity log'}</button>)}
      </div>
      {message && <div className="shrink-0 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-500">{message}</div>}

      {view === 'overview' && <div className="grid shrink-0 gap-3 sm:grid-cols-3"><div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><p className="text-xs opacity-50">Mã đang hoạt động</p><strong className="mt-2 block text-3xl font-semibold text-blue-500">{activeCodes}</strong></div><div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><p className="text-xs opacity-50">Lượt dùng access code</p><strong className="mt-2 block text-3xl font-semibold text-emerald-500">{totalUses}</strong></div><div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><p className="text-xs opacity-50">Activity đã ghi nhận</p><strong className="mt-2 block text-3xl font-semibold text-red-500">{activity.length}</strong></div></div>}

      {view === 'codes' && <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]"><form onSubmit={createCode} className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><h3 className="text-sm font-semibold">Tạo access code</h3><label className="mt-5 block text-xs font-medium">Mã tùy chọn<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="Để trống để tự sinh CH-..." className="mt-2 w-full rounded-2xl border border-current/10 bg-transparent px-3 py-3 font-mono text-sm outline-none focus:border-red-500" /></label><label className="mt-4 block text-xs font-medium">Tên người dùng / nhóm<input value={label} onChange={event => setLabel(event.target.value)} placeholder="Ví dụ: Team Editor" className="mt-2 w-full rounded-2xl border border-current/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-red-500" /></label><label className="mt-4 block text-xs font-medium">Hết hạn sau (ngày)<input type="number" min="1" value={expiresDays} onChange={event => setExpiresDays(event.target.value)} placeholder="Để trống = không hết hạn" className="mt-2 w-full rounded-2xl border border-current/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-red-500" /></label><div className="mt-5"><p className="text-xs font-medium">Quyền sử dụng</p><div className="mt-2 grid gap-2">{userPermissions.map(permission => <label key={permission} className="flex items-center gap-2 text-xs opacity-75"><input type="checkbox" checked={permissions.includes(permission)} onChange={() => togglePermission(permission)} />{permissionLabels[permission]}</label>)}</div></div><button disabled={busy} className="mt-6 w-full rounded-2xl bg-red-500 py-3 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50">{busy ? 'Đang tạo...' : 'TẠO MÃ MỚI'}</button></form><div className="custom-scrollbar min-h-0 overflow-y-auto space-y-3">{codes.map(code => <div key={code.id} className={`rounded-3xl border p-4 ${code.revokedAt ? 'opacity-45' : ''} ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-lg font-semibold tracking-widest text-blue-500">{code.code}</p><p className="mt-1 text-xs opacity-55">{code.label} · {code.useCount} lượt dùng</p></div>{!code.revokedAt && <button onClick={() => void revoke(code)} className="rounded-full border border-red-500/20 px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-500/10">Thu hồi</button>}</div><div className="mt-3 flex flex-wrap gap-1.5">{code.permissions.map(permission => <span key={permission} className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] text-blue-500">{permissionLabels[permission]}</span>)}</div><p className="mt-3 text-[10px] opacity-40">Tạo: {new Date(code.createdAt).toLocaleString()} {code.expiresAt ? `· Hết hạn: ${new Date(code.expiresAt).toLocaleDateString()}` : '· Không hết hạn'}</p></div>)}{codes.length === 0 && <div className="rounded-3xl border border-dashed border-current/15 p-8 text-center text-sm opacity-45">Chưa có access code.</div>}</div></div>}

      {view === 'activity' && <div className="custom-scrollbar min-h-0 flex-1 overflow-auto rounded-3xl border border-current/10"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 border-b border-current/10 bg-inherit text-[10px] uppercase tracking-widest opacity-55"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Chức năng</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Link / resource</th></tr></thead><tbody>{activity.map(item => <tr key={item.id} className="border-b border-current/5 align-top"><td className="whitespace-nowrap px-4 py-3 opacity-55">{new Date(item.createdAt).toLocaleString()}</td><td className="px-4 py-3 font-medium">{item.username}</td><td className="px-4 py-3 text-blue-500">{item.feature}</td><td className="px-4 py-3">{item.action}</td><td className="max-w-[420px] truncate px-4 py-3 opacity-65" title={item.link || item.resource}>{item.link || item.resource || '-'}</td></tr>)}</tbody></table>{activity.length === 0 && <div className="p-8 text-center text-sm opacity-45">Chưa có activity.</div>}</div>}
    </div>
  )
}
