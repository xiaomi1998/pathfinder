<template>
  <g class="flow-animation">
    <!-- Animated particles flowing along edges -->
    <g v-for="edge in activeEdges" :key="edge.id" class="flow-path">
      <!-- Flow particles -->
      <circle
        v-for="particle in getEdgeParticles(edge)"
        :key="particle.id"
        :r="particle.size"
        :fill="particle.color"
        :opacity="particle.opacity"
        class="flow-particle"
      >
        <animateMotion
          :dur="particle.duration"
          :path="getEdgePath(edge)"
          repeatCount="indefinite"
          :begin="particle.delay"
        />
        <animate
          attributeName="opacity"
          :values="particle.opacityAnimation"
          :dur="particle.duration"
          repeatCount="indefinite"
          :begin="particle.delay"
        />
      </circle>
      
      <!-- Flow intensity indicator -->
      <path
        v-if="showFlowIntensity"
        :d="getEdgePath(edge)"
        fill="none"
        :stroke="getFlowColor(edge)"
        :stroke-width="getFlowWidth(edge)"
        :opacity="getFlowOpacity(edge)"
        class="flow-intensity"
      />
    </g>
    
    <!-- Node pulsing effects for high activity -->
    <g v-for="node in highActivityNodes" :key="`pulse-${node.id}`" class="node-pulse">
      <circle
        :cx="node.position.x + nodeWidth/2"
        :cy="node.position.y + nodeHeight/2"
        :r="pulseRadius"
        fill="none"
        :stroke="getPulseColor(node)"
        stroke-width="2"
        opacity="0"
        class="pulse-ring"
      >
        <animate
          attributeName="r"
          :values="`${nodeWidth/2};${nodeWidth/2 + 20};${nodeWidth/2}`"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.8;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  </g>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { FunnelEdge, FunnelNode, FlowData } from '@/types/funnel'

interface Props {
  edges: FunnelEdge[]
  nodes: FunnelNode[]
  flowData: FlowData[]
  animationSpeed?: number
  showFlowIntensity?: boolean
  particleCount?: number
  nodeWidth?: number
  nodeHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  animationSpeed: 1,
  showFlowIntensity: true,
  particleCount: 5,
  nodeWidth: 120,
  nodeHeight: 60
})

const emit = defineEmits<{
  'flow-complete': [edgeId: string]
  'bottleneck-detected': [nodeId: string, intensity: number]
}>()

// Reactive state
const animationFrame = ref(0)
const isAnimating = ref(true)
const pulseRadius = ref(30)

// Computed properties
const activeEdges = computed(() => {
  return props.edges.filter(edge => {
    const flowData = props.flowData.find(f => f.edgeId === edge.id)
    return flowData && flowData.volume > 0
  })
})

const highActivityNodes = computed(() => {
  return props.nodes.filter(node => {
    const incomingFlow = props.flowData
      .filter(f => props.edges.find(e => e.id === f.edgeId)?.target === node.id)
      .reduce((sum, f) => sum + f.volume, 0)
    return incomingFlow > 1000 // High activity threshold
  })
})

// Methods
const getEdgePath = (edge: FunnelEdge): string => {
  const sourceNode = props.nodes.find(n => n.id === edge.source)
  const targetNode = props.nodes.find(n => n.id === edge.target)
  
  if (!sourceNode || !targetNode) return ''
  
  const sx = sourceNode.position.x + props.nodeWidth
  const sy = sourceNode.position.y + props.nodeHeight / 2
  const tx = targetNode.position.x
  const ty = targetNode.position.y + props.nodeHeight / 2
  
  const dx = tx - sx
  const dy = ty - sy
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Bezier curve for smooth flow
  const cp1x = sx + distance * 0.3
  const cp1y = sy
  const cp2x = tx - distance * 0.3
  const cp2y = ty
  
  return `M${sx},${sy} C${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`
}

