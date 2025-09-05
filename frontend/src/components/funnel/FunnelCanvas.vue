<template>
  <div 
    class="funnel-canvas relative w-full h-full bg-gray-50 dark:bg-gray-900 overflow-hidden"
    :data-drag-over="isDragOverCanvas"
    :class="{ 'snap-to-grid': snapToGrid }"
  >
    <!-- Canvas Controls -->
    <div class="absolute top-4 left-4 z-10 flex gap-2">
      <!-- View Controls -->
      <div class="flex gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm overflow-hidden">
        <button
          @click="resetView"
          title="重置视图 (空格键)"
          class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
        >
          <ViewfinderCircleIcon class="w-4 h-4 inline mr-1" />
          重置
        </button>
        <div class="w-px bg-gray-200 dark:bg-gray-600"></div>
        <button
          @click="fitToView"
          title="适应画布 (F键)"
          class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
        >
          <Square3Stack3DIcon class="w-4 h-4 inline mr-1" />
          适应
        </button>
      </div>

      <!-- Zoom Controls -->
      <div class="flex gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm overflow-hidden">
        <button
          @click="zoomOut"
          title="缩小 (-键)"
          class="px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <MinusIcon class="w-4 h-4" />
        </button>
        <div class="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 min-w-[60px] justify-center">
          <span class="font-medium">{{ Math.round(currentZoom * 100) }}%</span>
        </div>
        <button
          @click="zoomIn"
          title="放大 (+键)"
          class="px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <PlusIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Grid Toggle -->
      <button
        @click="toggleGrid"
        title="切换网格 (G键)"
        :class="[
          'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm transition-all duration-200',
          showGrid 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700 dark:text-blue-300 shadow-blue-100' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <Squares2X2Icon class="w-4 h-4 inline mr-1" />
        网格
      </button>

      <!-- Layout Controls -->
      <div class="flex gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm overflow-hidden">
        <button
          @click="autoArrange()"
          :disabled="isApplyingLayout || nodes.length === 0"
          title="智能布局 (A键)"
          class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon class="w-4 h-4 inline mr-1" />
          <span v-if="isApplyingLayout">布局中...</span>
          <span v-else>智能布局</span>
        </button>
        <div class="w-px bg-gray-200 dark:bg-gray-600"></div>
        <button
          @click="showLayoutPanel = !showLayoutPanel"
          title="布局选项 (L键)"
          :class="[
            'px-3 py-2 text-sm transition-colors',
            showLayoutPanel
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          <AdjustmentsHorizontalIcon class="w-4 h-4 inline mr-1" />
          选项
        </button>
      </div>

      <!-- Layout Analysis Toggle -->
      <button
        v-if="hasLayoutIssues"
        @click="showLayoutAnalysis = !showLayoutAnalysis"
        title="布局分析"
        class="px-3 py-2 border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md shadow-sm text-sm transition-all duration-200 hover:bg-amber-100 dark:hover:bg-amber-800/30"
      >
        <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" />
        {{ layoutSuggestions.length }}个建议
      </button>
    </div>

    <!-- Canvas Settings and Layout Info -->
    <div class="absolute top-4 right-4 z-10 flex gap-2">
      <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2">
        <div class="flex items-center gap-3 text-xs">
          <label class="flex items-center space-x-1">
            <input
              v-model="snapToGrid"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="updateLayoutConfig({ snapToGrid })"
            />
            <span class="text-gray-700 dark:text-gray-300">网格对齐</span>
          </label>
          <label class="flex items-center space-x-1">
            <input
              v-model="enableMagneticAlignment"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="updateLayoutConfig({ enableMagneticAlignment })"
            />
            <span class="text-gray-700 dark:text-gray-300">磁性对齐</span>
          </label>
        </div>
      </div>
      
      <!-- Layout Quality Score -->
      <div v-if="layoutAnalysis" class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2">
        <div class="flex items-center gap-2 text-xs">
          <div class="flex items-center gap-1">
            <div 
              :class="[
                'w-2 h-2 rounded-full',
                layoutQualityScore >= 80 ? 'bg-green-500' :
                layoutQualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              ]"
            ></div>
            <span class="text-gray-700 dark:text-gray-300">质量: {{ Math.round(layoutQualityScore) }}/100</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-3 py-2">
        <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>节点: {{ renderStats.visibleNodes }}/{{ nodes.length }}</span>
          <span>|</span>
          <span>连接: {{ renderStats.visibleEdges }}/{{ edges.length }}</span>
          <span v-if="nodes.length > 50" class="text-green-600 dark:text-green-400">
            | 优化模式
          </span>
          <span v-if="renderStats.renderTime > 0" class="text-blue-600 dark:text-blue-400">
            | {{ renderStats.renderTime.toFixed(1) }}ms
          </span>
        </div>
      </div>
    </div>

    <!-- Main SVG Canvas -->
    <svg
      ref="svgElement"
      class="w-full h-full"
      :class="{ 'cursor-move': !isConnecting && !isDragOverCanvas }"
      @contextmenu.prevent
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
      @dragover.prevent="handleCanvasDragOver"
      @drop.prevent="handleCanvasDrop"
      @dragenter.prevent="handleCanvasDragEnter"
      @dragleave.prevent="handleCanvasDragLeave"
    >
      <defs>
        <!-- Arrow markers for edges -->
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#666" />
        </marker>
        
        <!-- Gradient definitions for nodes -->
        <linearGradient id="startNodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="endNodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="eventNodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background grid -->
      <g v-if="showGrid" class="grid">
        <pattern
          id="grid"
          :width="gridSize"
          :height="gridSize"
          patternUnits="userSpaceOnUse"
        >
          <path
            :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="0.5"
            opacity="0.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </g>

      <!-- Main container group for zoom/pan -->
      <g ref="containerGroup">
        <!-- Edges -->
        <g class="edges">
          <ConnectionLine
            v-for="edge in visibleEdges"
            :key="edge.id"
            :edge="edge"
            :source-node="getNodeById(edge.source)"
            :target-node="getNodeById(edge.target)"
            :selected="selectedEdgeId === edge.id"
            :show-label="true"
            :show-analytics="false"
            :show-flow-animation="false"
            @select="handleEdgeSelect"
            @hover="onEdgeHover"
          />
        </g>

        <!-- Temporary edge while connecting -->
        <g v-if="isConnecting && connectionStart" class="connection-preview">
          <path
            :d="getPreviewConnectionPath(connectionStart.position, mousePosition)"
            fill="none"
            stroke="#3b82f6"
            stroke-width="3"
            stroke-dasharray="8,4"
            opacity="0.8"
            class="preview-path"
          />
          <!-- Start point indicator -->
          <circle
            :cx="connectionStart.position.x"
            :cy="connectionStart.position.y"
            r="8"
            fill="#10b981"
            stroke="white"
            stroke-width="3"
            class="start-indicator"
          />
          <!-- Connection preview circle with pulse effect -->
          <circle
            :cx="mousePosition.x"
            :cy="mousePosition.y"
            r="8"
            fill="#3b82f6"
            opacity="0.7"
            class="preview-cursor"
          />
          <circle
            :cx="mousePosition.x"
            :cy="mousePosition.y"
            r="12"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
            opacity="0.3"
            class="preview-pulse"
          />
        </g>

        <!-- Drag preview for new nodes -->
        <g v-if="isDragOverCanvas && dragPreview" class="drag-preview">
          <g :transform="`translate(${dragOverPosition.x - 60}, ${dragOverPosition.y - 30})`">
            <rect
              x="0"
              y="0"
              width="120"
              height="60"
              rx="8"
              :fill="getPreviewNodeColor(dragPreview)"
              opacity="0.7"
              stroke="#3b82f6"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <text
              x="60"
              y="35"
              text-anchor="middle"
              dominant-baseline="middle"
              class="text-sm font-medium fill-white"
            >
              {{ dragPreview.label }}
            </text>
          </g>
        </g>

        <!-- Snap Guides -->
        <g v-if="activeSnapGuides.length > 0" class="snap-guides">
          <g v-for="guide in activeSnapGuides" :key="`guide-${guide.type}-${guide.position}`">
            <line
              v-if="guide.type === 'horizontal'"
              :x1="0"
              :y1="guide.position"
              :x2="800"
              :y2="guide.position"
              stroke="#3b82f6"
              stroke-width="1"
              stroke-dasharray="4,2"
              opacity="0.6"
              class="snap-guide"
            />
            <line
              v-if="guide.type === 'vertical'"
              :x1="guide.position"
              :y1="0"
              :x2="guide.position"
              :y2="600"
              stroke="#3b82f6"
              stroke-width="1"
              stroke-dasharray="4,2"
              opacity="0.6"
              class="snap-guide"
            />
          </g>
        </g>

        <!-- Nodes -->
        <g class="nodes">
          <FunnelNode
            v-for="node in visibleNodes"
            :key="node.id"
            :node="node"
            :selected="selectedNodeId === node.id || selectedNodeIds.includes(node.id)"
            :analytics="getNodeAnalytics(node.id)"
            @select="handleNodeSelect"
            @multiselect="handleNodeMultiSelect"
            @update="updateNode"
            @batch-update="handleBatchUpdate"
            @delete="deleteNode"
            @batch-delete="handleBatchDelete"
            @edit="editNode"
            @connection-start="startConnection"
            @connection-end="endConnection"
            @gesture-detected="handleGestureDetected"
            @context-menu="handleNodeContextMenu"
          />
        </g>
      </g>
    </svg>

    <!-- Node Editor Modal -->
    <NodeEditor
      v-if="showNodeEditor"
      :node="editingNode"
      @close="closeNodeEditor"
      @save="saveNodeChanges"
    />

    <!-- Data Entry Modal -->
    <DataEntryModal
      v-if="showDataEntryModal"
      :node="dataEntryNode"
      @close="closeDataEntryModal"
      @save="saveNodeData"
    />

    <!-- Multi-selection Box -->
    <MultiSelectionBox
      :active="isSelecting"
      :start-position="selectionStart"
      :end-position="selectionEnd"
      :selected-count="selectedNodeIds.length"
      :show-info="true"
      theme="primary"
    />

    <!-- Advanced Context Menu -->
    <AdvancedContextMenu
      :visible="contextMenu.show"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :items="contextMenuItems"
      :selected-items="selectedNodeIds"
      :show-header="selectedNodeIds.length > 1"
      :context-info="getContextInfo()"
      @close="hideContextMenu"
      @item-click="handleContextMenuAction"
    />

    <!-- Layout Panel -->
    <div 
      v-if="showLayoutPanel" 
      class="absolute top-16 left-4 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[400px]"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium text-gray-900 dark:text-white">布局选项</h3>
        <button @click="showLayoutPanel = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <span class="sr-only">关闭</span>
          ✕
        </button>
      </div>
      
      <!-- Layout Algorithms -->
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">布局算法</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="applyHierarchicalLayout()"
              :disabled="isApplyingLayout"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              层次布局
            </button>
            <button
              @click="applyForceDirectedLayout()"
              :disabled="isApplyingLayout"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              力导向布局
            </button>
            <button
              @click="applyGridLayout()"
              :disabled="isApplyingLayout"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              网格布局
            </button>
            <button
              @click="applyCircularLayout()"
              :disabled="isApplyingLayout"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              环形布局
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">快速操作</label>
          <div class="flex gap-2 flex-wrap">
            <button
              @click="optimizeSpacing()"
              :disabled="isApplyingLayout"
              class="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              优化间距
            </button>
            <button
              @click="quickFix()"
              :disabled="isApplyingLayout || !hasLayoutIssues"
              class="px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600 rounded-md hover:bg-green-100 dark:hover:bg-green-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              快速修复
            </button>
          </div>
        </div>

        <!-- Undo/Redo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">历史操作</label>
          <div class="flex gap-2">
            <button
              @click="undoLayout()"
              :disabled="!canUndo"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              撤销
            </button>
            <button
              @click="redoLayout()"
              :disabled="!canRedo"
              class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              重做
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout Analysis Panel -->
    <div 
      v-if="showLayoutAnalysis && layoutAnalysis" 
      class="absolute top-16 right-4 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium text-gray-900 dark:text-white">布局分析</h3>
        <button @click="showLayoutAnalysis = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <span class="sr-only">关闭</span>
          ✕
        </button>
      </div>
      
      <!-- Layout Score -->
      <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">布局质量</span>
          <span class="text-sm font-bold" :class="[
            layoutQualityScore >= 80 ? 'text-green-600 dark:text-green-400' :
            layoutQualityScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          ]">{{ Math.round(layoutQualityScore) }}/100</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300" 
            :class="[
              layoutQualityScore >= 80 ? 'bg-green-500' :
              layoutQualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            ]"
            :style="{ width: `${layoutQualityScore}%` }"
          ></div>
        </div>
      </div>

      <!-- Issues -->
      <div v-if="layoutSuggestions.length > 0" class="space-y-3">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">建议改进</h4>
        <div class="space-y-2">
          <div 
            v-for="(suggestion, index) in layoutSuggestions.slice(0, 5)" 
            :key="index"
            class="flex items-start gap-2 p-2 rounded-md" 
            :class="[
              suggestion.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20' :
              suggestion.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
              'bg-blue-50 dark:bg-blue-900/20'
            ]"
          >
            <div class="flex-shrink-0 mt-0.5">
              <div 
                class="w-2 h-2 rounded-full" 
                :class="[
                  suggestion.severity === 'high' ? 'bg-red-500' :
                  suggestion.severity === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                ]"
              ></div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-700 dark:text-gray-300">{{ suggestion.message }}</p>
              <button 
                @click="suggestion.action()"
                class="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
              >
                应用修复
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Issues -->
      <div v-else class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
        <CheckCircleIcon class="w-5 h-5 text-green-500" />
        <span class="text-sm text-green-700 dark:text-green-300">布局状态良好，无需改进</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, provide } from 'vue'
