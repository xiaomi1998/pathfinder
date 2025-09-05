import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { useAdminStore } from '@stores/admin'
import NProgress from 'nprogress'

// Lazy load views
const Home = () => import('@views/Home.vue')
const Login = () => import('@views/auth/Login.vue')
const Register = () => import('@views/auth/Register.vue')
const Onboarding = () => import('@views/auth/Onboarding.vue')
const Dashboard = () => import('@views/Dashboard.vue')
const FunnelList = () => import('@views/funnels/FunnelList.vue')
const FunnelDetail = () => import('@views/funnels/FunnelDetail.vue')
const FunnelBuilder = () => import('@views/funnels/FunnelBuilder.vue')
const MinimalFunnelBuilder = () => import('@views/funnels/MinimalFunnelBuilder.vue')
const StableFunnelBuilder = () => import('@views/funnels/StableFunnelBuilder.vue')
const SimpleFunnelBuilder = () => import('@views/funnels/SimpleFunnelBuilder.vue')
const TestFunnelBuilder = () => import('@views/funnels/TestFunnelBuilder.vue')
const MinimalTest = () => import('@views/funnels/MinimalTest.vue')
const WorkingFunnelBuilder = () => import('@views/funnels/WorkingFunnelBuilder.vue')
const FinalFunnelBuilder = () => import('@views/funnels/FinalFunnelBuilder.vue')
const Profile = () => import('@views/Profile.vue')
const Settings = () => import('@views/Settings.vue')
const AICoach = () => import('@views/ai/AICoach.vue')
const PerformanceTest = () => import('@views/PerformanceTest.vue')
const TestRouter = () => import('@views/TestRouter.vue')
const NotFound = () => import('@views/errors/NotFound.vue')

// Metric Dataset views
const DataEntry = () => import('@views/metrics/DataEntry.vue')
const AnalysisDetails = () => import('@views/analysis/AnalysisDetails.vue')
const EnhancedAnalysisView = () => import('@views/analysis/EnhancedAnalysisView.vue')

