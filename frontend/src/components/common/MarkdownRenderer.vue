<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

interface Props {
  content: string
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  inline: false
})

// 配置marked (v16+的新API)
const markedOptions = {
  breaks: true,
  gfm: true
}

// 设置渲染器
const renderer = {
  strong(text: string) {
    return `<strong class="markdown-strong">${text}</strong>`
  },
  paragraph(text: string) {
    return `<p class="markdown-paragraph">${text}</p>`
  },
  list(body: string, ordered: boolean) {
    const tag = ordered ? 'ol' : 'ul'
    return `<${tag} class="markdown-list">${body}</${tag}>`
  },
  listitem(text: string) {
    return `<li class="markdown-list-item">${text}</li>`
  }
}

marked.use({ 
  ...markedOptions,
  renderer 
})

// 缓存已渲染的内容，避免重复计算
const contentCache = new Map<string, string>()

const renderedContent = computed(() => {
  if (!props.content) return ''
  if (typeof props.content !== 'string') {
    return `<pre style="color: red;">${JSON.stringify(props.content, null, 2)}</pre>`
  }
  
  // 检查缓存
  const cacheKey = props.content
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey)!
  }
  
  let html = props.content
  
  // 1. 处理标题 - 增强样式支持
  html = html.replace(/^#### (.*$)/gm, '<h4 class="markdown-h4">$1</h4>')
  html = html.replace(/^### (.*$)/gm, '<h3 class="markdown-h3">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="markdown-h2">$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="markdown-h1">$1</h1>')
  
  // 2. 处理粗体和特殊标记
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>')
  
  // 处理特殊标记：≥ ≤ → ↑ ↓ 等符号
  html = html.replace(/(≥|≤|→|↑|↓|±)/g, '<span class="markdown-symbol">$1</span>')
  
  // 处理货币和数据标记
  html = html.replace(/(US\$\s*[\d,.]+(\s*[kKmM])?)/g, '<span class="markdown-currency">$1</span>')
  html = html.replace(/(\d+(\.\d+)?\s*%)/g, '<span class="markdown-percentage">$1</span>')
  
  // 3. 处理分割线
  html = html.replace(/^——+(.*)——+$/gm, '<div class="markdown-divider">$1</div>')
  html = html.replace(/^---$/gm, '<hr class="markdown-hr">')
  
  // 4. 处理特殊格式的段落（报告头部信息）
  html = html.replace(/^(客户|行业|当前|目标|选用|报告|出具)：(.*)$/gm, '<div class="report-meta-item"><span class="meta-label">$1：</span><span class="meta-value">$2</span></div>')
  
  // 5. 处理表格 - 改进版本
  html = html.replace(/([^\n]*\|[^\n]*\|[^\n]*)/g, (match) => {
    if (match.includes('----') || match.includes('||||')) return match // 跳过分割线
    const cells = match.split('|').filter(cell => cell.trim()).map(cell => {
      const trimmed = cell.trim()
      return `<td class="markdown-td">${trimmed}</td>`
    }).join('')
    return cells ? `<tr class="markdown-tr">${cells}</tr>` : match
  })
  
  // 包装表格行
  html = html.replace(/(<tr class="markdown-tr">.*?<\/tr>)(\s*<tr class="markdown-tr">.*?<\/tr>)*/gs, (match) => {
    return `<div class="markdown-table-wrapper"><table class="markdown-table"><tbody>${match}</tbody></table></div>`
  })
  
  // 6. 处理列表项（更准确的匹配）
  html = html.replace(/^- (.*$)/gm, '<li class="markdown-li">$1</li>')
  html = html.replace(/^([①②③④⑤⑥⑦⑧⑨⑩]) (.*$)/gm, '<li class="markdown-li circled-number">$1 $2</li>')
  html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="markdown-li numbered">$1. $2</li>')
  
  // 包装连续的列表项
  html = html.replace(/(<li class="markdown-li[^"]*">.*?<\/li>)(\s*<li class="markdown-li[^"]*">.*?<\/li>)*/gs, (match) => {
    return `<ul class="markdown-ul">${match}</ul>`
  })
  
  // 7. 处理关键词高亮
  html = html.replace(/(关键里程碑|负责人|交付物|核心杠杆|成功指标|决策建议|痛点|现状|投资|ROI|风险|预警指标|应对\/回滚)/g, '<span class="markdown-keyword">$1</span>')
  
  // 8. 处理段落（换行）- 保持更好的格式
  html = html.replace(/\n\n+/g, '</p><p class="markdown-p">')
  html = html.replace(/\n/g, '<br>')
  
  // 9. 包装整体内容
  if (!html.startsWith('<')) {
    html = `<p class="markdown-p">${html}</p>`
  }
  
  // 缓存结果
  contentCache.set(cacheKey, html)
  
  // 限制缓存大小，防止内存泄漏
  if (contentCache.size > 100) {
    const firstKey = contentCache.keys().next().value
    contentCache.delete(firstKey)
  }
  
  return html
})
</script>

