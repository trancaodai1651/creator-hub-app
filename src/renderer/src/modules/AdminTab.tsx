import React, { useEffect, useMemo, useState } from 'react'
import { accountService } from '../utils/accountService'
import type { AccessCodeRecord, ActivityRecord, HubPermission, HubSession } from '../types/auth'

const permissionLabels: Record<HubPermission, string> = {
  download: 'Tải video',
  joiner: 'Gộp video',
  short_export: 'Bản ngắn',
  view_activity: 'Xem hoạt động',
  manage_access_codes: 'Quản lý mã'
}
const userPermissions: HubPermission[] = ['download', 'joiner', 'short_export']

interface AdminTabProps {
  session: HubSession
  isDark: boolean
}

const toDateTimeInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const AdminTab: React.FC<AdminTabProps> = ({ session, isDark }) => {
  const [codes, setCodes] = useState<AccessCodeRecord[]>([])
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [expiresDays, setExpiresDays] = useState('')
  const [permissions, setPermissions] = useState<HubPermission[]>(['download'])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCode, setEditCode] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [editPermissions, setEditPermissions] = useState<HubPermission[]>([])
  const [view, setView] = useState<'overview' | 'codes' | 'activity'>('overview')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const [nextCodes, nextActivity] = await Promise.all([accountService.listAccessCodes(session), accountService.listActivity(session)])
    setCodes(nextCodes)
    setActivity(nextActivity)
  }

  useEffect(() => { void load().catch(error => setMessage(error.message)) }, [session.token])

  const activeCodes = useMemo(() => codes.filter(item => !item.revokedAt && (!item.expiresAt || new Date(item.expiresAt) > new Date())).length, [codes])
  const totalUses = useMemo(() => codes.reduce((total, item) => total + item.useCount, 0), [codes])

  const resetEditor = () => {
    setEditingId(null)
    setEditCode('')
    setEditLabel('')
    setEditExpiresAt('')
    setEditPermissions([])
  }

  const startEdit = (record: AccessCodeRecord) => {
    setEditingId(record.id)
    setEditCode(record.code)
    setEditLabel(record.label)
    setEditExpiresAt(toDateTimeInput(record.expiresAt))
    setEditPermissions(record.permissions.filter(permission => userPermissions.includes(permission)))
    setMessage('')
    setView('codes')
  }

  const createCode = async () => {
    const expiresAt = expiresDays ? new Date(Date.now() + Number(expiresDays) * 86400000).toISOString() : undefined
    const created = await accountService.createAccessCode(session, { code, label, permissions, expiresAt })
    setCode('')
    setLabel('')
    setExpiresDays('')
    setCodes(current => [created, ...current])
    setMessage(`Đã tạo mã: ${created.code}`)
  }

  const updateCode = async () => {
    if (!editingId) return
    const updated = await accountService.updateAccessCode(session, editingId, {
      code: editCode,
      label: editLabel,
      permissions: editPermissions,
      expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined
    })
    setCodes(current => current.map(item => item.id === updated.id ? updated : item))
    setMessage(`Đã cập nhật mã: ${updated.code}`)
    resetEditor()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (editingId) await updateCode()
      else await createCode()
    } catch (error: any) {
      setMessage(error.message || String(error))
    } finally {
      setBusy(false)
    }
  }

  const togglePermission = (permission: HubPermission, editing: boolean) => {
    const setter = editing ? setEditPermissions : setPermissions
    setter(current => current.includes(permission) ? current.filter(item => item !== permission) : [...current, permission])
  }

  const revoke = async (record: AccessCodeRecord) => {
    setBusy(true)
    try {
      await accountService.revokeAccessCode(session, record.id)
      setCodes(current => current.map(item => item.id === record.id ? { ...item, revokedAt: new Date().toISOString() } : item))
      if (editingId === record.id) resetEditor()
      setMessage(`Đã thu hồi mã: ${record.code}`)
    } catch (error: any) {
      setMessage(error.message || String(error))
    } finally {
      setBusy(false)
    }
  }

  const editorIsActive = Boolean(editingId)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">Bảng quản trị</p>
          <h2 className="mt-1 text-2xl font-semibold">Quản trị ứng dụng</h2>
          <p className="mt-1 text-xs opacity-50">Theo dõi người dùng, quyền truy cập và hoạt động trong ứng dụng.</p>
        </div>
        <button type="button" onClick={() => void load().catch(error => setMessage(error.message))} className="shrink-0 rounded-full border border-current/10 px-4 py-2 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10">Làm mới</button>
      </header>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-current/10 pb-2">
        {(['overview', 'codes', 'activity'] as const).map(item => (
          <button type="button" key={item} onClick={() => setView(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${view === item ? 'bg-red-500 text-white' : 'opacity-55 hover:opacity-100'}`}>
            {item === 'overview' ? 'Tổng quan' : item === 'codes' ? 'Mã truy cập' : 'Nhật ký hoạt động'}
          </button>
        ))}
      </div>

      {message && <div className="shrink-0 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-500">{message}</div>}

      {view === 'overview' && (
        <div className="grid shrink-0 gap-3 sm:grid-cols-3">
          <div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><p className="text-xs opacity-50">Mã đang hoạt động</p><strong className="mt-2 block text-3xl font-semibold text-blue-500">{activeCodes}</strong></div>
          <div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><p className="text-xs opacity-50">Lượt dùng mã truy cập</p><strong className="mt-2 block text-3xl font-semibold text-emerald-500">{totalUses}</strong></div>
          <div className={`rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}><p className="text-xs opacity-50">Hoạt động đã ghi nhận</p><strong className="mt-2 block text-3xl font-semibold text-red-500">{activity.length}</strong></div>
        </div>
      )}

      {view === 'codes' && (
        <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
            <form onSubmit={handleSubmit} className={`min-w-0 rounded-3xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-500">{editorIsActive ? 'Chỉnh sửa mã' : 'Mã mới'}</p><h3 className="mt-1 text-sm font-semibold">{editorIsActive ? 'Chỉnh sửa mã' : 'Tạo mã truy cập'}</h3></div>
                {editorIsActive && <button type="button" onClick={resetEditor} className="shrink-0 rounded-full border border-current/10 px-3 py-1.5 text-[11px] font-medium opacity-70 hover:opacity-100">Hủy</button>}
              </div>

              <label className="mt-5 block text-xs font-medium">Mã truy cập
                <input value={editorIsActive ? editCode : code} onChange={event => editorIsActive ? setEditCode(event.target.value.toUpperCase()) : setCode(event.target.value.toUpperCase())} placeholder="CH-XXXXXXXX" required className="mt-2 w-full min-w-0 rounded-2xl border border-current/10 bg-transparent px-3 py-3 font-mono text-sm outline-none focus:border-red-500" />
              </label>
              <label className="mt-4 block text-xs font-medium">Tên người dùng / nhóm
                <input value={editorIsActive ? editLabel : label} onChange={event => editorIsActive ? setEditLabel(event.target.value) : setLabel(event.target.value)} placeholder="Ví dụ: Team Editor" className="mt-2 w-full min-w-0 rounded-2xl border border-current/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-red-500" />
              </label>

              {editorIsActive ? (
                <label className="mt-4 block text-xs font-medium">Thời điểm hết hạn
                  <input type="datetime-local" value={editExpiresAt} onChange={event => setEditExpiresAt(event.target.value)} className="mt-2 w-full min-w-0 rounded-2xl border border-current/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-red-500" />
                  <span className="mt-1 block text-[10px] opacity-45">Để trống nếu mã không hết hạn.</span>
                </label>
              ) : (
                <label className="mt-4 block text-xs font-medium">Hết hạn sau (ngày)
                  <input type="number" min="1" value={expiresDays} onChange={event => setExpiresDays(event.target.value)} placeholder="Để trống = không hết hạn" className="mt-2 w-full min-w-0 rounded-2xl border border-current/10 bg-transparent px-3 py-3 text-sm outline-none focus:border-red-500" />
                </label>
              )}

              <div className="mt-5"><p className="text-xs font-medium">Quyền sử dụng</p><div className="mt-2 grid gap-2">{userPermissions.map(permission => <label key={permission} className="flex min-w-0 items-center gap-2 text-xs opacity-75"><input type="checkbox" checked={(editorIsActive ? editPermissions : permissions).includes(permission)} onChange={() => togglePermission(permission, editorIsActive)} />{permissionLabels[permission]}</label>)}</div></div>
              <button type="submit" disabled={busy} className="mt-6 w-full whitespace-nowrap rounded-2xl bg-red-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-50">{busy ? 'Đang lưu...' : editorIsActive ? 'LƯU THAY ĐỔI' : 'TẠO MÃ MỚI'}</button>
            </form>

            <div className="grid min-w-0 gap-3">
              {codes.map(record => (
                <div key={record.id} className={`min-w-0 rounded-3xl border p-4 ${record.revokedAt ? 'opacity-45' : ''} ${editingId === record.id ? 'border-blue-500/50 ring-1 ring-blue-500/20' : ''} ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/70'}`}>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1"><p className="break-all font-mono text-lg font-semibold tracking-widest text-blue-500">{record.code}</p><p className="mt-1 truncate text-xs opacity-55">{record.label} · {record.useCount} lượt dùng</p></div>
                    {!record.revokedAt && <div className="flex shrink-0 flex-wrap justify-end gap-2">{record.code === '1651' ? <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-600">Mặc định · đầy đủ quyền</span> : <><button type="button" title="Chỉnh sửa mã" onClick={() => startEdit(record)} className="rounded-full border border-blue-500/20 px-3 py-1.5 text-[11px] font-medium text-blue-500 hover:bg-blue-500/10">Sửa</button><button type="button" disabled={busy} onClick={() => void revoke(record)} className="rounded-full border border-red-500/20 px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-500/10">Thu hồi</button></>}</div>}
                  </div>
                  <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">{record.permissions.map(permission => <span key={permission} className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] text-blue-500">{permissionLabels[permission]}</span>)}</div>
                  <p className="mt-3 break-words text-[10px] opacity-40">Tạo: {new Date(record.createdAt).toLocaleString()} {record.expiresAt ? `· Hết hạn: ${new Date(record.expiresAt).toLocaleString()}` : '· Không hết hạn'}</p>
                </div>
              ))}
              {codes.length === 0 && <div className="rounded-3xl border border-dashed border-current/15 p-8 text-center text-sm opacity-45">Chưa có mã truy cập.</div>}
            </div>
          </div>
        </div>
      )}

      {view === 'activity' && <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-3xl border border-current/10"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 border-b border-current/10 bg-inherit text-[10px] uppercase tracking-widest opacity-55"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Chức năng</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Liên kết / tài nguyên</th></tr></thead><tbody>{activity.map(item => <tr key={item.id} className="border-b border-current/5 align-top"><td className="whitespace-nowrap px-4 py-3 opacity-55">{new Date(item.createdAt).toLocaleString()}</td><td className="px-4 py-3 font-medium">{item.username}</td><td className="px-4 py-3 text-blue-500">{item.feature}</td><td className="px-4 py-3">{item.action}</td><td className="max-w-[420px] truncate px-4 py-3 opacity-65" title={item.link || item.resource}>{item.link || item.resource || '-'}</td></tr>)}</tbody></table>{activity.length === 0 && <div className="p-8 text-center text-sm opacity-45">Chưa có hoạt động.</div>}</div>}
    </div>
  )
}
