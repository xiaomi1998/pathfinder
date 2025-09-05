import * as d3 from 'd3'
import type { FunnelNode, Position } from '@/types/funnel'
import type { LayoutTransition, LayoutAnimationConfig } from '@/types/layout'
import { interpolatePosition, createEasingFunction } from './layout'

/**
 * Animation utilities for smooth layout transitions
 */

export interface AnimationCallback {
  onStart?: () => void
  onUpdate?: (progress: number) => void
  onComplete?: () => void
}

export class LayoutAnimator {
  private activeAnimations = new Map<string, d3.Transition<any, any, any, any>>()
  private animationQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  /**
   * Animate a single node to a new position
   */
  animateNode(
    node: FunnelNode,
    targetPosition: Position,
    duration: number = 500,
    easing: string = 'ease-in-out',
    callback?: AnimationCallback
  ): Promise<void> {
    return new Promise((resolve) => {
      const nodeId = node.id
      const startPosition = { ...node.position }
      const easingFn = createEasingFunction(easing)

      // Cancel any existing animation for this node
      this.cancelNodeAnimation(nodeId)

      callback?.onStart?.()

      const transition = d3.select({})
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)

      this.activeAnimations.set(nodeId, transition)

      transition
        .tween('position', () => {
          return (t: number) => {
            const easedT = easingFn(t)
            const currentPosition = interpolatePosition(startPosition, targetPosition, easedT)
            
            // Update node position
            node.position = currentPosition
            
            callback?.onUpdate?.(t)
          }
        })
        .on('end', () => {
          this.activeAnimations.delete(nodeId)
          node.position = targetPosition
          callback?.onComplete?.()
          resolve()
        })
        .on('interrupt', () => {
          this.activeAnimations.delete(nodeId)
          resolve()
        })
    })
  }

  /**
   * Animate multiple nodes simultaneously
   */
  async animateNodes(
    transitions: LayoutTransition[],
    config: LayoutAnimationConfig
  ): Promise<void> {
    if (transitions.length === 0) return

    const promises: Promise<void>[] = []

    transitions.forEach((transition, index) => {
      const delay = config.stagger * index
      const duration = transition.duration || config.duration

      const promise = new Promise<void>((resolve) => {
        setTimeout(() => {
          this.animateNodeTransition(transition, config.easing)
            .then(resolve)
            .catch(resolve)
        }, delay)
      })

      promises.push(promise)
    })

    await Promise.all(promises)
  }

  /**
   * Animate nodes in groups (e.g., by hierarchy level)
   */
  async animateNodesInGroups(
    nodeGroups: FunnelNode[][],
    targetPositions: Map<string, Position>,
    config: LayoutAnimationConfig
  ): Promise<void> {
    for (let groupIndex = 0; groupIndex < nodeGroups.length; groupIndex++) {
      const group = nodeGroups[groupIndex]
      const groupPromises: Promise<void>[] = []

      group.forEach((node, nodeIndex) => {
        const targetPosition = targetPositions.get(node.id)
        if (!targetPosition) return

        const delay = config.stagger * nodeIndex
        const promise = new Promise<void>((resolve) => {
          setTimeout(() => {
            this.animateNode(node, targetPosition, config.duration, config.easing)
              .then(resolve)
              .catch(resolve)
          }, delay)
        })

        groupPromises.push(promise)
      })

      // Wait for current group to complete before starting next group
      await Promise.all(groupPromises)
    }
  }

  /**
   * Create a spring animation for more natural movement
   */
  animateNodeWithSpring(
    node: FunnelNode,
    targetPosition: Position,
    springConfig: {
      stiffness: number
      damping: number
      mass: number
    } = { stiffness: 0.15, damping: 0.8, mass: 1 },
    callback?: AnimationCallback
  ): Promise<void> {
    return new Promise((resolve) => {
      const nodeId = node.id
      const startPosition = { ...node.position }
      let currentPosition = { ...startPosition }
      let velocity = { x: 0, y: 0 }
      
      const { stiffness, damping, mass } = springConfig

      callback?.onStart?.()

      let animationFrame: number
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const deltaTime = Math.min((currentTime - startTime) / 1000, 0.016) // Cap at 60fps
        
        // Spring physics calculations
        const springForceX = (targetPosition.x - currentPosition.x) * stiffness
        const springForceY = (targetPosition.y - currentPosition.y) * stiffness
        
        const dampingForceX = velocity.x * damping
        const dampingForceY = velocity.y * damping
        
        const accelerationX = (springForceX - dampingForceX) / mass
        const accelerationY = (springForceY - dampingForceY) / mass
        
        velocity.x += accelerationX * deltaTime
        velocity.y += accelerationY * deltaTime
        
        currentPosition.x += velocity.x * deltaTime
        currentPosition.y += velocity.y * deltaTime
        
        // Update node position
        node.position = { ...currentPosition }
        
        // Check if animation should continue
        const distanceToTarget = Math.sqrt(
          Math.pow(targetPosition.x - currentPosition.x, 2) + 
          Math.pow(targetPosition.y - currentPosition.y, 2)
        )
        const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        
        const progress = Math.max(0, Math.min(1, 1 - distanceToTarget / 100))
        callback?.onUpdate?.(progress)
        
        if (distanceToTarget > 0.5 || velocityMagnitude > 0.5) {
          animationFrame = requestAnimationFrame(animate)
        } else {
          // Animation complete
          node.position = targetPosition
          this.activeAnimations.delete(nodeId)
          callback?.onComplete?.()
          resolve()
        }
      }

      // Cancel any existing animation
      this.cancelNodeAnimation(nodeId)
      
      animationFrame = requestAnimationFrame(animate)
      
      // Store reference for cancellation
      this.activeAnimations.set(nodeId, {
        interrupt: () => {
          cancelAnimationFrame(animationFrame)
          this.activeAnimations.delete(nodeId)
        }
      } as any)
    })
  }

  /**
   * Animate layout changes with morphing effects
   */
  async morphLayout(
    fromNodes: FunnelNode[],
    toNodes: FunnelNode[],
    duration: number = 800
  ): Promise<void> {
    const nodeMap = new Map(toNodes.map(n => [n.id, n]))
    const promises: Promise<void>[] = []

    fromNodes.forEach(fromNode => {
      const toNode = nodeMap.get(fromNode.id)
      if (!toNode) return

      const promise = this.animateNodeWithSpring(
        fromNode,
        toNode.position,
        { stiffness: 0.12, damping: 0.7, mass: 1.2 }
      )

      promises.push(promise)
    })

    await Promise.all(promises)
  }

  /**
   * Create entrance animations for new nodes
   */
  animateNodeEntrance(
    node: FunnelNode,
    entranceType: 'fade' | 'scale' | 'slide' | 'bounce' = 'scale',
    duration: number = 400
  ): Promise<void> {
    return new Promise((resolve) => {
      const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
      if (!nodeElement) {
        resolve()
        return
      }

      const element = d3.select(nodeElement)
      
      switch (entranceType) {
        case 'fade':
          element
            .style('opacity', '0')
            .transition()
            .duration(duration)
            .ease(d3.easeQuadOut)
            .style('opacity', '1')
            .on('end', resolve)
          break

        case 'scale':
          element
            .style('transform', 'scale(0)')
            .style('transform-origin', 'center')
            .transition()
            .duration(duration)
            .ease(d3.easeBackOut.overshoot(1.7))
            .style('transform', 'scale(1)')
            .on('end', resolve)
          break

        case 'slide':
          const originalTransform = element.style('transform') || ''
          element
            .style('transform', `${originalTransform} translateY(-20px)`)
            .style('opacity', '0')
            .transition()
            .duration(duration)
            .ease(d3.easeQuadOut)
            .style('transform', originalTransform)
            .style('opacity', '1')
            .on('end', resolve)
          break

        case 'bounce':
          element
            .style('transform', 'scale(0) translateY(-10px)')
            .style('opacity', '0')
            .transition()
            .duration(duration)
            .ease(d3.easeBounceOut)
            .style('transform', 'scale(1) translateY(0px)')
            .style('opacity', '1')
            .on('end', resolve)
          break

        default:
          resolve()
      }
    })
  }

  /**
   * Create exit animations for removed nodes
   */
  animateNodeExit(
    node: FunnelNode,
    exitType: 'fade' | 'scale' | 'slide' = 'scale',
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
      if (!nodeElement) {
        resolve()
        return
      }

      const element = d3.select(nodeElement)
      
      switch (exitType) {
        case 'fade':
          element
            .transition()
            .duration(duration)
            .ease(d3.easeQuadIn)
            .style('opacity', '0')
            .on('end', resolve)
          break

        case 'scale':
          element
            .transition()
            .duration(duration)
            .ease(d3.easeBackIn.overshoot(1.7))
            .style('transform', 'scale(0)')
            .style('opacity', '0')
            .on('end', resolve)
          break

        case 'slide':
          element
            .transition()
            .duration(duration)
            .ease(d3.easeQuadIn)
            .style('transform', 'translateY(-20px)')
            .style('opacity', '0')
            .on('end', resolve)
          break

        default:
          resolve()
      }
    })
  }

  /**
   * Queue animations to prevent conflicts
   */
  queueAnimation(animationFn: () => Promise<void>): Promise<void> {
    return new Promise((resolve) => {
      this.animationQueue.push(async () => {
        await animationFn()
        resolve()
      })

      if (!this.isProcessingQueue) {
        this.processAnimationQueue()
      }
    })
  }

  /**
   * Cancel animation for a specific node
   */
  cancelNodeAnimation(nodeId: string): void {
    const animation = this.activeAnimations.get(nodeId)
    if (animation && typeof animation.interrupt === 'function') {
      animation.interrupt()
    }
    this.activeAnimations.delete(nodeId)
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    this.activeAnimations.forEach((animation, nodeId) => {
      if (typeof animation.interrupt === 'function') {
        animation.interrupt()
      }
    })
    this.activeAnimations.clear()
    this.animationQueue = []
    this.isProcessingQueue = false
  }

  /**
   * Process animation queue sequentially
   */
  private async processAnimationQueue(): Promise<void> {
    if (this.isProcessingQueue) return
    this.isProcessingQueue = true

    while (this.animationQueue.length > 0) {
      const animation = this.animationQueue.shift()
      if (animation) {
        await animation()
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * Animate a single transition
   */
  private animateNodeTransition(
    transition: LayoutTransition,
    easing: string
  ): Promise<void> {
    const easingFn = createEasingFunction(easing)
    
    return new Promise((resolve) => {
      const startTime = performance.now()
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / transition.duration, 1)
        const easedProgress = easingFn(progress)
        
        const currentPosition = interpolatePosition(
          transition.fromPosition,
          transition.toPosition,
          easedProgress
        )
        
        // This would update the actual node position
        // The implementation depends on how nodes are managed
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(animate)
    })
  }

  /**
   * Get the number of active animations
   */
  get activeAnimationCount(): number {
    return this.activeAnimations.size
  }

  /**
   * Check if any animations are currently running
   */
  get isAnimating(): boolean {
    return this.activeAnimations.size > 0 || this.isProcessingQueue
  }
}

// Export a global instance
export const layoutAnimator = new LayoutAnimator()

/**
 * Utility functions for common animation patterns
 */

/**
 * Animate a collection of nodes with staggered timing
 */
export function staggeredAnimation(
  nodes: FunnelNode[],
  animationFn: (node: FunnelNode, index: number) => Promise<void>,
  stagger: number = 100
): Promise<void> {
  return new Promise((resolve) => {
    let completedAnimations = 0
    const totalAnimations = nodes.length

    if (totalAnimations === 0) {
      resolve()
      return
    }

    nodes.forEach((node, index) => {
      setTimeout(() => {
        animationFn(node, index).then(() => {
          completedAnimations++
          if (completedAnimations === totalAnimations) {
            resolve()
          }
        })
      }, stagger * index)
    })
  })
}

/**
 * Create a wave animation effect
 */
export function waveAnimation(
  nodes: FunnelNode[],
  animationFn: (node: FunnelNode) => Promise<void>,
  waveSpeed: number = 50
): Promise<void> {
  // Sort nodes by position to create wave effect
  const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x)
  
  return staggeredAnimation(sortedNodes, animationFn, waveSpeed)
}

/**
 * Create a ripple animation effect from a center point
 */
export function rippleAnimation(
  nodes: FunnelNode[],
  centerPoint: Position,
  animationFn: (node: FunnelNode, distance: number) => Promise<void>,
  rippleSpeed: number = 30
): Promise<void> {
  // Calculate distances from center and sort by distance
  const nodesWithDistance = nodes.map(node => {
    const distance = Math.sqrt(
      Math.pow(node.position.x - centerPoint.x, 2) +
      Math.pow(node.position.y - centerPoint.y, 2)
    )
    return { node, distance }
  }).sort((a, b) => a.distance - b.distance)

  return new Promise((resolve) => {
    let completedAnimations = 0
    const totalAnimations = nodesWithDistance.length

    if (totalAnimations === 0) {
      resolve()
      return
    }

    nodesWithDistance.forEach(({ node, distance }, index) => {
      const delay = (distance / rippleSpeed) * 10 // Adjust multiplier as needed
      
      setTimeout(() => {
        animationFn(node, distance).then(() => {
          completedAnimations++
          if (completedAnimations === totalAnimations) {
            resolve()
          }
        })
      }, delay)
    })
  })
}