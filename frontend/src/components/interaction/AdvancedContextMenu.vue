<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="advanced-context-menu"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <!-- Menu backdrop for blur effect -->
      <div class="menu-backdrop"></div>
      
      <!-- Main menu content -->
      <div class="menu-content">
        <!-- Header section (if applicable) -->
        <div v-if="showHeader && selectedItems.length > 0" class="menu-header">
          <div class="header-info">
            <span class="selection-count">{{ selectedItems.length }}</span>
            <span class="selection-text">项目已选择</span>
          </div>
        </div>

        <!-- Menu sections -->
        <div class="menu-sections">
          <template v-for="(section, sectionIndex) in menuSections" :key="sectionIndex">
            <!-- Section header -->
            <div v-if="section.label" class="section-header">
              <span class="section-label">{{ section.label }}</span>
            </div>

            <!-- Menu items -->
            <div class="section-items">
              <template v-for="(item, itemIndex) in section.items" :key="`${sectionIndex}-${itemIndex}`">
                <!-- Divider -->
                <div v-if="item.type === 'divider'" class="menu-divider"></div>
                
                <!-- Submenu -->
                <div
                  v-else-if="item.type === 'submenu'"
                  class="menu-item submenu"
                  :class="{ disabled: item.disabled }"
                  @mouseenter="handleSubmenuHover(item, $event)"
                  @mouseleave="handleSubmenuLeave"
                  @click="handleSubmenuClick(item)"
                >
                  <div class="item-icon">
                    <component :is="item.icon" class="w-4 h-4" />
                  </div>
                  <span class="item-label">{{ item.label }}</span>
                  <div class="submenu-arrow">
                    <ChevronRightIcon class="w-3 h-3" />
                  </div>
                  <span v-if="item.shortcut" class="item-shortcut">{{ item.shortcut }}</span>
                </div>

                <!-- Regular menu item -->
                <div
                  v-else
                  class="menu-item"
                  :class="{
                    disabled: item.disabled,
                    destructive: item.destructive,
                    highlighted: item.highlighted
                  }"
                  @click="handleItemClick(item)"
                  @mouseenter="highlightedIndex = getItemIndex(sectionIndex, itemIndex)"
                >
                  <div class="item-icon">
                    <component :is="item.icon" class="w-4 h-4" />
                  </div>
                  <span class="item-label">{{ item.label }}</span>
                  <div v-if="item.badge" class="item-badge">{{ item.badge }}</div>
                  <span v-if="item.shortcut" class="item-shortcut">{{ item.shortcut }}</span>
                </div>
              </template>
            </div>

            <!-- Section divider -->
            <div v-if="sectionIndex < menuSections.length - 1" class="section-divider"></div>
          </template>
        </div>

        <!-- Footer section (if applicable) -->
        <div v-if="showFooter" class="menu-footer">
          <div class="footer-info">
            <span class="context-info">{{ contextInfo }}</span>
          </div>
        </div>
      </div>

      <!-- Submenu -->
      <AdvancedContextMenu
        v-if="activeSubmenu"
        :visible="!!activeSubmenu"
        :position="submenuPosition"
        :items="activeSubmenu.items"
        :selected-items="selectedItems"
        :parent-menu="true"
        @close="closeSubmenu"
        @item-click="handleSubmenuItemClick"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

interface MenuItem {
  type?: 'item' | 'divider' | 'submenu'
  label?: string
  icon?: any
  action?: () => void
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
  highlighted?: boolean
  badge?: string | number
  items?: MenuItem[] // For submenus
}

interface MenuSection {
  label?: string
  items: MenuItem[]
}

interface Props {
  visible?: boolean
  position?: { x: number; y: number }
  items?: MenuItem[]
  sections?: MenuSection[]
  selectedItems?: any[]
  showHeader?: boolean
  showFooter?: boolean
  contextInfo?: string
  parentMenu?: boolean
  theme?: 'light' | 'dark' | 'auto'
  animation?: 'none' | 'fade' | 'scale' | 'slide'
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: () => ({ x: 0, y: 0 }),
  items: () => [],
  selectedItems: () => [],
  showHeader: false,
  showFooter: false,
  contextInfo: '',
  parentMenu: false,
  theme: 'auto',
  animation: 'scale'
})

