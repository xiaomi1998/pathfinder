<template>
  <div class="space-y-6">
    <div class="text-center">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        选择业务模板
      </h3>
      <p class="text-gray-600 dark:text-gray-300">
        基于您的行业类型，我们为您推荐以下业务漏斗模板
      </p>
    </div>

    <!-- Industry Recommended Template -->
    <div v-if="industryTemplate" class="mb-6">
      <div class="flex items-center mb-4">
        <div class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">为您推荐</h4>
        <span class="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">智能匹配</span>
      </div>
      
      <div 
        @click="selectTemplate('industry')"
        :class="[
          'relative p-6 border-2 rounded-lg cursor-pointer transition-all bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
          selectedTemplate === 'industry' 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
        ]"
      >
        <!-- Selected Indicator -->
        <div v-if="selectedTemplate === 'industry'" 
             class="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <!-- Premium Badge -->
        <div class="absolute top-4 left-4 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full">
          推荐
        </div>

        <div class="flex items-start space-x-4 mt-6">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ industryTemplate.name }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ industryTemplate.description }}</p>
            
            <!-- Nodes Preview for Industry Template -->
            <div class="mt-3 space-y-2">
              <div v-for="(node, index) in industryTemplate.nodes.slice(0, 4)" :key="node.id" 
                   class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: node.color }"></span>
                <span>{{ node.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Other Templates -->
    <div class="mb-4">
      <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">其他模板选择</h4>
    </div>

    <!-- Template Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- E-commerce Template -->
      <div 
        @click="selectTemplate('ecommerce')"
        :class="[
          'relative p-6 border-2 rounded-lg cursor-pointer transition-all',
          selectedTemplate === 'ecommerce' 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        ]"
      >
        <!-- Selected Indicator -->
        <div v-if="selectedTemplate === 'ecommerce'" 
             class="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">电商购买漏斗</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">推荐用于电商、零售</p>
            
            <!-- Nodes Preview -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>访问商品页面</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>加入购物车</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>进入结算页面</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span>完成支付</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SaaS Template -->
      <div 
        @click="selectTemplate('saas')"
        :class="[
          'relative p-6 border-2 rounded-lg cursor-pointer transition-all',
          selectedTemplate === 'saas' 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        ]"
      >
        <!-- Selected Indicator -->
        <div v-if="selectedTemplate === 'saas'" 
             class="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">SaaS注册漏斗</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">推荐用于软件、工具</p>
            
            <!-- Nodes Preview -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>访问首页</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>点击注册</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>完成注册</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                <span>激活试用</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span>付费转化</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Template -->
      <div 
        @click="selectTemplate('content')"
        :class="[
          'relative p-6 border-2 rounded-lg cursor-pointer transition-all',
          selectedTemplate === 'content' 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        ]"
      >
        <!-- Selected Indicator -->
        <div v-if="selectedTemplate === 'content'" 
             class="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">内容转化漏斗</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">推荐用于媒体、内容</p>
            
            <!-- Nodes Preview -->
            <div class="mt-3 space-y-2">
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>浏览内容</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>点击互动</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>关注订阅</span>
              </div>
              <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span>付费内容</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Template -->
      <div 
        @click="selectTemplate('custom')"
        :class="[
          'relative p-6 border-2 rounded-lg cursor-pointer transition-all',
          selectedTemplate === 'custom' 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        ]"
      >
        <!-- Selected Indicator -->
        <div v-if="selectedTemplate === 'custom'" 
             class="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">自定义漏斗</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">完全自定义流程</p>
            
            <!-- Custom Description -->
            <div class="mt-3">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                根据您的具体业务需求，自定义设置漏斗节点和转化路径
              </p>
              <div class="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>从空白开始构建</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-center mt-8 space-x-4">
      <button
        v-if="!funnelCreated"
        @click="handleSetupFunnel"
        :disabled="!selectedTemplate"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        设置漏斗（可选）
      </button>
      <button
        @click="handleSkip"
        :class="[
          'px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
          funnelCreated 
            ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
        ]"
      >
        {{ funnelCreated ? '完成设置' : '稍后设置' }}
      </button>
    </div>
    
    <!-- Status indicator -->
    <div v-if="funnelCreated" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
      <div class="flex items-center justify-center text-green-700">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-medium">漏斗创建成功！现在可以继续完成初始化</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@stores/app'

// Define props for v-model
interface Props {
  modelValue?: string
  organization?: {
    name: string
    industry: string
    size: string
    description: string
    location: string
    salesModel: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  organization: () => ({
    name: '',
    industry: '',
    size: '',
    description: '',
    location: '',
    salesModel: ''
  })
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const router = useRouter()
const appStore = useAppStore()

// Use a local ref for internal state
const internalSelectedTemplate = ref<string>(props.modelValue || '')
const funnelCreated = ref(false)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    internalSelectedTemplate.value = newValue
  }
})

