import type { AccessCodeRecord, ActivityRecord, HubPermission, HubSession } from '../types/auth'

const API_URL = String(import.meta.env.VITE_HUB_API_URL || '').replace(/\/$/, '')
const SESSION_KEY = 'creator_hub_session'
const LOCAL_STATE_KEY = 'creator_hub_local_auth_v1'
export const DEFAULT_ADMIN_USERNAME = 'trancaodai'
export const DEFAULT_ADMIN_PASSWORD = 'Dai1651'
export const DEFAULT_ACCESS_CODE = '1651'
const DEFAULT_ADMIN_PASSWORD_HASH = '75f2faa1e8e186918c51e895c3109218ff73f3b48c1cb872a2de5d6782a689d2'
const DEFAULT_ACCESS_PERMISSIONS: HubPermission[] = ['download', 'joiner', 'short_export']

interface LocalAdmin {
  username: string
  passwordHash: string
}

interface LocalState {
  admin?: LocalAdmin
  accessCodes: AccessCodeRecord[]
  activity: ActivityRecord[]
}

const defaultAccessCode = (): AccessCodeRecord => ({
  id: 'default-access-code',
  code: DEFAULT_ACCESS_CODE,
  label: 'Default user',
  permissions: DEFAULT_ACCESS_PERMISSIONS,
  createdAt: '2026-08-21T00:00:00.000Z',
  useCount: 0
})

const emptyState = (): LocalState => ({
  admin: { username: DEFAULT_ADMIN_USERNAME, passwordHash: DEFAULT_ADMIN_PASSWORD_HASH },
  accessCodes: [defaultAccessCode()],
  activity: []
})

const readLocalState = (): LocalState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || '')
    const state: LocalState = {
      admin: parsed.admin,
      accessCodes: Array.isArray(parsed.accessCodes) ? parsed.accessCodes : [],
      activity: Array.isArray(parsed.activity) ? parsed.activity : []
    }
    let changed = false
    if (!state.admin) {
      state.admin = { username: DEFAULT_ADMIN_USERNAME, passwordHash: DEFAULT_ADMIN_PASSWORD_HASH }
      changed = true
    }
    if (!state.accessCodes.some(item => item.code === DEFAULT_ACCESS_CODE)) {
      state.accessCodes.unshift(defaultAccessCode())
      changed = true
    }
    if (changed) writeLocalState(state)
    return state
  } catch {
    const state = emptyState()
    writeLocalState(state)
    return state
  }
}

const writeLocalState = (state: LocalState) => {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state))
}

const makeToken = () => `local-${crypto.randomUUID()}`

const hashText = async (value: string) => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

