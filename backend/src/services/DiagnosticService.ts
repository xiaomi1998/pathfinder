import { PrismaClient } from '@prisma/client';
import { FunnelMetricData, FunnelStageData } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

/**
 * 性能诊断服务
 * 提供漏斗性能诊断、薄弱环节识别和评级功能
 */
export class DiagnosticService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 执行全面的漏斗性能诊断
   */
  async performComprehensiveDiagnosis(
    companyData: FunnelMetricData,
    benchmarkData: any,
    options: {
      includeWeakPoints?: boolean;
      includeImprovementPotential?: boolean;
      includeHealthScore?: boolean;
    } = {}
  ): Promise<{
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    healthScore: number;
    stageGrades: {
      stage_1: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
      stage_2: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
      stage_3: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
      stage_4: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    };
    weakPoints: Array<{
      stage: keyof FunnelMetricData;
      severity: 'critical' | 'major' | 'minor';
      description: string;
      currentRate: number;
      benchmarkRate: number;
      improvementNeeded: number;
    }>;
    improvementPriorities: Array<{
      stage: keyof FunnelMetricData;
      priority: 'high' | 'medium' | 'low';
      impactScore: number;
      difficultyScore: number;
      roiEstimate: number;
    }>;
    crossStageAnalysis: {
      dropOffPoints: Array<{ from: string; to: string; dropOffRate: number; severity: string }>;
      flowConsistency: number;
      bottleneckStage: keyof FunnelMetricData | null;
    };
  }> {
    try {
      logger.info('Performing comprehensive funnel diagnosis');

      // 计算各阶段评级和百分位数
      const stageGrades = this.calculateStageGrades(companyData, benchmarkData);
      
      // 计算总体评级
      const overallGrade = this.calculateOverallGrade(stageGrades);
      
      // 计算健康度评分
      const healthScore = this.calculateHealthScore(companyData, benchmarkData, stageGrades);
      
      // 识别薄弱环节
      const weakPoints = options.includeWeakPoints !== false 
        ? this.identifyWeakPoints(companyData, benchmarkData, stageGrades)
        : [];
      
      // 计算改进优先级
      const improvementPriorities = options.includeImprovementPotential !== false
        ? this.calculateImprovementPriorities(companyData, benchmarkData, weakPoints)
        : [];
      
      // 跨阶段分析
      const crossStageAnalysis = this.performCrossStageAnalysis(companyData, benchmarkData);

      return {
        overallGrade,
        healthScore,
        stageGrades,
        weakPoints,
        improvementPriorities,
        crossStageAnalysis
      };

    } catch (error) {
      logger.error('Error performing comprehensive diagnosis:', error);
      throw new ApiError('执行诊断分析失败', 500);
    }
  }

  /**
   * 识别薄弱阶段
   */
  identifyWeakStages(
    companyData: FunnelMetricData,
    benchmarkData: any,
    thresholds: {
      critical: number; // 低于基准的百分比阈值
      major: number;
      minor: number;
    } = { critical: -25, major: -15, minor: -5 }
  ): Array<{
    stage: keyof FunnelMetricData;
    severity: 'critical' | 'major' | 'minor';
    performanceGap: number;
    recommendation: string;
  }> {
    try {
      const weakStages: Array<{
        stage: keyof FunnelMetricData;
        severity: 'critical' | 'major' | 'minor';
        performanceGap: number;
        recommendation: string;
      }> = [];

      const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
      const benchmark = benchmarkData.percentiles.p50; // 使用中位数作为基准

      for (const stage of stages) {
        const companyRate = companyData[stage].conversionRate || 0;
        const benchmarkRate = benchmark[stage].conversionRate;
        const performanceGap = ((companyRate - benchmarkRate) / benchmarkRate) * 100;

        if (performanceGap <= thresholds.critical) {
          weakStages.push({
            stage,
            severity: 'critical',
            performanceGap,
            recommendation: this.getStageRecommendation(stage, 'critical')
          });
        } else if (performanceGap <= thresholds.major) {
          weakStages.push({
            stage,
            severity: 'major', 
            performanceGap,
            recommendation: this.getStageRecommendation(stage, 'major')
          });
        } else if (performanceGap <= thresholds.minor) {
          weakStages.push({
            stage,
            severity: 'minor',
            performanceGap,
            recommendation: this.getStageRecommendation(stage, 'minor')
          });
        }
      }

      // 按严重程度排序
      weakStages.sort((a, b) => {
        const severityOrder = { critical: 3, major: 2, minor: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      return weakStages;

    } catch (error) {
      logger.error('Error identifying weak stages:', error);
      throw new ApiError('识别薄弱阶段失败', 500);
    }
  }

  /**
   * 计算性能评级系统 (A-F)
   */
  calculatePerformanceGrade(
    companyData: FunnelMetricData,
    benchmarkData: any,
    weightings: {
      stage_1: number;
      stage_2: number;
      stage_3: number;
      stage_4: number;
      overall: number;
    } = { stage_1: 0.2, stage_2: 0.25, stage_3: 0.25, stage_4: 0.3, overall: 0 }
  ): {
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    stageGrades: Record<keyof FunnelMetricData, 'A' | 'B' | 'C' | 'D' | 'F'>;
    compositeScore: number;
    gradeBreakdown: {
      stage_1: { score: number; percentile: number };
      stage_2: { score: number; percentile: number };
      stage_3: { score: number; percentile: number };
      stage_4: { score: number; percentile: number };
    };
  } {
    try {
      logger.info('Calculating performance grades');

      const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
      const stageGrades: Record<keyof FunnelMetricData, 'A' | 'B' | 'C' | 'D' | 'F'> = {} as any;
      const gradeBreakdown: any = {};

      let compositeScore = 0;

      // 计算各阶段评级
      for (const stage of stages) {
        const percentile = this.calculateStagePercentile(
          companyData[stage].conversionRate || 0,
          benchmarkData.percentiles,
          stage
        );

        const score = this.percentileToScore(percentile);
        const grade = this.scoreToGrade(score);

        stageGrades[stage] = grade;
        gradeBreakdown[stage] = { score, percentile };

        compositeScore += score * weightings[stage];
      }

      // 如果设置了整体权重，也计算整体转化率的评级
      if (weightings.overall > 0) {
        const overallRate = this.calculateOverallConversionRate(companyData);
        const overallPercentile = this.calculateOverallPercentile(overallRate, benchmarkData);
        const overallScore = this.percentileToScore(overallPercentile);
        
        compositeScore += overallScore * weightings.overall;
      }

      const overallGrade = this.scoreToGrade(compositeScore);

      return {
        overallGrade,
        stageGrades,
        compositeScore,
        gradeBreakdown
      };

    } catch (error) {
      logger.error('Error calculating performance grade:', error);
      throw new ApiError('计算性能评级失败', 500);
    }
  }

  /**
   * 多维度诊断分析
   */
  performMultiDimensionalAnalysis(
    companyData: FunnelMetricData,
    benchmarkData: any,
    historicalData?: FunnelMetricData[]
  ): {
    singleStageAnalysis: Record<keyof FunnelMetricData, {
      performance: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
      specificIssues: string[];
      quickWins: string[];
    }>;
    crossStageAnalysis: {
      flowConsistency: number;
      dropOffAnalysis: Array<{ stage: string; dropOff: number; severity: 'high' | 'medium' | 'low' }>;
      bottleneckIdentification: { stage: keyof FunnelMetricData | null; impact: number };
    };
    competitiveAnalysis: {
      strengths: Array<{ stage: keyof FunnelMetricData; advantage: number }>;
      weaknesses: Array<{ stage: keyof FunnelMetricData; disadvantage: number }>;
      marketPosition: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
    };
    trendAnalysis?: {
      direction: 'improving' | 'stable' | 'declining';
      momentum: number;
      projectedGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    };
  } {
    try {
      logger.info('Performing multi-dimensional analysis');

      // 单阶段分析
      const singleStageAnalysis = this.analyzeSingleStages(companyData, benchmarkData);
      
      // 跨阶段分析
      const rawCrossStageAnalysis = this.performCrossStageAnalysis(companyData, benchmarkData);
      const crossStageAnalysis = {
        flowConsistency: rawCrossStageAnalysis.flowConsistency,
        dropOffAnalysis: rawCrossStageAnalysis.dropOffPoints.map(point => ({
          stage: point.from,
          dropOff: point.dropOffRate,
          severity: point.severity as 'high' | 'medium' | 'low'
        })),
        bottleneckIdentification: {
          stage: rawCrossStageAnalysis.bottleneckStage,
          impact: rawCrossStageAnalysis.bottleneckStage ? 0.8 : 0
        }
      };
      
      // 竞争对手分析
      const competitiveAnalysis = this.performCompetitiveAnalysis(companyData, benchmarkData);
      
      // 趋势分析（如果有历史数据）
      const trendAnalysis = historicalData 
        ? this.analyzeTrends(historicalData, companyData)
        : undefined;

      return {
        singleStageAnalysis,
        crossStageAnalysis,
        competitiveAnalysis,
        trendAnalysis
      };

    } catch (error) {
      logger.error('Error performing multi-dimensional analysis:', error);
      throw new ApiError('执行多维分析失败', 500);
    }
  }

  // ===================== Private Helper Methods =====================

  /**
   * 计算各阶段评级
   */
  private calculateStageGrades(companyData: FunnelMetricData, benchmarkData: any): {
    stage_1: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    stage_2: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    stage_3: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    stage_4: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
  } {
    const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
    const result: any = {};

    for (const stage of stages) {
      const percentile = this.calculateStagePercentile(
        companyData[stage].conversionRate || 0,
        benchmarkData.percentiles,
        stage
      );

      const grade = this.percentileToGrade(percentile);
      const status = this.getStageStatus(percentile);

      result[stage] = { grade, percentile, status };
    }

    return result;
  }

  /**
   * 计算总体评级
   */
  private calculateOverallGrade(stageGrades: any): 'A' | 'B' | 'C' | 'D' | 'F' {
    const grades = Object.values(stageGrades) as Array<{ grade: string }>;
    const gradePoints = grades.map(g => this.gradeToPoints(g.grade as any));
    const averagePoints = gradePoints.reduce((sum, points) => sum + points, 0) / gradePoints.length;
    
    return this.pointsToGrade(averagePoints);
  }

  /**
   * 计算健康度评分
   */
  private calculateHealthScore(
    companyData: FunnelMetricData, 
    benchmarkData: any, 
    stageGrades: any
  ): number {
    // 基础评分：基于各阶段表现
    const baseScore = Object.values(stageGrades).reduce((sum: number, stage: any) => {
      return sum + this.gradeToPoints(stage.grade);
    }, 0) / 4;

    // 流程一致性评分
    const consistencyScore = this.calculateFlowConsistency(companyData);
    
    // 改进潜力评分（越低越好，因为意味着已经很优化了）
    const improvementPotential = this.calculateTotalImprovementPotential(companyData, benchmarkData);
    const potentialScore = Math.max(0, 100 - improvementPotential);

    // 综合健康度评分
    const healthScore = (baseScore * 0.5 + consistencyScore * 0.3 + potentialScore * 0.2);
    
    return Number(healthScore.toFixed(1));
  }

  /**
   * 识别薄弱环节
   */
  private identifyWeakPoints(
    companyData: FunnelMetricData,
    benchmarkData: any,
    stageGrades: any
  ): Array<{
    stage: keyof FunnelMetricData;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    currentRate: number;
    benchmarkRate: number;
    improvementNeeded: number;
  }> {
    const weakPoints: Array<any> = [];
    const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];

    for (const stage of stages) {
      const stageInfo = stageGrades[stage];
      const currentRate = companyData[stage].conversionRate || 0;
      const benchmarkRate = benchmarkData.percentiles.p50[stage].conversionRate;
      const improvementNeeded = Math.max(0, benchmarkRate - currentRate);

      if (stageInfo.grade === 'F') {
        weakPoints.push({
          stage,
          severity: 'critical',
          description: `${this.getStageDisplayName(stage)}转化率严重低于行业平均水平`,
          currentRate,
          benchmarkRate,
          improvementNeeded
        });
      } else if (stageInfo.grade === 'D') {
        weakPoints.push({
          stage,
          severity: 'major',
          description: `${this.getStageDisplayName(stage)}转化率明显低于行业平均水平`,
          currentRate,
          benchmarkRate,
          improvementNeeded
        });
      } else if (stageInfo.grade === 'C' && improvementNeeded > 5) {
        weakPoints.push({
          stage,
          severity: 'minor',
          description: `${this.getStageDisplayName(stage)}转化率略低于行业平均水平`,
          currentRate,
          benchmarkRate,
          improvementNeeded
        });
      }
    }

    return weakPoints;
  }

  /**
   * 计算改进优先级
   */
  private calculateImprovementPriorities(
    companyData: FunnelMetricData,
    benchmarkData: any,
    weakPoints: any[]
  ): Array<{
    stage: keyof FunnelMetricData;
    priority: 'high' | 'medium' | 'low';
    impactScore: number;
    difficultyScore: number;
    roiEstimate: number;
  }> {
    const priorities: Array<any> = [];

    for (const weakPoint of weakPoints) {
      const impactScore = this.calculateImprovementImpact(
        companyData, 
        weakPoint.stage, 
        weakPoint.improvementNeeded
      );
      
      const difficultyScore = this.estimateImprovementDifficulty(
        weakPoint.stage, 
        weakPoint.severity
      );
      
      const roiEstimate = impactScore / (difficultyScore + 1); // +1 to avoid division by zero
      
      const priority = this.determinePriority(impactScore, difficultyScore, roiEstimate);

      priorities.push({
        stage: weakPoint.stage,
        priority,
        impactScore,
        difficultyScore,
        roiEstimate
      });
    }

    // 按ROI和影响力排序
    priorities.sort((a, b) => b.roiEstimate - a.roiEstimate);

    return priorities;
  }

  /**
   * 执行跨阶段分析
   */
  private performCrossStageAnalysis(companyData: FunnelMetricData, benchmarkData: any): {
    dropOffPoints: Array<{ from: string; to: string; dropOffRate: number; severity: string }>;
    flowConsistency: number;
    bottleneckStage: keyof FunnelMetricData | null;
  } {
    const stages = ['stage_1', 'stage_2', 'stage_3', 'stage_4'] as const;
    const dropOffPoints: Array<any> = [];
    
    // 计算各阶段间的流失率
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      
      const currentConverted = companyData[currentStage].converted;
      const nextVisitors = companyData[nextStage].visitors;
      
      if (currentConverted > 0) {
        const dropOffRate = ((currentConverted - nextVisitors) / currentConverted) * 100;
        const severity = dropOffRate > 30 ? 'high' : dropOffRate > 15 ? 'medium' : 'low';
        
        dropOffPoints.push({
          from: this.getStageDisplayName(currentStage),
          to: this.getStageDisplayName(nextStage),
          dropOffRate: Number(dropOffRate.toFixed(2)),
          severity
        });
      }
    }

    // 计算流程一致性
    const flowConsistency = this.calculateFlowConsistency(companyData);
    
    // 识别瓶颈阶段
    const bottleneckStage = this.identifyBottleneckStage(companyData, benchmarkData);

    return {
      dropOffPoints,
      flowConsistency,
      bottleneckStage
    };
  }

  /**
   * 单阶段分析
   */
  private analyzeSingleStages(companyData: FunnelMetricData, benchmarkData: any): Record<keyof FunnelMetricData, {
    performance: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    specificIssues: string[];
    quickWins: string[];
  }> {
    const result: any = {};
    const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];

    for (const stage of stages) {
      const percentile = this.calculateStagePercentile(
        companyData[stage].conversionRate || 0,
        benchmarkData.percentiles,
        stage
      );

      const performance = this.getPerformanceLevel(percentile);
      const specificIssues = this.getStageSpecificIssues(stage, percentile);
      const quickWins = this.getStageQuickWins(stage, percentile);

      result[stage] = { performance, specificIssues, quickWins };
    }

    return result;
  }

  /**
   * 竞争分析
   */
  private performCompetitiveAnalysis(companyData: FunnelMetricData, benchmarkData: any): {
    strengths: Array<{ stage: keyof FunnelMetricData; advantage: number }>;
    weaknesses: Array<{ stage: keyof FunnelMetricData; disadvantage: number }>;
    marketPosition: 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard';
  } {
    const strengths: Array<any> = [];
    const weaknesses: Array<any> = [];
    const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];

    for (const stage of stages) {
      const companyRate = companyData[stage].conversionRate || 0;
      const benchmarkRate = benchmarkData.percentiles.p50[stage].conversionRate;
      const difference = companyRate - benchmarkRate;

      if (difference > 5) { // 优势超过5个百分点
        strengths.push({ stage, advantage: Number(difference.toFixed(2)) });
      } else if (difference < -5) { // 劣势超过5个百分点
        weaknesses.push({ stage, disadvantage: Number(Math.abs(difference).toFixed(2)) });
      }
    }

    // 计算市场地位
    const overallRate = this.calculateOverallConversionRate(companyData);
    const benchmarkOverallRate = this.calculateOverallConversionRate(benchmarkData.percentiles.p50);
    const marketPosition = this.determineMarketPosition(overallRate, benchmarkOverallRate);

    return { strengths, weaknesses, marketPosition };
  }

  /**
   * 趋势分析
   */
  private analyzeTrends(historicalData: FunnelMetricData[], currentData: FunnelMetricData): {
    direction: 'improving' | 'stable' | 'declining';
    momentum: number;
    projectedGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  } {
    // 计算趋势方向和动量
    const recentData = historicalData.slice(-3); // 最近3个数据点
    const overallRates = recentData.map(data => this.calculateOverallConversionRate(data));
    const currentOverall = this.calculateOverallConversionRate(currentData);
    
    const trend = this.calculateTrendDirection(overallRates);
    const momentum = this.calculateMomentum(overallRates, currentOverall);
    
    // 基于趋势预测未来评级
    const projectedRate = currentOverall + (momentum * 2); // 预测2期后的表现
    const projectedGrade = this.rateToGrade(projectedRate);

    return {
      direction: trend,
      momentum,
      projectedGrade
    };
  }

  // ===================== Utility Methods =====================

  private calculateStagePercentile(
    value: number,
    percentiles: any,
    stage: keyof FunnelMetricData
  ): number {
    const p10 = percentiles.p10[stage].conversionRate;
    const p25 = percentiles.p25[stage].conversionRate;
    const p50 = percentiles.p50[stage].conversionRate;
    const p75 = percentiles.p75[stage].conversionRate;
    const p90 = percentiles.p90[stage].conversionRate;

    if (value >= p90) return 95;
    if (value >= p75) return 80;
    if (value >= p50) return 60;
    if (value >= p25) return 35;
    if (value >= p10) return 15;
    return 5;
  }

  private percentileToScore(percentile: number): number {
    return Math.min(100, Math.max(0, percentile));
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  }

  private percentileToGrade(percentile: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    return this.scoreToGrade(percentile);
  }

  private gradeToPoints(grade: 'A' | 'B' | 'C' | 'D' | 'F'): number {
    const gradePoints = { A: 90, B: 75, C: 60, D: 45, F: 25 };
    return gradePoints[grade];
  }

  private pointsToGrade(points: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    return this.scoreToGrade(points);
  }

  private getStageStatus(percentile: number): string {
    if (percentile >= 90) return '行业领先';
    if (percentile >= 75) return '优秀表现';
    if (percentile >= 50) return '行业平均';
    if (percentile >= 25) return '有待改进';
    return '急需改进';
  }

  private getStageDisplayName(stage: keyof FunnelMetricData): string {
    const names = {
      stage_1: '线索生成',
      stage_2: '有效触达',
      stage_3: '商机转化',
      stage_4: '成交完成'
    };
    return names[stage] || stage;
  }

  private getStageRecommendation(stage: keyof FunnelMetricData, severity: string): string {
    const recommendations = {
      stage_1: {
        critical: '立即优化获客渠道，提升线索质量和数量',
        major: '加强市场推广策略，扩大目标客户覆盖',
        minor: '优化内容营销，提升品牌认知度'
      },
      stage_2: {
        critical: '紧急改善客户触达策略和沟通时机',
        major: '优化销售流程，提升客户响应率',
        minor: '完善客户跟进机制，提高接触效率'
      },
      stage_3: {
        critical: '立即加强需求挖掘和方案设计能力',
        major: '提升销售团队专业技能和产品知识',
        minor: '优化商机评估流程，提高转化精准度'
      },
      stage_4: {
        critical: '紧急优化定价策略和谈判技巧',
        major: '完善成交流程，消除客户决策障碍',
        minor: '加强客户关系维护，提升成交信心'
      }
    };

    return recommendations[stage]?.[severity as keyof typeof recommendations.stage_1] || '需要进一步分析和改进';
  }

  private calculateOverallConversionRate(data: FunnelMetricData): number {
    const stage1Visitors = data.stage_1.visitors;
    const stage4Converted = data.stage_4.converted;
    
    if (stage1Visitors === 0) return 0;
    return Number((stage4Converted / stage1Visitors * 100).toFixed(2));
  }

  private calculateOverallPercentile(overallRate: number, benchmarkData: any): number {
    // 计算基准的整体转化率
    const benchmarkRates = {
      p10: this.calculateOverallConversionRate(benchmarkData.percentiles.p10),
      p25: this.calculateOverallConversionRate(benchmarkData.percentiles.p25),
      p50: this.calculateOverallConversionRate(benchmarkData.percentiles.p50),
      p75: this.calculateOverallConversionRate(benchmarkData.percentiles.p75),
      p90: this.calculateOverallConversionRate(benchmarkData.percentiles.p90)
    };

    if (overallRate >= benchmarkRates.p90) return 95;
    if (overallRate >= benchmarkRates.p75) return 80;
    if (overallRate >= benchmarkRates.p50) return 60;
    if (overallRate >= benchmarkRates.p25) return 35;
    if (overallRate >= benchmarkRates.p10) return 15;
    return 5;
  }

  private calculateFlowConsistency(data: FunnelMetricData): number {
    const rates = [
      data.stage_1.conversionRate || 0,
      data.stage_2.conversionRate || 0,
      data.stage_3.conversionRate || 0,
      data.stage_4.conversionRate || 0
    ];

    const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 一致性评分：标准差越小，一致性越好
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 2));
    
    return Number(consistencyScore.toFixed(1));
  }

  private calculateTotalImprovementPotential(companyData: FunnelMetricData, benchmarkData: any): number {
    const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
    let totalPotential = 0;

    for (const stage of stages) {
      const companyRate = companyData[stage].conversionRate || 0;
      const benchmarkRate = benchmarkData.percentiles.p75[stage].conversionRate; // 使用75分位数作为改进目标
      const potential = Math.max(0, benchmarkRate - companyRate);
      totalPotential += potential;
    }

    return totalPotential;
  }

  private calculateImprovementImpact(
    companyData: FunnelMetricData,
    stage: keyof FunnelMetricData,
    improvement: number
  ): number {
    // 计算改进对整体转化率的影响
    const currentOverall = this.calculateOverallConversionRate(companyData);
    
    const improvedData = { ...companyData };
    const stageData = improvedData[stage];
    const improvedRate = (stageData.conversionRate || 0) + improvement;
    
    improvedData[stage] = {
      ...stageData,
      conversionRate: improvedRate,
      converted: Math.round(stageData.visitors * improvedRate / 100)
    };
    
    const improvedOverall = this.calculateOverallConversionRate(improvedData);
    
    return Number((improvedOverall - currentOverall).toFixed(2));
  }

  private estimateImprovementDifficulty(stage: keyof FunnelMetricData, severity: string): number {
    // 基于阶段和严重程度估算改进难度 (1-10, 10最难)
    const stageDifficulty = {
      stage_1: 6, // 流量获取较难
      stage_2: 4, // 触达相对容易
      stage_3: 7, // 商机转化较难
      stage_4: 8  // 成交最难
    };

    const severityMultiplier = {
      critical: 1.5,
      major: 1.2,
      minor: 1.0
    };

    return Math.min(10, stageDifficulty[stage] * severityMultiplier[severity as keyof typeof severityMultiplier]);
  }

  private determinePriority(impactScore: number, difficultyScore: number, roiEstimate: number): 'high' | 'medium' | 'low' {
    if (roiEstimate > 2 && impactScore > 5) return 'high';
    if (roiEstimate > 1 || impactScore > 3) return 'medium';
    return 'low';
  }

  private identifyBottleneckStage(companyData: FunnelMetricData, benchmarkData: any): keyof FunnelMetricData | null {
    const stages: (keyof FunnelMetricData)[] = ['stage_1', 'stage_2', 'stage_3', 'stage_4'];
    let maxGap = 0;
    let bottleneck: keyof FunnelMetricData | null = null;

    for (const stage of stages) {
      const companyRate = companyData[stage].conversionRate || 0;
      const benchmarkRate = benchmarkData.percentiles.p50[stage].conversionRate;
      const gap = benchmarkRate - companyRate;

      if (gap > maxGap) {
        maxGap = gap;
        bottleneck = stage;
      }
    }

    return maxGap > 5 ? bottleneck : null; // 只有差距超过5个百分点才算瓶颈
  }

  private getPerformanceLevel(percentile: number): 'excellent' | 'good' | 'average' | 'poor' | 'critical' {
    if (percentile >= 90) return 'excellent';
    if (percentile >= 75) return 'good';
    if (percentile >= 50) return 'average';
    if (percentile >= 25) return 'poor';
    return 'critical';
  }

  private getStageSpecificIssues(stage: keyof FunnelMetricData, percentile: number): string[] {
    if (percentile >= 75) return []; // 表现良好，无明显问题

    const issues = {
      stage_1: ['获客渠道效果不佳', '目标客户定位不准确', '品牌认知度较低'],
      stage_2: ['客户联系时机把握不当', '沟通渠道选择有误', '初次接触话术需要优化'],
      stage_3: ['需求挖掘不够深入', '解决方案匹配度较低', '竞争优势展示不足'],
      stage_4: ['价格策略缺乏竞争力', '成交流程存在障碍', '客户决策周期过长']
    };

    return issues[stage] || [];
  }

  private getStageQuickWins(stage: keyof FunnelMetricData, percentile: number): string[] {
    if (percentile >= 90) return []; // 表现优异，无需快速改进

    const quickWins = {
      stage_1: ['优化关键词投放', '完善着陆页设计', '增加客户推荐激励'],
      stage_2: ['改进首次接触话术', '优化联系时间安排', '完善客户资料收集'],
      stage_3: ['使用需求挖掘框架', '准备标准化演示材料', '建立客户异议处理话术'],
      stage_4: ['设计限时优惠活动', '简化合同签署流程', '提供多种付款方式']
    };

    return quickWins[stage] || [];
  }

  private determineMarketPosition(companyRate: number, benchmarkRate: number): 'leader' | 'above_average' | 'average' | 'below_average' | 'laggard' {
    const ratio = companyRate / benchmarkRate;
    
    if (ratio >= 1.3) return 'leader';
    if (ratio >= 1.1) return 'above_average';
    if (ratio >= 0.9) return 'average';
    if (ratio >= 0.7) return 'below_average';
    return 'laggard';
  }

  private calculateTrendDirection(rates: number[]): 'improving' | 'stable' | 'declining' {
    if (rates.length < 2) return 'stable';
    
    const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
    const secondHalf = rates.slice(Math.floor(rates.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private calculateMomentum(historicalRates: number[], currentRate: number): number {
    if (historicalRates.length === 0) return 0;
    
    const lastRate = historicalRates[historicalRates.length - 1];
    const momentum = currentRate - lastRate;
    
    return Number(momentum.toFixed(2));
  }

  private rateToGrade(rate: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    // 基于整体转化率的评级标准（需要根据实际行业数据调整）
    if (rate >= 8) return 'A';
    if (rate >= 6) return 'B';
    if (rate >= 4) return 'C';
    if (rate >= 2) return 'D';
    return 'F';
  }
}