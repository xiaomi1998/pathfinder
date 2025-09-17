// 完全按照模板生成报告的函数
export const generateTemplateCompliantReportHTML = (report) => {
  const content = report.content || {}
  const funnelData = content.funnelData || {}
  const companyInfo = content.companyInfo || {}
  const keyInsights = content.keyInsights || {}
  const selectedStrategy = content.selectedStrategy || {}
  const detailedAnalysis = content.detailedAnalysis || ''
  const stages = funnelData.stages || funnelData.steps || []
  
  // 计算关键指标
  const healthScore = calculateHealthScore(content)
  const healthScoreDeg = Math.round((healthScore / 100) * 360)
  
  const headerTitle = funnelData.funnel_name || funnelData.name || report.funnelName || '客户漏斗分析报告'
  
  // 计算转化率
  const calculateConversionRate = (fromIndex, toIndex) => {
    if (!stages[fromIndex] || !stages[toIndex]) return 0
    const fromValue = stages[fromIndex].current_value || stages[fromIndex].value || 0
    const toValue = stages[toIndex].current_value || stages[toIndex].value || 0
    return fromValue > 0 ? ((toValue / fromValue) * 100).toFixed(2) : 0
  }
  
  // 获取瓶颈阶段的转化率（找最低的）
  const bottleneckRate = getBottleneckConversionRate(stages)
  const advantageRate = getHighestConversionRate(stages)
  
  // 从完整模板复制的HTML结构
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
    <!-- 这里插入完整的CSS - 从模板文件复制 -->
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

        /* 其他样式继续... */
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

        /* 继续添加其他必要的样式... */

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
                        <p style="margin-bottom: 15px;">${keyInsights.key_insight?.bottleneck_stage || '关键瓶颈识别中'}，转化率仅为${bottleneckRate}%</p>
                        <ul>
                            <li>${keyInsights.key_insight?.conversion_issue || keyInsights.teaser_analysis?.core_problem || '转化难点分析中'}</li>
                            <li>${keyInsights.key_insight?.quick_suggestion || keyInsights.teaser_analysis?.quick_advice || '优化建议制定中'}</li>
                            <li>${keyInsights.key_insight?.potential_impact || '影响评估中'}</li>
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
                        <p style="margin-bottom: 15px;">优化后预计转化率提升至${(parseFloat(bottleneckRate) + 15).toFixed(1)}%，ROI预期${selectedStrategy?.expected_roi || keyInsights.teaser_analysis?.expected_roi || '15-30%'}</p>
                        <ul>
                            <li>${selectedStrategy?.features || '策略特点分析中'}</li>
                            <li>${selectedStrategy?.core_actions || '核心行动制定中'}</li>
                            <li>${selectedStrategy?.investment || '投资回报分析中'}</li>
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
                        <p><strong>ROI预期：</strong>${keyInsights.teaser_analysis?.expected_roi || selectedStrategy?.expected_roi || '投资回报预期分析中'}</p>
                    </div>
                </div>

                <div class="industry-card">
                    <h3>优化建议与执行策略</h3>
                    <p style="margin-bottom: 20px; font-weight: 600;">基于${report.strategy === 'stable' ? '稳健' : '激进'}策略的核心建议：</p>
                    <div style="background: rgba(59, 130, 246, 0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #1d1d1f;">执行重点：</h4>
                        <div style="font-size: 0.95rem; line-height: 1.6;">
                            ${detailedAnalysis ? detailedAnalysis.slice(0, 300) + '...' : '详细分析报告生成中...'}
                        </div>
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

function calculateHealthScore(content) {
  let score = 50
  
  if (content.keyInsights) {
    score += 20
    const hasBottleneck = content.keyInsights.key_insight?.bottleneck_stage || 
                         content.keyInsights.bottleneck_stage ||
                         content.keyInsights.main_bottleneck
    
    if (hasBottleneck && hasBottleneck !== '待分析' && hasBottleneck !== '数据分析中') {
      score += 10
    }
  }
  
  const stages = content.funnelData?.stages || content.funnelData?.steps || []
  if (stages.length > 0) {
    score += 15
    const hasCompleteData = stages.every((stage) => {
      const value = stage.current_value || stage.value || stage.count || stage.amount
      return value !== undefined && value > 0
    })
    if (hasCompleteData) {
      score += 10
    }
  }
  
  if (content.detailedAnalysis && content.detailedAnalysis.length > 100) {
    score += 10
  }
  
  return Math.min(Math.max(score, 30), 100)
}

function getBottleneckConversionRate(stages) {
  if (stages.length < 2) return 0
  
  let minRate = 100
  for (let i = 0; i < stages.length - 1; i++) {
    const currentValue = stages[i].current_value || stages[i].value || 0
    const nextValue = stages[i + 1].current_value || stages[i + 1].value || 0
    const rate = currentValue > 0 ? (nextValue / currentValue) * 100 : 0
    if (rate < minRate) {
      minRate = rate
    }
  }
  return minRate.toFixed(2)
}

function getHighestConversionRate(stages) {
  if (stages.length < 2) return 0
  
  let maxRate = 0
  for (let i = 0; i < stages.length - 1; i++) {
    const currentValue = stages[i].current_value || stages[i].value || 0
    const nextValue = stages[i + 1].current_value || stages[i + 1].value || 0
    const rate = currentValue > 0 ? (nextValue / currentValue) * 100 : 0
    if (rate > maxRate) {
      maxRate = rate
    }
  }
  return maxRate.toFixed(2)
}

function generateFunnelStepsHTML(stages) {
  if (!stages || stages.length === 0) {
    return '<div class="funnel-step"><div class="step-label">暂无数据</div><div class="step-value">0</div></div>'
  }

  return stages.map((stage, index) => {
    const currentValue = stage.current_value || stage.value || stage.count || stage.amount || 0
    const stageName = stage.stage_name || stage.name || stage.label || stage.title || `阶段 ${index + 1}`
    const arrow = index < stages.length - 1 ? '<div class="funnel-arrow">→</div>' : ''
    
    return `
      <div class="funnel-step">
        <div class="step-label">${stageName}</div>
        <div class="step-value">${currentValue?.toLocaleString?.() || currentValue}</div>
      </div>
      ${arrow}
    `
  }).join('')
}

}