<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900">
    <!-- Left Side Panel -->
    <AuthSidePanel />
    
    <!-- Right Side Form -->
    <div class="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
        <router-link to="/" class="flex justify-center items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">P</span>
          </div>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">Pathfinder</span>
        </router-link>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          创建您的账户
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          已有账户？
          <router-link 
            to="/login" 
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            点击登录
          </router-link>
        </p>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              姓名
            </label>
            <div class="mt-1">
              <input
                id="name"
                v-model="form.name"
                name="name"
                type="text"
                autocomplete="name"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.name
                }"
                placeholder="请输入您的姓名"
              />
              <p v-if="errors.name" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.name }}
              </p>
            </div>
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              手机号码
            </label>
            <div class="mt-1">
              <input
                id="phone"
                v-model="form.phone"
                name="phone"
                type="tel"
                autocomplete="tel"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.phone
                }"
                placeholder="请输入您的手机号码"
              />
              <p v-if="errors.phone" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.phone }}
              </p>
            </div>
          </div>

          <div>
            <label for="verificationCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              验证码
            </label>
            <div class="mt-1 flex space-x-2">
              <input
                id="verificationCode"
                v-model="form.verificationCode"
                name="verificationCode"
                type="text"
                maxlength="6"
                required
                class="appearance-none relative block flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.verificationCode
                }"
                placeholder="请输入验证码"
              />
              <button
                type="button"
                :disabled="!form.phone || codeSent || countdown > 0"
                @click="sendVerificationCode"
                class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {{ countdown > 0 ? `${countdown}s后重发` : (codeSent ? '重发验证码' : '发送验证码') }}
              </button>
            </div>
            <p v-if="errors.verificationCode" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ errors.verificationCode }}
            </p>
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
                autocomplete="new-password"
                required
                class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.password
                }"
                placeholder="请设置一个强密码"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <EyeIcon v-if="showPassword" class="h-5 w-5 text-gray-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ errors.password }}
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              确认密码
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                :class="{
                  'border-red-300 focus:border-red-500 focus:ring-red-500': errors.confirmPassword
                }"
                placeholder="请再次输入密码"
              />
              <p v-if="errors.confirmPassword" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errors.confirmPassword }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="terms"
            v-model="form.agreeToTerms"
            name="terms"
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800"
          />
          <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            我同意 
            <a href="#" class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              服务条款
            </a>
            和 
            <a href="#" class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              隐私政策
            </a>
          </label>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !form.agreeToTerms"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3" v-if="isLoading">
              <LoadingSpinner size="small" />
            </span>
            {{ isLoading ? '创建账户中...' : '创建账户' }}
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
                  @click="retryRegister"
                >
                  重试注册
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
import AuthSidePanel from '@components/auth/AuthSidePanel.vue'
import { getErrorIcon, getErrorColorClass, type ErrorInfo } from '@/utils/errorHandler'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const showPassword = ref(false)
const isLoading = ref(false)
const error = ref<ErrorInfo | null>(null)

const form = reactive({
  name: '',
  phone: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

const errors = reactive({
  name: '',
  phone: '',
  verificationCode: '',
  password: '',
  confirmPassword: ''
})

const codeSent = ref(false)
const countdown = ref(0)

const validateForm = () => {
  errors.name = ''
  errors.phone = ''
  errors.verificationCode = ''
  errors.password = ''
  errors.confirmPassword = ''
  
  if (!form.name.trim()) {
    errors.name = '姓名为必填项'
  }
  
  if (!form.phone) {
    errors.phone = '手机号为必填项'
  } else if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = '请输入有效的手机号码'
  }
  
  if (!form.verificationCode) {
    errors.verificationCode = '验证码为必填项'
  } else if (!/^\d{6}$/.test(form.verificationCode)) {
    errors.verificationCode = '验证码必须为6位数字'
  }
  
  if (!form.password) {
    errors.password = '密码为必填项'
  } else if (form.password.length < 8) {
    errors.password = '密码至少需要 8 个字符'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = '密码必须包含至少一个大写字母、一个小写字母和一个数字'
  }
  
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认您的密码'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
  }
  
  return !errors.name && !errors.phone && !errors.verificationCode && !errors.password && !errors.confirmPassword
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    isLoading.value = true
    error.value = null
    
    const result = await authStore.register({
      name: form.name.trim(),
      phone: form.phone,
      verification_code: form.verificationCode,
      password: form.password,
      password_confirmation: form.confirmPassword,
      terms_accepted: form.agreeToTerms
    })
    
    if (result.success) {
      appStore.showSuccess('欢迎来到 Pathfinder！', '您的账户已成功创建。')
      // Redirect to onboarding to complete setup
      router.push('/onboarding')
    } else {
      error.value = result.errorInfo || {
        type: 'unknown',
        title: '注册失败',
        message: result.message || '注册过程中发生了未知错误',
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

const retryRegister = () => {
  error.value = null
  handleSubmit()
}

const sendVerificationCode = async () => {
  if (!form.phone) {
    errors.phone = '请先输入手机号码'
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = '请输入有效的手机号码'
    return
  }
  
  try {
    // TODO: 调用发送验证码API
    console.log('发送验证码到:', form.phone)
    
    // 模拟发送成功
    codeSent.value = true
    countdown.value = 60
    
    // 倒计时
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        countdown.value = 0
      }
    }, 1000)
    
    appStore.showSuccess('验证码已发送', `验证码已发送至 ${form.phone}`)
  } catch (err: any) {
    appStore.showError('发送失败', err.message || '验证码发送失败，请稍后重试')
  }
}
</script>