<style scoped>
.markdown-content {
  line-height: 1.8;
  color: #2d3748;
  font-size: 16px;
  max-width: none;
}

/* 标题样式 - 增强版 */
.markdown-content :deep(h1),
.markdown-content :deep(.markdown-h1) {
  font-size: 2rem;
  font-weight: 800;
  margin: 2em 0 1em;
  color: #1a202c;
  text-align: center;
  padding: 1em 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.markdown-content :deep(.markdown-h1):after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

.markdown-content :deep(h2),
.markdown-content :deep(.markdown-h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 2em 0 0.8em;
  color: #2d3748;
  position: relative;
  padding-left: 24px;
  border-left: 4px solid #3182ce;
  background: linear-gradient(90deg, rgba(49, 130, 206, 0.08), transparent);
  padding: 0.5em 1em 0.5em 24px;
  border-radius: 0 8px 8px 0;
}

.markdown-content :deep(h3),
.markdown-content :deep(.markdown-h3) {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 1.5em 0 0.6em;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h4),
.markdown-content :deep(.markdown-h4) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1.2em 0 0.5em;
  color: #4a5568;
  position: relative;
  padding-left: 12px;
}

.markdown-content :deep(.markdown-h4):before {
  content: '▶';
  position: absolute;
  left: 0;
  color: #3182ce;
  font-size: 0.8em;
}

.markdown-content :deep(h4) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.875em 0 0.5em;
  color: #4b5563;
}

/* 段落样式 - 优化版 */
.markdown-content :deep(p),
.markdown-content :deep(.markdown-p) {
  margin: 1.2em 0;
  line-height: 1.8;
  text-align: justify;
  color: #4a5568;
}