import * as d3 from 'd3'
import { useFunnel } from '@composables/useFunnel'
import { useLayout } from '@composables/useLayout'
import type { FunnelNode as FunnelNodeType, FunnelEdge, NodeType, Position, NodeAnalytics } from '@/types/funnel'
import type { LayoutAlgorithm, SnapGuide, LayoutBounds } from '@/types/layout'
import { createPerformanceOptimizer, debounce, throttle } from '@/utils/performance'
import { MultiSelectionManager } from '@/utils/multi-selection-manager'
import { BatchOperationsEngine } from '@/utils/batch-operations-engine'
import { AdvancedGestureRecognition } from '@/utils/advanced-gesture-recognition'
import { SmartSnappingAlignmentManager } from '@/utils/smart-snapping-alignment'
import FunnelNode from './FunnelNode.vue'
import NodeEditor from './NodeEditor.vue'
import DataEntryModal from './DataEntryModal.vue'
import ConnectionLine from './ConnectionLine.vue'
import MultiSelectionBox from '@/components/interaction/MultiSelectionBox.vue'
import AdvancedContextMenu from '@/components/interaction/AdvancedContextMenu.vue'
import { 
  PlusIcon, 
  MinusIcon,
  TrashIcon, 
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowRightIcon,
  LinkSlashIcon,
  ClipboardDocumentIcon,
  RectangleStackIcon,
  ViewfinderCircleIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  CpuChipIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
interface Props {
  width?: number
  height?: number
  readonly?: boolean
  showGrid?: boolean
  gridSize?: number
  snapToGrid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  readonly: false,
  showGrid: true,
  gridSize: 20,
  snapToGrid: true
})

