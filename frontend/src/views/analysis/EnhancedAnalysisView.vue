<template>
  <div class="min-h-screen" :style="{ 
    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    background: '#f8fafe',
    fontSize: '14px',
    color: '#1a1a1a' 
  }">
    <!-- Sidebar toggle is handled by the main Sidebar component -->

    <!-- Main Content -->
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }" 
         :style="{ 
           marginLeft: sidebarCollapsed ? '10px' : '20px', 
           padding: '16px', 
           minHeight: '100vh', 
           transition: 'all 0.3s ease' 
         }">
      <!-- Header Card -->
      <div class="header-card" :style="{
        background: 'white',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px',
        border: '1px solid #dcdcdc',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }">
        <div class="header-title" :style="{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '8px'
        }">
          <i class="fas fa-chart-line" style="margin-right: 12px;"></i>
          报告中心
        </div>
        <div class="header-desc" :style="{
          color: '#6b7280',
          fontSize: '14px'
        }">
          管理和查看您的AI分析报告，跟踪业务优化进展
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" :style="{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '20px'
      }">
        <div class="stat-card" :style="{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }">
          <div class="stat-icon blue" :style="{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '20px',
            background: '#e6f7ff',
            color: '#0052d9'
          }">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-value" :style="{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '4px'
          }">{{ stats.totalReports }}</div>
          <div class="stat-label" :style="{
            fontSize: '13px',
            color: '#6b7280'
          }">总报告数</div>
        </div>
        
        <div class="stat-card" :style="{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }">
          <div class="stat-icon green" :style="{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '20px',
            background: '#f0fdf4',
            color: '#16a34a'
          }">
            <i class="fas fa-calendar-week"></i>
          </div>
          <div class="stat-value" :style="{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '4px'
          }">{{ stats.monthlyNew }}</div>
          <div class="stat-label" :style="{
            fontSize: '13px',
            color: '#6b7280'
          }">本月新增</div>
        </div>
        
        <div class="stat-card" :style="{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }">
          <div class="stat-icon orange" :style="{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '20px',
            background: '#fff7ed',
            color: '#ea580c'
          }">
            <i class="fas fa-trending-up"></i>
          </div>
          <div class="stat-value" :style="{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '4px'
          }">+{{ stats.avgImprovement }}%</div>
          <div class="stat-label" :style="{
            fontSize: '13px',
            color: '#6b7280'
          }">平均改进</div>
        </div>
        
        <div class="stat-card" :style="{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }">
          <div class="stat-icon purple" :style="{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '20px',
            background: '#f3e8ff',
            color: '#9333ea'
          }">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-value" :style="{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '4px'
          }">{{ stats.aiCredits }}</div>
          <div class="stat-label" :style="{
            fontSize: '13px',
            color: '#6b7280'
          }">剩余AI次数</div>
        </div>
      </div>

      <!-- Report Sections -->
      <div class="report-sections" :style="{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px'
      }">
        <!-- Reports List -->
        <div class="reports-list" :style="{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #dcdcdc',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }">
          <div class="section-title" :style="{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }">
            <span>分析报告</span>
            <div style="display: flex; gap: 8px;">
              <button @click="loadReportsData" :style="{
                padding: '6px 12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }">
                <i class="fas fa-refresh" style="margin-right: 4px;"></i>刷新
              </button>
              <button @click="generateNewReport" :style="{
                padding: '6px 12px',
                background: '#0052d9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }">
                <i class="fas fa-plus" style="margin-right: 4px;"></i>新建分析
              </button>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="filter-tabs" :style="{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px'
          }">
            <button
              v-for="filter in filters"
              :key="filter.key"
              @click="activeFilter = filter.key"
              :class="['filter-tab', { active: activeFilter === filter.key }]"
              :style="{
                padding: '8px 16px',
                border: activeFilter === filter.key ? '1px solid #0052d9' : '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeFilter === filter.key ? '#0052d9' : 'white',
                color: activeFilter === filter.key ? 'white' : '#333'
              }"
            >
              {{ filter.label }}
            </button>
          </div>

          <!-- Reports List -->
          <div v-if="loading" class="text-center py-8">
            <div class="inline-flex items-center">
              <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              加载中...
            </div>
          </div>
          
          <div v-else-if="filteredReports.length === 0" class="empty-state" :style="{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280'
          }">
            <div class="empty-icon" :style="{
              fontSize: '48px',
              color: '#d1d5db',
              marginBottom: '16px'
            }">
              <i class="fas fa-file-chart-pie"></i>
            </div>
            <p style="margin-bottom: 8px; font-weight: 500;">暂无AI分析报告</p>
            <p style="font-size: 14px; color: #9ca3af;">请先创建漏斗并生成分析报告，完成第三步分析后报告将显示在这里</p>
            <div style="margin-top: 20px;">
              <router-link to="/funnels" style="
                display: inline-block;
                padding: 8px 16px;
                background: #3b82f6;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
              ">
                <i class="fas fa-plus" style="margin-right: 4px;"></i>创建漏斗
              </router-link>
            </div>
          </div>
          
          <div v-else>
            <div v-for="(funnelReports, funnelName) in groupedReports" :key="funnelName" class="funnel-group" :style="{
              marginBottom: '24px'
            }">
              <!-- Funnel Group Header -->
              <div class="funnel-group-header" :style="{
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }">
                <div :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }">
                  <i :class="getReportIcon(funnelName)" :style="{
                    color: '#64748b',
                    fontSize: '16px'
                  }"></i>
                  <span :style="{
                    fontWeight: '600',
                    color: '#1e293b',
                    fontSize: '14px'
                  }">{{ funnelName }}</span>
                </div>
                <span :style="{
                  fontSize: '12px',
                  color: '#64748b',
                  padding: '2px 8px',
                  background: '#e2e8f0',
                  borderRadius: '12px'
                }">{{ funnelReports.length }} 个报告</span>
              </div>

              <!-- Reports in this funnel -->
              <div
                v-for="report in funnelReports"
                :key="report.id"
                @click="goToReport(report)"
                class="report-item"
                :class="{ current: report.status === 'current' }"
                :style="{
                  padding: '16px',
                  border: report.status === 'current' ? '1px solid #10b981' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: report.status === 'current' ? '#f0fdf4' : 'white'
                }"
              >
                <div class="report-header" :style="{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }">
                  <div>
                    <div class="report-title" :style="{
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '4px'
                    }">{{ report.title }}</div>
                    <div class="report-period" :style="{
                      fontSize: '12px',
                      color: '#0052d9',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }">{{ report.detailedPeriod }}</div>
                    <div class="report-meta" :style="{
                      fontSize: '12px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }">
                      <span class="strategy-badge" :style="{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500',
                        background: report.strategy === '稳健策略' ? '#f0f9ff' : '#fef3c7',
                        color: report.strategy === '稳健策略' ? '#1e40af' : '#92400e'
                      }">{{ report.strategy }}</span>
                      <span>{{ report.analysisDate }}</span>
                    </div>
                  </div>
                  <div class="report-status" 
                       :class="`status-${report.status}`"
                       :style="{
                         padding: '4px 8px',
                         borderRadius: '12px',
                         fontSize: '11px',
                         fontWeight: '500',
                         background: getStatusBackground(report.status),
                         color: getStatusColor(report.status)
                       }"
                  >
                    {{ getStatusLabel(report.status) }}
                  </div>
                </div>
                <div class="report-meta" :style="{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '12px',
                  color: '#6b7280'
                }">
                  <span :style="{
                    padding: '4px 8px',
                    background: report.datasetPeriodStart ? '#e6f7ff' : '#fef3c7',
                    color: report.datasetPeriodStart ? '#0052d9' : '#92400e',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }">
                    <i class="fas fa-database" style="margin-right: 4px;"></i>{{ report.period }}
                  </span>
                  <span>
                    <i class="fas fa-chart-line" style="margin-right: 4px;"></i>{{ report.improvement }}
                  </span>
                  <span>
                    <i class="fas fa-clock" style="margin-right: 4px;"></i>{{ report.analysisDate }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Progress Modal -->
  <div 
    v-if="reportGenerating"
    :style="{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999'
    }"
  >
    <div :style="{
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      minWidth: '400px',
      maxWidth: '500px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }">
      <!-- Progress Header -->
      <div :style="{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px'
      }">
        正在生成报告
      </div>
      
      <div :style="{
        color: '#6b7280',
        marginBottom: '24px',
        fontSize: '14px'
      }">
        请稍候，我们正在为您生成完整的分析报告...
      </div>

      <!-- Progress Bar -->
      <div :style="{
        width: '100%',
        height: '8px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '16px'
      }">
        <div :style="{
          width: reportProgress + '%',
          height: '100%',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }"></div>
      </div>

      <!-- Progress Text -->
      <div :style="{
        fontSize: '14px',
        color: '#4b5563',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }">
        <div class="spinner" :style="{
          width: '16px',
          height: '16px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }"></div>
        <span>{{ reportProgress }}% 完成</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { dashboardAPI } from '@/api/dashboard'
