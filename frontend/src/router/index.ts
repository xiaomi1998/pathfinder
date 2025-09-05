import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import NProgress from 'nprogress'

// Lazy load views
const Home = () => import('@views/Home.vue')
const Login = () => import('@views/auth/Login.vue')
const Register = () => import('@views/auth/Register.vue')
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
  
  // Check authentication
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