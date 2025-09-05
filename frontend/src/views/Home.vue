<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
    <!-- Hero Section -->
    <section class="relative px-6 lg:px-8">
      <div class="mx-auto max-w-7xl pt-20 pb-32 sm:pt-32 sm:pb-40">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            用 <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
              Pathfinder
            </span> 可视化您的客户旅程
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            构建交互式漏斗模型，分析用户行为模式，使用我们强大的可视化分析平台优化转化率。
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <router-link
              v-if="!isAuthenticated"
              to="/register"
              class="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all duration-200 transform hover:scale-105"
            >
              免费开始
            </router-link>
            <router-link
              v-else
              to="/dashboard"
              class="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all duration-200 transform hover:scale-105"
            >
              进入仪表板
            </router-link>
            <a
              href="#features"
              class="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              了解更多 <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        
        <!-- Hero Image/Demo -->
        <div class="mt-16 flow-root sm:mt-24">
          <div class="-m-2 rounded-xl bg-gray-900/5 dark:bg-white/5 p-2 ring-1 ring-inset ring-gray-900/10 dark:ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-md shadow-2xl ring-1 ring-gray-900/10 dark:ring-white/10 w-full h-96 flex items-center justify-center">
              <div class="text-center text-gray-500 dark:text-gray-400">
                <div class="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-2xl">P</span>
                </div>
                <p class="text-lg font-medium">仪表板预览</p>
                <p class="text-sm">交互式漏斗分析界面</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 sm:py-32">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            优化您的漏斗所需的一切
          </h2>
          <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            强大的工具帮助您理解、可视化和改进您的客户旅程。
          </p>
        </div>
        
        <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div v-for="feature in features" :key="feature.name" class="flex flex-col">
              <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                <component
                  :is="feature.icon"
                  class="h-5 w-5 flex-none text-primary-600 dark:text-primary-400"
                  aria-hidden="true"
                />
                {{ feature.name }}
              </dt>
              <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                <p class="flex-auto">{{ feature.description }}</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="bg-white dark:bg-gray-800 py-24 sm:py-32">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl lg:max-w-none">
          <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              受到全球团队信赖
            </h2>
          </div>
          <dl class="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="stat in stats"
              :key="stat.id"
              class="flex flex-col bg-gray-400/5 dark:bg-gray-600/5 p-8"
            >
              <dt class="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">
                {{ stat.name }}
              </dt>
              <dd class="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {{ stat.value }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-primary-600 dark:bg-primary-800">
      <div class="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            准备好优化您的漏斗了吗？
          </h2>
          <p class="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-200">
            加入已经在使用 Pathfinder 提升转化率的数千个团队。
          </p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <router-link
              v-if="!isAuthenticated"
              to="/register"
              class="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
            >
              开始免费试用
            </router-link>
            <router-link
              v-else
              to="/funnels/create"
              class="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
            >
              创建您的第一个漏斗
            </router-link>
            <a
              href="#"
              class="text-sm font-semibold leading-6 text-white hover:text-primary-200 transition-colors"
            >
              了解更多 <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@stores/auth'
import {
  ChartBarIcon,
  CogIcon,
  CursorArrowRaysIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const features = [
  {
    name: '可视化漏斗构建器',
    description: '拖拽式界面创建复杂的客户旅程漏斗，支持节点、连线和条件逻辑。',
    icon: CursorArrowRaysIcon,
  },
  {
    name: '实时分析',
    description: '通过实时数据、转化率和用户行为洞察监控漏斗性能。',
    icon: ChartBarIcon,
  },
  {
    name: 'AI 驱动洞察',
    description: '使用机器学习获得智能建议，优化您的漏斗性能。',
    icon: CogIcon,
  },
]

const stats = [
  { id: 1, name: '活跃用户', value: '10,000+' },
  { id: 2, name: '创建的漏斗', value: '50,000+' },
  { id: 3, name: '转化率提升', value: '35%' },
  { id: 4, name: '客户满意度', value: '99%' },
]
</script>