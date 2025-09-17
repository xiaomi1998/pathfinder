import { PrismaClient } from '@prisma/client';
import { 
  FunnelMetricData, 
  FunnelStageData,
  AdviceRule
} from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

/**
 * 建议条件类型
 */
interface RecommendationCondition {
  stage?: keyof FunnelMetricData;
  metric?: 'conversion_rate' | 'drop_off_rate' | 'overall_rate';
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'between';
  value?: number;
  benchmarkComparison?: 'below_p25' | 'below_p50' | 'below_p75' | 'above_p75' | 'above_p90';
  severity?: 'critical' | 'major' | 'minor';
}

/**
 * 建议内容类型
 */
interface RecommendationContent {
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  implementationTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  resources: string[];
  successMetrics: string[];
}

/**
 * 生成的建议类型
 */
interface GeneratedRecommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  implementationTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  roiEstimate: number;
  resources: string[];
  successMetrics: string[];
  applicableStages: (keyof FunnelMetricData)[];
  customizedContent?: any;
}

/**
 * 建议规则引擎
 * 实现9大核心建议类别的规则匹配和智能建议生成
 */
export class RecommendationEngine {
  private prisma: PrismaClient;
  private coreRecommendations: Map<string, any>;

  constructor() {
    this.prisma = new PrismaClient();
    this.coreRecommendations = new Map();
    this.initializeCoreRecommendations();
  }

  /**
   * 生成智能建议
   */
  async generateRecommendations(
    companyData: FunnelMetricData,
    benchmarkData: any,
    diagnosticResult?: any,
    options: {
      maxRecommendations?: number;
      includeCustomRules?: boolean;
      organizationId?: string;
      industry?: string;
      companySize?: string;
    } = {}
  ): Promise<GeneratedRecommendation[]> {
    try {
      logger.info('Generating intelligent recommendations');

      const recommendations: GeneratedRecommendation[] = [];

      // 1. 基于核心规则生成建议
      const coreRecommendations = await this.generateCoreRecommendations(
        companyData, 
        benchmarkData, 
        diagnosticResult
      );
      recommendations.push(...coreRecommendations);

      // 2. 如果启用，加载自定义规则
      if (options.includeCustomRules && options.organizationId) {
        const customRecommendations = await this.generateCustomRecommendations(
          options.organizationId,
          companyData,
          benchmarkData
        );
        recommendations.push(...customRecommendations);
      }

      // 3. 个性化调整
      const personalizedRecommendations = this.personalizeRecommendations(
        recommendations,
        options.industry,
        options.companySize
      );

      // 4. 优先级排序
      const sortedRecommendations = this.sortRecommendationsByPriority(personalizedRecommendations);

      // 5. 限制返回数量
      const maxRecommendations = options.maxRecommendations || 12;
      return sortedRecommendations.slice(0, maxRecommendations);

    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw new ApiError('生成建议失败', 500);
    }
  }

  /**
   * 基于条件匹配规则
   */
  async matchRecommendationRules(
    companyData: FunnelMetricData,
    benchmarkData: any,
    customConditions?: RecommendationCondition[]
  ): Promise<string[]> {
    try {
      const matchedRules: string[] = [];
      
      // 检查9大核心类别的条件
      for (const [category, rule] of this.coreRecommendations) {
        if (this.evaluateConditions(rule.conditions, companyData, benchmarkData)) {
          matchedRules.push(category);
        }
      }

      // 检查自定义条件（如果提供）
      if (customConditions) {
        for (const condition of customConditions) {
          if (this.evaluateCondition(condition, companyData, benchmarkData)) {
            matchedRules.push('custom_condition_matched');
          }
        }
      }

      return matchedRules;

    } catch (error) {
      logger.error('Error matching recommendation rules:', error);
      throw new ApiError('规则匹配失败', 500);
    }
  }

