<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Header -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-white rounded-lg flex items-center justify-center">
          <svg class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-white">
          管理员登录
        </h2>
        <p class="mt-2 text-sm text-indigo-200">
          请使用管理员凭据登录系统
        </p>
      </div>

      <!-- Login Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">邮箱地址</label>
            <input 
              id="email" 
              v-model="form.email"
              name="email" 
              type="email" 
              autocomplete="email" 
              required 
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-500': errors.email }"
              placeholder="邮箱地址" 
            />
          </div>
          <div>
            <label for="password" class="sr-only">密码</label>
            <input 
              id="password" 
              v-model="form.password"
              name="password" 
              type="password" 
              autocomplete="current-password" 
              required 
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :class="{ 'border-red-500': errors.password }"
              placeholder="密码" 
            />
          </div>
        </div>

        <!-- Error Messages -->
        <div v-if="errors.email || errors.password || errors.general" class="space-y-1">
          <p v-if="errors.email" class="text-red-400 text-sm">{{ errors.email }}</p>
          <p v-if="errors.password" class="text-red-400 text-sm">{{ errors.password }}</p>
          <p v-if="errors.general" class="text-red-400 text-sm">{{ errors.general }}</p>
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="!loading">登录</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登录中...
            </span>
          </button>
        </div>

        <!-- Security Notice -->
        <div class="mt-6 text-center">
          <p class="text-xs text-indigo-200">
            <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            此登录页面受到SSL加密保护
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();

const loading = ref(false);

const form = reactive({
  email: '',
  password: ''
});

const errors = reactive({
  email: '',
  password: '',
  general: ''
});

const clearErrors = () => {
  errors.email = '';
  errors.password = '';
  errors.general = '';
};

const validateForm = () => {
  clearErrors();
  let isValid = true;

  if (!form.email) {
    errors.email = '请输入邮箱地址';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址';
    isValid = false;
  }

  if (!form.password) {
    errors.password = '请输入密码';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = '密码至少6个字符';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  loading.value = true;
  clearErrors();

  try {
    await adminStore.login({
      email: form.email,
      password: form.password
    });

    // Redirect to admin dashboard
    router.push('/admin/dashboard');
  } catch (error: any) {
    console.error('Admin login failed:', error);
    
    if (error.response?.status === 401) {
      errors.general = '邮箱或密码错误';
    } else if (error.response?.status === 403) {
      errors.general = '账户已被停用，请联系超级管理员';
    } else if (error.response?.data?.error) {
      errors.general = error.response.data.error;
    } else {
      errors.general = '登录失败，请稍后重试';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>