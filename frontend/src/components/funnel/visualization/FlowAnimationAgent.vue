<template>
  <g class="flow-animation-agent">
    <!-- Particle systems for different data types -->
    <g v-for="flow in activeFlows" :key="flow.id" class="flow-system">
      <!-- Flow path definition -->
      <defs>
        <path :id="`flow-path-${flow.id}`" :d="flow.path" />
      </defs>
      
      <!-- Animated particles -->
      <g v-for="particle in flow.particles" :key="particle.id" class="particle-group">
        <circle
          :r="particle.radius"
          :fill="particle.color"
          :opacity="particle.opacity"
          class="flow-particle"
          :class="`particle-${particle.type}`"
        >
          <!-- Motion animation along path -->
          <animateMotion
            :dur="`${particle.duration}s`"
            :repeatCount="particle.repeat ? 'indefinite' : '1'"
            :begin="particle.delay ? `${particle.delay}s` : '0s'"
            rotate="auto"
            :path="flow.path"
          >
            <!-- Speed variations based on flow volume -->
            <mpath :href="`#flow-path-${flow.id}`"/>
          </animateMotion>
          
          <!-- Pulse animation for emphasis -->
          <animate
            v-if="particle.pulse"
            attributeName="r"
            :values="`${particle.radius * 0.8};${particle.radius * 1.2};${particle.radius * 0.8}`"
            :dur="`${particle.pulseDuration || 1}s`"
            repeatCount="indefinite"
          />
          
          <!-- Opacity animation for lifecycle -->
          <animate
            attributeName="opacity"
            :values="`0;${particle.opacity};${particle.opacity};0`"
            :dur="`${particle.duration}s`"
            :repeatCount="particle.repeat ? 'indefinite' : '1'"
            :begin="particle.delay ? `${particle.delay}s` : '0s'"
          />
        </circle>
        
        <!-- Particle trail effect -->
        <circle
          v-if="particle.trail"
          :r="particle.radius * 0.6"
          :fill="particle.color"
          :opacity="particle.opacity * 0.3"
          class="particle-trail"
        >
          <animateMotion
            :dur="`${particle.duration * 1.2}s`"
            :repeatCount="particle.repeat ? 'indefinite' : '1'"
            :begin="particle.delay ? `${particle.delay + 0.1}s` : '0.1s'"
            :path="flow.path"
          />
        </circle>
      </g>
      
      <!-- Flow volume visualization (line thickness variation) -->
      <path
        :d="flow.path"
        fill="none"
        :stroke="flow.volumeColor"
        :stroke-width="flow.volumeWidth"
        :stroke-opacity="flow.volumeOpacity"
        class="volume-indicator"
        :stroke-dasharray="flow.animated ? '8,4' : 'none'"
      >
        <!-- Volume pulsing animation -->
        <animate
          v-if="flow.volumePulse"
          attributeName="stroke-width"
          :values="`${flow.volumeWidth * 0.8};${flow.volumeWidth * 1.2};${flow.volumeWidth * 0.8}`"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      
      <!-- Data burst effects for high activity -->
      <g v-if="flow.burst" class="burst-effect">
        <circle
          v-for="(burst, index) in flow.burstParticles"
          :key="`burst-${index}`"
          :cx="burst.x"
          :cy="burst.y"
          :r="burst.radius"
          :fill="burst.color"
          :opacity="burst.opacity"
          class="burst-particle"
        >
          <animate
            attributeName="r"
            values="0;20;0"
            dur="0.8s"
            :begin="`${burst.delay}s`"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.6;0"
            dur="0.8s"
            :begin="`${burst.delay}s`"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </g>
    
    <!-- Flow congestion indicators -->
    <g v-for="bottleneck in bottlenecks" :key="bottleneck.id" class="bottleneck-indicator">
      <circle
        :cx="bottleneck.position.x"
        :cy="bottleneck.position.y"
        :r="bottleneck.severity * 8"
        fill="none"
        stroke="#ef4444"
        :stroke-width="2"
        opacity="0.7"
        class="bottleneck-ring"
      >
        <animate
          attributeName="r"
          :values="`${bottleneck.severity * 6};${bottleneck.severity * 10};${bottleneck.severity * 6}`"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.3;0.8;0.3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  </g>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { FunnelNode, FunnelEdge, Position } from '@/types/funnel'

// Props
interface Props {
  nodes: FunnelNode[]
  edges: FunnelEdge[]
  flowData: FlowDataPoint[]
  animationSpeed?: number
  particleCount?: number
  showVolumeIndicators?: boolean
  showBottlenecks?: boolean
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animationSpeed: 1,
  particleCount: 50,
  showVolumeIndicators: true,
  showBottlenecks: true,
  enabled: true
})

const emit = defineEmits<{
  particleComplete: [particleId: string, nodeId: string]
  bottleneckDetected: [nodeId: string, severity: number]
  flowUpdate: [flowId: string, metrics: FlowMetrics]
}>()

