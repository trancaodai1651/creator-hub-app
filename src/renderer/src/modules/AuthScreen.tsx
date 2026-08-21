import React, { useState } from 'react'
import { accountService } from '../utils/accountService'
import type { HubSession } from '../types/auth'

interface AuthScreenProps {
  isDark: boolean
  onThemeToggle: () => void
  onAuthenticated: (session: HubSession) => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isDark, onThemeToggle, onAuthenticated }) => {
  const [mode, setMode] = useState<'admin' | 'user'>('user')
  const [setupMode] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'user') {
        const result = await accountService.loginWithAccessCode(accessCode)
        accountService.setSession(result.session)
        onAuthenticated(result.session)
      } else {
        if (setupMode && password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.')
        if (setupMode && password.length < 8) throw new Error('Mật khẩu admin phải có ít nhất 8 ký tự.')
        const result = setupMode ? await accountService.setupAdmin(username, password) : await accountService.loginAdmin(username, password)
        accountService.setSession(result.session)
        onAuthenticated(result.session)
      }
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`creator-app flex min-h-screen items-center justify-center overflow-auto p-4 sm:p-8 ${isDark ? 'bg-[#0d1016] text-white' : 'bg-[#e8edf2] text-zinc-900'}`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(239,68,68,0.16),transparent_32%),radial-gradient(circle_at_92%_88%,rgba(59,130,246,0.12),transparent_35%)]" />
      <main className={`relative w-full max-w-[920px] overflow-hidden rounded-[32px] border shadow-2xl ${isDark ? 'border-white/10 bg-[#171b23]/90' : 'border-white/70 bg-white/75'}`}>
        <div className="grid min-h-[540px] md:grid-cols-[0.9fr_1.1fr]">
          <section className="flex flex-col justify-between border-b border-white/10 p-7 sm:p-10 md:border-b-0 md:border-r">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-xl text-white shadow-lg">▶</span>
                <div>
                  <p className="text-sm font-semibold tracking-wide">CREATOR HUB</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] opacity-50">v2.0 Beta</p>
                </div>
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-red-500">Workspace access</p>
              <h1 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">Đăng nhập để tiếp tục làm việc.</h1>
              <p className="mt-4 max-w-md text-sm leading-7 opacity-60">Admin quản lý quyền truy cập và nhật ký sử dụng. Người dùng bên ngoài chỉ cần access code do admin cấp.</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 text-xs font-medium opacity-70">
              <div className="rounded-2xl border border-current/10 p-4"><strong className="mb-1 block text-red-500">Admin</strong>Quản lý mã và activity</div>
              <div className="rounded-2xl border border-current/10 p-4"><strong className="mb-1 block text-blue-500">User</strong>Truy cập theo quyền</div>
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <div className="mb-7 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Chào mừng trở lại</h2>
                <p className="mt-1 text-xs opacity-50">Chọn loại tài khoản để đăng nhập.</p>
              </div>
              <button type="button" onClick={onThemeToggle} className="rounded-full border border-current/10 px-3 py-2 text-xs font-medium opacity-70 transition hover:opacity-100">{isDark ? 'Sáng' : 'Tối'}</button>
            </div>

            <div className={`mb-6 grid grid-cols-2 rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-100/70'}`}>
              <button type="button" onClick={() => { setMode('user'); setError('') }} className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${mode === 'user' ? 'bg-blue-500 text-white shadow-md' : 'opacity-55 hover:opacity-100'}`}>User access code</button>
              <button type="button" onClick={() => { setMode('admin'); setError('') }} className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${mode === 'admin' ? 'bg-red-500 text-white shadow-md' : 'opacity-55 hover:opacity-100'}`}>Admin login</button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'user' ? (
                <label className="block text-sm font-medium">
                  Access code
                  <input autoFocus value={accessCode} onChange={event => setAccessCode(event.target.value.toUpperCase())} placeholder="CH-XXXXXXXX" required className={`mt-2 w-full rounded-2xl border px-4 py-3.5 text-base tracking-[0.12em] outline-none transition focus:border-blue-500 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/80'}`} />
                  <span className="mt-2 block text-xs opacity-50">Mã được tạo trong trang Admin.</span>
                </label>
              ) : (
                <>
                  <label className="block text-sm font-medium">Tài khoản<input autoFocus value={username} onChange={event => setUsername(event.target.value)} placeholder="admin" required className={`mt-2 w-full rounded-2xl border px-4 py-3.5 outline-none transition focus:border-red-500 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/80'}`} /></label>
                  <label className="block text-sm font-medium">Mật khẩu<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Tối thiểu 8 ký tự" required className={`mt-2 w-full rounded-2xl border px-4 py-3.5 outline-none transition focus:border-red-500 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/80'}`} /></label>
                  {setupMode && <label className="block text-sm font-medium">Xác nhận mật khẩu<input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" required className={`mt-2 w-full rounded-2xl border px-4 py-3.5 outline-none transition focus:border-red-500 ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white/80'}`} /></label>}
                  <p className="text-xs opacity-50">Tài khoản mặc định: `trancaodai` · Mật khẩu mặc định: `Dai1651`</p>
                </>
              )}
              {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-500">{error}</p>}
              <button disabled={busy} className={`w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 ${mode === 'admin' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>{busy ? 'Đang xác thực...' : setupMode && mode === 'admin' ? 'TẠO ADMIN' : mode === 'admin' ? 'ĐĂNG NHẬP ADMIN' : 'VÀO WORKSPACE'}</button>
            </form>
            <p className="mt-7 text-center text-[11px] opacity-40">{accountService.isRemoteConfigured ? 'Central workspace server enabled' : 'Local auth mode · cấu hình VITE_HUB_API_URL để đồng bộ nhiều máy'}</p>
          </section>
        </div>
      </main>
    </div>
  )
}
