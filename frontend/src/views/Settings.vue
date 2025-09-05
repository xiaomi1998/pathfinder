<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">设置</h1>
      </div>
    </div>
    
    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="space-y-6">
          <!-- Notifications -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">通知</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-900">邮件通知</label>
                    <p class="text-sm text-gray-500">接收重要更新通知</p>
                  </div>
                  <input
                    type="checkbox"
                    v-model="settings.emailNotifications"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-900">周报告</label>
                    <p class="text-sm text-gray-500">接收周度分析摘要</p>
                  </div>
                  <input
                    type="checkbox"
                    v-model="settings.weeklyReports"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-900">性能警报</label>
                    <p class="text-sm text-gray-500">当转化率显著下降时获得警报</p>
                  </div>
                  <input
                    type="checkbox"
                    v-model="settings.performanceAlerts"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">隐私</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-900">数据收集</label>
                    <p class="text-sm text-gray-500">允许匿名使用情况分析</p>
                  </div>
                  <input
                    type="checkbox"
                    v-model="settings.dataCollection"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-900">营销沟通</label>
                    <p class="text-sm text-gray-500">接收产品更新和营销邮件</p>
                  </div>
                  <input
                    type="checkbox"
                    v-model="settings.marketing"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- API Configuration -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">API 配置</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">API 密钥</label>
                  <div class="flex space-x-2">
                    <input
                      type="password"
                      :value="settings.apiKey"
                      readonly
                      class="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                      @click="generateApiKey"
                      class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      生成新的
                    </button>
                  </div>
                  <p class="mt-1 text-sm text-gray-500">使用此密钥认证 API 请求</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">速率限制</label>
                  <select
                    v-model="settings.rateLimit"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="1000">1,000 请求/小时</option>
                    <option value="5000">5,000 请求/小时</option>
                    <option value="10000">10,000 请求/小时</option>
                    <option value="unlimited">无限制</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-white shadow rounded-lg border-l-4 border-red-400">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-red-900 mb-4">危险区域</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">删除账户</h4>
                    <p class="text-sm text-gray-500">永久删除您的账户和所有数据</p>
                  </div>
                  <button
                    @click="showDeleteConfirm = true"
                    class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    删除账户
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end">
            <button
              @click="saveSettings"
              :disabled="loading"
              class="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ loading ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900">删除账户</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              您确定要删除您的账户吗？此操作无法撤销。
            </p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="showDeleteConfirm = false"
              class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              取消
            </button>
            <button
              @click="deleteAccount"
              class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const loading = ref(false)
const showDeleteConfirm = ref(false)

const settings = reactive({
  emailNotifications: true,
  weeklyReports: true,
  performanceAlerts: false,
  dataCollection: true,
  marketing: false,
  apiKey: '************************',
  rateLimit: '5000'
})

const saveSettings = async () => {
  loading.value = true
  try {
    // TODO: Implement settings save logic
    console.log('Settings saved:', settings)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
  } catch (error) {
    console.error('Settings save failed:', error)
  } finally {
    loading.value = false
  }
}

const generateApiKey = () => {
  // TODO: Implement API key generation
  settings.apiKey = '************************'
  console.log('New API key generated')
}

const deleteAccount = async () => {
  try {
    // TODO: Implement account deletion
    console.log('Account deletion requested')
    showDeleteConfirm.value = false
  } catch (error) {
    console.error('Account deletion failed:', error)
  }
}

onMounted(() => {
  // TODO: Load actual settings data
  console.log('Settings mounted')
})
</script>