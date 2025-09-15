<template>
  <div class="funnel-template-selector">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        @click="selectTemplate(template)"
        class="relative group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 hover:border-blue-300 p-6"
        :class="{ 'ring-2 ring-blue-500 border-blue-500': selectedTemplateId === template.id }"
      >
        <!-- Template Preview -->
        <div class="mb-4">
          <div class="flex items-center justify-center h-24 bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-2">
              <div 
                v-for="(node, index) in template.previewNodes" 
                :key="index"
                class="flex items-center"
              >
                <div 
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  :style="{ backgroundColor: node.color }"
                >
                  {{ index + 1 }}
                </div>
                <ArrowRightIcon 
                  v-if="index < template.previewNodes.length - 1"
                  class="h-3 w-3 text-gray-400 mx-1"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Template Info -->
        <div class="space-y-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {{ template.name }}
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ template.description }}
            </p>
          </div>

          <!-- Metadata -->
          <div class="flex items-center justify-between text-xs text-gray-500">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 bg-gray-100 rounded-full">
                {{ template.metadata?.category || 'Custom' }}
              </span>
              <span class="px-2 py-1 bg-gray-100 rounded-full">
                {{ template.metadata?.complexity || 'Medium' }}
              </span>
            </div>
            <div>
              {{ template.structure?.nodes?.length || 0 }} 节点
            </div>
          </div>

          <!-- Tags -->
          <div v-if="template.metadata?.tags?.length" class="flex flex-wrap gap-1">
            <span 
              v-for="tag in template.metadata.tags.slice(0, 3)"
              :key="tag"
              class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              {{ tag }}
            </span>
            <span 
              v-if="template.metadata.tags.length > 3"
              class="text-xs text-gray-500"
            >
              +{{ template.metadata.tags.length - 3 }}
            </span>
          </div>

          <!-- Estimated Setup Time -->
          <div v-if="template.metadata?.estimatedSetupTime" class="flex items-center text-sm text-gray-600">
            <ClockIcon class="h-4 w-4 mr-1" />
            预计设置时间: {{ template.metadata.estimatedSetupTime }}
          </div>
        </div>

        <!-- Selection Indicator -->
        <div 
          v-if="selectedTemplateId === template.id"
          class="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
        >
          <CheckIcon class="h-4 w-4 text-white" />
        </div>
      </div>

      <!-- Create Custom Template Card -->
      <div
        @click="createCustomTemplate"
        class="relative group cursor-pointer bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 p-6 flex flex-col items-center justify-center min-h-[280px] hover:bg-gray-100 transition-colors duration-200"
      >
        <div class="text-center">
          <PlusIcon class="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 group-hover:text-blue-600">
            创建自定义模板
          </h3>
          <p class="mt-2 text-sm text-gray-600">
            从头开始设计您的漏斗结构
          </p>
        </div>
      </div>
    </div>

    <!-- Selected Template Details -->
    <div v-if="selectedTemplate" class="mt-8 bg-blue-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-blue-900 mb-4">
        模板详情: {{ selectedTemplate.name }}
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Structure Preview -->
        <div>
          <h4 class="font-medium text-blue-800 mb-2">结构预览</h4>
          <div class="space-y-2">
            <div 
              v-for="(node, index) in selectedTemplate.structure?.nodes || []"
              :key="node.id"
              class="flex items-center space-x-2 p-2 bg-white rounded"
            >
              <div 
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: getNodeTypeColor(node.type) }"
              ></div>
              <span class="text-sm">{{ node.label }}</span>
              <span class="text-xs text-gray-500">({{ node.type }})</span>
            </div>
          </div>
        </div>

        <!-- Metadata Details -->
        <div>
          <h4 class="font-medium text-blue-800 mb-2">模板信息</h4>
          <dl class="space-y-1 text-sm">
            <div v-if="selectedTemplate.metadata?.author">
              <dt class="text-gray-600 inline">作者:</dt>
              <dd class="text-gray-900 inline ml-2">{{ selectedTemplate.metadata.author }}</dd>
            </div>
            <div v-if="selectedTemplate.metadata?.estimatedSetupTime">
              <dt class="text-gray-600 inline">设置时间:</dt>
              <dd class="text-gray-900 inline ml-2">{{ selectedTemplate.metadata.estimatedSetupTime }}</dd>
            </div>
            <div v-if="selectedTemplate.metadata?.requiredIntegrations?.length">
              <dt class="text-gray-600 inline">所需集成:</dt>
              <dd class="text-gray-900 inline ml-2">
                {{ selectedTemplate.metadata.requiredIntegrations.join(', ') }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex justify-end space-x-3">
        <button
          @click="clearSelection"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          取消选择
        </button>
        <button
          @click="useTemplate"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          使用此模板
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowRightIcon, ClockIcon, CheckIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  availableTemplates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['template-selected', 'create-custom'])

