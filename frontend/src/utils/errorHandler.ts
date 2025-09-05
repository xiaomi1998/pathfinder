import type { AxiosError } from 'axios'

export interface ErrorInfo {
  type: 'auth' | 'network' | 'server' | 'validation' | 'unknown'
  title: string
  message: string
  showRetry?: boolean
}

/**
 * 解析API错误并返回用户友好的错误信息
 */
export const parseAPIError = (error: any): ErrorInfo => {
  console.error('API Error:', error)

  // 网络错误（无法连接到服务器）
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('网络错误')) {
      return {
        type: 'network',
        title: '网络连接失败',
        message: '无法连接到服务器，请检查网络连接后重试',
        showRetry: true
      }
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        type: 'network',
        title: '请求超时',
        message: '服务器响应超时，请稍后重试',
        showRetry: true
      }
    }

    return {
      type: 'network',
      title: '网络异常',
      message: '网络连接异常，请检查网络设置后重试',
      showRetry: true
    }
  }

  const status = error.response?.status
  const responseData = error.response?.data

  // 根据HTTP状态码分类错误
  switch (status) {
    case 400:
      return {
        type: 'validation',
        title: '请求参数错误',
        message: responseData?.message || responseData?.error || '请求参数有误，请检查输入信息',
        showRetry: false
      }

    case 401:
      return {
        type: 'auth',
        title: '登录信息错误',
        message: responseData?.message || responseData?.error || '邮箱或密码错误，请重新输入',
        showRetry: false
      }

    case 403:
      return {
        type: 'auth',
        title: '权限不足',
        message: responseData?.message || responseData?.error || '您没有权限执行此操作',
        showRetry: false
      }

    case 404:
      return {
        type: 'server',
        title: '服务不可用',
        message: responseData?.message || responseData?.error || '请求的服务不存在',
        showRetry: false
      }

    case 409:
      return {
        type: 'validation',
        title: '数据冲突',
        message: responseData?.message || responseData?.error || '该邮箱已被注册，请使用其他邮箱',
        showRetry: false
      }

    case 422:
      return {
        type: 'validation',
        title: '数据验证失败',
        message: responseData?.message || responseData?.error || '输入的数据格式不正确，请检查后重试',
        showRetry: false
      }

    case 429:
      return {
        type: 'server',
        title: '请求过于频繁',
        message: responseData?.message || responseData?.error || '请求次数过多，请稍后再试',
        showRetry: true
      }

    case 500:
      return {
        type: 'server',
        title: '服务器内部错误',
        message: responseData?.message || responseData?.error || '服务器出现异常，请稍后重试',
        showRetry: true
      }

    case 502:
    case 503:
    case 504:
      return {
        type: 'server',
        title: '服务暂时不可用',
        message: responseData?.message || responseData?.error || '服务器正在维护中，请稍后重试',
        showRetry: true
      }

    default:
      return {
        type: 'server',
        title: '服务异常',
        message: responseData?.message || responseData?.error || `服务器返回错误 (${status})`,
        showRetry: true
      }
  }
}

/**
 * 获取错误图标
 */
export const getErrorIcon = (type: ErrorInfo['type']): string => {
  switch (type) {
    case 'auth':
      return '🔐'
    case 'network':
      return '🌐'
    case 'server':
      return '⚠️'
    case 'validation':
      return '❗'
    default:
      return '❌'
  }
}

/**
 * 获取错误颜色类
 */
export const getErrorColorClass = (type: ErrorInfo['type']): string => {
  switch (type) {
    case 'auth':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'network':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'server':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'validation':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}