// Computed property for template
const selectedTemplate = computed({
  get: () => internalSelectedTemplate.value,
  set: (value) => {
    internalSelectedTemplate.value = value
    emit('update:modelValue', value)
  }
})


// 行业专属模板配置
const industryTemplates = {
  'technology': {
    name: '科技/互联网漏斗',
    description: '适用于科技公司和互联网产品的用户转化漏斗',
    nodes: [
      { id: 'node_1', name: '访问产品页', type: 'start', label: '访问产品页', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '注册试用', type: 'stage', label: '注册试用', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '产品体验', type: 'stage', label: '产品体验', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '付费转化', type: 'end', label: '付费转化', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'finance': {
    name: '金融/保险漏斗',
    description: '适用于金融和保险行业的客户转化漏斗',
    nodes: [
      { id: 'node_1', name: '了解产品', type: 'start', label: '了解产品', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '咨询服务', type: 'stage', label: '咨询服务', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '风险评估', type: 'stage', label: '风险评估', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约购买', type: 'end', label: '签约购买', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'healthcare': {
    name: '医疗健康漏斗',
    description: '适用于医疗健康行业的患者服务漏斗',
    nodes: [
      { id: 'node_1', name: '症状咨询', type: 'start', label: '症状咨询', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '预约挂号', type: 'stage', label: '预约挂号', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '诊断治疗', type: 'stage', label: '诊断治疗', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '康复随访', type: 'end', label: '康复随访', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'education': {
    name: '教育培训漏斗',
    description: '适用于教育培训行业的学员转化漏斗',
    nodes: [
      { id: 'node_1', name: '了解课程', type: 'start', label: '了解课程', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '试听体验', type: 'stage', label: '试听体验', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '报名缴费', type: 'stage', label: '报名缴费', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '完成学习', type: 'end', label: '完成学习', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'ecommerce': {
    name: '电商/零售漏斗',
    description: '适用于电商零售行业的购买转化漏斗',
    nodes: [
      { id: 'node_1', name: '商品浏览', type: 'start', label: '商品浏览', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '加入购物车', type: 'stage', label: '加入购物车', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '确认订单', type: 'stage', label: '确认订单', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '支付完成', type: 'end', label: '支付完成', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'manufacturing': {
    name: '制造业漏斗',
    description: '适用于制造业的客户获取漏斗',
    nodes: [
      { id: 'node_1', name: '产品询价', type: 'start', label: '产品询价', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '技术沟通', type: 'stage', label: '技术沟通', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '报价谈判', type: 'stage', label: '报价谈判', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约合作', type: 'end', label: '签约合作', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'consulting': {
    name: '咨询服务漏斗',
    description: '适用于咨询服务行业的客户获取漏斗',
    nodes: [
      { id: 'node_1', name: '需求咨询', type: 'start', label: '需求咨询', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '方案讨论', type: 'stage', label: '方案讨论', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '提案报价', type: 'stage', label: '提案报价', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约服务', type: 'end', label: '签约服务', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'media': {
    name: '媒体/广告漏斗',
    description: '适用于媒体广告行业的客户转化漏斗',
    nodes: [
      { id: 'node_1', name: '内容曝光', type: 'start', label: '内容曝光', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '互动参与', type: 'stage', label: '互动参与', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '广告投放', type: 'stage', label: '广告投放', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '品牌转化', type: 'end', label: '品牌转化', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'real_estate': {
    name: '房地产漏斗',
    description: '适用于房地产行业的客户转化漏斗',
    nodes: [
      { id: 'node_1', name: '房源浏览', type: 'start', label: '房源浏览', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '实地看房', type: 'stage', label: '实地看房', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '意向洽谈', type: 'stage', label: '意向洽谈', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约成交', type: 'end', label: '签约成交', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'travel': {
    name: '旅游/酒店漏斗',
    description: '适用于旅游酒店行业的客户预订漏斗',
    nodes: [
      { id: 'node_1', name: '浏览产品', type: 'start', label: '浏览产品', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '比较选择', type: 'stage', label: '比较选择', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '下单预订', type: 'stage', label: '下单预订', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '确认入住', type: 'end', label: '确认入住', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'automotive': {
    name: '汽车行业漏斗',
    description: '适用于汽车行业的客户购买漏斗',
    nodes: [
      { id: 'node_1', name: '品牌关注', type: 'start', label: '品牌关注', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '试驾体验', type: 'stage', label: '试驾体验', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '配置选择', type: 'stage', label: '配置选择', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '购车成交', type: 'end', label: '购车成交', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'food': {
    name: '餐饮/食品漏斗',
    description: '适用于餐饮食品行业的客户消费漏斗',
    nodes: [
      { id: 'node_1', name: '了解品牌', type: 'start', label: '了解品牌', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '菜品选择', type: 'stage', label: '菜品选择', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '下单支付', type: 'stage', label: '下单支付', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '完成消费', type: 'end', label: '完成消费', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'logistics': {
    name: '物流/运输漏斗',
    description: '适用于物流运输行业的客户服务漏斗',
    nodes: [
      { id: 'node_1', name: '运输需求', type: 'start', label: '运输需求', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '方案报价', type: 'stage', label: '方案报价', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '签订合同', type: 'stage', label: '签订合同', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '服务交付', type: 'end', label: '服务交付', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'energy': {
    name: '能源行业漏斗',
    description: '适用于能源行业的客户获取漏斗',
    nodes: [
      { id: 'node_1', name: '需求评估', type: 'start', label: '需求评估', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '方案设计', type: 'stage', label: '方案设计', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '合同谈判', type: 'stage', label: '合同谈判', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '项目交付', type: 'end', label: '项目交付', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'government': {
    name: '政府/公共漏斗',
    description: '适用于政府和公共服务的民众服务漏斗',
    nodes: [
      { id: 'node_1', name: '服务咨询', type: 'start', label: '服务咨询', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '材料提交', type: 'stage', label: '材料提交', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '审核处理', type: 'stage', label: '审核处理', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '服务完成', type: 'end', label: '服务完成', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  'other': {
    name: '通用业务漏斗',
    description: '适用于各种行业的通用业务流程漏斗',
    nodes: [
      { id: 'node_1', name: '客户接触', type: 'start', label: '客户接触', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '需求沟通', type: 'stage', label: '需求沟通', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '方案确认', type: 'stage', label: '方案确认', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '服务交付', type: 'end', label: '服务交付', color: '#EF4444', x: 700, y: 200 }
    ]
  }
}

// 动态生成行业相关模板
const industryTemplate = computed(() => {
  console.log('🏭 Computing industry template:', props.organization)
  
  if (!props.organization?.industry) {
    console.log('🏭 No industry specified in organization')
    return null
  }
  
  const industry = props.organization.industry
  const industryConfig = industryTemplates[industry as keyof typeof industryTemplates]
  
  console.log('🏭 Industry template mapping:', {
    industry,
    hasConfig: !!industryConfig
  })
  
  if (!industryConfig) {
    console.log('🏭 No specific template for this industry')
    return null
  }
  
  // 为节点添加连接配置
  const nodes = industryConfig.nodes
  const connections = nodes.slice(0, -1).map((node, index) => ({
    id: `conn_${index + 1}`,
    source: node.id,
    target: nodes[index + 1].id
  }))
  
  const result = {
    id: 'industry',
    name: industryConfig.name,
    description: industryConfig.description,
    nodes,
    connections
  }
  
  console.log('🏭 Generated industry template:', result)
  return result
})

const selectTemplate = (template: string) => {
  console.log('Selecting template:', template)
  internalSelectedTemplate.value = template
  emit('update:modelValue', template)
}

// Template configurations with proper node types
const templates = {
  ecommerce: {
    name: '电商购买漏斗',
    description: '适用于电商平台的购买转化漏斗',
    nodes: [
      { id: 'node_1', name: '访问商品页面', type: 'start', label: '访问商品页面', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '加入购物车', type: 'stage', label: '加入购物车', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '进入结算页面', type: 'stage', label: '进入结算页面', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '完成支付', type: 'end', label: '完成支付', color: '#EF4444', x: 700, y: 200 }
    ],
    connections: [
      { id: 'conn_1', source: 'node_1', target: 'node_2' },
      { id: 'conn_2', source: 'node_2', target: 'node_3' },
      { id: 'conn_3', source: 'node_3', target: 'node_4' }
    ]
  },
  saas: {
    name: 'SaaS注册漏斗',
    description: '适用于SaaS产品的用户转化漏斗',
    nodes: [
      { id: 'node_1', name: '访问首页', type: 'start', label: '访问首页', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '点击注册', type: 'stage', label: '点击注册', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '完成注册', type: 'stage', label: '完成注册', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '激活试用', type: 'action', label: '激活试用', color: '#8B5CF6', x: 700, y: 200 },
      { id: 'node_5', name: '付费转化', type: 'end', label: '付费转化', color: '#EF4444', x: 900, y: 200 }
    ],
    connections: [
      { id: 'conn_1', source: 'node_1', target: 'node_2' },
      { id: 'conn_2', source: 'node_2', target: 'node_3' },
      { id: 'conn_3', source: 'node_3', target: 'node_4' },
      { id: 'conn_4', source: 'node_4', target: 'node_5' }
    ]
  },
  content: {
    name: '内容转化漏斗',
    description: '适用于内容平台的用户转化漏斗',
    nodes: [
      { id: 'node_1', name: '浏览内容', type: 'start', label: '浏览内容', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '点击互动', type: 'action', label: '点击互动', color: '#8B5CF6', x: 300, y: 200 },
      { id: 'node_3', name: '关注订阅', type: 'stage', label: '关注订阅', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '付费内容', type: 'end', label: '付费内容', color: '#EF4444', x: 700, y: 200 }
    ],
    connections: [
      { id: 'conn_1', source: 'node_1', target: 'node_2' },
      { id: 'conn_2', source: 'node_2', target: 'node_3' },
      { id: 'conn_3', source: 'node_3', target: 'node_4' }
    ]
  },
  custom: {
    name: '自定义漏斗',
    description: '从空白开始创建自定义漏斗',
    nodes: [],
    connections: []
  }
}

const handleSetupFunnel = async () => {
  if (!selectedTemplate.value) return

  let template
  if (selectedTemplate.value === 'industry' && industryTemplate.value) {
    template = industryTemplate.value
  } else {
    template = templates[selectedTemplate.value as keyof typeof templates]
  }
  
  if (!template) return
  
  console.log('🚀 FunnelTemplateSelection handleSetupFunnel called:', {
    selectedTemplate: selectedTemplate.value,
    template: template.name
  })
  
  // Store template and onboarding state in sessionStorage
  sessionStorage.setItem('funnelTemplate', JSON.stringify(template))
  sessionStorage.setItem('onboardingReturn', 'true')
  sessionStorage.setItem('onboardingTemplate', selectedTemplate.value)
  
  // Also save current organization data if available
  const orgData = sessionStorage.getItem('onboardingOrgData')
  if (!orgData && props.organization) {
    sessionStorage.setItem('onboardingOrgData', JSON.stringify(props.organization))
    console.log('💾 Saved organization data before navigating:', props.organization)
  }
  
  // Show success message
  appStore.showSuccess('模板已选择', `已选择${template.name}，正在进入编辑页面...`)
  
  console.log('🚀 FunnelTemplateSelection navigating to:', '/funnels/create')
  
  // Navigate to funnel builder with return parameter
  router.push({
    path: '/funnels/create',
    query: { from: 'onboarding' }
  })
}

const handleSkip = async () => {
  // Mark onboarding as complete
  sessionStorage.setItem('onboardingComplete', 'true')
  
  // If funnel was created, we're on the "完成设置" button
  if (funnelCreated.value) {
    // Set a flag so parent knows funnel was created
    sessionStorage.setItem('onboardingReturnComplete', 'true')
    // The parent (Onboarding) will handle the navigation
    // Don't navigate here, let the parent handle it
    return
  }
  
  // User clicked "稍后设置" - skip funnel creation
  // Clean up any temporary storage
  sessionStorage.removeItem('onboardingReturnComplete')
  sessionStorage.removeItem('onboardingReturn')
  sessionStorage.removeItem('funnelTemplate')
  
  // Show success message
  appStore.showSuccess('初始化完成', '欢迎使用 Pathfinder！')
  
  // Navigate to dashboard
  router.push('/dashboard')
}

const handleNext = async () => {
  if (!selectedTemplate.value) return

  let template
  if (selectedTemplate.value === 'industry' && industryTemplate.value) {
    template = industryTemplate.value
  } else {
    template = templates[selectedTemplate.value as keyof typeof templates]
  }
  
  if (!template) return
  
  // Store template in sessionStorage for the builder to use
  sessionStorage.setItem('funnelTemplate', JSON.stringify(template))
  
  // Show success message
  appStore.showSuccess('模板已选择', `已选择${template.name}，正在进入编辑页面...`)
  
  // Navigate to funnel builder with template
  router.push('/funnels/create')
}

// Check if returning from funnel creation
onMounted(() => {
  const templateFromStorage = sessionStorage.getItem('onboardingTemplate')
  const returnFlag = sessionStorage.getItem('onboardingReturnComplete')
  
  if (returnFlag === 'true' && templateFromStorage) {
    // User is returning after creating funnel
    // Set funnel created state to show success message
    funnelCreated.value = true
    selectedTemplate.value = templateFromStorage
    
    // Don't clean up session storage here - let the parent (Onboarding.vue) handle it
    // Don't auto-redirect - let the user click the "完成设置" button
    return
  }
})

// Expose for parent component
defineExpose({
  selectedTemplate: computed(() => selectedTemplate.value),
  handleNext,
  handleSkip
})
</script>