import { analyticsAPI } from '@/api/analytics'
import { aiAnalysisAPI } from '@/api/aiAnalysis'
import { useAuthStore } from '@/stores/auth'

interface AnalysisReport {
  id: string
  title: string
  funnelName: string
  status: 'current' | 'completed' | 'archived'
  createdAt: Date
  period: string
  improvement: string
  type: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  iconBackground: string
  iconColor: string
  action: string
}

// Component setup
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const reportGenerating = ref(false)
const reportProgress = ref(0)
const reports = ref<AnalysisReport[]>([])
const activeFilter = ref('all')
// Sidebar state is managed by the main Sidebar component
const sidebarCollapsed = ref(false)

// Stats data
const stats = ref({
  totalReports: 0,
  monthlyNew: 0,
  avgImprovement: 0,
  aiCredits: 10 // 初始值，将在loadReportsData中更新
})

// Filter options
const filters = [
  { key: 'all', label: '全部' },
  { key: 'current', label: '当前进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'archived', label: '已归档' }
]

// Quick actions
const quickActions: QuickAction[] = [
  {
    id: 'generate',
    title: '生成新报告',
    description: '基于最新数据进行AI分析',
    icon: 'fas fa-brain',
    iconBackground: '#e6f7ff',
    iconColor: '#0052d9',
    action: 'generate'
  },
  {
    id: 'view_current',
    title: '查看当前报告',
    description: '查看正在进行的分析结果',
    icon: 'fas fa-eye',
    iconBackground: '#f0fdf4',
    iconColor: '#16a34a',
    action: 'view_current'
  },
  {
    id: 'export',
    title: '导出报告',
    description: '下载PDF格式的分析报告',
    icon: 'fas fa-download',
    iconBackground: '#fff7ed',
    iconColor: '#ea580c',
    action: 'export'
  },
  {
    id: 'schedule',
    title: '定时报告',
    description: '设置自动生成分析报告',
    icon: 'fas fa-clock',
    iconBackground: '#f3e8ff',
    iconColor: '#9333ea',
    action: 'schedule'
  },
  {
    id: 'settings',
    title: '报告设置',
    description: '自定义报告模板和通知',
    icon: 'fas fa-cog',
    iconBackground: '#f3f4f6',
    iconColor: '#6b7280',
    action: 'settings'
  }
]

// Computed properties
const filteredReports = computed(() => {
  let filtered = reports.value
  if (activeFilter.value !== 'all') {
    filtered = reports.value.filter(report => report.status === activeFilter.value)
  }
  return filtered
})

// 按漏斗分组显示报告
const groupedReports = computed(() => {
  const grouped: { [key: string]: any[] } = {}
  filteredReports.value.forEach(report => {
    if (!grouped[report.funnelName]) {
      grouped[report.funnelName] = []
    }
    grouped[report.funnelName].push(report)
  })
  
  // 按漏斗名称排序，每个漏斗内部按时间倒序
  Object.keys(grouped).forEach(funnelName => {
    grouped[funnelName].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  })
  
  return grouped
})

// Methods
// 验证报告数据的真实性
const validateReportData = (report: any) => {
  // 检查是否有基本的分析内容
  if (!report.content || Object.keys(report.content).length === 0) {
    return false
  }
  
  // 检查是否至少有关键洞察数据
  const hasKeyInsights = report.content.keyInsights && 
    Object.keys(report.content.keyInsights).length > 0
  
  // 检查是否有完整的第三步分析（完整报告）
  const hasCompleteAnalysis = report.content.detailedAnalysis && 
    report.content.detailedAnalysis.length > 0
  
  // 检查是否有策略选择
  const hasStrategy = report.content.selectedStrategy && 
    Object.keys(report.content.selectedStrategy).length > 0
  
  // 至少需要有关键洞察才算有效报告
  return hasKeyInsights && (hasCompleteAnalysis || hasStrategy)
}

// 计算报告的改进数据
const calculateReportImprovement = (report: any) => {
  const content = report.content || {}
  
  // 尝试从多个可能的位置获取改进数据
  if (content.expectedROI?.revenue_impact) {
    return content.expectedROI.revenue_impact
  }
  
  if (content.keyInsights?.teaser_analysis?.expected_roi) {
    return content.keyInsights.teaser_analysis.expected_roi
  }
  
  if (content.selectedStrategy?.expected_roi) {
    return content.selectedStrategy.expected_roi
  }
  
  // 如果没有真实数据，返回明确的未知状态
  return '等待AI分析完成'
}

const loadReportsData = async () => {
  try {
    loading.value = true
    error.value = null
    
    console.log('🔄 重新加载报告数据...')
    
    // Load AI analysis reports from backend
    const reportsResponse = await aiAnalysisAPI.getReports()
    console.log('📊 API响应:', reportsResponse)
    console.log('📊 API返回的报告数据:', JSON.stringify(reportsResponse.data, null, 2))
    
    if (reportsResponse.success && reportsResponse.data && reportsResponse.data.length > 0) {
      // 转换报告数据格式，同时过滤无效报告
      const validReports = reportsResponse.data.filter(validateReportData)
      console.log(`📊 过滤后的有效报告数量: ${validReports.length}/${reportsResponse.data.length}`)
      
      reports.value = validReports.map((report: any) => {
        // 格式化数据集期间
        let period = '数据期间：未指定'
        let detailedPeriod = '未指定数据期间'
        
        if (report.datasetPeriodStart) {
          const periodDate = new Date(report.datasetPeriodStart)
          period = `数据期间：${periodDate.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          })}`
          detailedPeriod = periodDate.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          })
        }
        
        return {
          id: report.id,
          title: `${report.funnelName} - ${report.strategy === 'stable' ? '稳健策略' : '激进策略'}`,
          funnelName: report.funnelName,
          status: 'completed' as const,
          createdAt: new Date(report.createdAt),
          period: period,
          detailedPeriod: detailedPeriod,
          datasetPeriodStart: report.datasetPeriodStart,
          improvement: calculateReportImprovement(report),
          type: report.reportType === 'complete' ? '完整分析' : '策略分析',
          strategy: report.strategy === 'stable' ? '稳健策略' : '激进策略',
          timestamp: new Date(report.createdAt).toLocaleString('zh-CN'),
          analysisDate: `分析时间：${new Date(report.createdAt).toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          })}`
        }
      })
      
      // 按创建时间倒序排列，最新的在前面
      reports.value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      // 更新统计数据
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      
      // 计算实际的平均改进率
      const calculateAvgImprovement = () => {
        if (reports.value.length === 0) return 0
        
        const improvementValues = reports.value
          .map((r: any) => {
            // 提取改进数据中的数值
            const improvementStr = r.improvement || '0%'
            const match = improvementStr.match(/(\d+(?:\.\d+)?)/)
            return match ? parseFloat(match[1]) : 0
          })
          .filter(val => val > 0)
        
        if (improvementValues.length === 0) return 0
        return Math.round(improvementValues.reduce((sum, val) => sum + val, 0) / improvementValues.length)
      }
      
      stats.value = {
        totalReports: reports.value.length,
        monthlyNew: reports.value.filter((r: any) => new Date(r.createdAt) > monthAgo).length,
        avgImprovement: calculateAvgImprovement(),
        aiCredits: authStore.user?.analysisQuota || 10 // 从用户信息获取
      }
    } else {
      // 如果没有报告，显示空状态
      reports.value = []
      stats.value = {
        totalReports: 0,
        monthlyNew: 0,
        avgImprovement: 0,
        aiCredits: authStore.user?.analysisQuota || 10
      }
    }
    
  } catch (err) {
    console.error('Failed to load reports data:', err)
    error.value = err instanceof Error ? err.message : '加载报告数据失败'
    
    // 错误时设置空状态
    reports.value = []
    stats.value = {
      totalReports: 0,
      monthlyNew: 0,
      avgImprovement: 0,
      aiCredits: authStore.user?.analysisQuota || 10
    }
  } finally {
    loading.value = false
  }
}