// Types
interface FlowDataPoint {
  id: string
  sourceId: string
  targetId: string
  type: 'user' | 'event' | 'conversion' | 'data'
  volume: number
  speed: number
  timestamp: number
  metadata?: Record<string, any>
}

interface AnimatedFlow {
  id: string
  path: string
  particles: FlowParticle[]
  volumeColor: string
  volumeWidth: number
  volumeOpacity: number
  volumePulse: boolean
  animated: boolean
  burst: boolean
  burstParticles: BurstParticle[]
}

interface FlowParticle {
  id: string
  type: 'user' | 'event' | 'conversion' | 'data'
  radius: number
  color: string
  opacity: number
  duration: number
  delay: number
  repeat: boolean
  pulse: boolean
  pulseDuration?: number
  trail: boolean
}

interface BurstParticle {
  x: number
  y: number
  radius: number
  color: string
  opacity: number
  delay: number
}

interface FlowMetrics {
  throughput: number
  averageLatency: number
  errorRate: number
  bottleneckScore: number
}

interface Bottleneck {
  id: string
  position: Position
  severity: number // 1-3 scale
  cause: string
}

// State
const activeFlows = ref<AnimatedFlow[]>([])
const bottlenecks = ref<Bottleneck[]>([])
const animationFrame = ref<number>()
const lastUpdateTime = ref<number>(0)
const particleIdCounter = ref(0)

// Particle type configurations
const particleConfig = {
  user: {
    radius: 4,
    color: '#3b82f6',
    opacity: 0.8,
    duration: 3,
    pulse: true,
    trail: true
  },
  event: {
    radius: 3,
    color: '#10b981',
    opacity: 0.7,
    duration: 2,
    pulse: false,
    trail: false
  },
  conversion: {
    radius: 6,
    color: '#f59e0b',
    opacity: 0.9,
    duration: 4,
    pulse: true,
    trail: true
  },
  data: {
    radius: 2,
    color: '#8b5cf6',
    opacity: 0.6,
    duration: 1.5,
    pulse: false,
    trail: false
  }
}

// Computed
const flowsByEdge = computed(() => {
  const flowMap = new Map<string, FlowDataPoint[]>()
  
  props.flowData.forEach(flow => {
    const edgeId = `${flow.sourceId}-${flow.targetId}`
    if (!flowMap.has(edgeId)) {
      flowMap.set(edgeId, [])
    }
    flowMap.get(edgeId)!.push(flow)
  })
  
  return flowMap
})

// Methods
const createFlowPath = (sourceNode: FunnelNode, targetNode: FunnelNode): string => {
  const sourceX = sourceNode.position.x + 120 // Right edge
  const sourceY = sourceNode.position.y + 30  // Middle
  const targetX = targetNode.position.x       // Left edge
  const targetY = targetNode.position.y + 30  // Middle
  
  const dx = targetX - sourceX
  const controlOffset = Math.max(Math.abs(dx) * 0.5, 80)
  
  const cp1x = sourceX + controlOffset
  const cp1y = sourceY
  const cp2x = targetX - controlOffset
  const cp2y = targetY
  
  return `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`
}

const createParticles = (flow: FlowDataPoint[], pathId: string): FlowParticle[] => {
  const particles: FlowParticle[] = []
  const particlesPerFlow = Math.min(Math.ceil(flow.length / 10), props.particleCount)
  
  flow.slice(0, particlesPerFlow).forEach((dataPoint, index) => {
    const config = particleConfig[dataPoint.type]
    
    particles.push({
      id: `particle-${particleIdCounter.value++}`,
      type: dataPoint.type,
      radius: config.radius * (0.8 + dataPoint.volume * 0.4),
      color: config.color,
      opacity: config.opacity,
      duration: config.duration / (dataPoint.speed * props.animationSpeed),
      delay: index * 0.2,
      repeat: true,
      pulse: config.pulse && dataPoint.volume > 0.5,
      pulseDuration: 1 + dataPoint.volume,
      trail: config.trail && dataPoint.volume > 0.3
    })
  })
  
  return particles
}

const createBurstEffect = (position: Position, flowData: FlowDataPoint[]): BurstParticle[] => {
  if (flowData.length < 10) return []
  
  const burstCount = Math.min(Math.ceil(flowData.length / 20), 8)
  const bursts: BurstParticle[] = []
  
  for (let i = 0; i < burstCount; i++) {
    bursts.push({
      x: position.x + (Math.random() - 0.5) * 40,
      y: position.y + (Math.random() - 0.5) * 40,
      radius: 4 + Math.random() * 6,
      color: '#f59e0b',
      opacity: 0.6,
      delay: i * 0.1
    })
  }
  
  return bursts
}

const calculateVolumeIndicators = (flowData: FlowDataPoint[]) => {
  const totalVolume = flowData.reduce((sum, flow) => sum + flow.volume, 0)
  const avgVolume = totalVolume / flowData.length
  
  return {
    width: Math.max(2, Math.min(avgVolume * 8, 12)),
    color: avgVolume > 0.7 ? '#ef4444' : avgVolume > 0.4 ? '#f59e0b' : '#10b981',
    opacity: 0.3 + avgVolume * 0.4,
    pulse: avgVolume > 0.8
  }
}