const emit = defineEmits<{
  nodeSelect: [nodeId: string | null]
  edgeSelect: [edgeId: string | null]
  canvasClick: [position: Position]
  multiSelect: [nodeIds: string[]]
  gestureDetected: [nodeId: string, gesture: string, data: any]
  contextMenu: [nodeId: string | null, position: Position, event: MouseEvent]
  batchUpdate: [updates: Array<{ nodeId: string, updates: Partial<FunnelNodeType> }>]
}>()

// Composables
const { 
  nodes, 
  edges, 
  selectedNode, 
  selectedEdge, 
  addNode, 
  updateNode, 
  deleteNode, 
  addEdge, 
  deleteEdge, 
  selectNode, 
  selectEdge, 
  clearSelection 
} = useFunnel()

// Layout composable
const {
  isApplyingLayout,
  layoutConfig,
  layoutAnalysis,
  activeSnapGuides,
  canUndo,
  canRedo,
  layoutQualityScore,
  hasLayoutIssues,
  layoutSuggestions,
  applyLayout,
  autoArrange,
  optimizeSpacing,
  analyzeCurrentLayout,
  handleDragPosition,
  positionNewNode,
  undoLayout,
  redoLayout,
  updateLayoutConfig,
  detectLayoutIssues,
  clearSnapGuides,
  applyHierarchicalLayout,
  applyForceDirectedLayout,
  applyGridLayout,
  applyCircularLayout,
  quickFix,
  resetToManualLayout
} = useLayout(nodes, edges)

// Refs
const svgElement = ref<SVGElement>()
const containerGroup = ref<SVGGElement>()

// State
const currentZoom = ref(1)
const showGrid = ref(props.showGrid)
const snapToGrid = ref(props.snapToGrid)
const showLayoutPanel = ref(false)
const showLayoutAnalysis = ref(false)
const enableMagneticAlignment = ref(true)
const selectedLayoutAlgorithm = ref<LayoutAlgorithm>('hierarchical')
const currentTransform = ref(d3.zoomIdentity)

// Performance optimization
const performanceOptimizer = createPerformanceOptimizer({
  enableViewportCulling: true,
  maxVisibleNodes: 50,
  enableLevelOfDetail: true,
  simplifyEdgesThreshold: 100,
  enableWebWorkers: false,
  batchSize: 10
})
const viewport = ref<LayoutBounds>({ x: 0, y: 0, width: 800, height: 600 })
const renderStats = ref({ renderTime: 0, visibleNodes: 0, visibleEdges: 0 })
const isConnecting = ref(false)
const connectionStart = ref<{ nodeId: string; position: Position } | null>(null)
const mousePosition = ref<Position>({ x: 0, y: 0 })
const showNodeEditor = ref(false)
const showDataEntryModal = ref(false)
const editingNode = ref<FunnelNodeType | null>(null)
const dataEntryNode = ref<FunnelNodeType | null>(null)

// Drag and Drop state
const isDragOverCanvas = ref(false)
const dragOverPosition = ref<Position>({ x: 0, y: 0 })
const pendingNodeDrop = ref<any>(null)
const dragPreview = ref<any>(null)

// Advanced Interaction Managers
const multiSelectionManager = ref<MultiSelectionManager>()
const batchOperationsEngine = ref<BatchOperationsEngine>()
const gestureRecognizer = ref<AdvancedGestureRecognition>()
const snappingManager = ref<SmartSnappingAlignmentManager>()

// Multi-selection state
const isSelecting = ref(false)
const selectionStart = ref<Position | null>(null)
const selectionEnd = ref<Position | null>(null)
const selectedNodeIds = ref<string[]>([])

// Context menu
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  nodeId: null as string | null,
  items: [] as any[]
})

