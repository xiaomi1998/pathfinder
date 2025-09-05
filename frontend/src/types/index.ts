// Re-export all types for easier importing
export * from './user'
export * from './funnel'
export * from './ai'

// Common utility types
export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
  statusCode: number
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    from: number
    to: number
    per_page: number
    total: number
    last_page: number
    has_more: boolean
  }
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  field: string
  value: any
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
}

export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  format?: (value: any) => string
  render?: (value: any, row: T) => any
}

export interface SelectOption<T = string | number> {
  value: T
  label: string
  disabled?: boolean
  icon?: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export interface MenuItem {
  label: string
  href?: string
  icon?: string
  badge?: string | number
  children?: MenuItem[]
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
}

export interface ModalConfig {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  persistent?: boolean
}

export interface TooltipConfig {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
}

// Form types
export interface FormField<T = any> {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'datetime'
  value?: T
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  validation?: ValidationRule[]
  options?: SelectOption[]
  multiple?: boolean
  accept?: string // for file inputs
  min?: number
  max?: number
  step?: number
  rows?: number // for textarea
  cols?: number // for textarea
  help?: string
  prefix?: string
  suffix?: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean | string
}

export interface FormError {
  field: string
  message: string
}

// Chart types
export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

// File upload types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

// Theme types
export interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    muted: string
    border: string
    error: string
    warning: string
    success: string
    info: string
  }
  fonts: {
    sans: string
    mono: string
  }
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
}

// D3.js types extensions
export interface D3Node extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: string
  data?: any
  style?: any
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string
  source: string | D3Node
  target: string | D3Node
  label?: string
  data?: any
  style?: any
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type Nullable<T> = T | null

export type Maybe<T> = T | undefined

export type ValueOf<T> = T[keyof T]

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

// Event types
export interface CustomEvent<T = any> {
  type: string
  payload: T
  timestamp: Date
  source?: string
}

// WebSocket types
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  id?: string
  timestamp?: string
}

// Storage types
export interface StorageItem<T = any> {
  value: T
  expires?: Date
  version?: number
}

export interface CacheConfig {
  ttl: number // time to live in milliseconds
  maxSize?: number
  version?: number
}