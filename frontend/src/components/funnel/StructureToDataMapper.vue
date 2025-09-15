<template>
  <div class="structure-to-data-mapper">
    <!-- Structure Preview -->
    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-medium text-gray-900 mb-3">漏斗结构预览</h3>
      <div class="flex items-center justify-center">
        <div class="flex items-center space-x-4">
          <div 
            v-for="(node, index) in orderedNodes" 
            :key="node.id"
            class="flex items-center"
          >
            <div class="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              {{ node.label }}
            </div>
            <ArrowRightIcon 
              v-if="index < orderedNodes.length - 1"
              class="h-5 w-5 text-gray-400 mx-2"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dynamic Data Entry Form -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">数据录入表单</h3>
      
      <!-- Time Period Selection -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            时间段
          </label>
          <select 
            v-model="dataEntry.timePeriod"
            class="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">每日数据</option>
            <option value="weekly">每周数据</option>
            <option value="monthly">每月数据</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            开始日期
          </label>
          <input 
            v-model="dataEntry.startDate"
            type="date"
            class="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            结束日期
          </label>
          <input 
            v-model="dataEntry.endDate"
            type="date"
            class="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Dynamic Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th 
                v-for="node in orderedNodes" 
                :key="node.id"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ node.label }}
                <div class="text-xs text-gray-400 normal-case mt-1">
                  {{ getNodeDescription(node) }}
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(row, index) in dataEntry.rows" :key="index">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <input 
                  v-model="row.date"
                  type="date"
                  class="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </td>
              <td 
                v-for="node in orderedNodes" 
                :key="`${index}-${node.id}`"
                class="px-6 py-4 whitespace-nowrap"
              >
                <input 
                  v-model.number="row.values[node.id]"
                  type="number"
                  min="0"
                  step="1"
                  :placeholder="`输入${node.label}数量`"
                  class="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  @click="removeRow(index)"
                  class="text-red-600 hover:text-red-900"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Row Button -->
      <div class="mt-4 flex justify-between">
        <button 
          @click="addRow"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          添加数据行
        </button>
        
        <div class="flex space-x-3">
          <button 
            @click="generateSampleData"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            生成示例数据
          </button>
          
          <button 
            @click="saveData"
            :disabled="!isValidData"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon class="h-4 w-4 mr-2" />
            保存数据
          </button>
        </div>
      </div>
    </div>

    <!-- Data Preview -->
    <div v-if="dataEntry.rows.length > 0" class="mt-6 bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">转化分析预览</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          v-for="(connection, index) in nodeConnections" 
          :key="index"
          class="p-4 bg-gray-50 rounded-lg"
        >
          <div class="text-sm text-gray-600">{{ connection.fromLabel }} → {{ connection.toLabel }}</div>
          <div class="text-2xl font-bold" :class="getConversionRateColor(connection.avgRate)">
            {{ connection.avgRate }}%
          </div>
          <div class="text-xs text-gray-500">平均转化率</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowRightIcon, PlusIcon, CheckIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  funnelStructure: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['data-updated', 'data-saved'])

// Data entry state
const dataEntry = ref({
  timePeriod: 'daily',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  rows: []
})

// Computed properties
const orderedNodes = computed(() => {
  if (!props.funnelStructure?.nodes) return []
  
  // Simple ordering: start with 'start' type nodes, then follow connections
  const nodes = [...props.funnelStructure.nodes]
  const connections = props.funnelStructure.connections || []
  
  // Find start node
  const startNode = nodes.find(n => n.type === 'start') || nodes[0]
  if (!startNode) return nodes
  
  const ordered = [startNode]
  const remaining = nodes.filter(n => n.id !== startNode.id)
  
  // Follow connection chain
  let currentNodeId = startNode.id
  while (remaining.length > 0) {
    const nextConnection = connections.find(c => c.from === currentNodeId)
    if (!nextConnection) break
    
    const nextNode = remaining.find(n => n.id === nextConnection.to)
    if (!nextNode) break
    
    ordered.push(nextNode)
    remaining.splice(remaining.indexOf(nextNode), 1)
    currentNodeId = nextNode.id
  }
  
  // Add any remaining nodes
  ordered.push(...remaining)
  
  return ordered
})

