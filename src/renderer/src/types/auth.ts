export type HubRole = 'admin' | 'user'

export type HubPermission =
  | 'download'
  | 'joiner'
  | 'short_export'
  | 'view_activity'
  | 'manage_access_codes'

export const HUB_PERMISSIONS: HubPermission[] = [
  'download',
  'joiner',
  'short_export',
  'view_activity',
  'manage_access_codes'
]

export interface HubSession {
  token: string
  role: HubRole
  username: string
  displayName: string
  permissions: HubPermission[]
  accessCodeId?: string
}

export interface AccessCodeRecord {
  id: string
  code: string
  label: string
  permissions: HubPermission[]
  createdAt: string
  expiresAt?: string
  revokedAt?: string
  lastUsedAt?: string
  useCount: number
}

export interface ActivityRecord {
  id: string
  createdAt: string
  username: string
  accessCodeId?: string
  feature: string
  action: string
  resource?: string
  link?: string
  metadata?: Record<string, unknown>
}