// Admin views
const AdminLogin = () => import('@views/admin/AdminLogin.vue')
const AdminDashboard = () => import('@views/admin/AdminDashboard.vue')
const UserManagement = () => import('@views/admin/UserManagement.vue')
const BenchmarkManagement = () => import('@views/admin/BenchmarkManagement.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'Pathfinder - 客户旅程分析',
      requiresAuth: false,
      transition: 'fade'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: '登录 - Pathfinder',
      requiresAuth: false,
      requiresGuest: true,
      transition: 'slide-left'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: {
      title: '注册 - Pathfinder',
      requiresAuth: false,
      requiresGuest: true,
      transition: 'slide-left'
    }
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: Onboarding,
    meta: {
      title: '账户设置 - Pathfinder',
      requiresAuth: true,
      transition: 'slide-right'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: '仪表板 - Pathfinder',
      requiresAuth: true,
      transition: 'fade'
    }
  },
  {
    path: '/funnels',
    name: 'funnels',
    component: FunnelList,
    meta: {
      title: '漏斗 - Pathfinder',
      requiresAuth: true,
      transition: 'fade'
    }
  },
  {
    path: '/funnels/create',
    name: 'funnel-create',
    component: FinalFunnelBuilder, // 恢复版本
    meta: {
      title: '创建漏斗 - Pathfinder',
      requiresAuth: false,
      transition: 'slide-right'
    }
  },
  {
    path: '/funnels/:id',
    name: 'funnel-detail',
    component: FunnelDetail,
    meta: {
      title: '漏斗详情 - Pathfinder',
      requiresAuth: true,
      transition: 'scale'
    }
  },
  {
    path: '/funnels/:id/edit',
    name: 'funnel-edit',
    component: FinalFunnelBuilder, // 使用完整功能版本
    meta: {
      title: '编辑漏斗 - Pathfinder',
      requiresAuth: true,
      transition: 'slide-right'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: {
      title: '资料 - Pathfinder',
      requiresAuth: true,
      transition: 'slide-left'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: '设置 - Pathfinder',
      requiresAuth: true,
      transition: 'slide-left'
    }
  },
  {
    path: '/ai',
    name: 'ai-coach',
    component: AICoach,
    meta: {
      title: 'AI陪练助手 - Pathfinder',
      requiresAuth: true,
      transition: 'fade'
    }
  },
  {
    path: '/performance',
    name: 'performance-test',
    component: PerformanceTest,
    meta: {
      title: '性能测试 - Pathfinder',
      requiresAuth: false,
      transition: 'fade'
    }
  },
  {
    path: '/test-router',
    name: 'test-router',
    component: TestRouter,
    meta: {
      title: '路由测试 - Pathfinder',
      requiresAuth: false,
      transition: 'fade'
    }
  },
  {
    path: '/metrics',
    name: 'metrics',
    redirect: '/metrics/entry'
  },
  {
    path: '/metrics/entry',
    name: 'data-entry',
    component: DataEntry,
    meta: {
      title: '数据录入 - Pathfinder',
      requiresAuth: true,
      transition: 'slide-right'
    }
  },
  {
    path: '/analysis/:id',
    name: 'analysis-details',
    component: AnalysisDetails,
    meta: {
      title: '分析详情 - Pathfinder',
      requiresAuth: true,
      transition: 'scale'
    }
  },
  {
    path: '/analysis/enhanced/:id?',
    name: 'enhanced-analysis',
    component: EnhancedAnalysisView,
    meta: {
      title: '智能分析 - Pathfinder',
      requiresAuth: true,
      transition: 'scale'
    }
  },
  {
    path: '/metrics/edit/:id',
    name: 'metrics-edit',
    component: DataEntry,
    meta: {
      title: '编辑数据集 - Pathfinder',
      requiresAuth: true,
      transition: 'slide-right'
    }
  },
  // Admin routes
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLogin,
    meta: {
      title: '管理员登录 - Pathfinder',
      requiresAuth: false,
      requiresAdminGuest: true,
      transition: 'fade'
    }
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: {
      title: '管理员后台 - Pathfinder',
      requiresAdminAuth: true,
      transition: 'fade'
    }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: UserManagement,
    meta: {
      title: '用户管理 - Pathfinder',
      requiresAdminAuth: true,
      transition: 'slide-right'
    }
  },
  {
    path: '/admin/usage-stats',
    name: 'admin-usage-stats',
    component: AdminDashboard, // Reuse dashboard for now, can create separate view later
    meta: {
      title: '用量统计 - Pathfinder',
      requiresAdminAuth: true,
      transition: 'slide-right'
    }
  },
  {
    path: '/admin/benchmarks',
    name: 'admin-benchmarks',
    component: BenchmarkManagement,
    meta: {
      title: '基准数据管理 - Pathfinder',
      requiresAdminAuth: true,
      transition: 'slide-right'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: '页面未找到 - Pathfinder',
      requiresAuth: false,
      transition: 'fade'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  // Start loading progress
  NProgress.start()

  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  const authStore = useAuthStore()
  const adminStore = useAdminStore()
  
  // Handle admin authentication
  if (to.meta.requiresAdminAuth) {
    // Initialize admin auth if not already done
    if (!adminStore.isAuthenticated) {
      adminStore.initializeAuth()
    }
    
    if (!adminStore.isAuthenticated) {
      next({ name: 'admin-login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  // Redirect authenticated admin from admin guest pages
  if (to.meta.requiresAdminGuest && adminStore.isAuthenticated) {
    next({ name: 'admin-dashboard' })
    return
  }

  // Check regular authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Redirect authenticated users from guest-only pages
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // Check user permissions if needed
  if (to.meta.requiredPermissions) {
    const permissions = to.meta.requiredPermissions as string[]
    if (!authStore.hasPermissions(permissions)) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

router.afterEach((to, from) => {
  // Complete loading progress
  NProgress.done()

  // Track page view for analytics
  if (import.meta.env.PROD) {
    // Add analytics tracking here
    console.log(`Page view: ${to.path}`)
  }
})

router.onError((error) => {
  NProgress.done()
  console.error('Router error:', error)
})

export default router