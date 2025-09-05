<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/admin/dashboard" class="text-indigo-600 hover:text-indigo-500 mr-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </router-link>
            <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-600">
              {{ adminStore.admin?.username }}
            </div>
            <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Search and Filter Bar -->
        <div class="bg-white p-4 rounded-lg shadow mb-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索用户名、邮箱或姓名..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                @input="debouncedSearch"
              />
            </div>
            <div class="flex gap-2">
              <select
                v-model="sortBy"
                @change="loadUsers"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="createdAt">创建时间</option>
                <option value="username">用户名</option>
                <option value="email">邮箱</option>
                <option value="lastLoginAt">最后登录</option>
                <option value="aiUsage">AI使用量</option>
              </select>
              <select
                v-model="sortOrder"
                @change="loadUsers"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
              <button
                @click="loadUsers"
                :disabled="loading"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span v-else>刷新</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              用户列表 
              <span class="text-sm text-gray-500">(共 {{ pagination.total }} 个用户)</span>
            </h3>
          </div>

          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>

          <div v-else class="border-t border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI使用情况</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用限制</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 flex-shrink-0">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span class="text-sm font-medium text-gray-700">
                            {{ user.username.charAt(0).toUpperCase() }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
                        <div class="text-sm text-gray-500">{{ user.email }}</div>
                        <div class="text-xs text-gray-400">
                          {{ formatDate(user.createdAt) }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="space-y-1">
                      <div>今日: {{ user.aiUsageStats.todayUsage }}</div>
                      <div>本周: {{ user.aiUsageStats.weekUsage }}</div>
                      <div>本月: {{ user.aiUsageStats.monthUsage }}</div>
                      <div class="text-gray-500">总计: {{ user.aiUsageStats.totalUsage }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div v-if="user.aiLimit" class="space-y-1">
                      <div>日限制: {{ user.aiLimit.currentDaily }}/{{ user.aiLimit.dailyLimit }}</div>
                      <div>月限制: {{ user.aiLimit.currentMonthly }}/{{ user.aiLimit.monthlyLimit }}</div>
                    </div>
                    <div v-else class="text-gray-500">未设置</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ user.isActive ? '活跃' : '停用' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      @click="openEditLimitsModal(user)"
                      class="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      编辑限制
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="previousPage"
                :disabled="pagination.page <= 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                @click="nextPage"
                :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  显示第 
                  <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                  到
                  <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                  条，共
                  <span class="font-medium">{{ pagination.total }}</span>
                  条记录
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    @click="previousPage"
                    :disabled="pagination.page <= 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.limit) }}
                  </span>
                  <button
                    @click="nextPage"
                    :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Limits Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeEditModal"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            编辑用户AI使用限制
          </h3>
          <div class="mb-4">
            <div class="text-sm text-gray-600 mb-2">
              用户：{{ selectedUser?.username }} ({{ selectedUser?.email }})
            </div>
          </div>
          
          <form @submit.prevent="saveUserLimits">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                每日限制
              </label>
              <input
                v-model.number="editForm.dailyLimit"
                type="number"
                min="0"
                max="10000"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                每月限制
              </label>
              <input
                v-model.number="editForm.monthlyLimit"
                type="number"
                min="0"
                max="100000"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeEditModal"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="updating"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <span v-if="updating">保存中...</span>
                <span v-else>保存</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';
import { debounce } from 'lodash-es';

const router = useRouter();
const adminStore = useAdminStore();

const loading = ref(true);
const updating = ref(false);
const users = ref<any[]>([]);
const searchQuery = ref('');
const sortBy = ref('createdAt');
const sortOrder = ref('desc');
const showEditModal = ref(false);
const selectedUser = ref<any>(null);

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

const editForm = reactive({
  dailyLimit: 100,
  monthlyLimit: 3000
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const loadUsers = async () => {
  try {
    loading.value = true;
    const result = await adminStore.getUsers({
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery.value || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    });
    
    users.value = result.users;
    pagination.total = result.total;
  } catch (error) {
    console.error('Failed to load users:', error);
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = debounce(() => {
  pagination.page = 1;
  loadUsers();
}, 300);

const previousPage = () => {
  if (pagination.page > 1) {
    pagination.page--;
    loadUsers();
  }
};

const nextPage = () => {
  const maxPage = Math.ceil(pagination.total / pagination.limit);
  if (pagination.page < maxPage) {
    pagination.page++;
    loadUsers();
  }
};

const openEditLimitsModal = (user: any) => {
  selectedUser.value = user;
  editForm.dailyLimit = user.aiLimit?.dailyLimit || 100;
  editForm.monthlyLimit = user.aiLimit?.monthlyLimit || 3000;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedUser.value = null;
};

const saveUserLimits = async () => {
  if (!selectedUser.value) return;
  
  try {
    updating.value = true;
    await adminStore.updateUserLimits(selectedUser.value.id, {
      dailyLimit: editForm.dailyLimit,
      monthlyLimit: editForm.monthlyLimit
    });
    
    closeEditModal();
    // Reload users to show updated limits
    await loadUsers();
  } catch (error) {
    console.error('Failed to update user limits:', error);
  } finally {
    updating.value = false;
  }
};

const handleLogout = async () => {
  try {
    await adminStore.logout();
    router.push('/admin/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>