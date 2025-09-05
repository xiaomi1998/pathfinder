<template>
  <div
    v-if="active"
    ref="selectionBox"
    class="multi-selection-box"
    :style="boxStyle"
  >
    <!-- Selection rectangle -->
    <div class="selection-rectangle">
      <!-- Corner handles for resize (optional) -->
      <div v-if="showHandles" class="selection-handles">
        <div class="handle top-left"></div>
        <div class="handle top-right"></div>
        <div class="handle bottom-left"></div>
        <div class="handle bottom-right"></div>
      </div>
      
      <!-- Selection info tooltip -->
      <div v-if="showInfo && selectedCount > 0" class="selection-info">
        <span class="selection-count">{{ selectedCount }}</span>
        <span class="selection-text">项目已选中</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Vector2D } from '@/utils/math-precision'

interface Props {
  active?: boolean
  startPosition?: Vector2D
  endPosition?: Vector2D
  selectedCount?: number
  showHandles?: boolean
  showInfo?: boolean
  theme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  selectedCount: 0,
  showHandles: false,
  showInfo: true,
  theme: 'primary'
})

const emit = defineEmits<{
  resize: [bounds: { x: number, y: number, width: number, height: number }]
  move: [position: Vector2D]
}>()

// Refs
const selectionBox = ref<HTMLElement>()

// Computed styles
const boxStyle = computed(() => {
  if (!props.startPosition || !props.endPosition) {
    return {
      display: 'none'
    }
  }

  const x = Math.min(props.startPosition.x, props.endPosition.x)
  const y = Math.min(props.startPosition.y, props.endPosition.y)
  const width = Math.abs(props.endPosition.x - props.startPosition.x)
  const height = Math.abs(props.endPosition.y - props.startPosition.y)

  return {
    position: 'absolute' as const,
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: 'translateZ(0)', // Hardware acceleration
    pointerEvents: 'none' as const,
    zIndex: 1000
  }
})

// Theme colors
const themeColors = computed(() => {
  const themes = {
    primary: {
      border: '#3b82f6',
      background: 'rgba(59, 130, 246, 0.1)',
      shadow: 'rgba(59, 130, 246, 0.3)'
    },
    secondary: {
      border: '#8b5cf6',
      background: 'rgba(139, 92, 246, 0.1)',
      shadow: 'rgba(139, 92, 246, 0.3)'
    },
    success: {
      border: '#10b981',
      background: 'rgba(16, 185, 129, 0.1)',
      shadow: 'rgba(16, 185, 129, 0.3)'
    },
    warning: {
      border: '#f59e0b',
      background: 'rgba(245, 158, 11, 0.1)',
      shadow: 'rgba(245, 158, 11, 0.3)'
    },
    danger: {
      border: '#ef4444',
      background: 'rgba(239, 68, 68, 0.1)',
      shadow: 'rgba(239, 68, 68, 0.3)'
    }
  }
  
  return themes[props.theme]
})

// Watch for active state changes
watch(() => props.active, (newActive) => {
  if (newActive) {
    document.body.classList.add('selecting')
  } else {
    document.body.classList.remove('selecting')
  }
})

// Lifecycle
onMounted(() => {
  // Apply theme colors to CSS custom properties
  if (selectionBox.value) {
    const colors = themeColors.value
    selectionBox.value.style.setProperty('--selection-border', colors.border)
    selectionBox.value.style.setProperty('--selection-background', colors.background)
    selectionBox.value.style.setProperty('--selection-shadow', colors.shadow)
  }
})

onUnmounted(() => {
  document.body.classList.remove('selecting')
})
</script>

<style scoped>
.multi-selection-box {
  --selection-border: #3b82f6;
  --selection-background: rgba(59, 130, 246, 0.1);
  --selection-shadow: rgba(59, 130, 246, 0.3);
}

.selection-rectangle {
  width: 100%;
  height: 100%;
  border: 2px dashed var(--selection-border);
  background: var(--selection-background);
  border-radius: 4px;
  position: relative;
  animation: selectionPulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 1px var(--selection-shadow);
}

@keyframes selectionPulse {
  0%, 100% {
    border-opacity: 0.8;
    background-opacity: 0.8;
  }
  50% {
    border-opacity: 1;
    background-opacity: 1;
  }
}

/* Selection handles */
.selection-handles {
  position: absolute;
  inset: -4px;
  pointer-events: auto;
}

.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--selection-border);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.handle:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.handle.top-left {
  top: 0;
  left: 0;
  cursor: nw-resize;
}

.handle.top-right {
  top: 0;
  right: 0;
  cursor: ne-resize;
}

.handle.bottom-left {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
}

.handle.bottom-right {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

/* Selection info tooltip */
.selection-info {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--selection-border);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: tooltipSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.selection-info::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--selection-border);
}

@keyframes tooltipSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.selection-count {
  font-weight: 600;
  margin-right: 4px;
}

.selection-text {
  opacity: 0.9;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .selection-rectangle {
    border-width: 3px;
  }
  
  .handle {
    width: 12px;
    height: 12px;
    border-width: 3px;
  }
  
  .selection-info {
    font-size: 14px;
    padding: 6px 12px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .handle {
    border-color: #1f2937;
  }
  
  .selection-info {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
  }
}
</style>

<style>
/* Global styles for selection mode */
body.selecting {
  cursor: crosshair !important;
  user-select: none !important;
}

body.selecting * {
  cursor: crosshair !important;
}
</style>