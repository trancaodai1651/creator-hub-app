import type { AccessCodeRecord, ActivityRecord, HubPermission, HubSession } from '../types/auth'

const API_URL = String(import.meta.env.VITE_HUB_API_URL || '').replace(/\/$/, '')
const SESSION_KEY = 'creator_hub_session'
const LOCAL_STATE_KEY = 'creator_hub_local_auth_v1'
export const DEFAULT_ADMIN_USERNAME = 'trancaodai'
export const DEFAULT_ADMIN_PASSWORD = 'Dai1651'
export const DEFAULT_ACCESS_CODE = '1651'
export const DEFAULT_ACCESS_CODE_ID = 'default-access-code'
export const SECONDARY_ACCESS_CODE = '1231'
export const SECONDARY_ACCESS_CODE_ID = 'secondary-access-code'
export const FULL_USER_ACCESS_CODE = '160501'
export const FULL_USER_ACCESS_CODE_ID = 'full-user-access-code'
const DEFAULT_ADMIN_PASSWORD_HASH = '75f2faa1e8e186918c51e895c3109218ff73f3b48c1cb872a2de5d6782a689d2'
const STANDARD_USER_PERMISSIONS: HubPermission[] = ['download', 'joiner', 'short_export']
const FULL_USER_PERMISSIONS: HubPermission[] = [...STANDARD_USER_PERMISSIONS, 'tts']

const BUILT_IN_ACCESS_CODES = [
  { id: DEFAULT_ACCESS_CODE_ID, code: DEFAULT_ACCESS_CODE, label: 'Người dùng mặc định', permissions: STANDARD_USER_PERMISSIONS },
  { id: SECONDARY_ACCESS_CODE_ID, code: SECONDARY_ACCESS_CODE, label: 'Người dùng tiêu chuẩn', permissions: STANDARD_USER_PERMISSIONS },
  { id: FULL_USER_ACCESS_CODE_ID, code: FULL_USER_ACCESS_CODE, label: 'Người dùng đầy đủ tính năng', permissions: FULL_USER_PERMISSIONS }
] as const

interface LocalAdmin {
  username: string
  passwordHash: string
}

interface LocalState {
  admin?: LocalAdmin
  accessCodes: AccessCodeRecord[]
  activity: ActivityRecord[]
}

const createBuiltInAccessCode = (definition: typeof BUILT_IN_ACCESS_CODES[number]): AccessCodeRecord => ({
  id: definition.id,
  code: definition.code,
  label: definition.label,
  permissions: [...definition.permissions],
  createdAt: '2026-08-21T00:00:00.000Z',
  useCount: 0
})

const emptyState = (): LocalState => ({
  admin: { username: DEFAULT_ADMIN_USERNAME, passwordHash: DEFAULT_ADMIN_PASSWORD_HASH },
  accessCodes: BUILT_IN_ACCESS_CODES.map(createBuiltInAccessCode),
  activity: []
})

const sanitizePermissions = (permissions: HubPermission[], accessCode?: string) => {
  const allowed = new Set<HubPermission>(['download', 'joiner', 'short_export', 'tts'])
  const cleaned = permissions.filter(permission => allowed.has(permission) && (permission !== 'tts' || accessCode === FULL_USER_ACCESS_CODE))
  return accessCode === FULL_USER_ACCESS_CODE ? [...FULL_USER_PERMISSIONS] : Array.from(new Set(cleaned))
}

const normalizeUserPermissions = (permissions: HubPermission[], accessCodeId?: string) => {
  if (accessCodeId === FULL_USER_ACCESS_CODE_ID) return [...FULL_USER_PERMISSIONS]
  return sanitizePermissions(permissions, '')
}

export const isBuiltInAccessCode = (record: Pick<AccessCodeRecord, 'id' | 'code'>) => BUILT_IN_ACCESS_CODES.some(item => item.id === record.id || item.code === record.code)