const emit = defineEmits<{
  close: []
  'item-click': [item: MenuItem]
}>()

// Refs
const menuRef = ref<HTMLElement>()
const highlightedIndex = ref(-1)
const activeSubmenu = ref<MenuItem | null>(null)
const submenuPosition = ref({ x: 0, y: 0 })

// Computed menu sections
const menuSections = computed<MenuSection[]>(() => {
  if (props.sections && props.sections.length > 0) {
    return props.sections
  }
  
  // Convert flat items to a single section
  return [{
    items: props.items
  }]
})

// Menu positioning
const menuStyle = computed(() => {
  const { x, y } = props.position
  
  // Basic positioning - will be refined after mount
  return {
    position: 'fixed' as const,
    left: `${x}px`,
    top: `${y}px`,
    zIndex: props.parentMenu ? 1001 : 1000,
    transform: 'translateZ(0)', // Hardware acceleration
    transformOrigin: 'top left',
    animation: getAnimation()
  }
})

const getAnimation = (): string => {
  const duration = '200ms'
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
  
  switch (props.animation) {
    case 'fade':
      return `menuFadeIn ${duration} ${easing}`
    case 'scale':
      return `menuScaleIn ${duration} ${easing}`
    case 'slide':
      return `menuSlideIn ${duration} ${easing}`
    default:
      return 'none'
  }
}

// Get flattened item index
const getItemIndex = (sectionIndex: number, itemIndex: number): number => {
  let index = 0
  for (let s = 0; s < sectionIndex; s++) {
    index += menuSections.value[s].items.length
  }
  return index + itemIndex
}

// Event handlers
const handleItemClick = (item: MenuItem) => {
  if (item.disabled) return
  
  if (item.action) {
    item.action()
  }
  
  emit('item-click', item)
  emit('close')
}

const handleSubmenuHover = (item: MenuItem, event: MouseEvent) => {
  if (item.disabled || !item.items) return
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  submenuPosition.value = {
    x: rect.right + 4,
    y: rect.top
  }
  
  activeSubmenu.value = item
}

const handleSubmenuLeave = () => {
  // Don't close submenu immediately - let mouse move to submenu
  setTimeout(() => {
    if (!isMouseOverSubmenu()) {
      activeSubmenu.value = null
    }
  }, 100)
}

const handleSubmenuClick = (item: MenuItem) => {
  if (item.disabled) return
  
  // Toggle submenu on click
  if (activeSubmenu.value === item) {
    activeSubmenu.value = null
  } else {
    activeSubmenu.value = item
  }
}

const handleSubmenuItemClick = (item: MenuItem) => {
  emit('item-click', item)
  emit('close')
}

const closeSubmenu = () => {
  activeSubmenu.value = null
}

const isMouseOverSubmenu = (): boolean => {
  // Simple check - in a real implementation you'd track mouse position
  return false
}

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
      
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
      
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
      
    case 'ArrowRight':
      event.preventDefault()
      if (getHighlightedItem()?.type === 'submenu') {
        // Open submenu
        const item = getHighlightedItem()
        if (item && item.items) {
          activeSubmenu.value = item
        }
      }
      break
      
    case 'ArrowLeft':
      event.preventDefault()
      if (activeSubmenu.value) {
        closeSubmenu()
      }
      break
      
    case 'Enter':
    case ' ':
      event.preventDefault()
      const item = getHighlightedItem()
      if (item) {
        handleItemClick(item)
      }
      break
  }
}

const navigateDown = () => {
  const items = getAllSelectableItems()
  if (items.length === 0) return
  
  highlightedIndex.value = (highlightedIndex.value + 1) % items.length
}

const navigateUp = () => {
  const items = getAllSelectableItems()
  if (items.length === 0) return
  
  highlightedIndex.value = highlightedIndex.value <= 0 
    ? items.length - 1 
    : highlightedIndex.value - 1
}

const getAllSelectableItems = (): MenuItem[] => {
  const items: MenuItem[] = []
  
  menuSections.value.forEach(section => {
    section.items.forEach(item => {
      if (item.type !== 'divider' && !item.disabled) {
        items.push(item)
      }
    })
  })
  
  return items
}