/* 报告元信息样式 */
.markdown-content :deep(.report-meta-item) {
  display: flex;
  margin: 0.5em 0;
  padding: 0.5em 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.markdown-content :deep(.meta-label) {
  font-weight: 600;
  color: #2d3748;
  min-width: 100px;
  font-size: 0.95em;
}

.markdown-content :deep(.meta-value) {
  color: #4a5568;
  flex: 1;
}

/* 分割线增强 */
.markdown-content :deep(.markdown-divider) {
  text-align: center;
  font-weight: 700;
  font-size: 1.1em;
  color: #2d3748;
  margin: 2em 0;
  padding: 1em 0;
  border-top: 2px solid #e2e8f0;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(90deg, transparent, rgba(49, 130, 206, 0.05), transparent);
}

/* 列表样式 - 增强版 */
.markdown-content :deep(ul), 
.markdown-content :deep(ol),
.markdown-content :deep(.markdown-ul) {
  margin: 1em 0;
  padding-left: 2.2em;
  list-style: none;
}

.markdown-content :deep(li),
.markdown-content :deep(.markdown-li) {
  margin: 0.8em 0;
  line-height: 1.7;
  position: relative;
  padding: 0.3em 0;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.markdown-content :deep(.markdown-li):hover {
  background-color: rgba(49, 130, 206, 0.05);
  padding-left: 0.5em;
}

.markdown-content :deep(.markdown-li):before {
  content: '▸';
  color: #3182ce;
  font-weight: bold;
  position: absolute;
  left: -1.2em;
  font-size: 1.1em;
}

.markdown-content :deep(.markdown-li.numbered):before {
  content: '';
}

.markdown-content :deep(.markdown-li.circled-number):before {
  content: '';
}

.markdown-content :deep(.markdown-li.circled-number) {
  font-weight: 500;
}

.markdown-content :deep(.markdown-li.circled-number):first-child {
  margin-top: 0;
}

.markdown-content :deep(ul li) {
  list-style-type: disc;
}

.markdown-content :deep(ol li) {
  list-style-type: decimal;
}

/* 强调样式 - 增强版 */
.markdown-content :deep(strong),
.markdown-content :deep(.markdown-strong) {
  font-weight: 700;
  color: #1a202c;
  background: rgba(49, 130, 206, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border-left: 3px solid #3182ce;
  position: relative;
}

/* 特殊符号样式 */
.markdown-content :deep(.markdown-symbol) {
  color: #e53e3e;
  font-weight: 600;
  font-size: 1.1em;
}

/* 货币和百分比样式 */
.markdown-content :deep(.markdown-currency) {
  color: #38a169;
  font-weight: 600;
  background: rgba(56, 161, 105, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

.markdown-content :deep(.markdown-percentage) {
  color: #d69e2e;
  font-weight: 600;
  background: rgba(214, 158, 46, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}

/* 关键词高亮 */
.markdown-content :deep(.markdown-keyword) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #4b5563;
}

/* 段落样式增强 */
.markdown-content :deep(.markdown-paragraph) {
  margin: 0.75em 0;
  line-height: 1.7;
}

/* 列表样式增强 */
.markdown-content :deep(.markdown-list) {
  margin: 0.75em 0;
  padding-left: 2em;
}

.markdown-content :deep(.markdown-list-item) {
  margin: 0.5em 0;
  line-height: 1.6;
  position: relative;
}

.markdown-content :deep(.markdown-list-item::marker) {
  color: #3b82f6;
  font-weight: 600;
}

/* 代码样式 */
.markdown-content :deep(code) {
  background: #f3f4f6;
  color: #1f2937;
  padding: 0.125em 0.25em;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 引用样式 */
.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  background: #f8fafc;
  margin: 1em 0;
  padding: 0.75em 1em;
  border-radius: 0 0.5rem 0.5rem 0;
}

.markdown-content :deep(blockquote p) {
  margin: 0;
  color: #64748b;
  font-style: italic;
}

/* 链接样式 */
.markdown-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-content :deep(a:hover) {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* 分割线 */
.markdown-content :deep(hr),
.markdown-content :deep(.markdown-hr) {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 2em 0;
}

/* 表格样式 - 专业报告版 */
.markdown-content :deep(.markdown-table-wrapper) {
  margin: 1.5em 0;
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(table),
.markdown-content :deep(.markdown-table) {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 0.95em;
}

.markdown-content :deep(th),
.markdown-content :deep(td),
.markdown-content :deep(.markdown-td) {
  padding: 1em 1.2em;
  text-align: left;
  border: 1px solid #e2e8f0;
  vertical-align: top;
}

.markdown-content :deep(th) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.markdown-content :deep(.markdown-tr:nth-child(even)) {
  background-color: rgba(49, 130, 206, 0.02);
}

.markdown-content :deep(.markdown-tr:hover) {
  background-color: rgba(49, 130, 206, 0.08);
  transition: background-color 0.2s ease;
}

.markdown-content :deep(tr:last-child td),
.markdown-content :deep(.markdown-tr:last-child .markdown-td) {
  border-bottom: none;
}

/* Fallback styles for plain text */
.markdown-content :deep(.plain-text) {
  line-height: 1.7;
}

.markdown-content :deep(.plain-text strong) {
  font-weight: 700;
  color: #1d1d1f;
}

/* 样式增强 */
.markdown-content :deep(.practices-list) {
  margin-top: 1em;
}
</style>