const writeLocalState = (state: LocalState) => {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state))
}

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
    for (const definition of BUILT_IN_ACCESS_CODES) {
      const matches = state.accessCodes.filter(item => item.id === definition.id || item.code === definition.code)
      const record = matches[0]
      if (!record) {
        state.accessCodes.unshift(createBuiltInAccessCode(definition))
        changed = true
        continue
      }
      const expectedPermissions = [...definition.permissions]
      if (record.id !== definition.id || record.code !== definition.code || record.label !== definition.label || JSON.stringify(record.permissions || []) !== JSON.stringify(expectedPermissions) || record.revokedAt || record.expiresAt) {
        record.id = definition.id
        record.code = definition.code
        record.label = definition.label
        record.permissions = expectedPermissions
        delete record.revokedAt
        delete record.expiresAt
        changed = true
      }
      if (matches.length > 1) {
        state.accessCodes = state.accessCodes.filter(item => item === record || !matches.includes(item))
        changed = true
      }
    }
    for (const record of state.accessCodes) {
      const permissions = sanitizePermissions(record.permissions || [], record.code)
      if (JSON.stringify(record.permissions || []) !== JSON.stringify(permissions)) {
        record.permissions = permissions
        changed = true
      }
    }
    if (changed) writeLocalState(state)
    return state
  } catch {
    const state = emptyState()
    writeLocalState(state)
    return state
  }
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
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as HubSession | null
      return session?.role === 'user' ? { ...session, permissions: normalizeUserPermissions(session.permissions, session.accessCodeId) } : session
    } catch { return null }
  },
  setSession: (session: HubSession) => localStorage.setItem(SESSION_KEY, JSON.stringify(session)),
  clearSession: () => localStorage.removeItem(SESSION_KEY),

  setupAdmin: async (username: string, password: string) => {
    if (API_URL) return request<{ session: HubSession }>('/auth/admin/setup', { method: 'POST', body: JSON.stringify({ username, password }) })
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
    if (API_URL) {
      const response = await request<{ session: HubSession }>('/auth/access-code', { method: 'POST', body: JSON.stringify({ code }) })
      return { session: { ...response.session, permissions: normalizeUserPermissions(response.session.permissions, response.session.accessCodeId) } }
    }
    const state = readLocalState()
    const normalized = code.trim().toUpperCase()
    const record = state.accessCodes.find(item => item.code === normalized && !item.revokedAt && (!item.expiresAt || new Date(item.expiresAt) > new Date()))
    if (!record) throw new Error('Mã truy cập không hợp lệ, đã hết hạn hoặc đã bị thu hồi.')
    record.useCount += 1
    record.lastUsedAt = new Date().toISOString()
    state.activity.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), username: record.label || `user-${record.id.slice(0, 6)}`, accessCodeId: record.id, feature: 'auth', action: 'login_access_code', resource: 'Đăng nhập ứng dụng', metadata: {} })
    state.activity = state.activity.slice(0, 1000)
    writeLocalState(state)
    return { session: { token: makeToken(), role: 'user' as const, username: record.label || `user-${record.id.slice(0, 6)}`, displayName: record.label || 'Người dùng bên ngoài', permissions: normalizeUserPermissions(record.permissions, record.id), accessCodeId: record.id } }
  },

  listAccessCodes: async (session: HubSession) => {
    if (API_URL) return (await request<{ accessCodes: AccessCodeRecord[] }>('/admin/access-codes', {}, session.token)).accessCodes
    return readLocalState().accessCodes
  },

  createAccessCode: async (session: HubSession, input: { code?: string; label: string; permissions: HubPermission[]; expiresAt?: string }) => {
    if (API_URL) return (await request<{ accessCode: AccessCodeRecord }>('/admin/access-codes', { method: 'POST', body: JSON.stringify(input) }, session.token)).accessCode
    const state = readLocalState()
    const code = input.code?.trim().toUpperCase() || `CH-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
    if (state.accessCodes.some(item => item.code === code && !item.revokedAt)) throw new Error('Mã truy cập này đã tồn tại.')
    const record: AccessCodeRecord = { id: crypto.randomUUID(), code, label: input.label.trim() || 'Người dùng bên ngoài', permissions: sanitizePermissions(input.permissions, code), createdAt: new Date().toISOString(), expiresAt: input.expiresAt || undefined, useCount: 0 }
    state.accessCodes.unshift(record)
    writeLocalState(state)
    return record
  },

  updateAccessCode: async (session: HubSession, id: string, input: { code: string; label: string; permissions: HubPermission[]; expiresAt?: string }) => {
    if (API_URL) return (await request<{ accessCode: AccessCodeRecord }>(`/admin/access-codes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }, session.token)).accessCode
    const state = readLocalState()
    const record = state.accessCodes.find(item => item.id === id)
    if (!record) throw new Error('Không tìm thấy mã truy cập.')
    if (isBuiltInAccessCode(record)) throw new Error('Mã truy cập tích hợp không thể sửa.')
    const normalizedCode = input.code.trim().toUpperCase()
    if (!normalizedCode) throw new Error('Mã truy cập không được để trống.')
    if (state.accessCodes.some(item => item.id !== id && item.code === normalizedCode && !item.revokedAt)) throw new Error('Mã truy cập này đã tồn tại.')
    Object.assign(record, { code: normalizedCode, label: input.label.trim() || 'Người dùng bên ngoài', permissions: sanitizePermissions(input.permissions, normalizedCode), expiresAt: input.expiresAt || undefined })
    writeLocalState(state)
    return record
  },

  revokeAccessCode: async (session: HubSession, id: string) => {
    if (API_URL) { await request(`/admin/access-codes/${encodeURIComponent(id)}`, { method: 'DELETE' }, session.token); return }
    const state = readLocalState()
    const record = state.accessCodes.find(item => item.id === id)
    if (record && isBuiltInAccessCode(record)) throw new Error('Mã truy cập tích hợp không thể bị thu hồi.')
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

const ADMIN_ONLY_PERMISSIONS = new Set<HubPermission>(['view_activity', 'manage_access_codes'])

export const hasPermission = (session: HubSession | null, permission: HubPermission) => {
  if (!session) return false
  if (session.role === 'admin') return true
  if (session.accessCodeId === FULL_USER_ACCESS_CODE_ID && !ADMIN_ONLY_PERMISSIONS.has(permission)) return true
  return Boolean(session.permissions.includes(permission))
}
