<template>
  <div class="bg-gradient-pathfinder min-h-screen px-4 py-3">
    <!-- 头部卡片 -->
    <div class="card-pathfinder header-card hero-section animate-slide-in mb-4">
      <div class="flex justify-between items-center">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <i class="fas fa-funnel-dollar text-white"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ isEditMode ? '编辑漏斗' : '创建漏斗' }}
            </h1>
          </div>
          <p class="text-gray-600">{{ isEditMode ? '修改漏斗配置，优化转化流程' : '设计您的客户转化旅程，追踪业务增长' }}</p>
        </div>
        <div class="flex gap-3">
          <router-link to="/funnels" class="btn-pathfinder btn-secondary-pathfinder">
            <i class="fas fa-arrow-left mr-2"></i>返回列表
          </router-link>
        </div>
      </div>
    </div>

    <!-- 编辑/创建表单 -->
    <div class="card-pathfinder create-funnel-form animate-slide-in form-visible min-h-fit">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-gray-900">{{ isEditMode ? '编辑漏斗信息' : '创建新漏斗' }}</h3>
        <div class="text-xs text-gray-500 flex items-center gap-2" v-if="isEditMode">
          <i class="fas fa-info-circle"></i>
          <span>ID: {{ funnelId }}</span>
        </div>
      </div>
      
      <!-- 进度指示器 -->
      <div class="progress-steps mb-4">
        <div class="step active">
          <div class="step-circle">1</div>
          <div class="step-label">基本信息</div>
        </div>
        <div class="step-line"></div>
        <div class="step active">
          <div class="step-circle">2</div>
          <div class="step-label">阶段配置</div>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <div class="step-circle">3</div>
          <div class="step-label">数据录入</div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="form-group-compact">
          <label class="form-label-compact flex items-center gap-2">
            <i class="fas fa-tag text-blue-600"></i>
            漏斗名称 <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            class="form-input-pathfinder" 
            placeholder="如：SaaS产品试用转化漏斗"
            v-model="funnelData.name"
            maxlength="50"
          >
          <div class="text-xs text-gray-500 mt-1">{{ funnelData.name.length }}/50</div>
        </div>
        <div class="form-group-compact">
          <label class="form-label-compact flex items-center gap-2">
            <i class="fas fa-industry text-blue-600"></i>
            业务类型
          </label>
          <select class="form-input-pathfinder" v-model="funnelData.businessType">
            <option value="sales">💼 销售转化</option>
            <option value="product">🚀 产品试用</option>
            <option value="marketing">📢 内容营销</option>
            <option value="campaign">🎯 活动推广</option>
            <option value="other">📋 其他</option>
          </select>
        </div>
      </div>
      
      <!-- 数据更新周期 -->
      <div class="update-frequency-section-compact">
        <div class="flex items-center mb-2">
          <i class="fas fa-clock text-blue-600 mr-2 text-sm"></i>
          <label class="form-label-compact mb-0">数据更新周期</label>
        </div>
        <p class="text-xs text-blue-700 mb-2">选择数据录入的频率，这将影响数据录入界面的展示方式</p>
        
        <div class="frequency-options-compact">
          <div 
            class="frequency-option-compact" 
            :class="{ selected: funnelData.dataPeriod === 'DAILY' }"
            @click="selectFrequency('DAILY')"
          >
            <div class="frequency-title-compact">日更新</div>
            <div class="frequency-desc-compact">每日录入</div>
          </div>
          <div 
            class="frequency-option-compact"
            :class="{ selected: funnelData.dataPeriod === 'WEEKLY' }"
            @click="selectFrequency('WEEKLY')"
          >
            <div class="frequency-title-compact">周更新</div>
            <div class="frequency-desc-compact">每周录入</div>
          </div>
          <div 
            class="frequency-option-compact"
            :class="{ selected: funnelData.dataPeriod === 'MONTHLY' }"
            @click="selectFrequency('MONTHLY')"
          >
            <div class="frequency-title-compact">月更新</div>
            <div class="frequency-desc-compact">每月录入</div>
          </div>
        </div>
      </div>
      
      <!-- 描述 -->
      <div class="form-group-compact">
        <label class="form-label-compact flex items-center gap-2">
          <i class="fas fa-align-left text-blue-600"></i>
          描述
        </label>
        <textarea 
          class="form-textarea-pathfinder-compact" 
          placeholder="描述漏斗的业务场景、目标用户和预期效果..."
          v-model="funnelData.description"
          maxlength="200"
          rows="3"
        ></textarea>
        <div class="text-xs text-gray-500 mt-1">{{ funnelData.description.length }}/200</div>
      </div>
      
      <!-- 转化阶段配置 -->
      <div class="form-group-compact">
        <label class="form-label-compact flex items-center gap-2">
          <i class="fas fa-layer-group text-blue-600"></i>
          转化阶段配置 <span class="text-red-500">*</span>
          <span class="text-xs text-gray-500 ml-2">({{ funnelData.stages.length }} 个阶段)</span>
        </label>
        <div class="stages-config-enhanced">
          <div class="space-y-2">
            <div v-for="(stage, index) in funnelData.stages" :key="index" class="stage-input-row">
              <div class="stage-number">{{ index + 1 }}</div>
              <input 
                type="text" 
                class="form-input-pathfinder" 
                :placeholder="getStageplaceholder(index)" 
                v-model="stage.name"
                maxlength="30"
              >
              <button 
                class="btn-pathfinder btn-danger-pathfinder px-2 py-1" 
                @click="removeStage(index)"
                :disabled="funnelData.stages.length <= 2"
                :title="funnelData.stages.length <= 2 ? '至少需要2个阶段' : '删除阶段'"
              >
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
          <button class="btn-pathfinder btn-secondary-pathfinder w-full py-2 text-sm mt-3" @click="addStage" :disabled="funnelData.stages.length >= 10">
            <i class="fas fa-plus mr-2"></i>添加阶段 (最多10个)
          </button>
        </div>
      </div>
      
      <!-- 状态（仅编辑模式显示） -->
      <div v-if="isEditMode" class="form-group-compact">
        <label class="form-label-compact">漏斗状态</label>
        <select class="form-input-pathfinder" v-model="funnelData.status">
          <option value="ACTIVE">活跃</option>
          <option value="DRAFT">草稿</option>
          <option value="PAUSED">已暂停</option>
        </select>
      </div>
      
      <!-- 操作按钮 -->
      <div class="mt-6 pt-4 border-t border-gray-200 bg-white sticky bottom-0">
        <div class="flex justify-between items-start">
          <div class="text-xs text-gray-500 flex-1 mr-4">
            <div class="flex items-center mb-1">
              <i class="fas fa-save mr-1"></i>
              {{ isEditMode ? '修改后将自动保存' : '创建后可继续编辑' }}
            </div>
            <!-- 表单验证提示 -->
            <div v-if="!isFormValid" class="text-red-500 text-xs">
              <i class="fas fa-exclamation-circle mr-1"></i>
              请完善漏斗名称和阶段信息
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <router-link to="/funnels" class="btn-pathfinder btn-secondary-pathfinder px-4 py-2 text-sm">
              <i class="fas fa-times mr-1"></i>取消
            </router-link>
            <button 
              class="btn-pathfinder px-4 py-2 text-sm font-medium min-w-[120px]"
              :class="[
                (isSaving || !isFormValid) 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'btn-primary-pathfinder hover:bg-primary-600 focus:ring-2 focus:ring-primary-500'
              ]"
              @click="saveFunnel" 
              :disabled="isSaving || !isFormValid"
            >
              <i :class="isSaving ? 'fas fa-spinner fa-spin' : (isEditMode ? 'fas fa-save' : 'fas fa-plus')" class="mr-1"></i>
              {{ isSaving ? (isEditMode ? '保存中...' : '创建中...') : (isEditMode ? '保存修改' : '创建漏斗') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p class="text-gray-600">加载中...</p>
      </div>
    </div>

    <!-- 通知消息 -->
    <div 
      v-if="notification.show" 
      class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-pathfinder transition-all duration-300"
      :class="{
        'bg-green-500 text-white': notification.type === 'success',
        'bg-blue-500 text-white': notification.type === 'info',
        'bg-red-500 text-white': notification.type === 'error'
      }"
    >
      <div class="flex items-center">
        <i :class="{
          'fas fa-check-circle': notification.type === 'success',
          'fas fa-info-circle': notification.type === 'info',
          'fas fa-exclamation-circle': notification.type === 'error'
        }" class="mr-2"></i>
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { funnelAPI } from '@/api/funnel'