  /**
   * 计算建议优先级
   */
  calculateRecommendationPriority(
    recommendation: any,
    companyData: FunnelMetricData,
    benchmarkData: any,
    weakPoints?: any[]
  ): {
    priority: 'high' | 'medium' | 'low';
    roiScore: number;
    impactScore: number;
    urgencyScore: number;
    feasibilityScore: number;
  } {
    try {
      // 1. 计算ROI评分 (1-10)
      const roiScore = this.calculateROIScore(recommendation, companyData);
      
      // 2. 计算影响力评分 (1-10)  
      const impactScore = this.calculateImpactScore(recommendation, companyData, benchmarkData);
      
      // 3. 计算紧急性评分 (1-10)
      const urgencyScore = this.calculateUrgencyScore(recommendation, weakPoints);
      
      // 4. 计算可行性评分 (1-10)
      const feasibilityScore = this.calculateFeasibilityScore(recommendation);

      // 5. 综合优先级计算
      const compositeScore = (
        roiScore * 0.3 + 
        impactScore * 0.3 + 
        urgencyScore * 0.25 + 
        feasibilityScore * 0.15
      );

      const priority = this.scoreToPriority(compositeScore);

      return {
        priority,
        roiScore,
        impactScore,
        urgencyScore,
        feasibilityScore
      };

    } catch (error) {
      logger.error('Error calculating recommendation priority:', error);
      throw new ApiError('计算建议优先级失败', 500);
    }
  }

  /**
   * 个性化建议内容
   */
  personalizeRecommendationContent(
    baseRecommendation: any,
    companyData: FunnelMetricData,
    context: {
      industry?: string;
      companySize?: string;
      specificIssues?: string[];
      currentPerformance?: any;
    }
  ): GeneratedRecommendation {
    try {
      const personalized = { ...baseRecommendation };

      // 1. 基于行业调整
      if (context.industry) {
        personalized.description = this.adaptForIndustry(
          personalized.description, 
          context.industry
        );
        personalized.actionItems = this.adaptActionItemsForIndustry(
          personalized.actionItems,
          context.industry
        );
      }

      // 2. 基于公司规模调整
      if (context.companySize) {
        personalized.resources = this.adaptResourcesForCompanySize(
          personalized.resources,
          context.companySize
        );
        personalized.implementationTime = this.adaptTimelineForCompanySize(
          personalized.implementationTime,
          context.companySize
        );
      }

      // 3. 基于当前性能调整
      if (context.currentPerformance) {
        personalized.expectedImpact = this.calculatePersonalizedImpact(
          personalized,
          companyData,
          context.currentPerformance
        );
      }

      // 4. 插入具体数据
      personalized.customizedContent = this.insertSpecificData(
        personalized,
        companyData,
        context
      );

      return personalized;

    } catch (error) {
      logger.error('Error personalizing recommendation content:', error);
      throw new ApiError('个性化建议内容失败', 500);
    }
  }

  // ===================== Private Methods =====================