// Gesture tracking
const gestureTrail = ref<Position[]>([])
const activeGesture = ref<string | null>(null)

// Utility functions
const snapPositionToGrid = (position: Position): Position => {
  if (!snapToGrid.value) return position
  
  const gridSize = props.gridSize
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  }
}

const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Computed
const selectedNodeId = computed(() => selectedNode.value?.id || null)
const selectedEdgeId = computed(() => selectedEdge.value?.id || null)

// Performance optimization - visible nodes computation
const visibleNodes = computed(() => {
  if (nodes.value.length === 0) return []

  // Update viewport based on current transform
  const currentViewport = {
    x: -currentTransform.value.x / currentTransform.value.k,
    y: -currentTransform.value.y / currentTransform.value.k,
    width: props.width / currentTransform.value.k,
    height: props.height / currentTransform.value.k
  }
  viewport.value = currentViewport

  // Use performance optimizer for large graphs
  const optimizedNodes = performanceOptimizer.getVisibleNodes(
    nodes.value,
    currentViewport,
    currentZoom.value
  )

  // Apply level of detail based on zoom
  const lodNodes = performanceOptimizer.applyLevelOfDetail(optimizedNodes, currentZoom.value)
  
  // Update render stats
  renderStats.value.visibleNodes = optimizedNodes.length
  
  return lodNodes
})

// Performance optimization - visible edges computation
const visibleEdges = computed(() => {
  if (edges.value.length === 0) return []

  const visibleNodeIds = new Set(visibleNodes.value.map((n: any) => n.id))
  const optimizedEdges = performanceOptimizer.getVisibleEdges(
    edges.value,
    visibleNodeIds
  )
  
  // Update render stats
  renderStats.value.visibleEdges = optimizedEdges.length
  
  return optimizedEdges
})

const contextMenuItems = computed(() => {
  const items = []
  
  if (contextMenu.value.nodeId) {
    const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
    if (node) {
      items.push(
        { 
          label: '编辑节点', 
          icon: PencilIcon, 
          action: () => editNodeFromContext(),
          shortcut: '双击'
        },
        { 
          label: '复制节点', 
          icon: DocumentDuplicateIcon, 
          action: () => duplicateNodeFromContext(),
          shortcut: 'Ctrl+C'
        },
        { divider: true },
        { 
          label: '连接到...', 
          icon: ArrowRightIcon, 
          action: () => startConnectionFromContext(),
          disabled: node.type === 'end'
        },
        { 
          label: '断开所有连接', 
          icon: LinkSlashIcon, 
          action: () => disconnectNodeFromContext(),
          disabled: !hasConnections(node.id)
        },
        { divider: true },
        { 
          label: '删除节点', 
          icon: TrashIcon, 
          action: () => deleteNodeFromContext(),
          destructive: true,
          shortcut: 'Del'
        }
      )
    }
  } else {
    items.push(
      { 
        label: '粘贴节点', 
        icon: ClipboardDocumentIcon, 
        action: () => pasteNodeFromContext(),
        disabled: !hasClipboardNode(),
        shortcut: 'Ctrl+V'
      },
      { divider: true },
      { 
        label: '选择所有', 
        icon: RectangleStackIcon, 
        action: () => selectAllNodes(),
        shortcut: 'Ctrl+A'
      },
      { 
        label: '重置视图', 
        icon: ViewfinderCircleIcon, 
        action: () => resetView(),
        shortcut: '空格'
      },
      { 
        label: '适应画布', 
        icon: Square3Stack3DIcon, 
        action: () => fitToView(),
        shortcut: 'F'
      }
    )
  }
  
  return items
})

// D3 zoom behavior
let zoom: d3.ZoomBehavior<SVGElement, unknown>

// Methods
const initializeD3 = () => {
  if (!svgElement.value || !containerGroup.value) return

  // Initialize zoom behavior
  zoom = d3.zoom<SVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      const { transform } = event
      currentZoom.value = transform.k
      currentTransform.value = transform
      d3.select(containerGroup.value).attr('transform', transform)
    })

  // Apply zoom to SVG
  d3.select(svgElement.value)
    .call(zoom)
    .on('click', onCanvasClick)
    .on('contextmenu', onContextMenu)
}

const onCanvasClick = (event: MouseEvent) => {
  if (event.target !== svgElement.value && event.target !== containerGroup.value) return
  
  // Handle multi-selection with modifier keys
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
    clearSelection()
    if (multiSelectionManager.value) {
      multiSelectionManager.value.clearSelection()
      selectedNodeIds.value = []
    }
  }
  
  hideContextMenu()
  
  emit('canvasClick', { x: event.clientX, y: event.clientY })
}

const onContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    nodeId: null
  }
}

const hideContextMenu = () => {
  contextMenu.value.show = false
}

// Throttle mouse move events for better performance
const onMouseMove = throttle((event: MouseEvent) => {
  if (!svgElement.value) return
  
  const svgRect = svgElement.value.getBoundingClientRect()
  const transform = d3.zoomTransform(svgElement.value)
  
  mousePosition.value = {
    x: (event.clientX - svgRect.left - transform.x) / transform.k,
    y: (event.clientY - svgRect.top - transform.y) / transform.k
  }
  
  // Handle multi-selection rectangle
  if (isSelecting.value && selectionStart.value) {
    selectionEnd.value = {
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top
    }
    
    // Find nodes within selection rectangle
    updateSelectionRectangle()
  }
  
  // Clear snap guides when not dragging
  if (!isConnecting.value && !isSelecting.value) {
    setTimeout(() => clearSnapGuides(), 100)
  }
}, 16) // ~60fps

const onMouseUp = () => {
  if (isConnecting.value) {
    console.log('FunnelCanvas: Mouse up - cancelling connection')
    isConnecting.value = false
    connectionStart.value = null
    document.body.style.cursor = ''
  }
  
  // End multi-selection
  if (isSelecting.value) {
    endSelection()
  }
}

// Multi-selection helper functions
const startSelection = (event: MouseEvent) => {
  if (!svgElement.value) return
  
  const svgRect = svgElement.value.getBoundingClientRect()
  
  isSelecting.value = true
  selectionStart.value = {
    x: event.clientX - svgRect.left,
    y: event.clientY - svgRect.top
  }
  selectionEnd.value = selectionStart.value
  
  document.body.style.cursor = 'crosshair'
  document.body.style.userSelect = 'none'
}

