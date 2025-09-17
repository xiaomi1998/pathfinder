export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
  permissions: string[]
  organizationId?: string
  settings: UserSettings
  created_at: Date
  updated_at: Date
  last_login_at?: Date
  is_active: boolean
  email_verified_at?: Date
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  funnel_updates: boolean
  analytics_reports: boolean
  system_announcements: boolean
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private'
  show_online_status: boolean
  allow_data_collection: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  password_confirmation: string
  terms_accepted: boolean
}

export interface UpdateProfileRequest {
  name?: string
  avatar?: string
  settings?: Partial<UserSettings>
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  data: {
    user: User
    organization?: Organization
    access_token: string
    refresh_token: string
    expires_in: number
  }
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  planType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RefreshTokenResponse {
  success: boolean
  message?: string
  data: {
    access_token: string
    refresh_token: string
    expires_in: number
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  meta?: {
    pagination?: PaginationMeta
    filters?: any
    sort?: any
  }
}

export interface PaginationMeta {
  current_page: number
  from: number
  to: number
  per_page: number
  total: number
  last_page: number
  has_more: boolean
}