const getHighlightedItem = (): MenuItem | null => {
  const items = getAllSelectableItems()
  return items[highlightedIndex.value] || null
}

// Position adjustment to keep menu in viewport
const adjustPosition = async () => {
  await nextTick()
  
  if (!menuRef.value) return
  
  const menu = menuRef.value
  const rect = menu.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  
  let { x, y } = props.position
  
  // Adjust horizontal position
  if (x + rect.width > viewport.width) {
    x = Math.max(0, viewport.width - rect.width - 10)
  }
  
  // Adjust vertical position
  if (y + rect.height > viewport.height) {
    y = Math.max(0, viewport.height - rect.height - 10)
  }
  
  // Apply adjusted position
  menu.style.left = `${x}px`
  menu.style.top = `${y}px`
}

// Click outside to close
const handleClickOutside = (event: MouseEvent) => {
  if (!props.visible) return
  
  const target = event.target as Element
  if (!menuRef.value?.contains(target)) {
    emit('close')
  }
}

// Watch for visibility changes
watch(() => props.visible, async (visible) => {
  if (visible) {
    await adjustPosition()
    highlightedIndex.value = -1
    
    // Focus menu for keyboard navigation
    if (menuRef.value) {
      menuRef.value.focus()
    }
  } else {
    activeSubmenu.value = null
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.advanced-context-menu {
  position: fixed;
  z-index: 1000;
  outline: none;
  user-select: none;
  font-family: 'Inter', system-ui, sans-serif;
}

.menu-backdrop {
  position: absolute;
  inset: -2px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.1);
}

.menu-content {
  position: relative;
  min-width: 200px;
  max-width: 320px;
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
}

/* Header */
.menu-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(59, 130, 246, 0.05);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.selection-count {
  color: #1f2937;
  font-weight: 600;
}

/* Sections */
.menu-sections {
  padding: 4px 0;
}

.section-header {
  padding: 8px 12px 4px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: #6b7280;
}

.section-items {
  padding: 0;
}

/* Menu items */
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 0 4px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.menu-item:hover,
.menu-item.highlighted {
  background: rgba(59, 130, 246, 0.1);
  color: #1f2937;
}

.menu-item.disabled {
  color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
}

.menu-item.destructive {
  color: #dc2626;
}

.menu-item.destructive:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #b91c1c;
}

.item-icon {
  display: flex;
  align-items: center;
  color: #6b7280;
  flex-shrink: 0;
}

.menu-item:hover .item-icon,
.menu-item.highlighted .item-icon {
  color: #374151;
}

.menu-item.destructive .item-icon {
  color: #dc2626;
}

.item-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
}

.item-shortcut {
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.submenu-arrow {
  color: #9ca3af;
  flex-shrink: 0;
}

/* Dividers */
.menu-divider,
.section-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 4px 8px;
}

.section-divider {
  margin: 8px 0;
}

/* Footer */
.menu-footer {
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
}

.footer-info {
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

/* Animations */
@keyframes menuFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes menuScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .menu-backdrop {
    background: rgba(31, 41, 55, 0.9);
    box-shadow: 
      0 10px 25px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .menu-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
    background: rgba(59, 130, 246, 0.1);
  }

  .header-info,
  .selection-count {
    color: #f3f4f6;
  }

  .section-label {
    color: #9ca3af;
  }

  .menu-item {
    color: #f3f4f6;
  }

  .menu-item:hover,
  .menu-item.highlighted {
    background: rgba(59, 130, 246, 0.2);
    color: #ffffff;
  }

  .menu-item.disabled {
    color: #6b7280;
  }

  .item-icon {
    color: #9ca3af;
  }

  .menu-item:hover .item-icon,
  .menu-item.highlighted .item-icon {
    color: #e5e7eb;
  }

  .item-badge {
    background: #374151;
    color: #e5e7eb;
  }

  .item-shortcut {
    color: #9ca3af;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .menu-divider,
  .section-divider {
    background: rgba(255, 255, 255, 0.1);
  }

  .menu-footer {
    border-top-color: rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
  }

  .footer-info {
    color: #9ca3af;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .menu-item {
    padding: 12px;
    font-size: 16px;
  }

  .item-icon {
    width: 20px;
    height: 20px;
  }

  .item-shortcut {
    display: none;
  }
}
</style>