// State
const selectedTemplateId = ref(null)

// Pre-built templates
const builtInTemplates = ref([
  {
    id: 'marketing-basic',
    name: '基础营销漏斗',
    description: '适用于大多数营销活动的标准漏斗结构',
    structure: {
      nodes: [
        { id: 'awareness', type: 'start', label: '知晓度', position: { x: 50, y: 50 } },
        { id: 'interest', type: 'stage', label: '兴趣', position: { x: 200, y: 50 } },
        { id: 'consideration', type: 'stage', label: '考虑', position: { x: 350, y: 50 } },
        { id: 'purchase', type: 'end', label: '购买', position: { x: 500, y: 50 } }
      ],
      connections: [
        { id: 'c1', from: 'awareness', to: 'interest', type: 'default' },
        { id: 'c2', from: 'interest', to: 'consideration', type: 'default' },
        { id: 'c3', from: 'consideration', to: 'purchase', type: 'default' }
      ]
    },
    metadata: {
      category: 'marketing',
      complexity: 'simple',
      estimatedSetupTime: '10-15分钟',
      tags: ['营销', '基础', '转化'],
      author: 'Pathfinder团队'
    },
    previewNodes: [
      { color: '#10B981' },
      { color: '#3B82F6' },
      { color: '#3B82F6' },
      { color: '#EF4444' }
    ]
  },
  {
    id: 'saas-onboarding',
    name: 'SaaS用户入门',
    description: '为SaaS产品设计的用户入门和激活漏斗',
    structure: {
      nodes: [
        { id: 'signup', type: 'start', label: '注册', position: { x: 50, y: 50 } },
        { id: 'verification', type: 'stage', label: '邮箱验证', position: { x: 150, y: 50 } },
        { id: 'profile', type: 'stage', label: '完善资料', position: { x: 250, y: 50 } },
        { id: 'first-login', type: 'checkpoint', label: '首次登录', position: { x: 350, y: 50 } },
        { id: 'feature-use', type: 'action', label: '使用核心功能', position: { x: 450, y: 50 } },
        { id: 'activation', type: 'end', label: '用户激活', position: { x: 550, y: 50 } }
      ],
      connections: [
        { id: 'c1', from: 'signup', to: 'verification', type: 'default' },
        { id: 'c2', from: 'verification', to: 'profile', type: 'default' },
        { id: 'c3', from: 'profile', to: 'first-login', type: 'default' },
        { id: 'c4', from: 'first-login', to: 'feature-use', type: 'default' },
        { id: 'c5', from: 'feature-use', to: 'activation', type: 'default' }
      ]
    },
    metadata: {
      category: 'product',
      complexity: 'medium',
      estimatedSetupTime: '20-30分钟',
      tags: ['SaaS', '入门', '激活', '产品'],
      author: 'Pathfinder团队',
      requiredIntegrations: ['用户数据', '事件跟踪']
    },
    previewNodes: [
      { color: '#10B981' },
      { color: '#3B82F6' },
      { color: '#3B82F6' },
      { color: '#EC4899' },
      { color: '#8B5CF6' },
      { color: '#EF4444' }
    ]
  },
  {
    id: 'ecommerce-checkout',
    name: '电商结账流程',
    description: '电商网站的完整购买转化流程',
    structure: {
      nodes: [
        { id: 'product-view', type: 'start', label: '商品浏览', position: { x: 50, y: 50 } },
        { id: 'add-cart', type: 'action', label: '加入购物车', position: { x: 150, y: 50 } },
        { id: 'cart-view', type: 'stage', label: '查看购物车', position: { x: 250, y: 50 } },
        { id: 'checkout-start', type: 'decision', label: '开始结账', position: { x: 350, y: 50 } },
        { id: 'payment', type: 'action', label: '支付', position: { x: 450, y: 50 } },
        { id: 'order-complete', type: 'end', label: '订单完成', position: { x: 550, y: 50 } }
      ],
      connections: [
        { id: 'c1', from: 'product-view', to: 'add-cart', type: 'default' },
        { id: 'c2', from: 'add-cart', to: 'cart-view', type: 'default' },
        { id: 'c3', from: 'cart-view', to: 'checkout-start', type: 'default' },
        { id: 'c4', from: 'checkout-start', to: 'payment', type: 'default' },
        { id: 'c5', from: 'payment', to: 'order-complete', type: 'default' }
      ]
    },
    metadata: {
      category: 'sales',
      complexity: 'medium',
      estimatedSetupTime: '15-25分钟',
      tags: ['电商', '购买', '转化', '销售'],
      author: 'Pathfinder团队',
      requiredIntegrations: ['电商平台', '支付系统']
    },
    previewNodes: [
      { color: '#10B981' },
      { color: '#8B5CF6' },
      { color: '#3B82F6' },
      { color: '#F59E0B' },
      { color: '#8B5CF6' },
      { color: '#EF4444' }
    ]
  },
  {
    id: 'lead-generation',
    name: '潜客生成漏斗',
    description: 'B2B企业的潜在客户获取和转化流程',
    structure: {
      nodes: [
        { id: 'traffic', type: 'start', label: '网站访问', position: { x: 50, y: 50 } },
        { id: 'content-engage', type: 'stage', label: '内容互动', position: { x: 150, y: 50 } },
        { id: 'lead-magnet', type: 'action', label: '下载资源', position: { x: 250, y: 50 } },
        { id: 'contact-info', type: 'stage', label: '留联系方式', position: { x: 350, y: 50 } },
        { id: 'qualification', type: 'decision', label: '销售跟进', position: { x: 450, y: 50 } },
        { id: 'qualified-lead', type: 'end', label: '合格潜客', position: { x: 550, y: 50 } }
      ],
      connections: [
        { id: 'c1', from: 'traffic', to: 'content-engage', type: 'default' },
        { id: 'c2', from: 'content-engage', to: 'lead-magnet', type: 'default' },
        { id: 'c3', from: 'lead-magnet', to: 'contact-info', type: 'default' },
        { id: 'c4', from: 'contact-info', to: 'qualification', type: 'default' },
        { id: 'c5', from: 'qualification', to: 'qualified-lead', type: 'conditional' }
      ]
    },
    metadata: {
      category: 'sales',
      complexity: 'medium',
      estimatedSetupTime: '20-30分钟',
      tags: ['B2B', '潜客', '销售', '营销'],
      author: 'Pathfinder团队',
      requiredIntegrations: ['CRM系统', '营销自动化']
    },
    previewNodes: [
      { color: '#10B981' },
      { color: '#3B82F6' },
      { color: '#8B5CF6' },
      { color: '#3B82F6' },
      { color: '#F59E0B' },
      { color: '#EF4444' }
    ]
  }
])

// Computed properties
const templates = computed(() => {
  return [...builtInTemplates.value, ...props.availableTemplates]
})

const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === selectedTemplateId.value)
})

// Methods
const selectTemplate = (template) => {
  selectedTemplateId.value = selectedTemplateId.value === template.id ? null : template.id
}

const clearSelection = () => {
  selectedTemplateId.value = null
}

const useTemplate = () => {
  if (selectedTemplate.value) {
    emit('template-selected', selectedTemplate.value)
  }
}

const createCustomTemplate = () => {
  emit('create-custom')
}

const getNodeTypeColor = (type) => {
  const colors = {
    start: '#10B981',
    stage: '#3B82F6',
    decision: '#F59E0B',
    action: '#8B5CF6',
    checkpoint: '#EC4899',
    end: '#EF4444'
  }
  return colors[type] || '#6B7280'
}
</script>