  /**
   * 初始化9大核心建议类别
   */
  private initializeCoreRecommendations(): void {
    // 1. 流量获取优化
    this.coreRecommendations.set('traffic_acquisition', {
      category: 'traffic_acquisition',
      title: '流量获取优化',
      description: '针对第一阶段访问量不足的优化建议',
      conditions: [
        { stage: 'stage_1', metric: 'conversion_rate', operator: 'lt', benchmarkComparison: 'below_p50' }
      ],
      content: {
        title: '优化流量获取策略',
        description: '通过多渠道获客策略提升线索质量和数量',
        actionItems: [
          '分析现有获客渠道的ROI，优化预算分配',
          '扩展高质量获客渠道，如内容营销、SEO优化',
          '完善客户画像，精准定位目标客户群体',
          '建立推荐奖励机制，激励现有客户推荐',
          '优化着陆页设计，提升首次访问转化率'
        ],
        expectedImpact: '预计提升线索量20-40%，改善线索质量',
        implementationTime: '2-4周',
        difficulty: 'medium',
        resources: ['营销团队', '内容创作', 'SEO工具', '数据分析平台'],
        successMetrics: ['线索数量增长率', '获客成本降低', '线索质量评分提升']
      }
    });

    // 2. 着陆页优化
    this.coreRecommendations.set('landing_page_optimization', {
      category: 'landing_page_optimization',
      title: '着陆页优化',
      description: '针对首次转化率低的页面优化建议',
      conditions: [
        { stage: 'stage_1', metric: 'conversion_rate', operator: 'lt', value: 15 },
        { metric: 'overall_rate', operator: 'lt', benchmarkComparison: 'below_p25' }
      ],
      content: {
        title: '提升着陆页转化效果',
        description: '通过页面设计和用户体验优化提升首次转化率',
        actionItems: [
          '简化页面设计，突出核心价值主张',
          '优化表单设计，减少用户填写阻力',
          '增加社会证明元素，如客户评价、案例展示',
          '优化页面加载速度，减少跳出率',
          'A/B测试不同版本的着陆页效果'
        ],
        expectedImpact: '预计提升首次转化率15-30%',
        implementationTime: '1-3周',
        difficulty: 'easy',
        resources: ['UI/UX设计师', '前端开发', 'A/B测试工具'],
        successMetrics: ['页面转化率', '跳出率', '页面停留时间']
      }
    });

    // 3. 用户体验改进
    this.coreRecommendations.set('user_experience_improvement', {
      category: 'user_experience_improvement',
      title: '用户体验改进',
      description: '针对中间阶段流失高的体验优化建议',
      conditions: [
        { stage: 'stage_2', metric: 'conversion_rate', operator: 'lt', benchmarkComparison: 'below_p50' },
        { stage: 'stage_3', metric: 'conversion_rate', operator: 'lt', benchmarkComparison: 'below_p50' }
      ],
      content: {
        title: '优化客户体验流程',
        description: '通过改善客户接触和沟通体验减少中间流失',
        actionItems: [
          '优化客户接触时机，建立最佳联系时间表',
          '改进初次沟通话术，提升客户响应率',
          '建立多渠道触达机制（电话、邮件、微信等）',
          '优化客户资料收集流程，提升信息完整度',
          '建立客户反馈机制，及时了解客户需求'
        ],
        expectedImpact: '预计减少中间阶段流失15-25%',
        implementationTime: '2-3周',
        difficulty: 'medium',
        resources: ['销售团队', 'CRM系统', '客户服务工具'],
        successMetrics: ['客户响应率', '阶段转化率', '客户满意度']
      }
    });

    // 4. 内容优化
    this.coreRecommendations.set('content_optimization', {
      category: 'content_optimization',
      title: '内容优化',
      description: '针对特定内容相关转化问题的优化建议',
      conditions: [
        { stage: 'stage_2', metric: 'conversion_rate', operator: 'lt', value: 25 },
        { stage: 'stage_3', metric: 'conversion_rate', operator: 'between', value: 20 }
      ],
      content: {
        title: '优化内容营销策略',
        description: '通过高质量内容提升客户参与度和转化率',
        actionItems: [
          '分析客户关心的核心问题，创建针对性内容',
          '开发案例研究和成功故事，增强说服力',
          '制作演示材料和产品介绍视频',
          '建立内容库，支持销售团队使用',
          '定期更新内容，保持信息的时效性'
        ],
        expectedImpact: '预计提升客户参与度20-35%',
        implementationTime: '3-6周',
        difficulty: 'medium',
        resources: ['内容创作团队', '设计师', '视频制作', '内容管理系统'],
        successMetrics: ['内容阅读量', '客户参与度', '内容转化率']
      }
    });

    // 5. 技术性能优化
    this.coreRecommendations.set('technical_performance', {
      category: 'technical_performance',
      title: '技术性能优化',
      description: '针对加载速度等技术问题的优化建议',
      conditions: [
        { stage: 'stage_1', metric: 'conversion_rate', operator: 'lt', value: 10 }
      ],
      content: {
        title: '提升技术性能表现',
        description: '通过技术优化改善用户体验和转化效果',
        actionItems: [
          '优化网站加载速度，目标3秒内完全加载',
          '改善移动端适配，提升移动用户体验',
          '优化表单提交流程，减少技术错误',
          '增强网站安全性，提升用户信任度',
          '实施性能监控，及时发现和修复问题'
        ],
        expectedImpact: '预计减少技术相关流失10-20%',
        implementationTime: '2-4周',
        difficulty: 'medium',
        resources: ['技术开发团队', '性能监控工具', '安全服务'],
        successMetrics: ['页面加载时间', '技术错误率', '移动端转化率']
      }
    });

    // 6. 个性化推荐
    this.coreRecommendations.set('personalization', {
      category: 'personalization',
      title: '个性化推荐',
      description: '针对用户匹配度问题的个性化优化建议',
      conditions: [
        { stage: 'stage_3', metric: 'conversion_rate', operator: 'lt', benchmarkComparison: 'below_p50' }
      ],
      content: {
        title: '实施个性化营销策略',
        description: '基于客户特征提供个性化的产品和服务推荐',
        actionItems: [
          '建立客户细分模型，识别不同客户群体',
          '开发个性化产品推荐算法',
          '制定差异化定价策略，满足不同预算需求',
          '个性化沟通内容，提升客户相关性',
          '建立客户标签系统，支持精准营销'
        ],
        expectedImpact: '预计提升商机转化率25-40%',
        implementationTime: '4-8周',
        difficulty: 'hard',
        resources: ['数据分析师', '个性化系统', '标签管理工具'],
        successMetrics: ['个性化推荐点击率', '商机质量评分', '客户满意度']
      }
    });

    // 7. 转化路径优化
    this.coreRecommendations.set('conversion_path_optimization', {
      category: 'conversion_path_optimization',
      title: '转化路径优化',
      description: '针对流程复杂度问题的路径优化建议',
      conditions: [
        { metric: 'overall_rate', operator: 'lt', benchmarkComparison: 'below_p50' }
      ],
      content: {
        title: '简化转化路径流程',
        description: '通过流程优化减少客户决策阻力，提升整体转化率',
        actionItems: [
          '分析现有转化路径，识别主要障碍点',
          '简化决策流程，减少不必要的步骤',
          '优化各阶段间的衔接，减少客户流失',
          '建立快速决策通道，缩短销售周期',
          '提供清晰的进度指示，增强客户信心'
        ],
        expectedImpact: '预计提升整体转化率10-25%',
        implementationTime: '3-6周',
        difficulty: 'medium',
        resources: ['流程设计师', '销售团队', '用户体验师'],
        successMetrics: ['整体转化率', '平均转化时间', '流程完成率']
      }
    });

    // 8. 客户服务改进
    this.coreRecommendations.set('customer_service_improvement', {
      category: 'customer_service_improvement',
      title: '客户服务改进',
      description: '针对服务相关流失的客户服务优化建议',
      conditions: [
        { stage: 'stage_4', metric: 'conversion_rate', operator: 'lt', benchmarkComparison: 'below_p50' }
      ],
      content: {
        title: '提升客户服务质量',
        description: '通过改善客户服务减少成交阶段的客户流失',
        actionItems: [
          '建立客户异议处理标准流程',
          '提升销售团队专业技能和产品知识',
          '优化客户支持响应速度，目标2小时内回复',
          '建立客户成功案例库，增强客户信心',
          '实施客户满意度调研，持续改进服务'
        ],
        expectedImpact: '预计提升成交率15-30%',
        implementationTime: '2-4周',
        difficulty: 'easy',
        resources: ['客户服务团队', '培训资源', '客服系统'],
        successMetrics: ['客户满意度', '服务响应时间', '成交转化率']
      }
    });

    // 9. 定价策略调整
    this.coreRecommendations.set('pricing_strategy_adjustment', {
      category: 'pricing_strategy_adjustment',
      title: '定价策略调整',
      description: '针对价格敏感性问题的定价优化建议',
      conditions: [
        { stage: 'stage_4', metric: 'conversion_rate', operator: 'lt', value: 40 }
      ],
      content: {
        title: '优化产品定价策略',
        description: '通过价格策略调整提升成交率和客户价值',
        actionItems: [
          '进行市场价格调研，确保价格竞争力',
          '开发多层次定价方案，满足不同需求',
          '设计限时优惠策略，创造紧迫感',
          '提供灵活付款方式，降低客户门槛',
          '建立价值传递体系，证明价格合理性'
        ],
        expectedImpact: '预计提升成交率20-35%',
        implementationTime: '2-5周',
        difficulty: 'medium',
        resources: ['定价分析师', '财务团队', '市场调研'],
        successMetrics: ['成交转化率', '平均客单价', '价格接受度']
      }
    });
  }