const generateNewReport = () => {
  router.push('/dashboard')
}

const goToReport = (report: AnalysisReport) => {
  // 直接跳转到报告页面，无需进度条和延迟
  router.push(`/analysis/report/${report.id}`)
}

const handleQuickAction = (action: QuickAction) => {
  switch (action.action) {
    case 'generate':
      generateNewReport()
      break
    case 'view_current':
      const currentReport = reports.value.find(r => r.status === 'current')
      if (currentReport) {
        goToReport(currentReport)
      } else {
        // If no current report, go to AI reports page to see all reports
        router.push('/ai/reports')
      }
      break
    case 'export':
      alert('导出功能开发中...\n\n将支持导出为PDF、Excel等格式')
      break
    case 'schedule':
      alert('定时报告功能开发中...\n\n将支持设置每周/每月自动生成报告')
      break
    case 'settings':
      router.push('/settings')
      break
  }
}

// Helper methods
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// 完全符合模板的报告生成函数
const generateTemplateCompliantReportHTML = (report: any) => {
  const content = report.content || {}
  const funnelData = content.funnelData || {}
  const companyInfo = content.companyInfo || {}
  const keyInsights = content.keyInsights || {}
  const selectedStrategy = content.selectedStrategy || {}
  const detailedAnalysis = content.detailedAnalysis || ''
  const stages = funnelData.stages || funnelData.steps || []
  
  console.log('📊 生成符合模板的报告HTML，原始数据:', JSON.stringify(content, null, 2))
  
  // 计算关键指标
  const healthScore = calculateHealthScore(content)
  const healthScoreDeg = Math.round((healthScore / 100) * 360)
  
  const headerTitle = funnelData.funnel_name || funnelData.name || report.funnelName || '客户漏斗分析报告'
  
  // 计算转化率
  const bottleneckRate = getBottleneckConversionRate(stages)
  const advantageRate = getHighestConversionRate(stages)
  
  // 从完整模板复制的HTML结构
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: #f5f5f7;
            color: #1d1d1f;
            line-height: 1.47059;
            padding: 40px 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 18px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .header {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #1d1d1f;
            padding: 60px 40px;
            text-align: center;
            position: relative;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
            color: #1d1d1f;
        }

        .header p {
            font-size: 1.125rem;
            color: #6e6e73;
            font-weight: 400;
            letter-spacing: -0.01em;
        }

        .section {
            padding: 60px 50px;
            position: relative;
        }
        
        .section::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent);
        }
        
        .section:last-child::after {
            display: none;
        }

        .section-title {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 40px;
            position: relative;
            padding-left: 20px;
            letter-spacing: -0.015em;
            color: #1d1d1f;
        }

        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 3px;
            height: 100%;
            background: #3b82f6;
            border-radius: 2px;
        }

        /* Executive Summary Styles */
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 40px;
        }

        .summary-card {
            padding: 32px;
            border-radius: 20px;
            position: relative;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
        }
        
        .summary-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.03), 0 20px 40px rgba(0, 0, 0, 0.08), 0 40px 80px rgba(0, 0, 0, 0.12);
            background: rgba(255, 255, 255, 0.85);
        }

        .summary-card.health {
            background: #ffffff;
            border-left: 3px solid #3b82f6;
        }

        .summary-card.bottleneck {
            background: #ffffff;
            border-left: 3px solid #f59e0b;
        }

        .summary-card.growth {
            background: #ffffff;
            border-left: 3px solid #98FB98;
        }

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
        }

        .card-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.04);
        }

        .card-icon.health {
            background: #3b82f6;
            color: white;
        }

        .card-icon.bottleneck {
            background: #f59e0b;
            color: white;
        }

        .card-icon.growth {
            background: #98FB98;
            color: white;
        }

        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: -0.01em;
        }

        .progress-circle {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 24px auto;
            position: relative;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
            background: conic-gradient(#3b82f6 0deg ${healthScoreDeg}deg, #f3f4f6 ${healthScoreDeg}deg 360deg);
        }

        .progress-inner {
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .progress-value {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1d1d1f;
            letter-spacing: -0.01em;
        }

        .progress-label {
            font-size: 0.875rem;
            color: #6e6e73;
            font-weight: 400;
        }

        .card-content {
            margin-top: 20px;
        }

        .card-content li {
            margin: 10px 0;
            list-style: none;
            position: relative;
            padding-left: 20px;
        }

        .card-content li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #9ca3af;
            font-weight: normal;
        }

        .action-button {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 20px;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(59, 130, 246, 0.15);
            font-size: 14px;
        }
        
        .action-button:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1), 0 15px 30px rgba(59, 130, 246, 0.25);
        }

        .action-button.growth {
            background: linear-gradient(135deg, #98FB98, #90EE90);
        }
        
        .action-button.growth:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1), 0 15px 30px rgba(152, 251, 152, 0.25);
        }

        /* Funnel Styles */
        .funnel-container {
            text-align: center;
            margin-bottom: 50px;
        }

        .funnel-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 36px;
            letter-spacing: -0.012em;
        }

        .funnel-steps {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1000px;
            margin: 0 auto 40px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .funnel-step {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            padding: 24px 28px;
            border-radius: 16px;
            text-align: center;
            position: relative;
            min-width: 150px;
            height: 90px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(99, 102, 241, 0.15);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .funnel-step:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(99, 102, 241, 0.25);
        }

        .step-label {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .step-value {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .funnel-arrow {
            font-size: 1.2rem;
            color: #6b7280;
            margin: 0 10px;
        }

        /* Industry Analysis Styles */
        .industry-grid {
            display: grid;
            grid-template-columns: 0.7fr 1.3fr;
            gap: 40px;
            margin-bottom: 40px;
            align-items: start;
        }

        .industry-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 32px;
            border-radius: 18px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: 1px solid rgba(255, 255, 255, 0.25);
        }
        
        .industry-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.03), 0 20px 40px rgba(0, 0, 0, 0.08);
            background: rgba(255, 255, 255, 0.85);
        }

        .industry-card h3 {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .industry-card h3::before {
            content: '🎯';
            margin-right: 10px;
        }

        .industry-card:last-child h3::before {
            content: '💡';
        }

        .insights-box {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 16px;
            padding: 28px;
            margin-top: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
            border-left: 4px solid #6366f1;
        }

        .insights-box p {
            color: #4682B4;
            line-height: 1.7;
        }

        @media (max-width: 768px) {
            .container {
                margin: 16px;
                border-radius: 12px;
            }
            
            .section {
                padding: 32px 20px;
            }
            
            .summary-cards {
                grid-template-columns: 1fr;
            }
            
            .funnel-steps {
                flex-direction: column;
                gap: 20px;
            }
            
            .industry-grid {
                grid-template-columns: 1fr;
            }
            
            .funnel-arrow {
                transform: rotate(90deg);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>${headerTitle}</h1>
            <p>数据驱动的业务增长洞察与优化建议</p>
        </div>

        <!-- Section 1: Executive Summary -->
        <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
            <h2 class="section-title">📊 执行摘要</h2>
            
            <div class="summary-cards">
                <div class="summary-card health">
                    <div class="card-header">
                        <div class="card-icon health">📊</div>
                        <h3 class="card-title">健康度分析</h3>
                    </div>
                    
                    <div class="progress-circle health">
                        <div class="progress-inner">
                            <div class="progress-value">${healthScore}%</div>
                            <div class="progress-label">健康度</div>
                        </div>
                    </div>
                    
                    <ul class="card-content">
                        <li>整体转化表现${healthScore > 70 ? '良好' : '需要改进'}，综合评分${healthScore}分</li>
                        <li>数据完整性${stages.length > 0 ? '完整' : '不足'}，共${stages.length}个分析阶段</li>
                    </ul>
                </div>

                <div class="summary-card bottleneck">
                    <div class="card-header">
                        <div class="card-icon bottleneck">🔍</div>
                        <h3 class="card-title">核心瓶颈分析</h3>
                    </div>
                    
                    <div class="card-content">
                        <p style="margin-bottom: 15px;">${keyInsights.key_insight?.bottleneck_stage || keyInsights.bottleneck_stage || keyInsights.main_bottleneck || '等待AI分析完成'}，转化率${bottleneckRate}%</p>
                        <ul>
                            <li>${keyInsights.key_insight?.conversion_issue || keyInsights.teaser_analysis?.core_problem || keyInsights.core_issue || '等待AI分析完成'}</li>
                            <li>${keyInsights.key_insight?.quick_suggestion || keyInsights.teaser_analysis?.quick_advice || keyInsights.primary_suggestion || '等待AI分析完成'}</li>
                            <li>${keyInsights.key_insight?.potential_impact || keyInsights.impact_assessment || '等待AI分析完成'}</li>
                        </ul>
                        <button class="action-button">流程优化</button>
                    </div>
                </div>

                <div class="summary-card growth">
                    <div class="card-header">
                        <div class="card-icon growth">📈</div>
                        <h3 class="card-title">最大增长机会</h3>
                    </div>
                    
                    <div class="card-content">
                        <p style="margin-bottom: 15px;">${selectedStrategy?.conversion_improvement || keyInsights.teaser_analysis?.conversion_improvement || '等待AI分析完成'}，ROI预期${selectedStrategy?.expected_roi || keyInsights.teaser_analysis?.expected_roi || keyInsights.roi_estimate || '等待AI分析完成'}</p>
                        <ul>
                            <li><strong>策略特点：</strong>${selectedStrategy?.features || selectedStrategy?.tag || selectedStrategy?.description || '等待AI分析完成'}</li>
                            <li><strong>核心行动：</strong>${selectedStrategy?.core_actions || selectedStrategy?.actions || selectedStrategy?.steps || '等待AI分析完成'}</li>
                            <li><strong>投资水平：</strong>${selectedStrategy?.investment || selectedStrategy?.cost || selectedStrategy?.budget || '等待AI分析完成'}</li>
                        </ul>
                        <button class="action-button growth">优化空间</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2: Funnel Analysis -->
        <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
            <h2 class="section-title">🔍 核心分析</h2>
            
            <div class="funnel-container">
                <h3 class="funnel-title">${funnelData.funnel_name || '业务增长漏斗'}</h3>
                
                <div class="funnel-steps">
                    ${generateFunnelStepsHTML(stages)}
                </div>
            </div>
        </div>

        <!-- Section 3: Industry Analysis -->
        <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
            <h2 class="section-title">📈 行业分析</h2>
            
            <div class="industry-grid">
                <div class="industry-card" style="background: rgba(255, 255, 255, 0.85); padding: 36px;">
                    <h3>公司信息</h3>
                    <div style="margin-bottom: 24px;">
                        <p style="margin-bottom: 12px; font-weight: 600; font-size: 1.1rem;">${companyInfo.company_name || companyInfo.name || '分析对象'}</p>
                        <p style="margin-bottom: 8px; color: #666;"><strong>行业：</strong>${companyInfo.industry || companyInfo.sector || '未指定'}</p>
                        <p style="margin-bottom: 8px; color: #666;"><strong>地区：</strong>${companyInfo.city || companyInfo.location || companyInfo.region || '未指定'}</p>
                        <p style="margin-bottom: 8px; color: #666;"><strong>团队规模：</strong>${companyInfo.team_size || companyInfo.employees || '未指定'}</p>
                        <p style="margin-bottom: 8px; color: #666;"><strong>销售模式：</strong>${companyInfo.sales_model || companyInfo.business_model || 'B2B'}</p>
                    </div>
                    
                    <div class="insights-box">
                        <p><strong>公司描述：</strong>${companyInfo.company_description || companyInfo.description || '暂无描述'}</p>
                    </div>
                    
                    <div class="insights-box">
                        <p><strong>ROI预期：</strong>${keyInsights.teaser_analysis?.expected_roi || selectedStrategy?.expected_roi || keyInsights.roi_estimate || '等待AI分析完成'}</p>
                    </div>
                </div>

                <div class="industry-card">
                    <h3>优化建议与执行策略</h3>
                    <p style="margin-bottom: 20px; font-weight: 600;">基于${report.strategy === 'stable' ? '稳健' : '激进'}策略的核心建议：</p>
                    <div style="background: rgba(59, 130, 246, 0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #1d1d1f;">执行重点：</h4>
                        <div style="font-size: 0.95rem; line-height: 1.6;">
                            ${detailedAnalysis ? detailedAnalysis.slice(0, 500) + (detailedAnalysis.length > 500 ? '...' : '') : '详细分析报告生成中...'}
                        </div>
                    </div>
                    
                    <div style="background: rgba(152, 251, 152, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #98FB98;">
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #1d1d1f;">关键指标预期：</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 12px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #98FB98;">✓</span> 转化率提升：${selectedStrategy?.conversion_improvement || keyInsights.conversion_improvement || '等待AI分析完成'}</li>
                            <li style="margin-bottom: 12px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #98FB98;">✓</span> 预期ROI：${selectedStrategy?.expected_roi || keyInsights.teaser_analysis?.expected_roi || '等待AI分析完成'}</li>
                            <li style="margin-bottom: 12px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #98FB98;">✓</span> 实施周期：${selectedStrategy?.timeline || '等待AI分析完成'}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: rgba(59, 130, 246, 0.05); border-radius: 12px;">
                <p style="color: #4682B4; font-weight: 500;">
                    数据周期: ${funnelData.time_period || '未指定'} | 分析策略: ${report.strategy === 'stable' ? '稳健优化' : '激进增长'} | 生成时间: ${new Date().toLocaleString('zh-CN')}
                </p>
            </div>
        </div>
    </div>
</body>
</html>`
}

const generateFullReportHTML = (report: any) => {
  const content = report.content || {}
  console.log('📊 生成完整报告HTML，原始数据:', JSON.stringify(content, null, 2))
  
  // 根据后端实际数据结构获取数据
  const funnelData = content.funnelData || {}
  const companyInfo = content.companyInfo || {}
  const keyInsights = content.keyInsights || {}
  const selectedStrategy = content.selectedStrategy || {}
  const detailedAnalysis = content.detailedAnalysis || ''
  const recommendations = content.recommendations || []
  const nextSteps = content.nextSteps || []
  
  // 添加更多调试信息
  console.log('🔍 关键数据字段详细检查:')
  console.log('  报告策略:', report.strategy)
  console.log('  funnelData keys:', Object.keys(funnelData))
  console.log('  companyInfo keys:', Object.keys(companyInfo))  
  console.log('  keyInsights keys:', Object.keys(keyInsights))
  console.log('  selectedStrategy keys:', Object.keys(selectedStrategy))
  console.log('  detailedAnalysis type:', typeof detailedAnalysis, 'length:', detailedAnalysis.length)
  console.log('  recommendations length:', recommendations.length)
  console.log('  nextSteps length:', nextSteps.length)
  
  // 尝试从多个可能的位置获取漏斗名称
  const headerTitle = funnelData.funnel_name || funnelData.name || report.funnelName || '客户漏斗分析报告'
  const headerSubtitle = `数据驱动的业务增长洞察与优化建议 - ${new Date(report.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`
  
  const healthScore = calculateHealthScore(content)
  const healthScoreDeg = Math.round((healthScore / 100) * 360)
  
  // 调试健康评分
  console.log('🏥 健康评分计算:', healthScore, '度数:', healthScoreDeg)
  
  // 获取漏斗数据用于计算转化率
  const stages = funnelData.stages || funnelData.steps || []
  const stageMetrics = calculateStageMetrics(stages)
  
  // 获取关键瓶颈信息
  const bottleneckStage = keyInsights.key_insight?.bottleneck_stage || keyInsights.bottleneck_stage || keyInsights.main_bottleneck || '待分析阶段'
  const bottleneckRate = getBottleneckConversionRate(stages)
  
  // 获取优势环节信息  
  const advantageStage = getBestPerformingStage(stages)
  const advantageRate = getHighestConversionRate(stages)
  
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headerTitle} - AI分析报告</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
                background: #f5f5f7;
                color: #1d1d1f;
                line-height: 1.47059;
                padding: 40px 20px;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            .container {
                max-width: 1400px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 18px;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.06);
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.18);
            }

            .header {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                color: #1d1d1f;
                padding: 60px 40px;
                text-align: center;
                position: relative;
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            }
            
            .header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
            }

            .header h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 12px;
                letter-spacing: -0.025em;
                color: #1d1d1f;
            }

            .header p {
                font-size: 1.125rem;
                color: #6e6e73;
                font-weight: 400;
                letter-spacing: -0.01em;
            }

            .section {
                padding: 60px 50px;
                position: relative;
            }
            
            .section::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent);
            }
            
            .section:last-child::after {
                display: none;
            }

            .section-title {
                font-size: 1.75rem;
                font-weight: 600;
                margin-bottom: 40px;
                position: relative;
                padding-left: 20px;
                letter-spacing: -0.015em;
                color: #1d1d1f;
            }

            .section-title::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                width: 3px;
                height: 100%;
                background: #3b82f6;
                border-radius: 2px;
            }

            .summary-cards {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
                margin-bottom: 40px;
            }

            .summary-card {
                padding: 32px;
                border-radius: 20px;
                position: relative;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
            }
            
            .summary-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.03), 0 20px 40px rgba(0, 0, 0, 0.08), 0 40px 80px rgba(0, 0, 0, 0.12);
                background: rgba(255, 255, 255, 0.85);
            }

            .summary-card.health {
                background: #ffffff;
                border-left: 3px solid #3b82f6;
            }

            .summary-card.bottleneck {
                background: #ffffff;
                border-left: 3px solid #f59e0b;
            }

            .summary-card.growth {
                background: #ffffff;
                border-left: 3px solid #98FB98;
            }

            .card-header {
                display: flex;
                align-items: center;
                margin-bottom: 25px;
            }

            .card-icon {
                width: 52px;
                height: 52px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 24px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.04);
            }

            .card-icon.health {
                background: #3b82f6;
                color: white;
            }

            .card-icon.bottleneck {
                background: #f59e0b;
                color: white;
            }

            .card-icon.growth {
                background: #98FB98;
                color: white;
            }

            .card-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1d1d1f;
                letter-spacing: -0.01em;
            }

            .progress-circle {
                width: 130px;
                height: 130px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 24px auto;
                position: relative;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
                background: conic-gradient(#3b82f6 0deg ${healthScoreDeg}deg, #f3f4f6 ${healthScoreDeg}deg 360deg);
            }

            .progress-inner {
                width: 100px;
                height: 100px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
            }

            .progress-value {
                font-size: 1.4rem;
                font-weight: 700;
                color: #1d1d1f;
                letter-spacing: -0.01em;
            }

            .progress-label {
                font-size: 0.875rem;
                color: #6e6e73;
                font-weight: 400;
            }

            .card-content {
                margin-top: 20px;
            }

            .card-content li {
                margin: 10px 0;
                list-style: none;
                position: relative;
                padding-left: 20px;
            }

            .card-content li::before {
                content: '•';
                position: absolute;
                left: 0;
                color: #9ca3af;
                font-weight: normal;
            }

            .action-button {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 12px;
                font-weight: 500;
                cursor: pointer;
                margin-top: 20px;
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(59, 130, 246, 0.15);
                font-size: 14px;
            }
            
            .action-button:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1), 0 15px 30px rgba(59, 130, 246, 0.25);
            }

            .action-button.growth {
                background: linear-gradient(135deg, #98FB98, #90EE90);
            }
            
            .action-button.growth:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1), 0 15px 30px rgba(152, 251, 152, 0.25);
            }

            .funnel-container {
                text-align: center;
                margin-bottom: 50px;
            }

            .funnel-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: #1d1d1f;
                margin-bottom: 36px;
                letter-spacing: -0.012em;
            }

            .funnel-steps {
                display: flex;
                justify-content: center;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto 40px;
                flex-wrap: nowrap;
                gap: 8px;
                overflow-x: auto;
                padding: 10px 0;
            }

            .funnel-step {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                padding: 20px 16px;
                border-radius: 16px;
                text-align: center;
                position: relative;
                min-width: 120px;
                max-width: 200px;
                flex: 1;
                height: 90px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(99, 102, 241, 0.15);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .funnel-step:hover {
                transform: translateY(-6px) scale(1.02);
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(99, 102, 241, 0.25);
            }

            .step-label {
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 5px;
            }

            .step-value {
                font-size: 1.5rem;
                font-weight: 700;
            }

            .funnel-arrow {
                font-size: 1.2rem;
                color: #6b7280;
                margin: 0 5px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 20px;
            }

            .analysis-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 50px;
            }

            .analysis-card {
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                padding: 32px;
                border-radius: 18px;
                border-left: 4px solid #10b981;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.25);
            }
            
            .analysis-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.03), 0 20px 40px rgba(0, 0, 0, 0.08);
                background: rgba(255, 255, 255, 0.85);
            }

            .analysis-card.bottleneck {
                border-left-color: #f59e0b;
                background: #ffffff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            }
            
            .analysis-card.bottleneck:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .analysis-card h3 {
                font-size: 1.3rem;
                font-weight: 600;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            }

            .analysis-card h3::before {
                content: '👍';
                margin-right: 10px;
            }

            .analysis-card.bottleneck h3::before {
                content: '⚠️';
            }

            .highlight-text {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 15px;
            }

            .highlight-text .percentage {
                color: #98FB98;
                font-weight: 700;
            }

            .highlight-text.bottleneck .percentage {
                color: #FFB6C1;
            }

            .industry-grid {
                display: grid;
                grid-template-columns: 0.7fr 1.3fr;
                gap: 40px;
                margin-bottom: 40px;
                align-items: start;
            }

            .industry-card {
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                padding: 32px;
                border-radius: 18px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.25);
            }
            
            .industry-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.03), 0 20px 40px rgba(0, 0, 0, 0.08);
                background: rgba(255, 255, 255, 0.85);
            }

            .industry-card h3 {
                font-size: 1.3rem;
                font-weight: 600;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            }

            .industry-card h3::before {
                content: '🎯';
                margin-right: 10px;
            }

            .industry-card:last-child h3::before {
                content: '💡';
            }

            .industry-list {
                list-style: none;
            }

            .industry-list li {
                margin: 15px 0;
                padding-left: 20px;
                position: relative;
            }

            .industry-list li::before {
                content: '•';
                position: absolute;
                left: 0;
                color: #9ca3af;
                font-weight: normal;
            }

            .insights-box {
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 16px;
                padding: 28px;
                margin-top: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
                border-left: 4px solid #6366f1;
            }

            .insights-box p {
                color: #4682B4;
                line-height: 1.7;
            }

            @media (max-width: 768px) {
                .container {
                    margin: 16px;
                    border-radius: 12px;
                }
                
                .section {
                    padding: 32px 20px;
                }
                
                .summary-cards {
                    grid-template-columns: 1fr;
                }
                
                .funnel-steps {
                    gap: 4px;
                    max-width: 100%;
                    overflow-x: auto;
                    padding: 10px 5px;
                }
                
                .funnel-step {
                    min-width: 100px;
                    max-width: 150px;
                    padding: 16px 12px;
                    font-size: 0.9rem;
                }
                
                .funnel-arrow {
                    margin: 0 2px;
                    font-size: 1rem;
                }
                
                .analysis-grid,
                .industry-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>${headerTitle}</h1>
                <p>${headerSubtitle}</p>
            </div>

            <!-- Section 1: Executive Summary -->
            <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
                <h2 class="section-title">📊 执行摘要</h2>
                
                <div class="summary-cards">
                    <div class="summary-card health">
                        <div class="card-header">
                            <div class="card-icon health">📊</div>
                            <h3 class="card-title">健康度分析</h3>
                        </div>
                        
                        <div class="progress-circle health">
                            <div class="progress-inner">
                                <div class="progress-value">${healthScore}%</div>
                                <div class="progress-label">健康度</div>
                            </div>
                        </div>
                        
                        <ul class="card-content">
                            <li>整体转化表现：${healthScore > 70 ? '良好' : '需要改进'}（${healthScore}分）</li>
                            <li>数据完整性：${(funnelData.stages?.length || funnelData.steps?.length) > 0 ? `完整（${funnelData.stages?.length || funnelData.steps?.length}个阶段）` : '数据不足'}</li>
                            <li>分析深度：${detailedAnalysis ? `详细（${Math.floor(detailedAnalysis.length / 100)}k字）` : '基础分析'}</li>
                            <li>策略类型：${report.strategy === 'stable' ? '稳健型' : '激进型'}优化方案</li>
                        </ul>
                    </div>

                    <div class="summary-card bottleneck">
                        <div class="card-header">
                            <div class="card-icon bottleneck">🔍</div>
                            <h3 class="card-title">瓶颈分析</h3>
                        </div>
                        
                        <div class="card-content">
                            <p style="margin-bottom: 15px; font-weight: 600;">关键瓶颈：${keyInsights.key_insight?.bottleneck_stage || keyInsights.bottleneck_stage || keyInsights.main_bottleneck || '等待AI分析完成'}</p>
                            <ul>
                                <li><strong>核心问题：</strong>${keyInsights.key_insight?.conversion_issue || keyInsights.teaser_analysis?.core_problem || keyInsights.core_issue || keyInsights.main_issue || '等待AI分析完成'}</li>
                                <li><strong>改进建议：</strong>${keyInsights.key_insight?.quick_suggestion || keyInsights.teaser_analysis?.quick_advice || keyInsights.primary_suggestion || keyInsights.quick_fix || '等待AI分析完成'}</li>
                                <li><strong>影响评估：</strong>${keyInsights.key_insight?.potential_impact || keyInsights.impact_assessment || keyInsights.expected_improvement || '等待AI分析完成'}</li>
                            </ul>
                            <button class="action-button">立即优化</button>
                        </div>
                    </div>

                    <div class="summary-card growth">
                        <div class="card-header">
                            <div class="card-icon growth">📈</div>
                            <h3 class="card-title">增长机会</h3>
                        </div>
                        
                        <div class="card-content">
                            <p style="margin-bottom: 15px; font-weight: 600;">增长预期：${keyInsights.key_insight?.potential_impact || keyInsights.teaser_analysis?.expected_roi || keyInsights.growth_potential || keyInsights.roi_prediction || '等待AI分析完成'}</p>
                            <ul>
                                <li><strong>策略特点：</strong>${selectedStrategy?.features || selectedStrategy?.tag || selectedStrategy?.description || '等待AI分析完成'}</li>
                                <li><strong>核心行动：</strong>${selectedStrategy?.core_actions || selectedStrategy?.actions || selectedStrategy?.steps || '等待AI分析完成'}</li>
                                <li><strong>投资水平：</strong>${selectedStrategy?.investment || selectedStrategy?.cost || selectedStrategy?.budget || '等待AI分析完成'}</li>
                                <li><strong>预期收益：</strong>${selectedStrategy?.expected_roi || keyInsights.teaser_analysis?.expected_roi || keyInsights.roi_estimate || '等待AI分析完成'}</li>
                            </ul>
                            <button class="action-button growth">开始执行</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 2: Funnel Analysis -->
            <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
                <h2 class="section-title">🔍 核心分析</h2>
                
                <div class="funnel-container">
                    <h3 class="funnel-title">${funnelData.funnel_name || '漏斗分析'}</h3>
                    
                    <div class="funnel-steps">
                        ${generateFunnelStepsHTML(funnelData.stages || funnelData.steps || [])}
                    </div>
                </div>

                <div class="analysis-grid">
                    <div class="analysis-card">
                        <h3>优势分析</h3>
                        <p class="highlight-text">${keyInsights.key_insight?.summary || '等待AI分析完成'}</p>
                        <p>${detailedAnalysis ? detailedAnalysis.slice(0, 200) + '...' : '等待AI分析完成'}</p>
                        <div style="margin-top: 15px;">
                            <h4 style="font-size: 1.1rem; margin-bottom: 10px;">改进建议：</h4>
                            <ul style="list-style: disc; padding-left: 20px;">
                                ${recommendations.slice(0, 3).map(rec => `<li style="margin: 5px 0;">${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="analysis-card bottleneck">
                        <h3>瓶颈分析</h3>
                        <p class="highlight-text bottleneck">${keyInsights.teaser_analysis?.core_problem || '等待AI分析完成'}</p>
                        <p>${keyInsights.teaser_analysis?.quick_advice || '等待AI分析完成'}</p>
                        <div style="margin-top: 15px;">
                            <h4 style="font-size: 1.1rem; margin-bottom: 10px;">下一步行动：</h4>
                            <ul style="list-style: disc; padding-left: 20px;">
                                ${nextSteps.slice(0, 3).map(step => `<li style="margin: 5px 0;">${step}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 3: Industry Analysis -->
            <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
                <h2 class="section-title">📈 行业分析</h2>
                
                <div class="industry-grid">
                    <div class="industry-card" style="background: rgba(255, 255, 255, 0.85); padding: 36px;">
                        <h3>公司信息</h3>
                        <div style="margin-bottom: 24px;">
                            <p style="margin-bottom: 12px; font-weight: 600; font-size: 1.1rem;">${companyInfo.company_name || companyInfo.name || '未知公司'}</p>
                            <p style="margin-bottom: 8px; color: #666;"><strong>行业：</strong>${companyInfo.industry || companyInfo.sector || '通用'}</p>
                            <p style="margin-bottom: 8px; color: #666;"><strong>地区：</strong>${companyInfo.city || companyInfo.location || companyInfo.region || '未知'}</p>
                            <p style="margin-bottom: 8px; color: #666;"><strong>团队规模：</strong>${companyInfo.team_size || companyInfo.employees || '1-10'}</p>
                            <p style="margin-bottom: 8px; color: #666;"><strong>销售模式：</strong>${companyInfo.sales_model || companyInfo.business_model || 'B2B'}</p>
                        </div>
                        
                        <div class="insights-box">
                            <p><strong>公司描述：</strong>${companyInfo.company_description || '暂无描述'}</p>
                        </div>
                    </div>

                    <div class="industry-card">
                        <h3>策略详情</h3>
                        <div style="margin-bottom: 20px;">
                            <p style="margin-bottom: 12px; font-weight: 600; font-size: 1.1rem;">${selectedStrategy.title || '策略分析'}</p>
                            <p style="margin-bottom: 8px;"><strong>标签：</strong>${selectedStrategy.tag || '待定'}</p>
                            <p style="margin-bottom: 8px;"><strong>特点：</strong>${selectedStrategy.features || '等待AI分析完成'}</p>
                            <p style="margin-bottom: 8px;"><strong>核心行动：</strong>${selectedStrategy.core_actions || '等待AI分析完成'}</p>
                            <p style="margin-bottom: 8px;"><strong>投资要求：</strong>${selectedStrategy.investment || '等待AI分析完成'}</p>
                        </div>
                        
                        <div class="insights-box">
                            <p><strong>ROI预期：</strong>${keyInsights.teaser_analysis?.expected_roi || '等待AI分析完成'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 4: Detailed Analysis Report -->
            ${false ? `
            <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
                <h2 class="section-title">📋 详细分析报告</h2>
                
                <div style="background: rgba(255, 255, 255, 0.9); padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px;">
                    <div style="white-space: pre-wrap; line-height: 1.7; color: #333; font-size: 15px;">
                        ${detailedAnalysis.replace(/\n/g, '<br>')}
                    </div>
                </div>

                ${recommendations.length > 0 ? `
                <div style="background: rgba(255, 255, 255, 0.9); padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px; border-left: 4px solid #10b981;">
                    <h3 style="margin-bottom: 20px; color: #1d1d1f; font-size: 1.3rem;">💡 改进建议</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${recommendations.map((rec, index) => `
                            <li style="margin-bottom: 15px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
                                <strong style="color: #065f46;">${index + 1}.</strong> ${rec}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}

                ${nextSteps.length > 0 ? `
                <div style="background: rgba(255, 255, 255, 0.9); padding: 30px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;">
                    <h3 style="margin-bottom: 20px; color: #1d1d1f; font-size: 1.3rem;">🎯 下一步行动计划</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${nextSteps.map((step, index) => `
                            <li style="margin-bottom: 15px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 3px solid #3b82f6;">
                                <strong style="color: #1e40af;">步骤 ${index + 1}:</strong> ${step}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ` : ''}

            <!-- Footer -->
            <div style="background: rgba(255, 255, 255, 0.95); padding: 30px; text-align: center; border-top: 1px solid rgba(0,0,0,0.1);">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    本报告由 Pathfinder AI 分析系统生成 | 生成时间: ${new Date().toLocaleString('zh-CN')}
                </p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 5px;">
                    数据周期: ${funnelData.time_period || '未指定'} | 分析策略: ${report.strategy === 'stable' ? '稳健优化' : '激进增长'}
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

const generateFunnelStepsHTML = (stages: any[]) => {
  if (!stages || stages.length === 0) {
    return '<div class="funnel-step"><div class="step-label">暂无数据</div></div>'
  }

  return stages.map((stage, index) => {
    const arrow = index < stages.length - 1 ? '<div class="funnel-arrow">→</div>' : ''
    
    // 尝试不同的字段名来获取数值
    const currentValue = stage.current_value || stage.value || stage.count || stage.amount || 0
    const nextValue = stages[index + 1] ? (stages[index + 1].current_value || stages[index + 1].value || stages[index + 1].count || stages[index + 1].amount) : 0
    
    const conversionRate = index < stages.length - 1 && nextValue && currentValue > 0 ? 
      Math.round((nextValue / currentValue) * 100) : 100
    
    // 尝试不同的字段名来获取阶段名称
    const stageName = stage.stage_name || stage.name || stage.label || stage.title || `阶段 ${index + 1}`
    
    return `
      <div class="funnel-step" ${index === 0 ? 'style="background: linear-gradient(135deg, #10b981, #059669);"' : ''}>
        <div class="step-label">${stageName}</div>
        <div class="step-value">${currentValue?.toLocaleString?.() || currentValue}</div>
        ${index < stages.length - 1 ? `<div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">${conversionRate}%</div>` : ''}
      </div>
      ${arrow}
    `
  }).join('')
}

// 辅助函数：计算阶段指标
const calculateStageMetrics = (stages: any[]) => {
  if (!stages || stages.length === 0) return []
  
  return stages.map((stage, index) => {
    const currentValue = stage.current_value || stage.value || stage.count || stage.amount || 0
    const nextValue = stages[index + 1] ? (stages[index + 1].current_value || stages[index + 1].value || stages[index + 1].count || stages[index + 1].amount) : 0
    const conversionRate = index < stages.length - 1 && nextValue && currentValue > 0 ? 
      ((nextValue / currentValue) * 100) : 100
    
    return {
      ...stage,
      conversionRate: conversionRate,
      stageName: stage.stage_name || stage.name || stage.label || stage.title || `阶段 ${index + 1}`
    }
  })
}

// 获取瓶颈转化率
const getBottleneckConversionRate = (stages: any[]) => {
  const metrics = calculateStageMetrics(stages)
  if (metrics.length < 2) return 0
  
  let minRate = 100
  for (let i = 0; i < metrics.length - 1; i++) {
    if (metrics[i].conversionRate < minRate) {
      minRate = metrics[i].conversionRate
    }
  }
  return minRate.toFixed(2)
}

// 获取最佳表现阶段
const getBestPerformingStage = (stages: any[]) => {
  const metrics = calculateStageMetrics(stages)
  if (metrics.length < 2) return '暂无数据'
  
  let maxRate = 0
  let bestStage = ''
  for (let i = 0; i < metrics.length - 1; i++) {
    if (metrics[i].conversionRate > maxRate) {
      maxRate = metrics[i].conversionRate
      bestStage = metrics[i].stageName
    }
  }
  return bestStage || '暂无数据'
}

// 获取最高转化率
const getHighestConversionRate = (stages: any[]) => {
  const metrics = calculateStageMetrics(stages)
  if (metrics.length < 2) return 0
  
  let maxRate = 0
  for (let i = 0; i < metrics.length - 1; i++) {
    if (metrics[i].conversionRate > maxRate) {
      maxRate = metrics[i].conversionRate
    }
  }
  return maxRate.toFixed(2)
}

const calculateHealthScore = (content: any) => {
  // 如果没有任何分析内容，返回0分而不是误导性的基础分
  if (!content || Object.keys(content).length === 0) {
    console.log('❌ 没有分析内容，健康评分为0')
    return 0
  }
  
  let score = 0 // 从0开始，只有真实数据才能获得分数
  console.log('📊 健康评分计算开始，基础分:', score)
  
  // 检查关键洞察 - 支持多种数据结构
  if (content.keyInsights) {
    score += 20
    console.log('✅ 找到关键洞察，+20分，当前:', score)
    
    // 如果有具体的瓶颈分析，额外加分
    const hasBottleneck = content.keyInsights.key_insight?.bottleneck_stage || 
                         content.keyInsights.bottleneck_stage ||
                         content.keyInsights.main_bottleneck
    
    if (hasBottleneck && hasBottleneck !== '待分析' && hasBottleneck !== '等待AI分析完成') {
      score += 10
      console.log('✅ 找到具体瓶颈分析，+10分，当前:', score)
    }
    
    // 检查是否有具体的改进建议
    const hasSuggestion = content.keyInsights.key_insight?.quick_suggestion ||
                         content.keyInsights.teaser_analysis?.quick_advice ||
                         content.keyInsights.primary_suggestion
    
    if (hasSuggestion && hasSuggestion !== '等待AI分析完成') {
      score += 5
      console.log('✅ 找到改进建议，+5分，当前:', score)
    }
  }
  
  // 检查漏斗数据完整性 - 支持多种字段名
  const stages = content.funnelData?.stages || content.funnelData?.steps || []
  if (stages.length > 0) {
    score += 15
    console.log('✅ 找到漏斗阶段数据，+15分，当前:', score)
    
    // 如果阶段数据完整，额外加分
    const hasCompleteData = stages.every((stage: any) => {
      const value = stage.current_value || stage.value || stage.count || stage.amount
      return value !== undefined && value > 0
    })
    if (hasCompleteData) {
      score += 10
      console.log('✅ 阶段数据完整，+10分，当前:', score)
    }
  }
  
  // 检查详细分析
  if (content.detailedAnalysis && content.detailedAnalysis.length > 100) {
    score += 10
    console.log('✅ 找到详细分析，+10分，当前:', score)
  }
  
  // 检查策略选择
  const hasStrategy = content.selectedStrategy && 
                     (content.selectedStrategy.title || content.selectedStrategy.name)
  if (hasStrategy) {
    score += 5
    console.log('✅ 找到选择策略，+5分，当前:', score)
  }
  
  // 检查公司信息完整性
  if (content.companyInfo && (content.companyInfo.company_name || content.companyInfo.name)) {
    score += 5
    console.log('✅ 找到公司信息，+5分，当前:', score)
  }
  
  const finalScore = Math.min(Math.max(score, 30), 100) // 确保在30-100范围内
  console.log('🏆 最终健康评分:', finalScore)
  return finalScore
}

const getStatusLabel = (status: string): string => {
  const labels = {
    current: '进行中',
    completed: '已完成',
    archived: '已归档'
  }
  return labels[status as keyof typeof labels] || status
}

const getStatusBackground = (status: string): string => {
  const backgrounds = {
    current: '#dcfce7',
    completed: '#e0e7ff',
    archived: '#e0e7ff'  // Use same as completed for archived status
  }
  return backgrounds[status as keyof typeof backgrounds] || '#f3f4f6'
}

const getStatusColor = (status: string): string => {
  const colors = {
    current: '#166534',
    completed: '#3730a3',
    archived: '#3730a3'  // Use same as completed for archived status
  }
  return colors[status as keyof typeof colors] || '#6b7280'
}

const getReportIcon = (funnelName: string): string => {
  const icons = {
    '销售漏斗': 'fas fa-filter',
    '试用漏斗': 'fas fa-filter',
    '营销漏斗': 'fas fa-filter',
    '客户分析': 'fas fa-users'
  }
  return icons[funnelName as keyof typeof icons] || 'fas fa-filter'
}

// Sidebar management is handled by the main Sidebar component
// Listen for sidebar state changes from the main sidebar
const initSidebar = () => {
  // Listen for global sidebar toggle events
  window.addEventListener('sidebar-toggle', (event: any) => {
    sidebarCollapsed.value = event.detail.isCollapsed
  })
  
  // Initialize from localStorage
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
  sidebarCollapsed.value = isCollapsed
}

// Lifecycle
onMounted(async () => {
  initSidebar()
  await loadReportsData()
})

// 当组件被激活时（从其他路由返回）重新加载数据
onActivated(async () => {
  console.log('🔄 报告中心页面被激活，重新加载数据...')
  await loadReportsData()
})

// 监听路由变化，确保每次访问都能获得最新数据
watch(() => route.path, async (newPath) => {
  if (newPath === '/analysis/enhanced') {
    console.log('🔄 路由变化到报告中心，重新加载数据...')
    await loadReportsData()
  }
})
</script>

<style scoped>
/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Hover effects */
.report-item:hover {
  border-color: #0052d9 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.1);
}

.action-item:hover {
  border-color: #0052d9 !important;
  background: #f8fafc !important;
}

.filter-tab:hover {
  border-color: #0052d9 !important;
  color: #0052d9 !important;
}

/* Removed toggle-sidebar styles - handled by main Sidebar component */

/* Responsive design */
@media (max-width: 1024px) {
  .report-sections {
    grid-template-columns: 1fr !important;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  /* Toggle sidebar styles removed - handled by main Sidebar component */
}

@media (max-width: 640px) {
  .main-content {
    padding: 12px !important;
    margin-left: 0 !important;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }
  
  .header-card {
    padding: 16px !important;
    margin-bottom: 16px !important;
  }
  
  .reports-list,
  .quick-actions {
    padding: 16px !important;
  }
  
  .report-sections {
    gap: 16px !important;
  }
}

/* Font Awesome icons fallback */
.fas:before,
.fa:before {
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
}
</style>