const updateSelectionRectangle = () => {
  if (!svgElement.value || !selectionStart.value || !selectionEnd.value) return
  
  const svgRect = svgElement.value.getBoundingClientRect()
  const transform = d3.zoomTransform(svgElement.value)
  
  // Calculate selection bounds in canvas coordinates
  const startCanvas = {
    x: (selectionStart.value.x - transform.x) / transform.k,
    y: (selectionStart.value.y - transform.y) / transform.k
  }
  
  const endCanvas = {
    x: (selectionEnd.value.x - transform.x) / transform.k,
    y: (selectionEnd.value.y - transform.y) / transform.k
  }
  
  const minX = Math.min(startCanvas.x, endCanvas.x)
  const maxX = Math.max(startCanvas.x, endCanvas.x)
  const minY = Math.min(startCanvas.y, endCanvas.y)
  const maxY = Math.max(startCanvas.y, endCanvas.y)
  
  // Find nodes within selection rectangle
  const nodesInSelection: string[] = []
  
  nodes.value.forEach(node => {
    const nodeRight = node.position.x + 120 // Assuming node width
    const nodeBottom = node.position.y + 60 // Assuming node height
    
    // Check if node overlaps with selection rectangle
    if (node.position.x < maxX && nodeRight > minX &&
        node.position.y < maxY && nodeBottom > minY) {
      nodesInSelection.push(node.id)
    }
  })
  
  // Update selection manager
  if (multiSelectionManager.value) {
    multiSelectionManager.value.clearSelection()
    nodesInSelection.forEach(nodeId => {
      multiSelectionManager.value!.addToSelection(nodeId)
    })
    
    selectedNodeIds.value = nodesInSelection
    emit('multiSelect', nodesInSelection)
  }
}

const endSelection = () => {
  isSelecting.value = false
  selectionStart.value = null
  selectionEnd.value = null
  
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const onMouseLeave = () => {
  onMouseUp()
}


const startConnection = (nodeId: string, position: Position) => {
  if (props.readonly) return
  
  console.log('FunnelCanvas: Starting connection from node:', nodeId, 'at position:', position)
  
  isConnecting.value = true
  connectionStart.value = { nodeId, position }
  
  // Show connection points on all compatible nodes
  const sourceNode = nodes.value.find(n => n.id === nodeId)
  if (sourceNode) {
    // Add visual feedback for connecting state
    document.body.style.cursor = 'crosshair'
    
    console.log('FunnelCanvas: Connection mode enabled')
  }
}

const endConnection = (targetNodeId: string) => {
  console.log('FunnelCanvas: Ending connection at node:', targetNodeId)
  
  if (!isConnecting.value || !connectionStart.value) {
    console.log('FunnelCanvas: No active connection to end')
    isConnecting.value = false
    connectionStart.value = null
    document.body.style.cursor = ''
    return
  }
  
  if (connectionStart.value.nodeId === targetNodeId) {
    console.log('FunnelCanvas: Cannot connect node to itself')
    isConnecting.value = false
    connectionStart.value = null
    document.body.style.cursor = ''
    return
  }
  
  const sourceNode = nodes.value.find(n => n.id === connectionStart.value!.nodeId)
  const targetNode = nodes.value.find(n => n.id === targetNodeId)
  
  if (!sourceNode || !targetNode) {
    console.warn('FunnelCanvas: Source or target node not found')
    isConnecting.value = false
    connectionStart.value = null
    document.body.style.cursor = ''
    return
  }
  
  // Check if connection already exists
  const existingEdge = edges.value.find(e => 
    e.source === sourceNode.id && e.target === targetNode.id
  )
  
  if (existingEdge) {
    console.log('FunnelCanvas: Connection already exists')
    isConnecting.value = false
    connectionStart.value = null
    document.body.style.cursor = ''
    return
  }
  
  console.log('FunnelCanvas: Creating new connection:', sourceNode.id, '->', targetNode.id)
  
  const newEdge: Omit<FunnelEdge, 'id'> = {
    source: sourceNode.id,
    target: targetNode.id,
    type: 'default',
    data: {
      label: `从 ${sourceNode.data.label} 到 ${targetNode.data.label}`,
      config: {
        created_at: new Date().toISOString()
      }
    }
  }
  
  try {
    const createdEdge = addEdge(newEdge)
    console.log('FunnelCanvas: Edge created successfully:', createdEdge)
  } catch (error) {
    console.error('FunnelCanvas: Failed to create edge:', error)
  }
  
  isConnecting.value = false
  connectionStart.value = null
  document.body.style.cursor = ''
}

const handleEdgeSelect = (edgeId: string) => {
  selectEdge(edgeId)
  emit('edgeSelect', edgeId)
}

const onEdgeHover = (edgeId: string, isHovering: boolean) => {
  // Could add visual feedback for edge hover
  // For now, just handle the event
  console.log(`Edge ${edgeId} hover: ${isHovering}`)
}

const editNode = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    editingNode.value = node
    showNodeEditor.value = true
  }
}

const closeNodeEditor = () => {
  showNodeEditor.value = false
  editingNode.value = null
}

const saveNodeChanges = (updatedNode: FunnelNodeType) => {
  updateNode(updatedNode.id, updatedNode)
  closeNodeEditor()
}

const openDataEntryModal = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    dataEntryNode.value = node
    showDataEntryModal.value = true
  }
}

const closeDataEntryModal = () => {
  showDataEntryModal.value = false
  dataEntryNode.value = null
}

const saveNodeData = (nodeId: string, data: any) => {
  updateNode(nodeId, { data })
  closeDataEntryModal()
}

const getEdgePath = (edge: FunnelEdge): string => {
  const sourceNode = nodes.value.find(n => n.id === edge.source)
  const targetNode = nodes.value.find(n => n.id === edge.target)
  
  if (!sourceNode || !targetNode) return ''
  
  return calculateConnectionPath(sourceNode, targetNode)
}

const calculateConnectionPath = (sourceNode: FunnelNodeType, targetNode: FunnelNodeType): string => {
  const sourceX = sourceNode.position.x + 120 // Right edge of source node
  const sourceY = sourceNode.position.y + 30  // Middle of source node
  const targetX = targetNode.position.x       // Left edge of target node
  const targetY = targetNode.position.y + 30  // Middle of target node
  
  // Create a smooth bezier curve
  const dx = targetX - sourceX
  const controlPointOffset = Math.abs(dx) * 0.5
  
  const cp1x = sourceX + controlPointOffset
  const cp1y = sourceY
  const cp2x = targetX - controlPointOffset
  const cp2y = targetY
  
  return `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`
}