  /**
   * 生成核心建议
   */
  private async generateCoreRecommendations(
    companyData: FunnelMetricData,
    benchmarkData: any,
    diagnosticResult?: any
  ): Promise<GeneratedRecommendation[]> {
    const recommendations: GeneratedRecommendation[] = [];

    for (const [category, rule] of this.coreRecommendations) {
      if (this.evaluateConditions(rule.conditions, companyData, benchmarkData)) {
        const priorityInfo = this.calculateRecommendationPriority(
          rule,
          companyData,
          benchmarkData,
          diagnosticResult?.weakPoints
        );

        const recommendation: GeneratedRecommendation = {
          id: `core_${category}_${Date.now()}`,
          category: rule.category,
          priority: priorityInfo.priority,
          title: rule.content.title,
          description: rule.content.description,
          actionItems: rule.content.actionItems,
          expectedImpact: rule.content.expectedImpact,
          implementationTime: rule.content.implementationTime,
          difficulty: rule.content.difficulty,
          roiEstimate: priorityInfo.roiScore,
          resources: rule.content.resources,
          successMetrics: rule.content.successMetrics,
          applicableStages: this.getApplicableStages(rule.conditions)
        };

        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * 生成自定义建议
   */
  private async generateCustomRecommendations(
    organizationId: string,
    companyData: FunnelMetricData,
    benchmarkData: any
  ): Promise<GeneratedRecommendation[]> {
    try {
      const customRules = await this.prisma.adviceRule.findMany({
        where: {
          organizationId,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      });

      const recommendations: GeneratedRecommendation[] = [];

      for (const rule of customRules) {
        if (this.evaluateConditions(rule.conditions as any, companyData, benchmarkData)) {
          const priorityInfo = this.calculateRecommendationPriority(
            rule,
            companyData,
            benchmarkData
          );

          const advice = rule.advice as any;
          const recommendation: GeneratedRecommendation = {
            id: `custom_${rule.id}`,
            category: rule.ruleType,
            priority: priorityInfo.priority,
            title: advice.title || rule.name,
            description: advice.description || '',
            actionItems: advice.actionItems || [],
            expectedImpact: advice.expectedImpact || '',
            implementationTime: advice.implementationTime || '未指定',
            difficulty: advice.difficulty || 'medium',
            roiEstimate: priorityInfo.roiScore,
            resources: advice.resources || [],
            successMetrics: advice.successMetrics || [],
            applicableStages: this.getApplicableStages(rule.conditions as any)
          };

          recommendations.push(recommendation);
        }
      }

      return recommendations;

    } catch (error) {
      logger.error('Error generating custom recommendations:', error);
      return [];
    }
  }

  /**
   * 个性化建议
   */
  private personalizeRecommendations(
    recommendations: GeneratedRecommendation[],
    industry?: string,
    companySize?: string
  ): GeneratedRecommendation[] {
    return recommendations.map(rec => {
      const personalized = { ...rec };

      // 基于行业调整
      if (industry) {
        personalized.description = this.adaptForIndustry(personalized.description, industry);
        personalized.actionItems = this.adaptActionItemsForIndustry(personalized.actionItems, industry);
      }

      // 基于公司规模调整
      if (companySize) {
        personalized.resources = this.adaptResourcesForCompanySize(personalized.resources, companySize);
        personalized.implementationTime = this.adaptTimelineForCompanySize(
          personalized.implementationTime,
          companySize
        );
      }

      return personalized;
    });
  }

  /**
   * 按优先级排序建议
   */
  private sortRecommendationsByPriority(recommendations: GeneratedRecommendation[]): GeneratedRecommendation[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      // 首先按优先级排序
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 其次按ROI排序
      return b.roiEstimate - a.roiEstimate;
    });
  }

  /**
   * 评估条件
   */
  private evaluateConditions(
    conditions: RecommendationCondition[],
    companyData: FunnelMetricData,
    benchmarkData: any
  ): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, companyData, benchmarkData));
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(
    condition: RecommendationCondition,
    companyData: FunnelMetricData,
    benchmarkData: any
  ): boolean {
    let actualValue: number;

    // 获取实际值
    if (condition.stage && condition.metric === 'conversion_rate') {
      actualValue = companyData[condition.stage].conversionRate || 0;
    } else if (condition.metric === 'overall_rate') {
      actualValue = this.calculateOverallConversionRate(companyData);
    } else {
      return false; // 不支持的指标
    }

    // 基准比较
    if (condition.benchmarkComparison) {
      return this.evaluateBenchmarkComparison(
        actualValue,
        condition.benchmarkComparison,
        condition.stage,
        benchmarkData
      );
    }

    // 数值比较
    if (condition.value !== undefined) {
      return this.evaluateNumericComparison(actualValue, condition.operator, condition.value);
    }

    return false;
  }