const getEdgeParticles = (edge: FunnelEdge) => {
  const flowData = props.flowData.find(f => f.edgeId === edge.id)
  if (!flowData) return []
  
  const particleCount = Math.min(props.particleCount, Math.max(1, Math.floor(flowData.volume / 100)))
  const particles = []
  
  for (let i = 0; i < particleCount; i++) {
    const baseDelay = (i * 2) / props.animationSpeed
    const jitter = (Math.random() - 0.5) * 0.5
    
    particles.push({
      id: `${edge.id}-particle-${i}`,
      size: 2 + (flowData.volume / 1000) * 3, // Size based on volume
      color: getParticleColor(flowData.type),
      opacity: 0.7 + Math.random() * 0.3,
      duration: `${4 / props.animationSpeed}s`,
      delay: `${baseDelay + jitter}s`,
      opacityAnimation: '0;1;1;1;0'
    })
  }
  
  return particles
}

const getParticleColor = (type: string): string => {
  switch (type) {
    case 'user': return '#3b82f6'
    case 'conversion': return '#10b981'
    case 'event': return '#f59e0b'
    case 'error': return '#ef4444'
    default: return '#6b7280'
  }
}

const getFlowColor = (edge: FunnelEdge): string => {
  const flowData = props.flowData.find(f => f.edgeId === edge.id)
  if (!flowData) return '#e5e7eb'
  
  const intensity = Math.min(1, flowData.volume / 1000)
  const opacity = Math.round(intensity * 255).toString(16).padStart(2, '0')
  
  return `${getParticleColor(flowData.type)}${opacity}`
}

const getFlowWidth = (edge: FunnelEdge): number => {
  const flowData = props.flowData.find(f => f.edgeId === edge.id)
  if (!flowData) return 1
  
  return Math.max(2, Math.min(10, 2 + (flowData.volume / 500) * 6))
}

const getFlowOpacity = (edge: FunnelEdge): number => {
  const flowData = props.flowData.find(f => f.edgeId === edge.id)
  if (!flowData) return 0.1
  
  return Math.max(0.2, Math.min(0.8, flowData.volume / 1000))
}

const getPulseColor = (node: FunnelNode): string => {
  switch (node.type) {
    case 'start': return '#10b981'
    case 'conversion': return '#f59e0b'
    case 'end': return '#ef4444'
    default: return '#3b82f6'
  }
}

// Animation control
const startAnimation = () => {
  isAnimating.value = true
}

const stopAnimation = () => {
  isAnimating.value = false
}

const updateAnimationSpeed = (speed: number) => {
  // Update animation speed dynamically
  const elements = document.querySelectorAll('.flow-particle animateMotion, .flow-particle animate')
  elements.forEach(el => {
    const dur = el.getAttribute('dur')
    if (dur) {
      const baseDuration = parseFloat(dur.replace('s', ''))
      el.setAttribute('dur', `${baseDuration / speed}s`)
    }
  })
}

// Bottleneck detection
const detectBottlenecks = () => {
  props.nodes.forEach(node => {
    const incomingFlow = props.flowData
      .filter(f => props.edges.find(e => e.id === f.edgeId)?.target === node.id)
      .reduce((sum, f) => sum + f.volume, 0)
    
    const outgoingFlow = props.flowData
      .filter(f => props.edges.find(e => e.id === f.edgeId)?.source === node.id)
      .reduce((sum, f) => sum + f.volume, 0)
    
    if (incomingFlow > 0 && outgoingFlow / incomingFlow < 0.5) {
      const bottleneckIntensity = 1 - (outgoingFlow / incomingFlow)
      emit('bottleneck-detected', node.id, bottleneckIntensity)
    }
  })
}

// Watchers
watch(() => props.animationSpeed, (newSpeed) => {
  updateAnimationSpeed(newSpeed)
})

watch(() => props.flowData, () => {
  detectBottlenecks()
}, { deep: true })

// Lifecycle
onMounted(() => {
  startAnimation()
  detectBottlenecks()
})

onUnmounted(() => {
  stopAnimation()
})

// Expose methods
defineExpose({
  startAnimation,
  stopAnimation,
  updateAnimationSpeed
})
</script>

<style scoped>
.flow-animation {
  pointer-events: none;
}

.flow-particle {
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
}

.flow-intensity {
  transition: all 0.3s ease;
}

.pulse-ring {
  filter: drop-shadow(0 0 8px currentColor);
}

.node-pulse {
  pointer-events: none;
}

/* Performance optimization for animations */
.flow-particle,
.flow-intensity,
.pulse-ring {
  will-change: transform, opacity;
}
</style>