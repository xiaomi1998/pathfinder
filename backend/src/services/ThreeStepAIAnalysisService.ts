import { PrismaClient } from '@prisma/client';
import kimiAiService from './KimiAiService';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';

interface CompanyProfile {
  company_name: string;
  industry: string;
  city: string;
  team_size: string;
  sales_model: string;
  company_description: string;
}

interface FunnelStage {
  stage_name: string;
  current_value: number;
  previous_value?: number;
}

interface FunnelData {
  funnel_name: string;
  time_period: string;
  stages: FunnelStage[];
}

interface Step1Input {
  company_profile: CompanyProfile;
  funnel_data: FunnelData;
}

interface KeyInsight {
  summary: string;
  bottleneck_stage: string;
  conversion_issue: string;
  quick_suggestion: string;
  potential_impact: string;
}

interface TeaserAnalysis {
  core_problem: string;
  quick_advice: string;
  expected_roi: string;
}

interface Step1Output {
  key_insight: KeyInsight;
  teaser_analysis: TeaserAnalysis;
}

interface Strategy {
  title: string;
  tag: string;
  features: string;
  core_actions: string;
  investment: string;
}

interface Step2Output {
  stable_strategy: Strategy;
  aggressive_strategy: Strategy;
}

export class ThreeStepAIAnalysisService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 清除指定漏斗的所有AI分析记录
   */
  async clearAnalysisForFunnel(userId: string, funnelId: string): Promise<void> {
    await this.prisma.aiAnalysis.deleteMany({
      where: {
        userId,
        funnelId
      }
    });
  }

  /**
   * 清除指定漏斗特定数据期间的AI分析记录
   */
  async clearAnalysisForFunnelPeriod(userId: string, funnelId: string, datasetPeriodStart: Date): Promise<void> {
    try {
      // 首先找到该数据期间的所有分析记录
      const analysesToDelete = await this.prisma.aiAnalysis.findMany({
        where: {
          userId,
          funnelId,
          // 通过关联的报告找到特定数据期间的分析
          reports: {
            some: {
              datasetPeriodStart: datasetPeriodStart
            }
          }
        },
        select: { id: true }
      });

      // 删除这些分析记录（级联删除会同时删除关联的报告）
      if (analysesToDelete.length > 0) {
        const analysisIds = analysesToDelete.map(a => a.id);
        await this.prisma.aiAnalysis.deleteMany({
          where: {
            id: { in: analysisIds }
          }
        });
        
        logger.info(`清除了 ${analysisIds.length} 个特定数据期间的分析记录`, {
          funnelId: funnelId.slice(0, 8),
          datasetPeriodStart,
          analysisIds: analysisIds.map(id => id.slice(0, 8))
        });
      }
    } catch (error) {
      logger.error('清除特定数据期间的分析记录失败:', error);
      // 如果出错，不抛出异常，避免影响数据录入流程
    }
  }

  /**
   * 清除用户的所有AI分析记录（测试用）
   */
  async clearAllAnalysisForUser(userId: string): Promise<void> {
    // 删除所有分析报告
    await this.prisma.aiAnalysisReport.deleteMany({
      where: {
        userId
      }
    });
    
    // 删除所有分析记录
    await this.prisma.aiAnalysis.deleteMany({
      where: {
        userId
      }
    });
  }

  /**
   * 第一步：生成关键洞察（免费）
   */
  async generateKeyInsights(userId: string, funnelId: string): Promise<Step1Output & {analysisId?: string}> {
    try {
      // 先检查是否已经存在该漏斗的分析
      const existingAnalysis = await this.prisma.aiAnalysis.findFirst({
        where: {
          userId,
          funnelId,
          step: 1
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 如果存在分析结果，直接返回，不消耗配额
      if (existingAnalysis) {
        logger.info(`返回已存在的分析结果: ${existingAnalysis.id}`);
        
        // 正确处理JSON数据
        let outputData: Step1Output;
        if (typeof existingAnalysis.output === 'string') {
          outputData = JSON.parse(existingAnalysis.output);
        } else if (typeof existingAnalysis.output === 'object' && existingAnalysis.output !== null) {
          outputData = existingAnalysis.output as unknown as Step1Output;
        } else {
          throw new Error('Invalid analysis output format');
        }
        
        return {
          ...outputData,
          analysisId: existingAnalysis.id
        };
      }

      // 第一步是免费的，不检查配额

      // 获取漏斗数据
      console.log('🔍 AI分析获取漏斗数据:');
      console.log('  用户ID:', userId?.slice(0, 8));
      console.log('  漏斗ID:', funnelId?.slice(0, 8));
      
      const funnel = await this.prisma.funnel.findFirst({
        where: { id: funnelId, userId },
        include: {
          user: {
            include: {
              organization: true
            }
          },
          nodes: {
            orderBy: { createdAt: 'asc' }
          },
          funnelMetrics: {
            orderBy: { createdAt: 'desc' },
            take: 2 // 获取最近两次数据用于对比
          }
        }
      });

      if (!funnel) {
        throw new Error('漏斗不存在');
      }

      console.log('✅ 查询到的漏斗数据:');
      console.log('  漏斗名称:', funnel.name);
      console.log('  节点数量:', funnel.nodes?.length || 0);
      console.log('  指标记录数量:', funnel.funnelMetrics?.length || 0);
      if (funnel.funnelMetrics?.length > 0) {
        console.log('  最新指标详情:');
        const latest = funnel.funnelMetrics[0];
        console.log('    ID:', latest.id?.slice(0, 8));
        console.log('    总进入:', latest.totalEntries);
        console.log('    总转化:', latest.totalConversions);
        console.log('    自定义指标:', JSON.stringify(latest.customMetrics, null, 4));
      }

      // 构建输入数据
      const input: Step1Input = {
        company_profile: {
          company_name: funnel.user.organization?.name || '未命名公司',
          industry: funnel.user.organization?.industryId || '通用',
          city: funnel.user.organization?.location || '未知',
          team_size: funnel.user.organization?.companySize || '1-10',
          sales_model: 'B2B', // 默认值，可以从组织信息扩展
          company_description: funnel.user.organization?.description || '暂无描述'
        },
        funnel_data: {
          funnel_name: funnel.name,
          time_period: funnel.dataPeriod,
          stages: this.buildStagesData(funnel)
        }
      };

      console.log('📊 构建的AI输入数据:');
      console.log('  公司信息:', JSON.stringify(input.company_profile, null, 2));
      console.log('  漏斗数据:', JSON.stringify(input.funnel_data, null, 2));

      // 调用AI生成第一步分析
      const prompt = this.buildStep1Prompt(input);
      console.log('📝 发送给AI的Prompt长度:', prompt.length);
      const aiResponse = await kimiAiService.callKimiAPI([
        {
          role: 'system',
          content: `你是一位资深的销售数据分析专家，拥有10年以上的B2B/B2C销售漏斗优化经验。
你精通：
1. 销售漏斗各阶段转化率分析和优化
2. 行业基准对标和最佳实践
3. 数据驱动的决策建议
4. ROI预测和商业价值评估

你的分析风格：
- 数据驱动：所有结论必须基于具体数据
- 简洁有力：用最少的文字传达最关键的信息
- 专业精准：使用专业术语，但确保易于理解
- 价值导向：突出问题的商业影响和改进价值

请严格按照用户要求的JSON格式输出，不要包含任何额外的说明文字。`
        },
        {
          role: 'user',
          content: prompt
        }
      ], 0.3);

      // 解析AI响应
      const result = this.parseStep1Response(aiResponse);

      // 保存分析结果
      const analysisId = await this.saveAnalysisStep(userId, funnelId, 1, input, result);

      // 第一步是免费的，不消耗配额

      return {
        ...result,
        analysisId
      };
    } catch (error: any) {
      logger.error('生成关键洞察失败:', error);
      throw error;
    }
  }

  /**
   * 第一步：为特定数据期间生成关键洞察（免费）
   */
  async generateKeyInsightsForPeriod(userId: string, funnelId: string, datasetPeriodStart: Date): Promise<Step1Output & {analysisId?: string}> {
    try {
      // 先检查是否已经存在该数据期间的分析
      const existingAnalysis = await this.prisma.aiAnalysis.findFirst({
        where: {
          userId,
          funnelId,
          step: 1,
          // 通过关联的报告查找特定数据期间的分析
          reports: {
            some: {
              datasetPeriodStart: datasetPeriodStart
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 如果存在分析结果，直接返回，不消耗配额
      if (existingAnalysis) {
        logger.info(`返回已存在的数据期间分析结果: ${existingAnalysis.id}`);
        
        // 正确处理JSON数据
        let outputData: Step1Output;
        if (typeof existingAnalysis.output === 'string') {
          outputData = JSON.parse(existingAnalysis.output);
        } else if (typeof existingAnalysis.output === 'object' && existingAnalysis.output !== null) {
          outputData = existingAnalysis.output as unknown as Step1Output;
        } else {
          throw new Error('Invalid analysis output format');
        }
        
        return {
          ...outputData,
          analysisId: existingAnalysis.id
        };
      }

      // 第一步是免费的，不检查配额

      // 获取指定数据期间的漏斗数据
      console.log('🔍 AI分析获取指定期间的漏斗数据:');
      console.log('  用户ID:', userId?.slice(0, 8));
      console.log('  漏斗ID:', funnelId?.slice(0, 8));
      console.log('  数据期间:', datasetPeriodStart);
      
      const funnel = await this.prisma.funnel.findFirst({
        where: { id: funnelId, userId },
        include: {
          user: {
            include: {
              organization: {
                include: {
                  industry: true
                }
              }
            }
          },
          nodes: {
            orderBy: { createdAt: 'asc' }
          },
          funnelMetrics: {
            where: {
              periodStartDate: datasetPeriodStart
            },
            orderBy: { createdAt: 'desc' },
            take: 1 // 只获取指定期间的数据
          }
        }
      });

      if (!funnel) {
        throw new Error('漏斗不存在');
      }

      if (!funnel.funnelMetrics || funnel.funnelMetrics.length === 0) {
        throw new Error(`指定数据期间 ${datasetPeriodStart.toISOString().split('T')[0]} 的数据不存在`);
      }

      console.log('✅ 查询到的指定期间漏斗数据:');
      console.log('  漏斗名称:', funnel.name);
      console.log('  节点数量:', funnel.nodes?.length || 0);
      console.log('  指定期间数据:', funnel.funnelMetrics.length);

      // 构建输入数据
      const input: Step1Input = {
        company_profile: {
          company_name: funnel.user.organization?.name || '未命名公司',
          industry: funnel.user.organization?.industryId || '通用',
          city: funnel.user.organization?.location || '未知',
          team_size: funnel.user.organization?.companySize || '1-10',
          sales_model: 'B2B', // 默认值，可以从组织信息扩展
          company_description: funnel.user.organization?.description || '暂无描述'
        },
        funnel_data: {
          funnel_name: funnel.name,
          time_period: funnel.dataPeriod,
          stages: this.buildStagesData(funnel)
        }
      };

      console.log('📊 构建的AI输入数据:');
      console.log('  公司信息:', JSON.stringify(input.company_profile, null, 2));
      console.log('  漏斗数据:', JSON.stringify(input.funnel_data, null, 2));

      // 调用AI生成第一步分析
      const prompt = this.buildStep1Prompt(input);
      console.log('📝 发送给AI的Prompt长度:', prompt.length);
      const aiResponse = await kimiAiService.callKimiAPI([
        {
          role: 'system',
          content: `你是一位资深的销售数据分析专家，拥有10年以上的B2B/B2C销售漏斗优化经验。

请基于提供的数据进行深度分析，输出关键洞察。保持专业、客观、务实的分析风格。

要求：
1. 分析必须基于实际数据，不得编造数字
2. 洞察要具体、可执行
3. 建议要考虑到公司规模和行业特点
4. 输出格式必须严格按照要求的JSON结构`
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      console.log('🤖 收到AI响应长度:', aiResponse.length);

      // 解析AI响应
      const result = this.parseStep1Response(aiResponse);

      // 保存分析结果，包含数据期间信息
      const analysisId = await this.saveAnalysisStepForPeriod(userId, funnelId, 1, input, result, datasetPeriodStart);

      // 第一步是免费的，不消耗配额

      return {
        ...result,
        analysisId
      };
    } catch (error: any) {
      logger.error('生成指定期间关键洞察失败:', error);
      throw error;
    }
  }

  /**
   * 第一步：为最新数据期间生成关键洞察（免费）
   */
  async generateKeyInsightsForLatestPeriod(userId: string, funnelId: string): Promise<Step1Output & {analysisId?: string}> {
    try {
      // 获取该漏斗真正最新更新的数据期间（按更新时间而不是期间日期排序）
      const latestMetrics = await this.prisma.funnelMetrics.findFirst({
        where: {
          funnelId,
          funnel: {
            userId
          }
        },
        orderBy: {
          updatedAt: 'desc'  // 改为按更新时间排序，获取真正最新的数据
        },
        select: {
          periodStartDate: true,
          updatedAt: true
        }
      });

      if (!latestMetrics) {
        throw new Error('没有找到该漏斗的数据记录');
      }

      logger.info(`为最新更新数据期间生成分析: ${latestMetrics.periodStartDate.toISOString().split('T')[0]} (更新时间: ${latestMetrics.updatedAt.toISOString()})`);
      
      // 使用真正最新更新的数据期间生成分析
      return await this.generateKeyInsightsForPeriod(userId, funnelId, latestMetrics.periodStartDate);
    } catch (error: any) {
      logger.error('生成最新期间关键洞察失败:', error);
      throw error;
    }
  }

  /**
   * 第一步：为最新数据期间强制重新生成关键洞察（免费）
   */
  async generateKeyInsightsForLatestPeriodForced(userId: string, funnelId: string): Promise<Step1Output & {analysisId?: string}> {
    try {
      // 获取该漏斗真正最新更新的数据期间（按更新时间而不是期间日期排序）
      const latestMetrics = await this.prisma.funnelMetrics.findFirst({
        where: {
          funnelId,
          funnel: {
            userId
          }
        },
        orderBy: {
          updatedAt: 'desc'  // 改为按更新时间排序，获取真正最新的数据
        },
        select: {
          periodStartDate: true,
          updatedAt: true
        }
      });

      if (!latestMetrics) {
        throw new Error('没有找到该漏斗的数据记录');
      }

      logger.info(`强制为最新更新数据期间重新生成分析: ${latestMetrics.periodStartDate.toISOString().split('T')[0]} (更新时间: ${latestMetrics.updatedAt.toISOString()})`);
      
      // 先清除该期间的分析
      await this.clearAnalysisForFunnelPeriod(userId, funnelId, latestMetrics.periodStartDate);
      
      // 使用真正最新更新的数据期间生成分析
      return await this.generateKeyInsightsForPeriod(userId, funnelId, latestMetrics.periodStartDate);
    } catch (error: any) {
      logger.error('强制生成最新期间关键洞察失败:', error);
      throw error;
    }
  }

  /**
   * 第二步：生成策略选项（付费）
   */
  async generateStrategyOptions(userId: string, funnelId: string, analysisId: string): Promise<Step2Output> {
    try {
      // 检查用户分析次数
      // 检查用户分析次数配额
      const hasQuota = await this.checkAnalysisQuota(userId);
      if (!hasQuota) {
        throw new ApiError('您的AI分析次数已用完，请联系管理员获取更多次数', 403);
      }

      // 获取第一步的分析结果
      const step1Analysis = await this.getAnalysisStep(analysisId, 1);
      if (!step1Analysis) {
        throw new Error('请先完成第一步分析');
      }

      // 构建第二步输入（包含第一步的所有数据）
      const input = {
        ...step1Analysis.input,
        step1_output: step1Analysis.output
      };

      // 调用AI生成第二步分析
      const prompt = this.buildStep2Prompt(input);
      const aiResponse = await kimiAiService.callKimiAPI([
        {
          role: 'system',
          content: '你是一个专业的商业策略顾问，需要基于数据分析提供两种对比鲜明的优化策略。请严格按照JSON格式输出。'
        },
        {
          role: 'user',
          content: prompt
        }
      ], 0.6);

      // 解析AI响应
      const result = this.parseStep2Response(aiResponse);

      // 保存分析结果
      await this.saveAnalysisStep(userId, funnelId, 2, input, result, analysisId);

      // 消耗分析配额
      await this.consumeAnalysisQuota(userId);
      logger.info(`用户 ${userId} 消耗了1次AI分析配额`);

      return result;
    } catch (error: any) {
      logger.error('生成策略选项失败:', error);
      throw error;
    }
  }

  /**
   * 第三步：生成完整个性化分析报告（不消耗配额，因为配额已在第二步消耗）
   */
  async generateCompleteReport(
    userId: string, 
    funnelId: string, 
    analysisId: string,
    selectedStrategy: 'stable' | 'aggressive'
  ): Promise<any> {
    try {
      // 获取前两步的分析结果
      const step1Analysis = await this.getAnalysisStep(analysisId, 1);
      const step2Analysis = await this.getAnalysisStep(analysisId, 2);

      if (!step1Analysis || !step2Analysis) {
        throw new Error('请先完成前面的分析步骤');
      }

      // 获取漏斗数据以获取dataset period start time
      const funnel = await this.prisma.funnel.findFirst({
        where: { id: funnelId, userId },
        include: {
          funnelMetrics: {
            orderBy: { updatedAt: 'desc' },  // 改为按更新时间排序，获取真正最新更新的数据
            take: 1 // 获取最新更新的metrics数据
          }
        }
      });

      // 提取dataset period start time
      let datasetPeriodStart: Date | undefined;
      if (funnel && funnel.funnelMetrics && funnel.funnelMetrics.length > 0) {
        datasetPeriodStart = funnel.funnelMetrics[0].periodStartDate;
      }

      // 构建第三步输入
      const input = {
        ...step1Analysis.input,
        step1_output: step1Analysis.output,
        step2_output: step2Analysis.output,
        user_choice: selectedStrategy
      };

      // 调用AI生成个性化报告
      const prompt = this.buildStep3Prompt(input, selectedStrategy);
      const aiResponse = await kimiAiService.callKimiAPI([
        {
          role: 'system',
          content: '你是一个专业的商业分析师，请基于用户策略偏好生成个性化的完整分析报告。严格按照JSON格式输出，确保内容匹配用户的风险偏好和时间要求。'
        },
        {
          role: 'user',
          content: prompt
        }
      ], 0.7);

      // 解析并格式化报告
      const report = this.formatCompleteReport(aiResponse, input, selectedStrategy);

      // 保存完整报告 - 包含dataset period start time
      await this.saveCompleteReport(userId, funnelId, analysisId, report, datasetPeriodStart);

      // 注意：第三步不消耗配额，因为配额已在第二步消耗
      logger.info(`第三步报告生成完成，未消耗额外配额`);

      return report;
    } catch (error: any) {
      logger.error('生成完整报告失败:', error);
      throw error;
    }
  }

  /**
   * 构建第一步的prompt
   */
  private buildStep1Prompt(input: Step1Input): string {
    // 计算各阶段转化率
    const stagesWithConversion = input.funnel_data.stages.map((stage, index, array) => {
      if (index === array.length - 1) {
        return { ...stage, conversionRate: 100 };
      }
      const nextStage = array[index + 1];
      const rate = stage.current_value > 0 
        ? ((nextStage.current_value / stage.current_value) * 100).toFixed(1)
        : '0';
      return { ...stage, conversionRate: parseFloat(rate) };
    });

    return `# 销售漏斗关键洞察分析

## 任务说明
基于提供的销售漏斗数据，生成简洁而有力的关键洞察。这是免费的初步分析，目的是给用户提供核心价值并激发其进行深度分析的兴趣。

## 输入数据

### 公司信息
- 公司名称：${input.company_profile.company_name}
- 行业：${input.company_profile.industry}
- 城市：${input.company_profile.city}
- 团队规模：${input.company_profile.team_size}
- 销售模式：${input.company_profile.sales_model}
- 公司描述：${input.company_profile.company_description || '暂无描述'}

### 漏斗数据
- 漏斗名称：${input.funnel_data.funnel_name}
- 时间周期：${input.funnel_data.time_period}
- 各阶段数据及转化率：
${stagesWithConversion.map((s, i) => 
  `  ${i + 1}. ${s.stage_name}: 
     - 当前数量：${s.current_value}
     ${s.previous_value ? `- 上期数量：${s.previous_value}` : ''}
     ${i < stagesWithConversion.length - 1 ? `- 转化率：${s.conversionRate}%` : ''}`
).join('\n')}

## 分析要求

### 分析逻辑
1. **转化率分析**
   - 识别转化率最低的环节作为主要瓶颈
   - 对比历史数据（如有）识别趋势变化
   - 参考行业标准判断严重程度

2. **问题识别优先级**
   - 严重瓶颈：转化率<行业平均50%
   - 潜在机会：转化率接近行业平均但有提升空间
   - 优势环节：转化率超过行业平均，可复制到其他环节

3. **建议生成原则**
   - 具体性：给出明确的改进方向
   - 可行性：建议必须是可执行的
   - 影响力：优先选择影响最大的改进点
   - 紧迫性：突出最需要立即关注的问题

4. **收益预估逻辑**
   - 基于瓶颈环节的改进潜力
   - 参考行业标准转化率
   - 给出保守和乐观的收益区间

### 输出格式要求
请严格按照以下JSON格式输出，注意字数限制：

{
  "key_insight": {
    "summary": "核心洞察，点出最关键的问题或机会（30-40字以内）",
    "bottleneck_stage": "最大瓶颈阶段的名称",
    "conversion_issue": "该阶段的具体转化问题（20字以内）",
    "quick_suggestion": "最重要的1-2个改进方向（20字以内）",
    "potential_impact": "改进后的预期收益（25字以内）"
  },
  "teaser_analysis": {
    "core_problem": "用数据说明核心问题的严重性（40字以内）",
    "quick_advice": "具体可执行的改进建议（40字以内）",
    "expected_roi": "量化的投资回报预期（30字以内）"
  }
}

### 质量标准
- 必须明确指出最大瓶颈环节
- 提供具体可执行的改进建议
- 给出量化的收益预期
- 内容简洁但有吸引力
- 使用专业的商业分析术语
- 突出问题的重要性和紧迫感

### 注意事项
- 如果数据不完整，明确指出需要补充哪些数据
- 避免过于复杂的分析
- 避免模糊不清的建议
- 避免过于保守的收益预估
- 确保所有结论都有数据支撑

现在请根据以上数据生成关键洞察分析。`;
  }

  /**
   * 构建第二步的prompt
   */
  private buildStep2Prompt(input: any): string {
    return `
基于第一步的分析结果，为用户提供两种对比鲜明的优化策略。

第一步分析结果：
- 核心洞察：${input.step1_output.key_insight.summary}
- 瓶颈环节：${input.step1_output.key_insight.bottleneck_stage}
- 主要问题：${input.step1_output.teaser_analysis.core_problem}

请生成两种策略：
1. 稳健优化策略：低风险、渐进式、适合保守型企业
2. 激进增长策略：高收益、快速见效、适合追求增长的企业

请严格按照以下JSON格式输出：
{
  "stable_strategy": {
    "title": "稳健优化策略",
    "tag": "低风险",
    "features": "渐进式改进，2-3个月见效",
    "core_actions": "A/B测试、团队培训、流程优化",
    "investment": "相对较低，风险可控"
  },
  "aggressive_strategy": {
    "title": "激进增长策略",
    "tag": "高收益",
    "features": "技术驱动，1个月快速见效",
    "core_actions": "AI工具、自动化系统、数据驱动",
    "investment": "较高但ROI更大"
  }
}`;
  }

  /**
   * 构建第三步的prompt
   */
  private buildStep3Prompt(input: any, strategy: string): string {
    const strategyType = strategy === 'stable' ? '稳健优化策略' : '激进增长策略';
    const strategyDetails = strategy === 'stable' 
      ? input.step2_output.stable_strategy 
      : input.step2_output.aggressive_strategy;

    // 基于策略选择确定用户偏好
    const userPreferences = {
      risk_preference: strategy === 'stable' ? 'low' : 'high',
      timeline_preference: strategy === 'stable' ? 'gradual' : 'fast',
      investment_preference: strategy === 'stable' ? 'conservative' : 'aggressive',
      approach_preference: strategy === 'stable' ? 'traditional' : 'tech_driven'
    };

    return `# 第三步：个性化完整分析报告 Prompt（深度收费分析）

## 输入数据

### 公司信息
- 公司名称：${input.company_profile.company_name}
- 行业：${input.company_profile.industry}
- 城市：${input.company_profile.city}
- 团队规模：${input.company_profile.team_size}
- 销售模式：${input.company_profile.sales_model}

### 漏斗数据
- 漏斗名称：${input.funnel_data.funnel_name}
- 时间周期：${input.funnel_data.time_period}
- 漏斗阶段：${JSON.stringify(input.funnel_data.stages)}

### 关键洞察（第一步分析结果）
- 核心洞察：${input.step1_output.key_insight.summary}
- 瓶颈阶段：${input.step1_output.key_insight.bottleneck_stage}
- 转化问题：${input.step1_output.key_insight.conversion_issue}

### 用户策略偏好
- 选择策略：${strategyType}
- 策略特点：${strategyDetails.features}
- 核心行动：${strategyDetails.core_actions}
- 投资偏好：${strategyDetails.investment}
- 风险偏好：${userPreferences.risk_preference}（低风险/高增长）
- 时间偏好：${userPreferences.timeline_preference}（渐进式/快速）
- 投入偏好：${userPreferences.investment_preference}（保守/激进）
- 方法偏好：${userPreferences.approach_preference}（传统/技术驱动）

## 分析要求

### ${strategy === 'stable' ? '稳健策略适配' : '激进策略适配'}
${strategy === 'stable' ? `
**分析重点**：风险控制、渐进式改进、基于现有资源
**建议风格**：保守稳妥、分阶段实施、可验证方法
**时间预期**：2-3个月的渐进式改进周期
**投资导向**：优先低成本高效果的解决方案
**语言风格**：强调"稳步提升"、"风险可控"、"确保稳定"
` : `
**分析重点**：快速增长、创新技术、突破性方案
**建议风格**：积极进取、快速迭代、技术驱动
**时间预期**：1个月的快速见效目标
**投资导向**：重点关注高投入高回报的机会
**语言风格**：强调"快速突破"、"技术领先"、"跨越式发展"
`}

## 输出格式要求

请严格按照以下JSON格式输出个性化分析报告：

{
  "header": {
    "title": "个性化报告标题（基于${strategyType}，15-20字符）",
    "subtitle": "副标题（体现个性化特点，20-30字符）"
  },
  "executive_summary": {
    "health_analysis": {
      "score": "健康度分数（基于用户策略调整评估标准）",
      "description": "健康度描述（30-40字符）",
      "metrics": ["个性化指标1（基于用户关注点，25-30字符）", "个性化指标2"]
    },
    "bottleneck_analysis": {
      "title": "瓶颈分析标题（体现策略特点，8-12字符）",
      "main_issue": "主要问题（基于用户偏好调整表述，30-35字符）",
      "details": ["针对性问题1（匹配用户策略方向，20-25字符）", "针对性问题2", "针对性问题3"]
    },
    "growth_opportunity": {
      "title": "增长机会标题（匹配策略类型，8-12字符）",
      "main_opportunity": "主要机会（基于用户选择，35-40字符）",
      "strategies": ["个性化策略1（匹配风险和时间偏好，20-25字符）", "个性化策略2", "个性化策略3"]
    }
  },
  "personalized_recommendations": {
    "execution_plan": {
      "phase_1": {
        "title": "第一阶段（基于${userPreferences.timeline_preference === 'gradual' ? '渐进式' : '快速'}时间偏好）",
        "duration": "${strategy === 'stable' ? '4-6周' : '1-2周'}",
        "actions": ["基于策略的具体行动1", "行动2", "行动3"],
        "expected_results": "预期结果（匹配策略类型）",
        "investment_required": "所需投入（匹配${userPreferences.investment_preference}投资偏好）"
      },
      "phase_2": {
        "title": "第二阶段",
        "duration": "${strategy === 'stable' ? '6-10周' : '2-3周'}",
        "actions": ["基于策略的具体行动1", "行动2", "行动3"],
        "expected_results": "预期结果",
        "investment_required": "所需投入"
      },
      "phase_3": {
        "title": "第三阶段",
        "duration": "${strategy === 'stable' ? '10-12周' : '3-4周'}",
        "actions": ["基于策略的具体行动1", "行动2", "行动3"],
        "expected_results": "预期结果",
        "investment_required": "所需投入"
      }
    },
    "roi_analysis": {
      "total_investment": "总投入预估（基于${userPreferences.investment_preference}偏好）",
      "expected_revenue_increase": "预期收入增长（${strategy === 'stable' ? '保守' : '积极'}预估）",
      "roi_percentage": "ROI百分比",
      "payback_period": "回本周期（${strategy === 'stable' ? '6-12个月' : '2-6个月'}）",
      "risk_assessment": "风险评估（基于${userPreferences.risk_preference}风险偏好）"
    }
  }
}

## 质量要求
- 所有建议必须与用户的${strategyType}高度匹配
- 时间规划符合${userPreferences.timeline_preference}偏好
- 投资方案匹配${userPreferences.investment_preference}投入意愿
- 风险评估与${userPreferences.risk_preference}风险偏好一致
- 提供具体可执行的行动方案
- 确保ROI分析有数据支撑

现在请基于以上输入数据和用户策略偏好生成个性化的完整分析报告。`;
  }

  /**
   * 构建漏斗阶段数据
   */
  private buildStagesData(funnel: any): FunnelStage[] {
    const stages: FunnelStage[] = [];
    const latestMetrics = funnel.funnelMetrics[0];
    const previousMetrics = funnel.funnelMetrics[1];

    console.log('🔍 buildStagesData 调试信息:');
    console.log('  漏斗ID:', funnel.id);
    console.log('  漏斗指标数量:', funnel.funnelMetrics?.length || 0);
    console.log('  最新指标:', latestMetrics ? JSON.stringify({
      id: latestMetrics.id,
      totalEntries: latestMetrics.totalEntries,
      customMetrics: latestMetrics.customMetrics
    }, null, 2) : '无');
    
    // 获取节点信息：优先使用关联的nodes，否则从canvasData.nodes获取
    const nodes = funnel.nodes?.length > 0 ? funnel.nodes : (funnel.canvasData?.nodes || []);
    console.log('  节点来源:', funnel.nodes?.length > 0 ? 'funnel.nodes' : 'canvasData.nodes');
    console.log('  节点数量:', nodes.length);
    
    // 修复：正确读取customMetrics.stageData而不是stageMetrics
    if (latestMetrics?.customMetrics?.stageData && nodes.length > 0) {
      const stageData = latestMetrics.customMetrics.stageData;
      const previousData = previousMetrics?.customMetrics?.stageData || {};

      console.log('  ✅ 找到阶段数据:', JSON.stringify(stageData, null, 2));

      nodes.forEach((node: any) => {
        const stageInfo = {
          stage_name: node.label || node.name,
          current_value: stageData[node.id] || 0,
          previous_value: previousData[node.id]
        };
        stages.push(stageInfo);
        console.log(`  - 阶段 ${node.id}: ${node.label} = ${stageInfo.current_value}`);
      });
    } else if (nodes.length > 0) {
      console.log('  ⚠️ 未找到customMetrics.stageData，使用默认值');
      // 如果没有metrics数据，使用节点的默认值
      nodes.forEach((node: any) => {
        const stageInfo = {
          stage_name: node.label || node.name,
          current_value: node.data?.value || 0
        };
        stages.push(stageInfo);
        console.log(`  - 默认阶段 ${node.id}: ${node.label} = ${stageInfo.current_value}`);
      });
    } else {
      console.log('  ❌ 既没有节点数据也没有阶段数据');
    }

    console.log('  📊 最终构建的阶段数据:', JSON.stringify(stages, null, 2));
    return stages;
  }

  /**
   * 解析第一步AI响应
   */
  private parseStep1Response(response: string): Step1Output {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果解析失败，返回默认结构
      return {
        key_insight: {
          summary: '数据显示存在转化瓶颈，需要进一步分析',
          bottleneck_stage: '待识别',
          conversion_issue: '转化率下降',
          quick_suggestion: '优化流程',
          potential_impact: '提升15-30%'
        },
        teaser_analysis: {
          core_problem: '漏斗中段转化率偏低',
          quick_advice: '建议优化用户体验和销售流程',
          expected_roi: 'ROI预计200-300%'
        }
      };
    } catch (error) {
      logger.error('解析Step1响应失败:', error);
      throw new Error('AI响应解析失败');
    }
  }

  /**
   * 解析第二步AI响应
   */
  private parseStep2Response(response: string): Step2Output {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        stable_strategy: {
          title: '稳健优化策略',
          tag: '低风险',
          features: '渐进式改进，风险可控',
          core_actions: '流程优化、团队培训',
          investment: '投入较低，稳定收益'
        },
        aggressive_strategy: {
          title: '激进增长策略',
          tag: '高收益',
          features: '快速见效，增长迅速',
          core_actions: '技术驱动、数据分析',
          investment: '投入较高，回报更大'
        }
      };
    } catch (error) {
      logger.error('解析Step2响应失败:', error);
      throw new Error('AI响应解析失败');
    }
  }

  /**
   * 格式化完整报告
   */
  private formatCompleteReport(aiResponse: string, input: any, strategy: string): any {
    return {
      reportId: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      strategy: strategy,
      companyInfo: input.company_profile,
      funnelData: input.funnel_data,
      keyInsights: input.step1_output,
      selectedStrategy: strategy === 'stable' 
        ? input.step2_output.stable_strategy 
        : input.step2_output.aggressive_strategy,
      detailedAnalysis: aiResponse,
      recommendations: this.extractRecommendations(aiResponse),
      nextSteps: this.extractNextSteps(aiResponse)
    };
  }

  /**
   * 提取建议
   */
  private extractRecommendations(report: string): string[] {
    const recommendations: string[] = [];
    const lines = report.split('\n');
    
    lines.forEach(line => {
      if (line.includes('建议') || line.includes('推荐') || line.includes('应该')) {
        const cleaned = line.replace(/^[-•*\d.]\s*/, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      }
    });

    return recommendations.slice(0, 5);
  }

  /**
   * 提取下一步行动
   */
  private extractNextSteps(report: string): string[] {
    const steps: string[] = [];
    const lines = report.split('\n');
    
    let inStepsSection = false;
    lines.forEach(line => {
      if (line.includes('下一步') || line.includes('实施步骤') || line.includes('行动计划')) {
        inStepsSection = true;
      } else if (inStepsSection && line.trim()) {
        const cleaned = line.replace(/^[-•*\d.]\s*/, '').trim();
        if (cleaned.length > 5 && cleaned.length < 100) {
          steps.push(cleaned);
        }
      }
    });

    return steps.slice(0, 5);
  }

  /**
   * 保存分析步骤结果
   */
  private async saveAnalysisStep(
    userId: string,
    funnelId: string,
    step: number,
    input: any,
    output: any,
    parentId?: string
  ): Promise<string> {
    const analysis = await this.prisma.aiAnalysis.create({
      data: {
        userId,
        funnelId,
        step,
        parentId,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        status: 'completed'
      }
    });

    return analysis.id;
  }

  /**
   * 保存分析步骤结果，包含数据期间信息
   */
  private async saveAnalysisStepForPeriod(
    userId: string,
    funnelId: string,
    step: number,
    input: any,
    output: any,
    datasetPeriodStart: Date,
    parentId?: string
  ): Promise<string> {
    // 创建分析记录
    const analysis = await this.prisma.aiAnalysis.create({
      data: {
        userId,
        funnelId,
        step,
        parentId,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        status: 'completed'
      }
    });

    // 构建完整的报告内容，包含漏斗数据结构
    const reportContent = {
      ...output,
      funnelData: input.funnel_data,
      companyInfo: input.company_profile,
      datasetPeriodStart: datasetPeriodStart
    };

    // 创建关联的报告记录，包含数据期间信息
    await this.prisma.aiAnalysisReport.create({
      data: {
        userId,
        funnelId,
        analysisId: analysis.id,
        reportType: `step${step}`,
        content: JSON.stringify(reportContent),
        datasetPeriodStart: datasetPeriodStart
      }
    });

    logger.info(`保存了步骤${step}的分析和报告，数据期间: ${datasetPeriodStart.toISOString().split('T')[0]}`);
    
    return analysis.id;
  }

  /**
   * 获取分析步骤结果
   */
  private async getAnalysisStep(analysisId: string, step: number): Promise<any> {
    const analysis = await this.prisma.aiAnalysis.findFirst({
      where: {
        OR: [
          { id: analysisId, step },
          { parentId: analysisId, step },
          // Also check if this is the root analysis and we want step 1
          ...(step === 1 ? [{ id: analysisId }] : [])
        ]
      }
    });

    if (!analysis) {
      return null;
    }

    return {
      input: JSON.parse(analysis.input as string),
      output: JSON.parse(analysis.output as string)
    };
  }

  /**
   * 保存完整报告
   */
  private async saveCompleteReport(
    userId: string,
    funnelId: string,
    analysisId: string,
    report: any,
    datasetPeriodStart?: Date
  ): Promise<void> {
    await this.prisma.aiAnalysisReport.create({
      data: {
        userId,
        funnelId,
        analysisId,
        reportType: 'complete',
        content: JSON.stringify(report),
        strategy: report.strategy,
        datasetPeriodStart
      }
    });
  }

  /**
   * 检查用户分析次数
   */
  private async checkAnalysisQuota(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    return (user?.analysisQuota || 0) > 0;
  }

  /**
   * 消耗分析次数
   */
  private async consumeAnalysisQuota(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        analysisQuota: {
          decrement: 1
        }
      }
    });
  }

  /**
   * 获取用户剩余分析次数
   */
  async getUserAnalysisQuota(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    return user?.analysisQuota || 0;
  }

  /**
   * 获取用户的所有分析报告
   */
  async getUserReports(userId: string): Promise<any[]> {
    logger.info(`🔍 获取用户报告: userId=${userId}`);
    
    const reports = await this.prisma.aiAnalysisReport.findMany({
      where: { userId },
      include: {
        funnel: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    logger.info(`📊 找到 ${reports.length} 个报告`);
    
    const result = reports.map(report => {
      try {
        return {
          id: report.id,
          funnelName: report.funnel.name,
          reportType: report.reportType,
          strategy: report.strategy,
          datasetPeriodStart: report.datasetPeriodStart,
          createdAt: report.createdAt,
          content: JSON.parse(report.content as string)
        };
      } catch (error) {
        logger.error(`❌ 解析报告 ${report.id} 内容失败:`, error);
        return {
          id: report.id,
          funnelName: report.funnel.name,
          reportType: report.reportType,
          strategy: report.strategy,
          datasetPeriodStart: report.datasetPeriodStart,
          createdAt: report.createdAt,
          content: {}
        };
      }
    });
    
    logger.info(`✅ 返回 ${result.length} 个处理后的报告`);
    return result;
  }

  // 报告缓存
  private reportCache = new Map<string, any>()
  private reportCacheExpiration = new Map<string, number>()
  private REPORT_CACHE_DURATION = 300000 // 5分钟缓存

  /**
   * 获取单个报告详情
   */
  async getReportById(userId: string, reportId: string): Promise<any | null> {
    const cacheKey = `report-${userId}-${reportId}`
    const now = Date.now()

    // 检查缓存
    if (this.reportCache.has(cacheKey) && 
        this.reportCacheExpiration.has(cacheKey) && 
        this.reportCacheExpiration.get(cacheKey)! > now) {
      console.log('🚀 使用缓存的报告数据:', reportId.slice(0, 8))
      return this.reportCache.get(cacheKey)
    }

    const report = await this.prisma.aiAnalysisReport.findFirst({
      where: { 
        id: reportId,
        userId 
      },
      include: {
        funnel: {
          select: {
            name: true
          }
        }
      }
    });

    if (!report) {
      return null;
    }

    const result = {
      id: report.id,
      funnelName: report.funnel.name,
      reportType: report.reportType,
      strategy: report.strategy,
      createdAt: report.createdAt,
      content: JSON.parse(report.content as string)
    };

    // 设置缓存
    this.reportCache.set(cacheKey, result)
    this.reportCacheExpiration.set(cacheKey, now + this.REPORT_CACHE_DURATION)

    // 限制缓存大小
    if (this.reportCache.size > 50) {
      const oldestKey = this.reportCache.keys().next().value
      if (oldestKey) {
        this.reportCache.delete(oldestKey)
        this.reportCacheExpiration.delete(oldestKey)
      }
    }

    console.log('✅ 报告数据已缓存:', reportId.slice(0, 8))
    return result;
  }

  /**
   * 获取漏斗的分析状态
   */
  async getFunnelAnalysisStatus(userId: string, funnelId: string): Promise<{
    hasStep1: boolean;
    hasStep2: boolean;
    hasStep3: boolean;
    analysisId?: string;
  }> {
    // 检查各步骤是否存在
    const step1 = await this.prisma.aiAnalysis.findFirst({
      where: { userId, funnelId, step: 1 },
      orderBy: { createdAt: 'desc' }
    });

    const step2 = await this.prisma.aiAnalysis.findFirst({
      where: { userId, funnelId, step: 2 },
      orderBy: { createdAt: 'desc' }
    });

    const step3 = await this.prisma.aiAnalysisReport.findFirst({
      where: { userId, funnelId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      hasStep1: !!step1,
      hasStep2: !!step2,
      hasStep3: !!step3,
      analysisId: step1?.id
    };
  }

  /**
   * 获取特定数据集周期的分析状态
   */
  async getFunnelDatasetAnalysisStatus(userId: string, funnelId: string, datasetPeriodStart: Date): Promise<{
    hasStep1: boolean;
    hasStep2: boolean;
    hasStep3: boolean;
    analysisId?: string;
    existingReport?: any;
    needsReanalysis?: boolean;
  }> {
    // 获取该数据期间最新更新时间
    const latestMetrics = await this.prisma.funnelMetrics.findFirst({
      where: {
        funnelId,
        periodStartDate: datasetPeriodStart,
        funnel: {
          userId
        }
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        updatedAt: true
      }
    });

    // 检查各步骤是否存在
    const step1 = await this.prisma.aiAnalysis.findFirst({
      where: { 
        userId, 
        funnelId, 
        step: 1,
        // 通过关联的报告查找特定数据期间的分析
        reports: {
          some: {
            datasetPeriodStart: datasetPeriodStart
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const step2 = await this.prisma.aiAnalysis.findFirst({
      where: { userId, funnelId, step: 2 },
      orderBy: { createdAt: 'desc' }
    });

    // 检查特定数据集周期的完整报告
    const step3 = await this.prisma.aiAnalysisReport.findFirst({
      where: { 
        userId, 
        funnelId,
        datasetPeriodStart: datasetPeriodStart
      },
      orderBy: { createdAt: 'desc' }
    });

    // 判断是否需要重新分析（数据更新时间晚于分析时间）
    let needsReanalysis = false;
    if (latestMetrics && step1) {
      needsReanalysis = latestMetrics.updatedAt > step1.createdAt;
    }

    return {
      hasStep1: !!step1,
      hasStep2: !!step2,
      hasStep3: !!step3,
      analysisId: step1?.id,
      needsReanalysis,
      existingReport: step3 ? {
        id: step3.id,
        strategy: step3.strategy,
        createdAt: step3.createdAt
      } : undefined
    };
  }
}

// 导出单例
export default new ThreeStepAIAnalysisService();