const route = useRoute()
const router = useRouter()

// 计算属性
const isEditMode = computed(() => !!route.params.id)
const funnelId = computed(() => route.params.id as string)

// 响应式数据
const isLoading = ref(false)
const isSaving = ref(false)
const notification = ref({ show: false, message: '', type: 'success' })

// 表单验证
const isFormValid = computed(() => {
  return funnelData.value.name.trim() && 
         funnelData.value.stages.every(stage => stage.name.trim()) &&
         funnelData.value.stages.length >= 2
})

// 漏斗数据
const funnelData = ref({
  name: '',
  description: '',
  businessType: 'sales',
  dataPeriod: 'DAILY',
  status: 'ACTIVE',
  stages: [
    { name: '获取线索' },
    { name: '初步接触' },
    { name: '产品演示' }
  ]
})

// 方法
const selectFrequency = (frequency: string) => {
  funnelData.value.dataPeriod = frequency
}

const addStage = () => {
  if (funnelData.value.stages.length < 10) {
    funnelData.value.stages.push({ name: '' })
  }
}

const removeStage = (index: number) => {
  if (funnelData.value.stages.length > 2) {
    funnelData.value.stages.splice(index, 1)
  }
}

const getStageplaceholder = (index: number) => {
  const placeholders = [
    '获取线索',
    '初步接触', 
    '需求确认',
    '产品演示',
    '方案报价',
    '合同谈判',
    '成交签约',
    '交付使用',
    '续约复购',
    '推荐传播'
  ]
  return placeholders[index] || `阶段${index + 1}`
}