const getPreviewConnectionPath = (start: Position, end: Position): string => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Adaptive control point offset based on distance and direction
  const controlPointOffset = Math.max(Math.abs(dx) * 0.5, Math.min(distance * 0.3, 100))
  
  const cp1x = start.x + controlPointOffset
  const cp1y = start.y
  const cp2x = end.x - controlPointOffset
  const cp2y = end.y
  
  return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`
}

const getPreviewNodeColor = (nodeType: any): string => {
  // Convert Tailwind CSS class to hex color
  const colorMap: Record<string, string> = {
    'bg-green-500': '#10b981',
    'bg-amber-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6',
    'bg-emerald-500': '#10b981',
    'bg-blue-500': '#3b82f6',
    'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
    'bg-gray-500': '#6b7280'
  }
  
  return colorMap[nodeType.color] || '#6b7280'
}

const getNodeById = (nodeId: string): FunnelNodeType | undefined => {
  return nodes.value.find(node => node.id === nodeId)
}

const getEdgeColor = (edge: FunnelEdge): string => {
  if (selectedEdgeId.value === edge.id) return '#3b82f6'
  
  switch (edge.type) {
    case 'conditional': return '#f59e0b'
    case 'fallback': return '#ef4444'
    case 'trigger': return '#10b981'
    default: return '#6b7280'
  }
}

const getEdgeLabelPosition = (edge: FunnelEdge): Position => {
  const sourceNode = nodes.value.find(n => n.id === edge.source)
  const targetNode = nodes.value.find(n => n.id === edge.target)
  
  if (!sourceNode || !targetNode) return { x: 0, y: 0 }
  
  const sourceX = sourceNode.position.x + 60
  const sourceY = sourceNode.position.y + 30
  const targetX = targetNode.position.x + 60
  const targetY = targetNode.position.y + 30
  
  return {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2 - 10
  }
}

const getNodeAnalytics = (nodeId: string): NodeAnalytics | undefined => {
  // This would be fetched from the analytics service
  // For now, return mock data
  return undefined
}

const resetView = () => {
  if (!svgElement.value || !zoom) return
  
  d3.select(svgElement.value)
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity)
}

const fitToView = () => {
  if (!svgElement.value || !containerGroup.value || !zoom || nodes.value.length === 0) return
  
  // Calculate bounds of all nodes
  const padding = 50
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  
  nodes.value.forEach(node => {
    minX = Math.min(minX, node.position.x - padding)
    maxX = Math.max(maxX, node.position.x + 120 + padding) // Node width + padding
    minY = Math.min(minY, node.position.y - padding)
    maxY = Math.max(maxY, node.position.y + 60 + padding) // Node height + padding
  })
  
  const width = maxX - minX
  const height = maxY - minY
  const svgRect = svgElement.value.getBoundingClientRect()
  
  const scale = Math.min(svgRect.width / width, svgRect.height / height, 1)
  const translateX = (svgRect.width - width * scale) / 2 - minX * scale
  const translateY = (svgRect.height - height * scale) / 2 - minY * scale
  
  d3.select(svgElement.value)
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale))
}

// Canvas interaction functions
const toggleGrid = () => {
  showGrid.value = !showGrid.value
  console.log('FunnelCanvas: Grid toggled:', showGrid.value)
}

const zoomIn = () => {
  if (!svgElement.value || !zoom) return
  
  d3.select(svgElement.value)
    .transition()
    .duration(300)
    .call(zoom.scaleBy, 1.2)
}

const zoomOut = () => {
  if (!svgElement.value || !zoom) return
  
  d3.select(svgElement.value)
    .transition()
    .duration(300)
    .call(zoom.scaleBy, 0.8)
}

const centerView = () => {
  if (!svgElement.value || !zoom) return
  
  const svgRect = svgElement.value.getBoundingClientRect()
  const centerX = svgRect.width / 2
  const centerY = svgRect.height / 2
  
  d3.select(svgElement.value)
    .transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY).scale(1))
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.target !== document.body) return
  
  switch (event.key) {
    case ' ':
      event.preventDefault()
      resetView()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      fitToView()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      centerView()
      break
    case 'g':
    case 'G':
      event.preventDefault()
      toggleGrid()
      break
    case 'a':
    case 'A':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        selectAllNodes()
      } else {
        event.preventDefault()
        autoArrange()
      }
      break
    case 'l':
    case 'L':
      event.preventDefault()
      showLayoutPanel.value = !showLayoutPanel.value
      break
    case 'z':
    case 'Z':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (event.shiftKey) {
          redoLayout()
        } else {
          undoLayout()
        }
      }
      break
    case 'Escape':
      if (isConnecting.value) {
        onMouseUp()
      } else if (showLayoutPanel.value) {
        showLayoutPanel.value = false
      } else if (showLayoutAnalysis.value) {
        showLayoutAnalysis.value = false
      }
      break
  }
}

// Context menu actions
const addNodeFromContext = () => {
  // Implementation for adding node from context menu
  hideContextMenu()
}

const editNodeFromContext = () => {
  if (contextMenu.value.nodeId) {
    editNode(contextMenu.value.nodeId)
  }
  hideContextMenu()
}

const deleteNodeFromContext = () => {
  if (contextMenu.value.nodeId) {
    deleteNode(contextMenu.value.nodeId)
  }
  hideContextMenu()
}

// Additional context menu actions
const duplicateNodeFromContext = () => {
  if (contextMenu.value.nodeId) {
    const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
    if (node) {
      const duplicatedNode: Omit<FunnelNodeType, 'id'> = {
        ...node,
        position: {
          x: node.position.x + 150,
          y: node.position.y + 50
        },
        data: {
          ...node.data,
          label: `${node.data.label} (副本)`
        }
      }
      addNode(duplicatedNode)
    }
  }
  hideContextMenu()
}

const startConnectionFromContext = () => {
  if (contextMenu.value.nodeId) {
    const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
    if (node) {
      isConnecting.value = true
      connectionStart.value = {
        nodeId: node.id,
        position: { x: node.position.x + 120, y: node.position.y + 30 }
      }
    }
  }
  hideContextMenu()
}

const disconnectNodeFromContext = () => {
  if (contextMenu.value.nodeId) {
    // Remove all edges connected to this node
    const nodeId = contextMenu.value.nodeId
    const connectedEdges = edges.value.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    )
    connectedEdges.forEach(edge => deleteEdge(edge.id))
  }
  hideContextMenu()
}

const pasteNodeFromContext = () => {
  // Implement paste functionality
  hideContextMenu()
}

const selectAllNodes = () => {
  // Select all nodes (could be implemented in the store)
  hideContextMenu()
}

const hasConnections = (nodeId: string): boolean => {
  return edges.value.some(edge => edge.source === nodeId || edge.target === nodeId)
}

const hasClipboardNode = (): boolean => {
  // Check if there's a node in clipboard (mock for now)
  return false
}

// Drag and Drop Handlers
const handleCanvasDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  if (!event.dataTransfer) return
  
  event.dataTransfer.dropEffect = 'copy'
  isDragOverCanvas.value = true
  
  if (svgElement.value) {
    const svgRect = svgElement.value.getBoundingClientRect()
    const transform = d3.zoomTransform(svgElement.value)
    
    dragOverPosition.value = {
      x: (event.clientX - svgRect.left - transform.x) / transform.k,
      y: (event.clientY - svgRect.top - transform.y) / transform.k
    }
  }
}

const handleCanvasDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOverCanvas.value = false
  dragPreview.value = null
  
  console.log('FunnelCanvas: Drop event received')
  
  if (!event.dataTransfer || !svgElement.value) {
    console.warn('FunnelCanvas: No dataTransfer or svgElement available')
    return
  }
  
  try {
    const jsonData = event.dataTransfer.getData('application/json')
    const textData = event.dataTransfer.getData('text/plain')
    
    console.log('FunnelCanvas: Raw drag data:', { jsonData, textData })
    
    if (jsonData) {
      const data = JSON.parse(jsonData)
      console.log('FunnelCanvas: Parsed drag data:', data)
      
      // Handle both old and new data formats
      const isValidDrop = (data.type === 'node' || data.type === 'palette-node') && data.nodeType
      
      if (isValidDrop) {
        const svgRect = svgElement.value.getBoundingClientRect()
        const transform = d3.zoomTransform(svgElement.value)
        
        // Calculate accurate canvas position
        const canvasX = (event.clientX - svgRect.left - transform.x) / transform.k
        const canvasY = (event.clientY - svgRect.top - transform.y) / transform.k
        
        const position = snapPositionToGrid({
          x: Math.max(0, canvasX - 60), // Center the node (assuming 120px width)
          y: Math.max(0, canvasY - 30)  // Center the node (assuming 60px height)
        })
        
        console.log('FunnelCanvas: Creating node:', {
          type: data.nodeType.type,
          position,
          rawPosition: { x: canvasX, y: canvasY },
          clientPosition: { x: event.clientX, y: event.clientY },
          svgRect,
          transform
        })
        
        addNewNodeFromDrop(data.nodeType, position)
      } else {
        console.warn('FunnelCanvas: Invalid drop data format:', data)
      }
    } else {
      console.warn('FunnelCanvas: No JSON data in drop event')
    }
  } catch (error) {
    console.error('FunnelCanvas: Failed to parse drop data:', error)
  }
}

const handleCanvasDragEnter = (event: DragEvent) => {
  event.preventDefault()
  
  console.log('FunnelCanvas: Drag enter detected')
  
  if (!event.dataTransfer) return
  
  try {
    const jsonData = event.dataTransfer.getData('application/json')
    if (jsonData) {
      const data = JSON.parse(jsonData)
      console.log('FunnelCanvas: Drag enter data:', data)
      
      if ((data.type === 'node' || data.type === 'palette-node') && data.nodeType) {
        isDragOverCanvas.value = true
        dragPreview.value = data.nodeType
        console.log('FunnelCanvas: Drag preview enabled for:', data.nodeType.type)
      }
    }
  } catch (error) {
    // Try to get drag type from types
    const types = event.dataTransfer.types
    console.log('FunnelCanvas: Drag types available:', types)
    
    if (types.includes('application/json')) {
      isDragOverCanvas.value = true
      console.log('FunnelCanvas: Enabling drag preview based on MIME type')
    }
  }
}

const handleCanvasDragLeave = (event: DragEvent) => {
  const target = event.relatedTarget as Element
  if (!target || !svgElement.value?.contains(target)) {
    isDragOverCanvas.value = false
    dragPreview.value = null
  }
}

const addNewNodeFromDrop = (nodeType: any, position: Position) => {
  console.log('FunnelCanvas: Creating new node from drop:', nodeType, position)
  
  // Use smart positioning to find optimal location
  const smartPosition = positionNewNode(nodeType.type).position
  const finalPosition = snapToGrid.value ? snapPositionToGrid(smartPosition) : smartPosition
  
  const newNode: Omit<FunnelNodeType, 'id'> = {
    type: nodeType.type,
    position: finalPosition,
    data: {
      label: nodeType.label,
      description: nodeType.description || '',
      config: { 
        ...nodeType.defaultConfig,
        created_from_palette: true,
        created_at: new Date().toISOString()
      }
    }
  }
  
  console.log('FunnelCanvas: Final node data:', newNode)
  
  try {
    const createdNode = addNode(newNode)
    console.log('FunnelCanvas: Node created successfully:', createdNode)
    
    // Update layout analysis
    setTimeout(() => {
      analyzeCurrentLayout()
    }, 100)
  } catch (error) {
    console.error('FunnelCanvas: Failed to create node:', error)
  }
}

const getContextInfo = (): string => {
  if (selectedNodeIds.value.length > 1) {
    return `${selectedNodeIds.value.length} 个节点已选中`
  } else if (contextMenu.value.nodeId) {
    const node = nodes.value.find(n => n.id === contextMenu.value.nodeId)
    return node ? `节点: ${node.data.label}` : '节点操作'
  }
  return '画布操作'
}

const handleContextMenuAction = (item: any) => {
  if (item.action) {
    item.action()
  }
  hideContextMenu()
}

// Provide managers for child components
const provideManagers = () => {
  provide('multiSelectionManager', multiSelectionManager.value)
  provide('batchOperationsEngine', batchOperationsEngine.value)
  provide('gestureRecognizer', gestureRecognizer.value)
  provide('snappingManager', snappingManager.value)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  // Initialize advanced interaction managers
  multiSelectionManager.value = new MultiSelectionManager()
  batchOperationsEngine.value = new BatchOperationsEngine()
  gestureRecognizer.value = new AdvancedGestureRecognition()
  snappingManager.value = new SmartSnappingAlignmentManager()
  
  // Provide managers to child components
  provideManagers()
  
  // Initialize D3
  initializeD3()
  
  // Event listeners
  document.addEventListener('click', hideContextMenu)
  document.addEventListener('keydown', handleKeyDown)
  
  // Add canvas mouse down for selection
  if (svgElement.value) {
    svgElement.value.addEventListener('mousedown', (event) => {
      if (event.target === svgElement.value || event.target === containerGroup.value) {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !isConnecting.value) {
          startSelection(event)
        }
      }
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('keydown', handleKeyDown)
  
  // Clean up performance optimizer
  performanceOptimizer.dispose()
})

// Watch for node/edge selection changes
watch(() => selectedNode.value, (node) => {
  emit('nodeSelect', node?.id || null)
})

watch(() => selectedEdge.value, (edge) => {
  emit('edgeSelect', edge?.id || null)
})

// Watch for snap to grid changes
watch(snapToGrid, (newValue) => {
  updateLayoutConfig({ snapToGrid: newValue })
})

// Watch for magnetic alignment changes
watch(enableMagneticAlignment, (newValue) => {
  updateLayoutConfig({ enableMagneticAlignment: newValue })
})

// Auto-hide panels when clicking outside
watch(() => showLayoutPanel.value, (showing) => {
  if (showing) {
    nextTick(() => {
      document.addEventListener('click', handleOutsideClick)
    })
  } else {
    document.removeEventListener('click', handleOutsideClick)
  }
})

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.layout-panel')) {
    showLayoutPanel.value = false
  }
}

// Advanced Interaction Event Handlers
const handleNodeSelect = (nodeId: string, modifiers?: { ctrl?: boolean, shift?: boolean, alt?: boolean }) => {
  selectNode(nodeId)
  emit('nodeSelect', nodeId)
}

const handleNodeMultiSelect = (nodeIds: string[]) => {
  selectedNodeIds.value = nodeIds
  emit('multiSelect', nodeIds)
}

const handleBatchUpdate = (updates: Array<{ nodeId: string, updates: Partial<FunnelNodeType> }>) => {
  // Apply batch updates through the batch operations engine
  if (batchOperationsEngine.value) {
    batchOperationsEngine.value.performBatchUpdate(updates)
  }
  
  emit('batchUpdate', updates)
}

const handleBatchDelete = (nodeIds: string[]) => {
  // Apply batch delete through the batch operations engine
  if (batchOperationsEngine.value) {
    batchOperationsEngine.value.performBatchDelete(nodeIds)
  }
  
  // Update selection
  selectedNodeIds.value = selectedNodeIds.value.filter(id => !nodeIds.includes(id))
}

const handleGestureDetected = (nodeId: string, gesture: string, data: any) => {
  activeGesture.value = gesture
  
  // Add to gesture trail if applicable
  if (data.position) {
    gestureTrail.value.push(data.position)
    
    // Limit trail length
    if (gestureTrail.value.length > 10) {
      gestureTrail.value = gestureTrail.value.slice(-10)
    }
  }
  
  emit('gestureDetected', nodeId, gesture, data)
  
  // Clear gesture trail after a delay
  setTimeout(() => {
    gestureTrail.value = []
    activeGesture.value = null
  }, 3000)
}

const handleNodeContextMenu = (nodeId: string, position: Position, event: MouseEvent) => {
  contextMenu.value = {
    show: true,
    x: position.x,
    y: position.y,
    nodeId,
    items: []
  }
  
  emit('contextMenu', nodeId, position, event)
}
</script>

<style scoped>
.funnel-canvas {
  user-select: none;
}

.edge:hover path {
  stroke-width: 3;
}

.edge.selected path {
  stroke: #3b82f6;
  stroke-width: 3;
}

.grid {
  pointer-events: none;
}

/* Dark mode adjustments */
.dark .grid pattern path {
  stroke: #374151;
}

/* Enhanced drag preview animation */
.drag-preview {
  animation: dragPreview 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.drag-preview rect {
  animation: previewPulse 1s ease-in-out infinite;
}

@keyframes dragPreview {
  from {
    opacity: 0;
    transform: scale(0.8) rotate(-2deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes previewPulse {
  0%, 100% { 
    stroke-opacity: 0.7;
    stroke-width: 2;
  }
  50% { 
    stroke-opacity: 1;
    stroke-width: 3;
  }
}

/* Canvas drag over state */
.funnel-canvas[data-drag-over="true"] {
  background-color: rgba(59, 130, 246, 0.05);
}

.funnel-canvas[data-drag-over="true"] .grid pattern path {
  stroke: #3b82f6;
  stroke-width: 1;
  opacity: 0.3;
}

/* Enhanced connection preview animations */
.connection-preview .preview-path {
  animation: dashFlow 2s linear infinite;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
}

.connection-preview .preview-cursor {
  animation: cursorPulse 1s ease-in-out infinite;
}

.connection-preview .preview-pulse {
  animation: pulsePulse 1.5s ease-in-out infinite;
}

.connection-preview .start-indicator {
  animation: startGlow 2s ease-in-out infinite;
}

@keyframes dashFlow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -24; }
}

@keyframes cursorPulse {
  0%, 100% { 
    opacity: 0.7; 
    r: 8;
  }
  50% { 
    opacity: 1; 
    r: 10;
  }
}

@keyframes pulsePulse {
  0%, 100% { 
    opacity: 0.3; 
    r: 12;
  }
  50% { 
    opacity: 0.1; 
    r: 16;
  }
}

@keyframes startGlow {
  0%, 100% { 
    filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.5));
  }
  50% { 
    filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));
  }
}

/* Enhanced grid alignment visualization */
.funnel-canvas.snap-to-grid .grid pattern path {
  stroke-width: 1;
  opacity: 0.8;
}

/* 60fps optimized transitions */
.funnel-canvas {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth GPU-accelerated transitions */
.funnel-canvas * {
  transition: opacity var(--transition-normal), 
              transform var(--transition-normal);
  will-change: transform, opacity;
}

/* Snap guides styling */
.snap-guide {
  pointer-events: none;
  animation: snapGuidePulse 2s ease-in-out infinite;
}

@keyframes snapGuidePulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

/* Layout panel styling */
.layout-panel {
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* Loading state for layout operations */
.layout-applying {
  cursor: wait !important;
}

.layout-applying * {
  pointer-events: none;
}

/* Layout quality indicator */
.quality-indicator {
  position: relative;
  overflow: hidden;
}

.quality-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Optimize for 60fps animations */
.drag-preview,
.connection-preview,
.funnel-node.dragging {
  transform: translateZ(0); /* Force GPU layer */
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>