  /**
   * 评估基准比较
   */
  private evaluateBenchmarkComparison(
    value: number,
    comparison: string,
    stage: keyof FunnelMetricData | undefined,
    benchmarkData: any
  ): boolean {
    if (!benchmarkData?.percentiles) return false;

    let benchmarkValue: number;
    
    if (stage) {
      // 阶段级比较
      const percentileMap = {
        below_p25: benchmarkData.percentiles.p25[stage]?.conversionRate,
        below_p50: benchmarkData.percentiles.p50[stage]?.conversionRate,
        below_p75: benchmarkData.percentiles.p75[stage]?.conversionRate,
        above_p75: benchmarkData.percentiles.p75[stage]?.conversionRate,
        above_p90: benchmarkData.percentiles.p90[stage]?.conversionRate
      };
      benchmarkValue = percentileMap[comparison as keyof typeof percentileMap] || 0;
    } else {
      // 整体比较
      benchmarkValue = this.calculateOverallConversionRate(
        benchmarkData.percentiles.p50
      );
    }

    if (comparison.startsWith('below_')) {
      return value < benchmarkValue;
    } else if (comparison.startsWith('above_')) {
      return value > benchmarkValue;
    }

    return false;
  }

  /**
   * 评估数值比较
   */
  private evaluateNumericComparison(value: number, operator: string, targetValue: number): boolean {
    switch (operator) {
      case 'lt': return value < targetValue;
      case 'lte': return value <= targetValue;
      case 'gt': return value > targetValue;
      case 'gte': return value >= targetValue;
      case 'eq': return value === targetValue;
      case 'between': return value >= targetValue && value <= targetValue * 1.5; // 简单的区间判断
      default: return false;
    }
  }

