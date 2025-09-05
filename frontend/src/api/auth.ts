import { api } from './client'
import type { 
  LoginCredentials, 
  RegisterCredentials, 
  User, 
  AuthResponse,
  RefreshTokenResponse,
  UpdateProfileRequest,
  ChangePasswordRequest 
} from '@/types/user'

export const authAPI = {
  // Login user
  login: (credentials: LoginCredentials) => {
    return api.post<AuthResponse>('/auth/login', credentials)
  },

  // Register new user
  register: (credentials: RegisterCredentials) => {
    return api.post<AuthResponse>('/auth/register', credentials)
  },

  // Logout user
  logout: () => {
    return api.post('/auth/logout')
  },

  // Refresh access token
  refreshToken: (refreshToken: string) => {
    return api.post<RefreshTokenResponse>('/auth/refresh', { refresh_token: refreshToken })
  },

  // Get current user profile
  getCurrentUser: () => {
    return api.get<User>('/auth/me')
  },

  // Update user profile
  updateProfile: (data: UpdateProfileRequest) => {
    return api.patch<User>('/auth/profile', data)
  },

  // Change password
  changePassword: (currentPassword: string, newPassword: string) => {
    const data: ChangePasswordRequest = {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword
    }
    return api.post('/auth/change-password', data)
  },

  // Request password reset
  requestPasswordReset: (email: string) => {
    return api.post('/auth/forgot-password', { email })
  },

  // Reset password with token
  resetPassword: (token: string, password: string, passwordConfirmation: string) => {
    return api.post('/auth/reset-password', {
      token,
      password,
      password_confirmation: passwordConfirmation
    })
  },

  // Verify email
  verifyEmail: (token: string) => {
    return api.post('/auth/verify-email', { token })
  },

  // Resend verification email
  resendVerificationEmail: () => {
    return api.post('/auth/resend-verification')
  },

  // Upload avatar
  uploadAvatar: (file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('avatar', file)

    return api.upload<{ avatar_url: string }>('/auth/avatar', formData, (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onUploadProgress(progress)
      }
    })
  },

  // Delete avatar
  deleteAvatar: () => {
    return api.delete('/auth/avatar')
  },

  // Update user settings
  updateSettings: (settings: any) => {
    return api.patch<User>('/auth/settings', { settings })
  },

  // Get user permissions
  getPermissions: () => {
    return api.get<string[]>('/auth/permissions')
  },

  // Delete user account
  deleteAccount: (password: string) => {
    return api.post('/auth/delete-account', { password })
  },

  // Get user sessions
  getSessions: () => {
    return api.get('/auth/sessions')
  },

  // Revoke session
  revokeSession: (sessionId: string) => {
    return api.delete(`/auth/sessions/${sessionId}`)
  },

  // Revoke all sessions except current
  revokeAllSessions: () => {
    return api.post('/auth/revoke-all-sessions')
  }
}