const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 加载漏斗数据（编辑模式）
const loadFunnelData = async () => {
  if (!isEditMode.value) return
  
  try {
    isLoading.value = true
    const response = await funnelAPI.getFunnelById(funnelId.value)
    const funnel = response.data.data
    
    if (funnel) {
      // 填充基本信息
      funnelData.value.name = funnel.name || ''
      funnelData.value.description = funnel.description || ''
      funnelData.value.dataPeriod = funnel.dataPeriod || 'DAILY'
      funnelData.value.status = funnel.status || 'ACTIVE'
      
      // 从 canvasData 中提取阶段信息
      if (funnel.canvasData && funnel.canvasData.nodes) {
        const nodes = typeof funnel.canvasData === 'string' 
          ? JSON.parse(funnel.canvasData).nodes 
          : funnel.canvasData.nodes
          
        if (nodes && Array.isArray(nodes) && nodes.length > 0) {
          // 按位置排序并提取阶段名称
          const sortedNodes = nodes
            .filter(node => node && (node.label || node.name))
            .sort((a, b) => (a.x || 0) - (b.x || 0))
          
          funnelData.value.stages = sortedNodes.map(node => ({
            name: node.label || node.name || '未命名阶段'
          }))
        }
      }
      
      // 推测业务类型
      const name = funnel.name?.toLowerCase() || ''
      const desc = funnel.description?.toLowerCase() || ''
      
      if (name.includes('销售') || name.includes('sale') || desc.includes('销售')) {
        funnelData.value.businessType = 'sales'
      } else if (name.includes('试用') || name.includes('产品') || desc.includes('试用')) {
        funnelData.value.businessType = 'product'
      } else if (name.includes('营销') || name.includes('内容') || desc.includes('营销')) {
        funnelData.value.businessType = 'marketing'
      } else if (name.includes('活动') || name.includes('推广') || desc.includes('活动')) {
        funnelData.value.businessType = 'campaign'
      }
      
      showNotification('漏斗数据加载成功', 'success')
    }
  } catch (error: any) {
    console.error('加载漏斗数据失败:', error)
    showNotification(`加载失败: ${error.message || '未知错误'}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// 保存漏斗
const saveFunnel = async () => {
  // 验证表单
  if (!funnelData.value.name.trim()) {
    showNotification('请输入漏斗名称', 'error')
    return
  }
  
  if (funnelData.value.stages.some(stage => !stage.name.trim())) {
    showNotification('请填写所有阶段名称', 'error')
    return
  }
  
  try {
    isSaving.value = true
    
    // 构建节点数据（用于兼容现有系统）
    const nodes = funnelData.value.stages.map((stage, index) => ({
      id: `node_${index + 1}`,
      name: stage.name,
      label: stage.name,
      type: index === 0 ? 'start' : (index === funnelData.value.stages.length - 1 ? 'conversion' : 'stage'),
      x: 100 + index * 200,
      y: 200,
      width: 140,
      height: 100,
      color: index === 0 ? '#10B981' : (index === funnelData.value.stages.length - 1 ? '#EF4444' : '#3B82F6')
    }))
    
    // 构建连接数据
    const connections = funnelData.value.stages.slice(0, -1).map((_, index) => ({
      id: `conn_${index + 1}`,
      from: `node_${index + 1}`,
      to: `node_${index + 2}`,
      fromAnchor: 'right',
      toAnchor: 'left'
    }))
    
    // 构建保存数据
    const saveData = {
      name: funnelData.value.name,
      description: funnelData.value.description,
      dataPeriod: funnelData.value.dataPeriod,
      canvasData: {
        nodes,
        connections,
        metadata: {
          createdBy: 'simple-editor',
          savedAt: new Date().toISOString()
        }
      }
    }
    
    if (isEditMode.value) {
      // 更新现有漏斗
      await funnelAPI.updateFunnel(funnelId.value, {
        ...saveData,
        status: funnelData.value.status
      })
      showNotification('漏斗更新成功！', 'success')
    } else {
      // 创建新漏斗
      await funnelAPI.createFunnel(saveData)
      showNotification('漏斗创建成功！', 'success')
    }
    
    // 延迟跳转，让用户看到成功消息
    setTimeout(() => {
      // 检查是否从注册流程进入
      const fromOnboarding = sessionStorage.getItem('onboardingReturn')
      console.log('🏗️ StructureFunnelBuilder after save, checking navigation:', {
        fromOnboarding,
        sessionStorageContents: {
          onboardingReturn: sessionStorage.getItem('onboardingReturn'),
          onboardingTemplate: sessionStorage.getItem('onboardingTemplate'),
          onboardingOrgData: sessionStorage.getItem('onboardingOrgData')
        }
      })
      
      if (fromOnboarding) {
        // 从注册流程进入，设置标记并返回注册流程完成
        sessionStorage.setItem('onboardingReturnComplete', 'true')
        sessionStorage.removeItem('onboardingReturn')
        console.log('🏗️ StructureFunnelBuilder navigating back to onboarding with completion flag')
        router.push('/onboarding')
      } else {
        // 直接创建漏斗，跳转到仪表盘
        console.log('🏗️ StructureFunnelBuilder navigating to dashboard')
        router.push('/dashboard')
      }
    }, 1500)
    
  } catch (error: any) {
    console.error('保存失败:', error)
    showNotification(`保存失败: ${error.message || '未知错误'}`, 'error')
  } finally {
    isSaving.value = false
  }
}

// 生命周期
onMounted(async () => {
  // 检查是否有模板数据（从列表页的模板选择来的）
  const templateData = sessionStorage.getItem('funnelTemplate')
  if (templateData && !isEditMode.value) {
    try {
      const template = JSON.parse(templateData)
      funnelData.value.name = template.name || '新漏斗'
      funnelData.value.dataPeriod = template.dataPeriod || 'DAILY'
      
      if (template.nodes && template.nodes.length > 0) {
        const sortedNodes = template.nodes
          .filter(node => node && (node.label || node.name))
          .sort((a, b) => (a.x || 0) - (b.x || 0))
        
        funnelData.value.stages = sortedNodes.map(node => ({
          name: node.label || node.name || '未命名阶段'
        }))
      }
      
      sessionStorage.removeItem('funnelTemplate')
      showNotification('模板数据已加载', 'success')
    } catch (error) {
      console.error('加载模板数据失败:', error)
    }
  }
  
  // 如果是编辑模式，加载现有数据
  if (isEditMode.value) {
    await loadFunnelData()
  }
})
</script>

<style scoped>
/* 使用与 FunnelList.vue 相同的样式类 */

/* 进度指示器 */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step.active .step-circle {
  background: #0052d9;
  color: white;
}

.step.active .step-label {
  color: #0052d9;
  font-weight: 600;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s ease;
}

.step-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.step-line {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px;
}

/* 阶段配置增强样式 */
.stages-config-enhanced {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.stage-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-number {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #0052d9 0%, #366ef4 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

/* 表单样式优化 */
.form-group-compact {
  margin-bottom: 16px;
}

.form-label-compact {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.form-input-pathfinder:focus {
  border-color: #0052d9;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
}

/* 内边距修复 */
.create-funnel-form {
  padding: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-steps {
    padding: 12px 0;
  }
  
  .step-line {
    width: 20px;
  }
  
  .stage-input-row {
    flex-wrap: wrap;
  }
  
  .stage-input-row .form-input-pathfinder {
    flex: 1;
    min-width: 200px;
  }
}
</style>