  /**
   * 计算整体转化率
   */
  private calculateOverallConversionRate(data: FunnelMetricData): number {
    const stage1Visitors = data.stage_1.visitors;
    const stage4Converted = data.stage_4.converted;
    
    if (stage1Visitors === 0) return 0;
    return Number((stage4Converted / stage1Visitors * 100).toFixed(2));
  }

  /**
   * 获取适用阶段
   */
  private getApplicableStages(conditions: RecommendationCondition[]): (keyof FunnelMetricData)[] {
    const stages = conditions
      .filter(c => c.stage)
      .map(c => c.stage!)
      .filter((stage, index, self) => self.indexOf(stage) === index);
    
    return stages.length > 0 ? stages : ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
  }

  // ===================== Priority Calculation Methods =====================

  private calculateROIScore(recommendation: any, companyData: FunnelMetricData): number {
    // 基于建议类别和预期影响计算ROI评分
    const categoryROIMap = {
      traffic_acquisition: 7,
      landing_page_optimization: 8,
      user_experience_improvement: 6,
      content_optimization: 5,
      technical_performance: 7,
      personalization: 9,
      conversion_path_optimization: 8,
      customer_service_improvement: 6,
      pricing_strategy_adjustment: 9
    };

    const baseScore = categoryROIMap[recommendation.category as keyof typeof categoryROIMap] || 5;
    const difficultyPenalty = recommendation.difficulty === 'hard' ? 2 : recommendation.difficulty === 'medium' ? 1 : 0;
    
    return Math.max(1, Math.min(10, baseScore - difficultyPenalty));
  }

  private calculateImpactScore(
    recommendation: any,
    companyData: FunnelMetricData,
    benchmarkData: any
  ): number {
    // 基于当前性能与基准的差距计算影响力
    const overallRate = this.calculateOverallConversionRate(companyData);
    const benchmarkRate = this.calculateOverallConversionRate(benchmarkData.percentiles.p50);
    
    const gap = Math.max(0, benchmarkRate - overallRate);
    
    // 差距越大，改进影响力越大
    if (gap > 10) return 9;
    if (gap > 5) return 7;
    if (gap > 2) return 5;
    return 3;
  }

  private calculateUrgencyScore(recommendation: any, weakPoints?: any[]): number {
    if (!weakPoints) return 5;

    // 基于薄弱环节的严重程度计算紧急性
    const applicableWeakPoints = weakPoints.filter(wp => 
      recommendation.applicableStages.includes(wp.stage)
    );

    if (applicableWeakPoints.some(wp => wp.severity === 'critical')) return 9;
    if (applicableWeakPoints.some(wp => wp.severity === 'major')) return 7;
    if (applicableWeakPoints.some(wp => wp.severity === 'minor')) return 5;
    
    return 3;
  }

  private calculateFeasibilityScore(recommendation: any): number {
    // 基于实施难度和所需资源计算可行性
    const difficultyScore = {
      easy: 9,
      medium: 6,
      hard: 3
    };

    const resourceCount = recommendation.resources?.length || 0;
    const resourcePenalty = Math.min(3, resourceCount / 2);
    
    return Math.max(1, difficultyScore[recommendation.difficulty as keyof typeof difficultyScore] - resourcePenalty);
  }

