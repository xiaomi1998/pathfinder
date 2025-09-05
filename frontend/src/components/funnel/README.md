# Pathfinder 漏斗建模器组件

这个目录包含了 Pathfinder 项目的核心漏斗建模器组件，基于 Vue 3 + TypeScript + D3.js + Tailwind CSS 开发。

## 组件架构

### 核心组件

1. **FunnelCanvas.vue** - 主画布组件
   - 集成 D3.js 进行高性能渲染和交互
   - 支持节点拖拽、画布缩放和平移
   - 节点和连接线的创建、编辑和删除
   - 网格对齐和上下文菜单
   - 实时预览和分析数据显示

2. **FunnelNode.vue** - 节点组件
   - 动态节点渲染，支持多种节点类型
   - 交互式连接点，支持拖拽连接
   - 内置分析数据可视化
   - 节点验证和错误显示
   - 自适应尺寸和样式

3. **NodeEditor.vue** - 节点编辑弹窗
   - 动态表单生成，基于节点类型
   - 支持所有节点类型的配置选项
   - 实时验证和错误提示
   - 样式自定义功能

4. **DataEntryModal.vue** - 数据录入弹窗
   - 可编辑数据表格界面
   - 预置数据模板（电商、SaaS、营销、移动应用）
   - 自定义数据生成器
   - 数据筛选、排序和搜索功能

### 支持文件

- **types.ts** - TypeScript 类型定义
- **utils.ts** - 工具函数和验证逻辑  
- **useD3Canvas.ts** - D3.js 画布 composable
- **index.ts** - 组件导出文件
- **FunnelBuilderDemo.vue** - 完整的演示页面

## 功能特性

### 节点类型

- **Start** - 漏斗入口点
- **End** - 漏斗出口点（成功/失败）
- **Event** - 用户事件追踪
- **Condition** - 条件分支逻辑
- **Action** - 执行操作（邮件、Webhook等）
- **Delay** - 时间延迟
- **Split** - 流量分割（随机、加权、属性）
- **Merge** - 流量合并

### 画布功能

- **缩放和平移** - 鼠标滚轮缩放，拖拽平移
- **网格对齐** - 可选的网格对齐功能
- **节点连接** - 可视化拖拽连接
- **上下文菜单** - 右键操作菜单
- **键盘快捷键** - 删除、复制等操作
- **自动保存** - 更改后自动保存

### 数据集成

- **实时分析** - 显示节点访问量和转化率
- **数据模板** - 预置多种行业数据模板
- **自定义数据** - 支持导入和生成自定义数据
- **数据验证** - 确保数据完整性和准确性

## 使用方法

### 基本使用

```vue
<template>
  <div class="h-screen">
    <FunnelCanvas
      :readonly="false"
      :show-grid="true"
      :grid-size="20"
      @node-select="handleNodeSelect"
      @edge-select="handleEdgeSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { FunnelCanvas } from '@components/funnel'
import { useFunnel } from '@composables/useFunnel'

const { selectNode, selectEdge } = useFunnel()

const handleNodeSelect = (nodeId: string | null) => {
  selectNode(nodeId)
}

const handleEdgeSelect = (edgeId: string | null) => {
  selectEdge(edgeId)
}
</script>
```

### 高级配置

```vue
<template>
  <FunnelCanvas
    ref="canvasRef"
    :settings="{
      width: 1200,
      height: 800,
      showGrid: true,
      gridSize: 20,
      snapToGrid: true,
      readonly: false
    }"
    :show-analytics="true"
    :enable-simulation="true"
    @node-select="handleNodeSelect"
    @edge-select="handleEdgeSelect"
    @canvas-click="handleCanvasClick"
  />
</template>
```

### 节点编辑

```vue
<template>
  <NodeEditor
    v-if="showEditor"
    :node="selectedNode"
    @close="showEditor = false"
    @save="handleNodeSave"
  />
</template>

<script setup lang="ts">
import { NodeEditor } from '@components/funnel'

const handleNodeSave = (updatedNode: FunnelNode) => {
  updateNode(updatedNode.id, updatedNode)
}
</script>
```

### 数据录入

```vue
<template>
  <DataEntryModal
    v-if="showDataEntry"
    :node="selectedNode"
    @close="showDataEntry = false"
    @save="handleDataSave"
  />
</template>

<script setup lang="ts">
import { DataEntryModal } from '@components/funnel'

const handleDataSave = (nodeId: string, data: any[]) => {
  // 保存节点数据
  saveNodeData(nodeId, data)
}
</script>
```

## API 接口

### FunnelCanvas Props

```typescript
interface FunnelCanvasProps {
  nodes?: FunnelNode[]
  edges?: FunnelEdge[]
  settings?: Partial<CanvasSettings>
  readonly?: boolean
  showAnalytics?: boolean
  enableSimulation?: boolean
}
```

### FunnelCanvas Events

```typescript
// 节点选择
@node-select="(nodeId: string | null) => void"

// 连接选择  
@edge-select="(edgeId: string | null) => void"

// 画布点击
@canvas-click="(position: Position) => void"
```

### Node Configuration

```typescript
// 事件节点配置
{
  type: 'event',
  data: {
    label: 'Page View',
    config: {
      event_name: 'page_view',
      event_properties: {
        page_url: '/dashboard',
        page_title: 'Dashboard'
      }
    }
  }
}

// 条件节点配置
{
  type: 'condition',
  data: {
    label: 'Premium User?',
    config: {
      conditions: [
        {
          property: 'user.plan',
          operator: 'equals',
          value: 'premium'
        }
      ]
    }
  }
}
```

## 开发指南

### 添加新节点类型

1. 在 `types.ts` 中添加节点类型
2. 在 `utils.ts` 的 `nodeTypeConfigs` 中添加配置
3. 在 `FunnelNode.vue` 中添加渲染逻辑
4. 在 `NodeEditor.vue` 中添加编辑界面

### 扩展数据模板

在 `DataEntryModal.vue` 中的 `dataTemplates` 数组添加新模板：

```typescript
{
  id: 'custom',
  name: 'Custom Template',
  description: 'Your custom data template',
  count: 1000,
  generator: () => generateCustomData(1000)
}
```

### 自定义验证规则

在 `utils.ts` 中的 `validateNodeConfiguration` 函数添加验证逻辑：

```typescript
if (node.type === 'custom' && !node.data.config.customField) {
  errors.push({
    type: 'required',
    message: 'Custom field is required',
    validator: () => false
  })
}
```

## 性能优化

- 使用 D3.js 虚拟化大量节点渲染
- 实现视口裁剪，只渲染可见节点
- 节点缓存和增量更新
- 异步数据加载和懒加载
- 防抖处理用户输入

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

支持所有现代浏览器，需要 ES2020+ 特性支持。

## 故障排除

### 常见问题

1. **节点无法拖拽** - 检查 `readonly` 属性是否为 false
2. **连接线不显示** - 确认节点间存在有效的 edge 数据
3. **D3.js 报错** - 确认 SVG 元素已正确挂载
4. **样式不正确** - 检查 Tailwind CSS 类是否正确加载

### 调试技巧

```javascript
// 查看当前状态
console.log('Nodes:', nodes.value)
console.log('Edges:', edges.value)
console.log('Selected:', selectedNode.value)

// 验证漏斗结构
const errors = validateFunnelStructure(nodes.value, edges.value)
console.log('Validation errors:', errors)
```

## 贡献指南

1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -am 'Add new feature'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件