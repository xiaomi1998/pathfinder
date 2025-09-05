<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <router-link to="/" class="flex justify-center items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">P</span>
          </div>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">Pathfinder</span>
        </router-link>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          登录您的账户
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          还没有账户？
          <router-link 
            to="/register" 
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            点击注册
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              邮箱地址
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.email
                }"
                placeholder="请输入您的邮箱"
              />
              <p v-if="errors.email" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.email }}
              </p>
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              密码
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.password
                }"
                placeholder="请输入您的密码"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <EyeIcon v-if="showPassword" class="h-5 w-5 text-gray-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
              </button>
              <p v-if="errors.password" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.password }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              记住我
            </label>
          </div>

          <div class="text-sm">
            <a
              href="#"
              class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              忘记密码？
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3" v-if="isLoading">
              <LoadingSpinner size="small" />
            </span>
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </div>

        <!-- Enhanced Error Display -->
        <div v-if="error" class="mt-4 p-4 rounded-md border" :class="getErrorColorClass(error.type)">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <span class="text-lg">{{ getErrorIcon(error.type) }}</span>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium">{{ error.title }}</h3>
              <p class="mt-1 text-sm">{{ error.message }}</p>
              <div v-if="error.showRetry" class="mt-3">
                <button
                  type="button"
                  class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                  :class="error.type === 'network' 
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500' 
                    : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'"
                  @click="retryLogin"
                >
                  重试登录
                </button>
              </div>
            </div>
            <div class="flex-shrink-0">
              <button
                type="button"
                class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                @click="error = null"
              >
                <span class="sr-only">关闭</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'
import LoadingSpinner from '@components/common/LoadingSpinner.vue'
import ErrorAlert from '@components/common/ErrorAlert.vue'
import { getErrorIcon, getErrorColorClass, type ErrorInfo } from '@/utils/errorHandler'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const showPassword = ref(false)
const isLoading = ref(false)
const error = ref<ErrorInfo | null>(null)

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const validateForm = () => {
  errors.email = ''
  errors.password = ''
  
  if (!form.email) {
    errors.email = '邮箱为必填项'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
  }
  
  if (!form.password) {
    errors.password = '密码为必填项'
  } else if (form.password.length < 6) {
    errors.password = '密码至少需要 6 个字符'
  }
  
  return !errors.email && !errors.password
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    isLoading.value = true
    error.value = null
    
    const result = await authStore.login({
      email: form.email,
      password: form.password
    })
    
    if (result.success) {
      appStore.showSuccess('欢迎回来！', '您已成功登录。')
      
      // Always redirect to dashboard after login
      router.push('/dashboard')
    } else {
      error.value = result.errorInfo || {
        type: 'unknown',
        title: '登录失败',
        message: result.message || '登录过程中发生了未知错误',
        showRetry: false
      }
    }
  } catch (err: any) {
    error.value = {
      type: 'unknown',
      title: '系统异常',
      message: err.message || '发生了未预期的错误',
      showRetry: false
    }
  } finally {
    isLoading.value = false
  }
}

const retryLogin = () => {
  error.value = null
  handleSubmit()
}
</script>