  private scoreToPriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 7.5) return 'high';
    if (score >= 5.5) return 'medium';
    return 'low';
  }

  // ===================== Personalization Methods =====================

  private adaptForIndustry(description: string, industry: string): string {
    const industryTerms = {
      'saas': '软件服务',
      'ecommerce': '电商',
      'education': '教育',
      'finance': '金融',
      'healthcare': '医疗'
    };

    const term = industryTerms[industry.toLowerCase() as keyof typeof industryTerms];
    if (term) {
      return description.replace(/客户/g, `${term}客户`);
    }
    return description;
  }

  private adaptActionItemsForIndustry(actionItems: string[], industry: string): string[] {
    // 基于行业特点调整执行项目
    const industryAdaptations = {
      'saas': (item: string) => item.includes('内容') ? item + '（重点关注产品演示和试用体验）' : item,
      'ecommerce': (item: string) => item.includes('页面') ? item + '（优化商品展示和购买流程）' : item,
      'education': (item: string) => item.includes('客户') ? item.replace('客户', '学员') : item
    };

    const adapter = industryAdaptations[industry.toLowerCase() as keyof typeof industryAdaptations];
    return adapter ? actionItems.map(adapter) : actionItems;
  }

  private adaptResourcesForCompanySize(resources: string[], companySize: string): string[] {
    if (companySize === 'small') {
      // 小公司建议使用更多自助工具
      return resources.map(resource => {
        if (resource.includes('团队')) return resource + '（可考虑外包或兼职）';
        if (resource.includes('系统')) return resource + '（推荐使用SaaS工具）';
        return resource;
      });
    }
    return resources;
  }

  private adaptTimelineForCompanySize(timeline: string, companySize: string): string {
    if (companySize === 'small') {
      // 小公司可能需要更长时间
      const timeMatch = timeline.match(/(\d+)-(\d+)周/);
      if (timeMatch) {
        const min = parseInt(timeMatch[1]);
        const max = parseInt(timeMatch[2]);
        return `${min + 1}-${max + 2}周（考虑到资源限制）`;
      }
    }
    return timeline;
  }

  private calculatePersonalizedImpact(
    recommendation: any,
    companyData: FunnelMetricData,
    currentPerformance: any
  ): string {
    // 基于当前表现计算个性化的预期影响
    const baseImpact = recommendation.expectedImpact;
    
    if (currentPerformance.overallGrade === 'F') {
      return baseImpact.replace(/\d+-\d+%/, match => {
        const numbers = match.match(/\d+/g);
        if (numbers) {
          const higher = Math.max(...numbers.map(Number)) + 10;
          return `${numbers[0]}-${higher}%`;
        }
        return match;
      });
    }
    
    return baseImpact;
  }

  private insertSpecificData(
    recommendation: any,
    companyData: FunnelMetricData,
    context: any
  ): any {
    const currentRates = {
      stage1: companyData.stage_1.conversionRate || 0,
      stage2: companyData.stage_2.conversionRate || 0,
      stage3: companyData.stage_3.conversionRate || 0,
      stage4: companyData.stage_4.conversionRate || 0,
      overall: this.calculateOverallConversionRate(companyData)
    };

    return {
      currentPerformance: currentRates,
      specificIssues: context.specificIssues || [],
      targetImprovement: this.calculateTargetImprovement(recommendation, currentRates)
    };
  }

  private calculateTargetImprovement(recommendation: any, currentRates: any): any {
    // 基于建议类别计算具体的改进目标
    const improvements = {
      traffic_acquisition: { stage1: 5, overall: 2 },
      landing_page_optimization: { stage1: 8, overall: 3 },
      user_experience_improvement: { stage2: 6, stage3: 4, overall: 2 },
      content_optimization: { stage2: 4, stage3: 6, overall: 2 },
      technical_performance: { stage1: 3, overall: 1 },
      personalization: { stage3: 8, overall: 3 },
      conversion_path_optimization: { overall: 5 },
      customer_service_improvement: { stage4: 7, overall: 2 },
      pricing_strategy_adjustment: { stage4: 10, overall: 3 }
    };

    return improvements[recommendation.category as keyof typeof improvements] || { overall: 2 };
  }
}