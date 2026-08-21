import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataFile = process.env.HUB_DATA_FILE || path.join(root, 'data.json')
const port = Number(process.env.PORT || 8787)
const userPermissions = new Set(['download', 'joiner', 'short_export'])
const defaultAccessCodeId = 'default-access-code'
const defaultAdminUsername = process.env.HUB_ADMIN_USERNAME || 'trancaodai'
const defaultAdminPassword = process.env.HUB_ADMIN_PASSWORD || 'Dai1651'
const defaultAccessCode = '1651'
const sessions = new Map()

const readData = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    return { admin: parsed.admin || null, accessCodes: Array.isArray(parsed.accessCodes) ? parsed.accessCodes : [], activity: Array.isArray(parsed.activity) ? parsed.activity : [] }
  } catch { return { admin: null, accessCodes: [], activity: [] } }
}
let data = readData()
const persist = () => { fs.mkdirSync(path.dirname(dataFile), { recursive: true }); fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)) }
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': process.env.HUB_ALLOWED_ORIGIN || '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS' }); res.end(JSON.stringify(body)) }
const readBody = req => new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}) } catch { reject(new Error('Invalid JSON')) } }); req.on('error', reject) })
const id = () => crypto.randomUUID()
const token = () => crypto.randomBytes(32).toString('hex')
const passwordHash = (password, salt = crypto.randomBytes(16).toString('hex')) => `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`
const validPassword = (password, stored) => { const [, salt, expected] = String(stored || '').split('$'); if (!salt || !expected) return false; const actual = crypto.scryptSync(password, salt, 64).toString('hex'); return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected)) }
const createSession = (payload) => { const value = token(); sessions.set(value, { ...payload, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14 }); return value }
const auth = (req, requiredRole) => { const value = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const session = sessions.get(value); if (!session || session.expiresAt < Date.now() || (requiredRole && session.role !== requiredRole)) return null; return { ...session, token: value } }
const cleanPermissions = input => Array.isArray(input) ? input.filter(value => userPermissions.has(value)) : []
const createAccessCode = (body) => ({ id: id(), code: String(body.code || `CH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`).trim().toUpperCase().slice(0, 40), label: String(body.label || 'Người dùng bên ngoài').trim().slice(0, 80), permissions: cleanPermissions(body.permissions), createdAt: new Date().toISOString(), expiresAt: body.expiresAt || undefined, useCount: 0 })
const isDefaultAccessCode = record => record?.id === defaultAccessCodeId || record?.code === defaultAccessCode
const defaultUserPermissions = () => Array.from(userPermissions)

const ensureDefaults = () => {
  let changed = false
  if (!data.admin) {
    data.admin = { username: defaultAdminUsername, passwordHash: passwordHash(defaultAdminPassword), displayName: defaultAdminUsername }
    changed = true
  }
  const defaultRecord = data.accessCodes.find(item => isDefaultAccessCode(item))
  if (!defaultRecord) {
    data.accessCodes.unshift({ id: defaultAccessCodeId, code: defaultAccessCode, label: 'Người dùng mặc định', permissions: defaultUserPermissions(), createdAt: '2026-08-21T00:00:00.000Z', useCount: 0 })
    changed = true
  } else {
    const permissions = defaultUserPermissions()
    if (defaultRecord.id !== defaultAccessCodeId || defaultRecord.code !== defaultAccessCode || JSON.stringify(defaultRecord.permissions || []) !== JSON.stringify(permissions) || defaultRecord.revokedAt || defaultRecord.expiresAt) {
      defaultRecord.id = defaultAccessCodeId
      defaultRecord.code = defaultAccessCode
      defaultRecord.permissions = permissions
      delete defaultRecord.revokedAt
      delete defaultRecord.expiresAt
      changed = true
    }
  }
  if (changed) persist()
}