const detectBottlenecks = () => {
  const nodeFlowCount = new Map<string, number>()
  
  // Count flows per node
  props.flowData.forEach(flow => {
    nodeFlowCount.set(flow.targetId, (nodeFlowCount.get(flow.targetId) || 0) + 1)
  })
  
  const newBottlenecks: Bottleneck[] = []
  
  props.nodes.forEach(node => {
    const flowCount = nodeFlowCount.get(node.id) || 0
    const threshold = 20 // Configurable threshold
    
    if (flowCount > threshold) {
      const severity = Math.min(Math.ceil(flowCount / threshold), 3)
      newBottlenecks.push({
        id: `bottleneck-${node.id}`,
        position: {
          x: node.position.x + 60,
          y: node.position.y + 30
        },
        severity,
        cause: 'high_throughput'
      })
      
      emit('bottleneckDetected', node.id, severity)
    }
  })
  
  bottlenecks.value = newBottlenecks
}

const updateFlows = () => {
  if (!props.enabled || props.flowData.length === 0) {
    activeFlows.value = []
    return
  }
  
  const newFlows: AnimatedFlow[] = []
  
  props.edges.forEach(edge => {
    const sourceNode = props.nodes.find(n => n.id === edge.source)
    const targetNode = props.nodes.find(n => n.id === edge.target)
    
    if (!sourceNode || !targetNode) return
    
    const edgeFlowData = flowsByEdge.value.get(`${edge.source}-${edge.target}`) || []
    if (edgeFlowData.length === 0) return
    
    const path = createFlowPath(sourceNode, targetNode)
    const particles = createParticles(edgeFlowData, edge.id)
    const volumeIndicators = calculateVolumeIndicators(edgeFlowData)
    
    const flow: AnimatedFlow = {
      id: edge.id,
      path,
      particles,
      volumeColor: volumeIndicators.color,
      volumeWidth: volumeIndicators.width,
      volumeOpacity: volumeIndicators.opacity,
      volumePulse: volumeIndicators.pulse,
      animated: edgeFlowData.length > 5,
      burst: edgeFlowData.length > 15,
      burstParticles: edgeFlowData.length > 15 ? 
        createBurstEffect(targetNode.position, edgeFlowData) : []
    }
    
    newFlows.push(flow)
    
    // Emit flow metrics
    const metrics: FlowMetrics = {
      throughput: edgeFlowData.length,
      averageLatency: edgeFlowData.reduce((sum, f) => sum + f.speed, 0) / edgeFlowData.length,
      errorRate: edgeFlowData.filter(f => f.metadata?.error).length / edgeFlowData.length,
      bottleneckScore: Math.min(edgeFlowData.length / 20, 1)
    }
    
    emit('flowUpdate', edge.id, metrics)
  })
  
  activeFlows.value = newFlows
  
  if (props.showBottlenecks) {
    detectBottlenecks()
  }
}

const startAnimation = () => {
  if (!props.enabled) return
  
  const animate = (timestamp: number) => {
    if (timestamp - lastUpdateTime.value > 1000) { // Update every second
      updateFlows()
      lastUpdateTime.value = timestamp
    }
    
    animationFrame.value = requestAnimationFrame(animate)
  }
  
  animationFrame.value = requestAnimationFrame(animate)
}

const stopAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = undefined
  }
}

// Watchers
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    startAnimation()
  } else {
    stopAnimation()
    activeFlows.value = []
    bottlenecks.value = []
  }
})

watch(() => props.flowData, () => {
  if (props.enabled) {
    updateFlows()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  if (props.enabled) {
    updateFlows()
    startAnimation()
  }
})

onUnmounted(() => {
  stopAnimation()
})

// Expose methods for external control
defineExpose({
  updateFlows,
  startAnimation,
  stopAnimation,
  getActiveFlows: () => activeFlows.value,
  getBottlenecks: () => bottlenecks.value
})
</script>

<style scoped>
.flow-animation-agent {
  pointer-events: none;
}

.flow-particle {
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}

.particle-user {
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}

.particle-conversion {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
}

.particle-event {
  filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.4));
}

.particle-data {
  filter: drop-shadow(0 0 2px rgba(139, 92, 246, 0.4));
}

.particle-trail {
  filter: blur(1px);
}

.volume-indicator {
  transition: stroke-width 0.3s ease, stroke-opacity 0.3s ease;
}

.bottleneck-ring {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
}

.burst-particle {
  fill-opacity: 0.4;
  filter: blur(0.5px);
}

/* Performance optimizations */
.flow-particle,
.particle-trail,
.burst-particle {
  will-change: transform;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .flow-particle {
    r: calc(var(--particle-radius, 3) * 0.8);
  }
  
  .particle-trail {
    display: none;
  }
  
  .burst-effect {
    display: none;
  }
}
</style>