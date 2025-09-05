<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="handleBackdropClick">
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div 
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center',
              getNodeTypeColor(node.type)
            ]"
          >
            <component 
              :is="getNodeIcon(node.type)" 
              class="w-5 h-5 text-white"
            />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              编辑{{ getNodeTypeLabel(node.type) }}节点
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              配置节点属性和行为
            </p>
          </div>
        </div>
        <button 
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <XMarkIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">基本信息</h3>
            
            <!-- Node Label -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                节点标签
              </label>
              <input
                v-model="editableNode.data.label"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="输入节点标签..."
              />
            </div>

            <!-- Node Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                描述（可选）
              </label>
              <textarea
                v-model="editableNode.data.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="输入节点描述..."
              />
            </div>
          </div>

          <!-- Node Type Specific Configuration -->
          <div v-if="hasSpecificConfig" class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              {{ getNodeTypeLabel(node.type) }} 配置
            </h3>

            <!-- Event Node Configuration -->
            <div v-if="node.type === 'event'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  事件名称 *
                </label>
                <input
                  v-model="editableNode.data.config.event_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="e.g., button_click, page_view, purchase"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  事件属性
                </label>
                <div class="space-y-2">
                  <div 
                    v-for="(property, index) in eventProperties"
                    :key="index"
                    class="flex gap-2"
                  >
                    <input
                      v-model="property.key"
                      type="text"
                      placeholder="属性名称"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <input
                      v-model="property.value"
                      type="text"
                      placeholder="属性值"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      @click="removeEventProperty(index)"
                      class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    @click="addEventProperty"
                    class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + 添加属性
                  </button>
                </div>
              </div>
            </div>

            <!-- Condition Node Configuration -->
            <div v-if="node.type === 'condition'" class="space-y-4">
              <div class="space-y-3">
                <div 
                  v-for="(condition, index) in conditions"
                  :key="index"
                  class="border border-gray-200 dark:border-gray-600 rounded-md p-4"
                >
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        属性
                      </label>
                      <input
                        v-model="condition.property"
                        type="text"
                        required
                        placeholder="e.g., user.age"
                        class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        操作符
                      </label>
                      <select
                        v-model="condition.operator"
                        class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="equals">等于</option>
                        <option value="not_equals">不等于</option>
                        <option value="contains">包含</option>
                        <option value="not_contains">不包含</option>
                        <option value="greater_than">大于</option>
                        <option value="less_than">小于</option>
                        <option value="exists">存在</option>
                        <option value="not_exists">不存在</option>
                      </select>
                    </div>
                    <div class="flex gap-2">
                      <div class="flex-1">
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          值
                        </label>
                        <input
                          v-model="condition.value"
                          type="text"
                          placeholder="比较值"
                          class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div class="flex items-end">
                        <button
                          type="button"
                          @click="removeCondition(index)"
                          class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <TrashIcon class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="index < conditions.length - 1" class="mt-2">
                    <select
                      v-model="condition.logical_operator"
                      class="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="and">AND</option>
                      <option value="or">OR</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="button"
                  @click="addCondition"
                  class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + 添加条件
                </button>
              </div>
            </div>

            <!-- Action Node Configuration -->
            <div v-if="node.type === 'action'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  操作类型 *
                </label>
                <select
                  v-model="editableNode.data.config.action_type"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">选择操作类型...</option>
                  <option value="email">发送邮件</option>
                  <option value="webhook">调用Webhook</option>
                  <option value="notification">发送通知</option>
                  <option value="tag">添加标签</option>
                  <option value="score">更新评分</option>
                </select>
              </div>
              
              <div v-if="editableNode.data.config.action_type" class="space-y-3">
                <h4 class="font-medium text-gray-900 dark:text-gray-100">操作参数</h4>
                <div 
                  v-for="(param, index) in actionParams"
                  :key="index"
                  class="flex gap-2"
                >
                  <input
                    v-model="param.key"
                    type="text"
                    placeholder="参数名称"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <input
                    v-model="param.value"
                    type="text"
                    placeholder="参数值"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    @click="removeActionParam(index)"
                    class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  @click="addActionParam"
                  class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + 添加参数
                </button>
              </div>
            </div>

            <!-- Delay Node Configuration -->
            <div v-if="node.type === 'delay'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  延迟类型 *
                </label>
                <select
                  v-model="editableNode.data.config.delay_type"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="fixed">固定延迟</option>
                  <option value="dynamic">动态延迟</option>
                </select>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    延迟值 *
                  </label>
                  <input
                    v-model.number="editableNode.data.config.delay_value"
                    type="number"
                    min="1"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    时间单位 *
                  </label>
                  <select
                    v-model="editableNode.data.config.delay_unit"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="seconds">秒</option>
                    <option value="minutes">分钟</option>
                    <option value="hours">小时</option>
                    <option value="days">天</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Split Node Configuration -->
            <div v-if="node.type === 'split'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分支类型 *
                </label>
                <select
                  v-model="editableNode.data.config.split_type"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="random">随机分支</option>
                  <option value="weighted">加权分支</option>
                  <option value="property">属性分支</option>
                </select>
              </div>
              
              <div v-if="editableNode.data.config.split_type === 'weighted'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分支比例 (%)
                </label>
                <div class="grid grid-cols-2 gap-4">
                  <input
                    v-model.number="splitRatios[0]"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="分支 A %"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <input
                    v-model.number="splitRatios[1]"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="分支 B %"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  总计：{{ (splitRatios[0] || 0) + (splitRatios[1] || 0) }}%
                </p>
              </div>
              
              <div v-if="editableNode.data.config.split_type === 'property'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  属性名称 *
                </label>
                <input
                  v-model="editableNode.data.config.split_property"
                  type="text"
                  required
                  placeholder="e.g., user.segment"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <!-- Node Style -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">外观</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  背景颜色
                </label>
                <input
                  v-model="editableNode.style.backgroundColor"
                  type="color"
                  class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  边框颜色
                </label>
                <input
                  v-model="editableNode.style.borderColor"
                  type="color"
                  class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <InformationCircleIcon class="w-4 h-4" />
          <span>更改将自动保存</span>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSubmit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FunnelNode, ConditionRule } from '@/types/funnel'