const request = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Request failed (${response.status})`)
  return body as T
}

export const accountService = {
  isRemoteConfigured: Boolean(API_URL),
  hasLocalAdmin: () => Boolean(readLocalState().admin),
  getSession: (): HubSession | null => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
  },
  setSession: (session: HubSession) => localStorage.setItem(SESSION_KEY, JSON.stringify(session)),
  clearSession: () => localStorage.removeItem(SESSION_KEY),

  setupAdmin: async (username: string, password: string) => {
    if (API_URL) {
      return request<{ session: HubSession }>('/auth/admin/setup', { method: 'POST', body: JSON.stringify({ username, password }) })
    }
    const state = readLocalState()
    if (state.admin) throw new Error('Tài khoản admin local đã được thiết lập.')
    state.admin = { username, passwordHash: await hashText(password) }
    writeLocalState(state)
    return { session: { token: makeToken(), role: 'admin' as const, username, displayName: username, permissions: [] as HubPermission[] } }
  },

  loginAdmin: async (username: string, password: string) => {
    if (API_URL) return request<{ session: HubSession }>('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    const state = readLocalState()
    if (!state.admin) throw new Error('Chưa có admin local. Hãy chọn thiết lập admin lần đầu.')
    if (state.admin.username !== username || state.admin.passwordHash !== await hashText(password)) throw new Error('Sai tài khoản hoặc mật khẩu admin.')
    return { session: { token: makeToken(), role: 'admin' as const, username, displayName: username, permissions: [] as HubPermission[] } }
  },

  loginWithAccessCode: async (code: string) => {
    if (API_URL) return request<{ session: HubSession }>('/auth/access-code', { method: 'POST', body: JSON.stringify({ code }) })
    const state = readLocalState()
    const normalized = code.trim().toUpperCase()
    const record = state.accessCodes.find(item => item.code === normalized && !item.revokedAt && (!item.expiresAt || new Date(item.expiresAt) > new Date()))
    if (!record) throw new Error('Access code không hợp lệ, đã hết hạn hoặc đã bị thu hồi.')
    record.useCount += 1
    record.lastUsedAt = new Date().toISOString()
    state.activity.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), username: record.label || `user-${record.id.slice(0, 6)}`, accessCodeId: record.id, feature: 'auth', action: 'login_access_code', resource: 'Workspace login', metadata: {} })
    state.activity = state.activity.slice(0, 1000)
    writeLocalState(state)
    return { session: { token: makeToken(), role: 'user' as const, username: record.label || `user-${record.id.slice(0, 6)}`, displayName: record.label || 'External user', permissions: record.permissions, accessCodeId: record.id } }
  },

  listAccessCodes: async (session: HubSession) => {
    if (API_URL) return (await request<{ accessCodes: AccessCodeRecord[] }>('/admin/access-codes', {}, session.token)).accessCodes
    return readLocalState().accessCodes
  },

  createAccessCode: async (session: HubSession, input: { code?: string; label: string; permissions: HubPermission[]; expiresAt?: string }) => {
    if (API_URL) return (await request<{ accessCode: AccessCodeRecord }>('/admin/access-codes', { method: 'POST', body: JSON.stringify(input) }, session.token)).accessCode
    const state = readLocalState()
    const code = input.code?.trim().toUpperCase() || `CH-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
    if (state.accessCodes.some(item => item.code === code && !item.revokedAt)) throw new Error('Access code này đã tồn tại.')
    const record: AccessCodeRecord = { id: crypto.randomUUID(), code, label: input.label.trim() || 'External user', permissions: input.permissions, createdAt: new Date().toISOString(), expiresAt: input.expiresAt || undefined, useCount: 0 }
    state.accessCodes.unshift(record)
    writeLocalState(state)
    return record
  },

  updateAccessCode: async (session: HubSession, id: string, input: { code: string; label: string; permissions: HubPermission[]; expiresAt?: string }) => {
    if (API_URL) return (await request<{ accessCode: AccessCodeRecord }>(`/admin/access-codes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }, session.token)).accessCode
    const state = readLocalState()
    const record = state.accessCodes.find(item => item.id === id)
    if (!record) throw new Error('Không tìm thấy access code.')
    const normalizedCode = input.code.trim().toUpperCase()
    if (!normalizedCode) throw new Error('Access code không được để trống.')
    if (state.accessCodes.some(item => item.id !== id && item.code === normalizedCode && !item.revokedAt)) throw new Error('Access code này đã tồn tại.')
    Object.assign(record, { code: normalizedCode, label: input.label.trim() || 'External user', permissions: input.permissions, expiresAt: input.expiresAt || undefined })
    writeLocalState(state)
    return record
  },

  revokeAccessCode: async (session: HubSession, id: string) => {
    if (API_URL) { await request(`/admin/access-codes/${encodeURIComponent(id)}`, { method: 'DELETE' }, session.token); return }
    const state = readLocalState()
    const record = state.accessCodes.find(item => item.id === id)
    if (record) record.revokedAt = new Date().toISOString()
    writeLocalState(state)
  },

  listActivity: async (session: HubSession) => {
    if (API_URL) return (await request<{ activity: ActivityRecord[] }>('/admin/activity', {}, session.token)).activity
    return readLocalState().activity
  },

  track: async (session: HubSession | null, input: Omit<ActivityRecord, 'id' | 'createdAt' | 'username' | 'accessCodeId'>) => {
    if (!session) return
    if (API_URL) {
      await request('/activity', { method: 'POST', body: JSON.stringify(input) }, session.token).catch(() => {})
      return
    }
    const state = readLocalState()
    state.activity.unshift({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), username: session.username, accessCodeId: session.accessCodeId })
    state.activity = state.activity.slice(0, 1000)
    writeLocalState(state)
  }
}

export const hasPermission = (session: HubSession | null, permission: HubPermission) => session?.role === 'admin' || Boolean(session?.permissions.includes(permission))