const nodeConnections = computed(() => {
  const connections = []
  
  for (let i = 0; i < orderedNodes.value.length - 1; i++) {
    const fromNode = orderedNodes.value[i]
    const toNode = orderedNodes.value[i + 1]
    
    // Calculate average conversion rate for this connection
    let totalRate = 0
    let validRows = 0
    
    dataEntry.value.rows.forEach(row => {
      const fromValue = row.values[fromNode.id]
      const toValue = row.values[toNode.id]
      
      if (fromValue > 0 && toValue >= 0) {
        const rate = (toValue / fromValue) * 100
        totalRate += rate
        validRows++
      }
    })
    
    const avgRate = validRows > 0 ? Math.round(totalRate / validRows) : 0
    
    connections.push({
      fromLabel: fromNode.label,
      toLabel: toNode.label,
      avgRate
    })
  }
  
  return connections
})

const isValidData = computed(() => {
  return dataEntry.value.rows.length > 0 && 
         dataEntry.value.rows.every(row => 
           row.date && Object.keys(row.values).length > 0
         )
})

// Methods
const getNodeDescription = (node) => {
  const descriptions = {
    start: '入口流量',
    stage: '阶段用户',
    decision: '决策分支',
    action: '行动转化',
    checkpoint: '关键节点',
    end: '最终转化'
  }
  return descriptions[node.type] || '用户数量'
}

const addRow = () => {
  const newRow = {
    date: new Date().toISOString().split('T')[0],
    values: {}
  }
  
  // Initialize values for each node
  orderedNodes.value.forEach(node => {
    newRow.values[node.id] = 0
  })
  
  dataEntry.value.rows.push(newRow)
}

const removeRow = (index) => {
  dataEntry.value.rows.splice(index, 1)
}

const generateSampleData = () => {
  // Clear existing data
  dataEntry.value.rows = []
  
  // Generate 7 days of sample data
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const row = {
      date: date.toISOString().split('T')[0],
      values: {}
    }
    
    // Generate decreasing funnel values
    let currentValue = Math.floor(Math.random() * 1000) + 500 // 500-1500
    
    orderedNodes.value.forEach((node, index) => {
      if (index === 0) {
        // First node keeps the full value
        row.values[node.id] = currentValue
      } else {
        // Each subsequent node has 60-90% of the previous value
        const conversionRate = 0.6 + Math.random() * 0.3
        currentValue = Math.floor(currentValue * conversionRate)
        row.values[node.id] = currentValue
      }
    })
    
    dataEntry.value.rows.push(row)
  }
}

const saveData = () => {
  const dataToSave = {
    funnelId: props.funnelStructure.id,
    timePeriod: dataEntry.value.timePeriod,
    dateRange: {
      start: dataEntry.value.startDate,
      end: dataEntry.value.endDate
    },
    data: dataEntry.value.rows.map(row => ({
      date: row.date,
      metrics: orderedNodes.value.map(node => ({
        nodeId: node.id,
        nodeLabel: node.label,
        value: row.values[node.id] || 0
      }))
    }))
  }
  
  emit('data-saved', dataToSave)
}

const getConversionRateColor = (rate) => {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-yellow-600'
  if (rate >= 40) return 'text-orange-600'
  return 'text-red-600'
}

// Watchers
watch(() => props.funnelStructure, () => {
  // Reset data when funnel structure changes
  dataEntry.value.rows = []
}, { deep: true })

watch(dataEntry, () => {
  emit('data-updated', dataEntry.value)
}, { deep: true })

// Initialize with one empty row
onMounted(() => {
  addRow()
})
</script>