import { 
  PlayIcon, 
  StopIcon, 
  CubeIcon, 
  QuestionMarkCircleIcon,
  BoltIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
interface Props {
  node: FunnelNode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [node: FunnelNode]
}>()

// State
const editableNode = ref<FunnelNode>(JSON.parse(JSON.stringify(props.node)))
const eventProperties = ref<Array<{key: string, value: string}>>([])
const conditions = ref<ConditionRule[]>([])
const actionParams = ref<Array<{key: string, value: string}>>([])
const splitRatios = ref<number[]>([50, 50])

// Computed
const hasSpecificConfig = computed(() => {
  return ['event', 'condition', 'action', 'delay', 'split'].includes(props.node.type)
})

// Methods
const getNodeIcon = (type: string) => {
  switch (type) {
    case 'start': return PlayIcon
    case 'end': return StopIcon
    case 'event': return CubeIcon
    case 'condition': return QuestionMarkCircleIcon
    case 'action': return BoltIcon
    case 'delay': return ClockIcon
    case 'split': return ArrowsRightLeftIcon
    case 'merge': return ArrowsPointingInIcon
    default: return CubeIcon
  }
}

const getNodeTypeLabel = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const getNodeTypeColor = (type: string) => {
  switch (type) {
    case 'start': return 'bg-green-500'
    case 'end': return 'bg-red-500'
    case 'event': return 'bg-blue-500'
    case 'condition': return 'bg-yellow-500'
    case 'action': return 'bg-purple-500'
    case 'delay': return 'bg-orange-500'
    case 'split': return 'bg-indigo-500'
    case 'merge': return 'bg-pink-500'
    default: return 'bg-gray-500'
  }
}

const addEventProperty = () => {
  eventProperties.value.push({ key: '', value: '' })
}

const removeEventProperty = (index: number) => {
  eventProperties.value.splice(index, 1)
}

const addCondition = () => {
  conditions.value.push({
    property: '',
    operator: 'equals',
    value: '',
    logical_operator: 'and'
  })
}

const removeCondition = (index: number) => {
  conditions.value.splice(index, 1)
}

const addActionParam = () => {
  actionParams.value.push({ key: '', value: '' })
}

const removeActionParam = (index: number) => {
  actionParams.value.splice(index, 1)
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const handleSubmit = () => {
  // Convert arrays back to config format
  if (props.node.type === 'event') {
    const eventPropertiesObj: Record<string, any> = {}
    eventProperties.value.forEach(prop => {
      if (prop.key) {
        eventPropertiesObj[prop.key] = prop.value
      }
    })
    editableNode.value.data.config.event_properties = eventPropertiesObj
  }

  if (props.node.type === 'condition') {
    editableNode.value.data.config.conditions = conditions.value.filter(c => c.property)
  }

  if (props.node.type === 'action') {
    const actionParamsObj: Record<string, any> = {}
    actionParams.value.forEach(param => {
      if (param.key) {
        actionParamsObj[param.key] = param.value
      }
    })
    editableNode.value.data.config.action_params = actionParamsObj
  }

  if (props.node.type === 'split' && editableNode.value.data.config.split_type === 'weighted') {
    editableNode.value.data.config.split_ratio = splitRatios.value
  }

  emit('save', editableNode.value)
}

// Initialize form data
const initializeFormData = () => {
  // Initialize style if not exists
  if (!editableNode.value.style) {
    editableNode.value.style = {
      backgroundColor: getNodeTypeColor(props.node.type).replace('bg-', '#'),
      borderColor: '#e5e7eb'
    }
  }

  // Initialize type-specific data
  if (props.node.type === 'event' && props.node.data.config.event_properties) {
    eventProperties.value = Object.entries(props.node.data.config.event_properties).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  }

  if (props.node.type === 'condition' && props.node.data.config.conditions) {
    conditions.value = [...props.node.data.config.conditions]
  } else if (props.node.type === 'condition') {
    conditions.value = [{
      property: '',
      operator: 'equals',
      value: '',
      logical_operator: 'and'
    }]
  }

  if (props.node.type === 'action' && props.node.data.config.action_params) {
    actionParams.value = Object.entries(props.node.data.config.action_params).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  }

  if (props.node.type === 'split' && props.node.data.config.split_ratio) {
    splitRatios.value = [...props.node.data.config.split_ratio]
  }
}

// Lifecycle
onMounted(() => {
  initializeFormData()
})

// Watch for split ratio changes to ensure they add up to 100%
watch(splitRatios, (newRatios) => {
  if (newRatios[0] !== undefined && newRatios[1] === undefined) {
    splitRatios.value[1] = 100 - newRatios[0]
  } else if (newRatios[1] !== undefined && newRatios[0] === undefined) {
    splitRatios.value[0] = 100 - newRatios[1]
  }
}, { deep: true })
</script>

<style scoped>
/* Custom scrollbar for the content area */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>