ensureDefaults()

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  try {
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true })
    if (req.method === 'POST' && url.pathname === '/api/auth/admin/setup') {
      if (data.admin) return json(res, 409, { message: 'Admin đã được thiết lập.' })
      const body = await readBody(req)
      if (!body.username || String(body.password || '').length < 8) return json(res, 400, { message: 'Tài khoản và mật khẩu tối thiểu 8 ký tự là bắt buộc.' })
      data.admin = { username: String(body.username).trim(), passwordHash: passwordHash(String(body.password)), displayName: String(body.username).trim() }
      persist()
      const session = { role: 'admin', username: data.admin.username, displayName: data.admin.displayName, permissions: [] }
      return json(res, 200, { session: { ...session, token: createSession(session) } })
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/admin/login') {
      const body = await readBody(req)
      if (!data.admin || data.admin.username !== String(body.username || '').trim() || !validPassword(String(body.password || ''), data.admin.passwordHash)) return json(res, 401, { message: 'Sai tài khoản hoặc mật khẩu admin.' })
      const session = { role: 'admin', username: data.admin.username, displayName: data.admin.displayName, permissions: [] }
      return json(res, 200, { session: { ...session, token: createSession(session) } })
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/access-code') {
      const body = await readBody(req)
      const code = data.accessCodes.find(item => item.code === String(body.code || '').trim().toUpperCase() && !item.revokedAt && (!item.expiresAt || new Date(item.expiresAt) > new Date()))
      if (!code) return json(res, 401, { message: 'Access code không hợp lệ, đã hết hạn hoặc đã bị thu hồi.' })
      code.useCount += 1; code.lastUsedAt = new Date().toISOString(); persist()
      const session = { role: 'user', username: code.label || `user-${code.id.slice(0, 6)}`, displayName: code.label || 'Người dùng bên ngoài', permissions: code.permissions, accessCodeId: code.id }
      data.activity.unshift({ id: id(), createdAt: new Date().toISOString(), username: session.username, accessCodeId: code.id, feature: 'auth', action: 'login_access_code', resource: 'Đăng nhập ứng dụng', metadata: {} })
      data.activity = data.activity.slice(0, 10000); persist()
      return json(res, 200, { session: { ...session, token: createSession(session) } })
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/access-codes') {
      if (!auth(req, 'admin')) return json(res, 401, { message: 'Admin authentication required.' })
      return json(res, 200, { accessCodes: data.accessCodes })
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/access-codes') {
      if (!auth(req, 'admin')) return json(res, 401, { message: 'Admin authentication required.' })
      const record = createAccessCode(await readBody(req))
      if (!record.code || data.accessCodes.some(item => item.code === record.code && !item.revokedAt)) return json(res, 409, { message: 'Access code này đã tồn tại.' })
      data.accessCodes.unshift(record); persist(); return json(res, 201, { accessCode: record })
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/api/admin/access-codes/')) {
      if (!auth(req, 'admin')) return json(res, 401, { message: 'Admin authentication required.' })
      const record = data.accessCodes.find(item => item.id === decodeURIComponent(url.pathname.split('/').pop()))
      if (!record) return json(res, 404, { message: 'Access code not found.' })
      if (isDefaultAccessCode(record)) return json(res, 409, { message: 'Mã truy cập mặc định 1651 luôn có đầy đủ quyền người dùng và không thể sửa.' })
      if (record.revokedAt) return json(res, 409, { message: 'Không thể sửa access code đã thu hồi.' })
      const body = await readBody(req)
      const code = String(body.code || '').trim().toUpperCase().slice(0, 40)
      if (!code) return json(res, 400, { message: 'Access code không được để trống.' })
      if (data.accessCodes.some(item => item.id !== record.id && item.code === code && !item.revokedAt)) return json(res, 409, { message: 'Access code này đã tồn tại.' })
      record.code = code
      record.label = String(body.label || 'Người dùng bên ngoài').trim().slice(0, 80)
      record.permissions = cleanPermissions(body.permissions)
      record.expiresAt = body.expiresAt || undefined
      persist()
      return json(res, 200, { accessCode: record })
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/admin/access-codes/')) {
      if (!auth(req, 'admin')) return json(res, 401, { message: 'Admin authentication required.' })
      const record = data.accessCodes.find(item => item.id === decodeURIComponent(url.pathname.split('/').pop()))
      if (!record) return json(res, 404, { message: 'Access code not found.' })
      if (isDefaultAccessCode(record)) return json(res, 409, { message: 'Mã truy cập mặc định 1651 không thể bị thu hồi.' })
      record.revokedAt = new Date().toISOString(); persist(); return json(res, 200, { ok: true })
    }
    if (req.method === 'GET' && url.pathname === '/api/admin/activity') {
      if (!auth(req, 'admin')) return json(res, 401, { message: 'Admin authentication required.' })
      return json(res, 200, { activity: data.activity.slice(0, 2000) })
    }
    if (req.method === 'POST' && url.pathname === '/api/activity') {
      const session = auth(req)
      if (!session) return json(res, 401, { message: 'Authentication required.' })
      const body = await readBody(req)
      const record = { id: id(), createdAt: new Date().toISOString(), username: session.username, accessCodeId: session.accessCodeId, feature: String(body.feature || 'unknown').slice(0, 80), action: String(body.action || 'unknown').slice(0, 80), resource: String(body.resource || '').slice(0, 240), link: String(body.link || '').slice(0, 2000), metadata: body.metadata || {} }
      data.activity.unshift(record); data.activity = data.activity.slice(0, 10000); persist(); return json(res, 201, { ok: true })
    }
    return json(res, 404, { message: 'Not found.' })
  } catch (error) { return json(res, 500, { message: error instanceof Error ? error.message : 'Internal server error.' }) }
})

server.listen(port, () => console.log(`Creator Hub auth server listening on http://127.0.0.1:${port}`))
