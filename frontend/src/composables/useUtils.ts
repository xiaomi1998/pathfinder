import { ref, computed } from 'vue'
import { debounce } from 'lodash-es'
import { format, formatDistanceToNow, isValid } from 'date-fns'

export function useUtils() {
  // Clipboard utilities
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const result = document.execCommand('copy')
        document.body.removeChild(textArea)
        return result
      }
    } catch (err) {
      console.error('Failed to copy text:', err)
      return false
    }
  }

  // Debounced search
  const createDebouncedSearch = (callback: (query: string) => void, delay: number = 300) => {
    const searchQuery = ref('')
    const debouncedCallback = debounce(callback, delay)
    
    const search = (query: string) => {
      searchQuery.value = query
      debouncedCallback(query)
    }
    
    return {
      searchQuery,
      search
    }
  }

  // File utilities
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
  }

  const validateFileType = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type) || 
           allowedTypes.includes(getFileExtension(file.name).toLowerCase())
  }

  const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  // Date utilities
  const formatDate = (date: Date | string | null, formatStr: string = 'PPP'): string => {
    if (!date) return 'N/A'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (!isValid(dateObj)) return 'Invalid Date'
    
    return format(dateObj, formatStr)
  }

  const formatRelativeTime = (date: Date | string | null): string => {
    if (!date) return 'N/A'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (!isValid(dateObj)) return 'Invalid Date'
    
    return formatDistanceToNow(dateObj, { addSuffix: true })
  }

  const isDateInRange = (date: Date | string, startDate: Date | string, endDate: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate
    const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate
    
    return dateObj >= startObj && dateObj <= endObj
  }

  // URL utilities
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const parseQueryParams = (search: string = window.location.search): Record<string, string> => {
    const params = new URLSearchParams(search)
    const result: Record<string, string> = {}
    
    for (const [key, value] of params) {
      result[key] = value
    }
    
    return result
  }

  const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(`${key}[]`, String(item)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    
    return searchParams.toString()
  }

  // Number utilities
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat('en-US', options).format(num)
  }

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`
  }

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max)
  }

  const round = (value: number, decimals: number = 0): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  // String utilities
  const truncate = (text: string, length: number, suffix: string = '...'): string => {
    if (text.length <= length) return text
    return text.substring(0, length).trim() + suffix
  }

  const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  const camelToKebab = (str: string): string => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  }

  const kebabToCamel = (str: string): string => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  }

  // Array utilities
  const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  const unique = <T>(array: T[]): T[] => {
    return [...new Set(array)]
  }

  const groupBy = <T, K extends string | number>(
    array: T[], 
    keyFn: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFn(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<K, T[]>)
  }

  // Color utilities
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  const generateRandomColor = (): string => {
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
      '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
      '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
      '#EC4899', '#F43F5E'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Browser utilities
  const isMobile = computed(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  })

  const isOnline = ref(navigator.onLine)
  
  // Update online status
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })

  const downloadFile = (url: string, filename?: string) => {
    const link = document.createElement('a')
    link.href = url
    if (filename) link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    // Clipboard
    copyToClipboard,
    
    // Search
    createDebouncedSearch,
    
    // File utilities
    formatFileSize,
    getFileExtension,
    validateFileType,
    validateFileSize,
    
    // Date utilities
    formatDate,
    formatRelativeTime,
    isDateInRange,
    
    // URL utilities
    generateSlug,
    parseQueryParams,
    buildQueryString,
    
    // Number utilities
    formatNumber,
    formatCurrency,
    formatPercentage,
    clamp,
    round,
    
    // String utilities
    truncate,
    capitalize,
    camelToKebab,
    kebabToCamel,
    
    // Array utilities
    chunk,
    unique,
    groupBy,
    
    // Color utilities
    hexToRgb,
    rgbToHex,
    generateRandomColor,
    
    // Browser utilities
    isMobile,
    isOnline,
    downloadFile
  }
}