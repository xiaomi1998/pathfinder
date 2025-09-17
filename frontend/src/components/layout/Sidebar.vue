<template>
  <div class="sidebar-container">
    <!-- 侧边栏 -->
    <div 
      :class="[
        'sidebar sidebar-pathfinder',
        { 'collapsed': isCollapsed }
      ]"
    >
      <!-- Logo 区域 -->
      <div class="sidebar-header">
        <router-link
          to="/"
          class="logo-link"
        >
          <i class="fas fa-compass mr-2"></i>
          <div class="logo">Pathfinder</div>
        </router-link>
      </div>

      <!-- 导航菜单 -->
      <nav>
        <router-link
          to="/dashboard"
          :class="[navItemClass('/dashboard'), 'nav-item-pathfinder']"
          :title="isCollapsed ? '仪表盘' : ''"
        >
          <i class="fas fa-tachometer-alt"></i>
          <span>仪表盘</span>
        </router-link>

        <router-link
          to="/funnels"
          :class="[navItemClass('/funnels'), 'nav-item-pathfinder']"
          :title="isCollapsed ? '漏斗管理' : ''"
        >
          <i class="fas fa-filter"></i>
          <span>漏斗管理</span>
        </router-link>

        <router-link
          to="/data-entry"
          :class="[navItemClass('/data-entry', '/metrics'), 'nav-item-pathfinder']"
          :title="isCollapsed ? '数据录入' : ''"
        >
          <i class="fas fa-edit"></i>
          <span>数据录入</span>
        </router-link>

        <router-link
          to="/analysis/enhanced"
          :class="[navItemClass('/analysis'), 'nav-item-pathfinder']"
          :title="isCollapsed ? '报告中心' : ''"
        >
          <i class="fas fa-chart-line"></i>
          <span>报告中心</span>
        </router-link>


        <router-link
          to="/settings"
          :class="[navItemClass('/settings'), 'nav-item-pathfinder']"
          :title="isCollapsed ? '系统设置' : ''"
        >
          <i class="fas fa-cog"></i>
          <span>系统设置</span>
        </router-link>

        <div class="nav-divider"></div>

        <button
          @click="handleLogout"
          class="nav-item-pathfinder logout-btn"
          :title="isCollapsed ? '退出登录' : ''"
        >
          <i class="fas fa-sign-out-alt"></i>
          <span>退出登录</span>
        </button>
      </nav>
    </div>

    <!-- 切换按钮 -->
    <div
      class="toggle-sidebar"
      :class="{ 'collapsed': isCollapsed }"
      @click="toggleSidebar"
    >
      <i class="fas fa-chevron-left"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// State
const isCollapsed = ref(false)

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isDarkMode = computed(() => appStore.isDarkMode)
const userInitials = computed(() => {
  if (!authStore.user) return '?'
  const name = authStore.user.name || authStore.user.email
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
})

// Methods
const navItemClass = (path: string, altPath?: string) => {
  const isActive = route.path.startsWith(path) || (altPath && route.path.startsWith(altPath))
  return [
    'nav-item',
    isActive ? 'active' : ''
  ]
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  // 保存状态到localStorage
  localStorage.setItem('sidebarCollapsed', isCollapsed.value.toString())
  
  // 触发全局事件，通知其他组件侧边栏状态变化
  window.dispatchEvent(new CustomEvent('sidebar-toggle', { 
    detail: { isCollapsed: isCollapsed.value } 
  }))
}

const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/')
    appStore.showSuccess('成功退出登录')
  } catch (error) {
    console.error('Logout error:', error)
    appStore.showError('退出登录失败')
  }
}

// 初始化侧边栏状态
onMounted(() => {
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState === 'true') {
    isCollapsed.value = true
  }
})

// 向外暴露侧边栏状态
defineExpose({
  isCollapsed
})
</script>

<style scoped>
/* 侧边栏主体 - Pathfinder样式 */
.sidebar {
  width: 200px;
  background: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  border-right: 1px solid #dcdcdc;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  z-index: 100;
}

.sidebar.collapsed {
  width: 50px;
}

.sidebar-pathfinder {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* Logo区域 */
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: #0052d9;
  transition: all 0.3s ease;
}

.sidebar.collapsed .logo {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.logo-link i {
  color: #0052d9;
  font-size: 18px;
}

/* 导航项 */
.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  font-size: 14px;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #0052d9;
}

.nav-item.active {
  background: #e6f7ff;
  color: #0052d9;
  border-right: 3px solid #0052d9;
}

/* Pathfinder导航项样式 */
.nav-item-pathfinder {
  transition: all 0.3s ease;
}

.nav-item-pathfinder:hover {
  background: #f3f4f6;
  color: #0052d9;
  transform: translateX(2px);
}

.nav-item-pathfinder.active {
  background: #e0f2fe;
  color: #0052d9;
  border-right: 3px solid #0052d9;
  transform: translateX(2px);
}

.nav-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 16px;
}

.logout-btn {
  background: none !important;
  border: none;
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  cursor: pointer;
  color: #dc2626 !important;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #fef2f2 !important;
  color: #dc2626 !important;
  transform: translateX(2px);
}

.nav-item i,
.logout-btn i {
  width: 16px;
  margin-right: 10px;
  font-size: 14px;
}

.nav-item span {
  transition: all 0.3s ease;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .nav-item span,
.sidebar.collapsed .logout-btn span {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .logout-btn i,
.sidebar.collapsed .nav-item i {
  margin-right: 0;
}

/* 切换按钮 - Pathfinder样式 */
.toggle-sidebar {
  position: fixed;
  top: 16px;
  left: 180px;
  width: 28px;
  height: 28px;
  background: white;
  border: 1px solid #dcdcdc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toggle-sidebar:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.toggle-sidebar.collapsed {
  left: 32px;
}

.toggle-sidebar i {
  transition: transform 0.3s ease;
  color: #6b7280;
  font-size: 12px;
}

.toggle-sidebar.collapsed i {
  transform: rotate(180deg);
}
</style>