import { PrismaClient } from '@prisma/client';
import { 
  BenchmarkData, 
  CreateBenchmarkDataRequest,
  FunnelMetricData,
  FunnelStageData
} from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

/**
 * 基准计算服务
 * 提供行业基准数据计算、分位数分析和同行对比功能
 */
export class BenchmarkService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 计算分位数基准数据
   * 基于行业和公司规模计算各阶段转化率的分位数分布
   */
  async calculatePercentileBenchmarks(
    industry: string,
    companySize?: string,
    region?: string,
    timePeriod?: { start: Date; end: Date }
  ): Promise<{
    percentiles: {
      p10: FunnelMetricData;
      p25: FunnelMetricData;
      p50: FunnelMetricData;
      p75: FunnelMetricData;
      p90: FunnelMetricData;
    };
    sampleSize: number;
    averageRates: FunnelMetricData;
  }> {
    try {
      logger.info(`Calculating percentile benchmarks for industry: ${industry}`);
      
      // 构建查询条件
      const whereConditions: any = {
        industry,
        ...(timePeriod && {
          periodStart: { gte: timePeriod.start },
          periodEnd: { lte: timePeriod.end }
        })
      };

      // 获取基准数据
      const benchmarkRecords = await this.prisma.benchmarkData.findMany({
        where: whereConditions,
        orderBy: [
          { metricType: 'asc' },
          { metricName: 'asc' },
          { percentile: 'asc' }
        ]
      });

      if (benchmarkRecords.length === 0) {
        // 如果没有实际数据，返回默认基准数据
        return this.getDefaultBenchmarkData(industry);
      }

      // 按阶段和百分位数组织数据
      const percentileData = this.organizeBenchmarkData(benchmarkRecords);
      
      // 计算平均值
      const averageRates = this.calculateAverageRates(benchmarkRecords);
      
      // 获取样本量
      const sampleSize = this.calculateSampleSize(benchmarkRecords);

      return {
        percentiles: percentileData,
        sampleSize,
        averageRates
      };

    } catch (error) {
      logger.error('Error calculating percentile benchmarks:', error);
      throw new ApiError('计算基准数据失败', 500);
    }
  }

  /**
   * 执行同行对比分析
   */
  async performPeerComparison(
    companyData: FunnelMetricData,
    industry: string,
    companySize?: string,
    region?: string
  ): Promise<{
    rankings: {
      stage_1: { percentile: number; rank: string };
      stage_2: { percentile: number; rank: string };
      stage_3: { percentile: number; rank: string };
      stage_4: { percentile: number; rank: string };
      overall: { percentile: number; rank: string };
    };
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    benchmarkData: any;
  }> {
    try {
      logger.info(`Performing peer comparison for industry: ${industry}`);
      
      // 获取基准数据
      const benchmarkData = await this.calculatePercentileBenchmarks(
        industry, 
        companySize, 
        region
      );
      
      // 计算各阶段排名
      const rankings = {
        stage_1: this.calculateRanking(
          companyData.stage_1.conversionRate || 0,
          benchmarkData.percentiles,
          'stage_1'
        ),
        stage_2: this.calculateRanking(
          companyData.stage_2.conversionRate || 0,
          benchmarkData.percentiles,
          'stage_2'
        ),
        stage_3: this.calculateRanking(
          companyData.stage_3.conversionRate || 0,
          benchmarkData.percentiles,
          'stage_3'
        ),
        stage_4: this.calculateRanking(
          companyData.stage_4.conversionRate || 0,
          benchmarkData.percentiles,
          'stage_4'
        ),
        overall: this.calculateOverallRanking(companyData, benchmarkData.percentiles)
      };

      // 计算综合性能评级
      const averagePercentile = (
        rankings.stage_1.percentile +
        rankings.stage_2.percentile +
        rankings.stage_3.percentile +
        rankings.stage_4.percentile
      ) / 4;

      const performanceGrade = this.getGradeFromPercentile(averagePercentile);

      return {
        rankings,
        performanceGrade,
        benchmarkData
      };

    } catch (error) {
      logger.error('Error performing peer comparison:', error);
      throw new ApiError('同行对比分析失败', 500);
    }
  }

  /**
   * 计算改进潜力
   */
  calculateImprovementPotential(
    companyData: FunnelMetricData,
    benchmarkData: any
  ): {
    stage_1: { current: number; benchmark: number; potential: number; impact: number };
    stage_2: { current: number; benchmark: number; potential: number; impact: number };
    stage_3: { current: number; benchmark: number; potential: number; impact: number };
    stage_4: { current: number; benchmark: number; potential: number; impact: number };
    overallPotential: number;
  } {
    try {
      const p75 = benchmarkData.percentiles.p75;
      
      const stage1Potential = Math.max(0, p75.stage_1.conversionRate - (companyData.stage_1.conversionRate || 0));
      const stage2Potential = Math.max(0, p75.stage_2.conversionRate - (companyData.stage_2.conversionRate || 0));
      const stage3Potential = Math.max(0, p75.stage_3.conversionRate - (companyData.stage_3.conversionRate || 0));
      const stage4Potential = Math.max(0, p75.stage_4.conversionRate - (companyData.stage_4.conversionRate || 0));

      // 计算改进对整体转化率的影响
      const currentOverall = this.calculateOverallConversionRate(companyData);
      
      const impact1 = this.calculateImprovementImpact(companyData, 'stage_1', stage1Potential);
      const impact2 = this.calculateImprovementImpact(companyData, 'stage_2', stage2Potential);
      const impact3 = this.calculateImprovementImpact(companyData, 'stage_3', stage3Potential);
      const impact4 = this.calculateImprovementImpact(companyData, 'stage_4', stage4Potential);

      const overallPotential = impact1 + impact2 + impact3 + impact4;

      return {
        stage_1: {
          current: companyData.stage_1.conversionRate || 0,
          benchmark: p75.stage_1.conversionRate,
          potential: stage1Potential,
          impact: impact1
        },
        stage_2: {
          current: companyData.stage_2.conversionRate || 0,
          benchmark: p75.stage_2.conversionRate,
          potential: stage2Potential,
          impact: impact2
        },
        stage_3: {
          current: companyData.stage_3.conversionRate || 0,
          benchmark: p75.stage_3.conversionRate,
          potential: stage3Potential,
          impact: impact3
        },
        stage_4: {
          current: companyData.stage_4.conversionRate || 0,
          benchmark: p75.stage_4.conversionRate,
          potential: stage4Potential,
          impact: impact4
        },
        overallPotential
      };

    } catch (error) {
      logger.error('Error calculating improvement potential:', error);
      throw new ApiError('计算改进潜力失败', 500);
    }
  }

  /**
   * 创建或更新基准数据
   */
  async createBenchmarkData(
    organizationId: string,
    data: CreateBenchmarkDataRequest
  ): Promise<BenchmarkData> {
    try {
      logger.info(`Creating benchmark data for industry: ${data.industry}`);
      
      const benchmarkData = await this.prisma.benchmarkData.create({
        data: {
          ...data,
          organizationId
        }
      });

      return benchmarkData;

    } catch (error) {
      logger.error('Error creating benchmark data:', error);
      throw new ApiError('创建基准数据失败', 500);
    }
  }

  /**
   * 批量导入基准数据
   */
  async bulkImportBenchmarkData(
    organizationId: string,
    benchmarkRecords: CreateBenchmarkDataRequest[]
  ): Promise<{ created: number; errors: string[] }> {
    try {
      logger.info(`Bulk importing ${benchmarkRecords.length} benchmark records`);
      
      let created = 0;
      const errors: string[] = [];

      for (const record of benchmarkRecords) {
        try {
          await this.createBenchmarkData(organizationId, record);
          created++;
        } catch (error) {
          errors.push(`Failed to create record for ${record.industry}-${record.metricName}: ${error}`);
        }
      }

      return { created, errors };

    } catch (error) {
      logger.error('Error bulk importing benchmark data:', error);
      throw new ApiError('批量导入基准数据失败', 500);
    }
  }

  /**
   * 验证基准数据有效性
   */
  async validateBenchmarkData(industry: string): Promise<{
    isValid: boolean;
    sampleSize: number;
    lastUpdated: Date | null;
    missingMetrics: string[];
  }> {
    try {
      const benchmarkRecords = await this.prisma.benchmarkData.findMany({
        where: { industry },
        orderBy: { updatedAt: 'desc' }
      });

      const sampleSize = benchmarkRecords.reduce((sum, record) => sum + record.sampleSize, 0);
      const lastUpdated = benchmarkRecords.length > 0 ? benchmarkRecords[0].updatedAt : null;
      
      // 检查必要指标是否存在
      const requiredMetrics = [
        'stage_1_conversion_rate',
        'stage_2_conversion_rate', 
        'stage_3_conversion_rate',
        'stage_4_conversion_rate'
      ];
      
      const availableMetrics = [...new Set(benchmarkRecords.map(record => record.metricName))];
      const missingMetrics = requiredMetrics.filter(metric => !availableMetrics.includes(metric));
      
      const isValid = sampleSize >= 50 && missingMetrics.length === 0; // 至少50个样本且所有指标齐全

      return {
        isValid,
        sampleSize,
        lastUpdated,
        missingMetrics
      };

    } catch (error) {
      logger.error('Error validating benchmark data:', error);
      throw new ApiError('验证基准数据失败', 500);
    }
  }

  // ===================== Private Helper Methods =====================

  /**
   * 组织基准数据按分位数
   */
  private organizeBenchmarkData(records: BenchmarkData[]): {
    p10: FunnelMetricData;
    p25: FunnelMetricData;
    p50: FunnelMetricData;
    p75: FunnelMetricData;
    p90: FunnelMetricData;
  } {
    const percentiles = { p10: {}, p25: {}, p50: {}, p75: {}, p90: {} };
    
    for (const record of records) {
      const percentileKey = `p${record.percentile}` as keyof typeof percentiles;
      const stageKey = this.getStageKeyFromMetricName(record.metricName);
      
      if (percentiles[percentileKey] && stageKey) {
        (percentiles[percentileKey] as any)[stageKey] = {
          visitors: 1000, // 标准化基数
          converted: Math.round(1000 * record.value / 100),
          conversionRate: record.value
        };
      }
    }
    
    // 填充缺失数据
    this.fillMissingPercentileData(percentiles);
    
    return percentiles as any;
  }

  /**
   * 计算平均转化率
   */
  private calculateAverageRates(records: BenchmarkData[]): FunnelMetricData {
    const averages = { stage_1: 0, stage_2: 0, stage_3: 0, stage_4: 0 };
    const counts = { stage_1: 0, stage_2: 0, stage_3: 0, stage_4: 0 };
    
    for (const record of records) {
      const stageKey = this.getStageKeyFromMetricName(record.metricName);
      if (stageKey && record.percentile === 50) { // 使用中位数作为平均值
        averages[stageKey] = record.value;
        counts[stageKey]++;
      }
    }
    
    return {
      stage_1: {
        visitors: 1000,
        converted: Math.round(1000 * averages.stage_1 / 100),
        conversionRate: averages.stage_1
      },
      stage_2: {
        visitors: 1000,
        converted: Math.round(1000 * averages.stage_2 / 100),
        conversionRate: averages.stage_2
      },
      stage_3: {
        visitors: 1000,
        converted: Math.round(1000 * averages.stage_3 / 100),
        conversionRate: averages.stage_3
      },
      stage_4: {
        visitors: 1000,
        converted: Math.round(1000 * averages.stage_4 / 100),
        conversionRate: averages.stage_4
      }
    };
  }

  /**
   * 计算样本量
   */
  private calculateSampleSize(records: BenchmarkData[]): number {
    return records.reduce((sum, record) => sum + record.sampleSize, 0) / records.length;
  }

  /**
   * 计算单阶段排名
   */
  private calculateRanking(
    value: number,
    percentiles: any,
    stage: keyof FunnelMetricData
  ): { percentile: number; rank: string } {
    const stagePercentiles = {
      p10: percentiles.p10[stage].conversionRate,
      p25: percentiles.p25[stage].conversionRate,
      p50: percentiles.p50[stage].conversionRate,
      p75: percentiles.p75[stage].conversionRate,
      p90: percentiles.p90[stage].conversionRate
    };

    let percentile = 0;
    let rank = 'Poor';

    if (value >= stagePercentiles.p90) {
      percentile = 95;
      rank = 'Excellent';
    } else if (value >= stagePercentiles.p75) {
      percentile = 80;
      rank = 'Good';
    } else if (value >= stagePercentiles.p50) {
      percentile = 60;
      rank = 'Average';
    } else if (value >= stagePercentiles.p25) {
      percentile = 35;
      rank = 'Below Average';
    } else {
      percentile = 15;
      rank = 'Poor';
    }

    return { percentile, rank };
  }

  /**
   * 计算整体排名
   */
  private calculateOverallRanking(
    companyData: FunnelMetricData,
    percentiles: any
  ): { percentile: number; rank: string } {
    const overallRate = this.calculateOverallConversionRate(companyData);
    
    // 计算基准的整体转化率
    const benchmarkRates = {
      p10: this.calculateOverallConversionRate(percentiles.p10),
      p25: this.calculateOverallConversionRate(percentiles.p25),
      p50: this.calculateOverallConversionRate(percentiles.p50),
      p75: this.calculateOverallConversionRate(percentiles.p75),
      p90: this.calculateOverallConversionRate(percentiles.p90)
    };

    return this.calculateRanking(overallRate, { percentiles: benchmarkRates }, 'stage_1' as any);
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
   * 计算改进影响
   */
  private calculateImprovementImpact(
    companyData: FunnelMetricData,
    stage: keyof FunnelMetricData,
    improvement: number
  ): number {
    // 模拟计算改进对整体转化率的影响
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
    
    return improvedOverall - currentOverall;
  }

  /**
   * 根据百分位数获取等级
   */
  private getGradeFromPercentile(percentile: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentile >= 80) return 'A';
    if (percentile >= 65) return 'B';
    if (percentile >= 50) return 'C';
    if (percentile >= 35) return 'D';
    return 'F';
  }

  /**
   * 从指标名称获取阶段键
   */
  private getStageKeyFromMetricName(metricName: string): keyof FunnelMetricData | null {
    if (metricName.includes('stage_1')) return 'stage_1';
    if (metricName.includes('stage_2')) return 'stage_2';
    if (metricName.includes('stage_3')) return 'stage_3';
    if (metricName.includes('stage_4')) return 'stage_4';
    return null;
  }

  /**
   * 填充缺失的分位数数据
   */
  private fillMissingPercentileData(percentiles: any): void {
    const defaultStageData = (rate: number) => ({
      visitors: 1000,
      converted: Math.round(1000 * rate / 100),
      conversionRate: rate
    });

    // 默认分位数值
    const defaultPercentiles = {
      p10: { stage_1: 10, stage_2: 15, stage_3: 20, stage_4: 35 },
      p25: { stage_1: 15, stage_2: 20, stage_3: 25, stage_4: 45 },
      p50: { stage_1: 20, stage_2: 30, stage_3: 30, stage_4: 50 },
      p75: { stage_1: 30, stage_2: 40, stage_3: 40, stage_4: 65 },
      p90: { stage_1: 40, stage_2: 50, stage_3: 50, stage_4: 80 }
    };

    for (const [pKey, pData] of Object.entries(defaultPercentiles)) {
      if (!percentiles[pKey]) percentiles[pKey] = {};
      
      for (const [sKey, rate] of Object.entries(pData)) {
        if (!percentiles[pKey][sKey]) {
          percentiles[pKey][sKey] = defaultStageData(rate);
        }
      }
    }
  }

  /**
   * 获取默认基准数据（当数据库中没有数据时使用）
   */
  private getDefaultBenchmarkData(industry: string): any {
    return {
      percentiles: {
        p10: {
          stage_1: { visitors: 1000, converted: 100, conversionRate: 10 },
          stage_2: { visitors: 100, converted: 15, conversionRate: 15 },
          stage_3: { visitors: 15, converted: 3, conversionRate: 20 },
          stage_4: { visitors: 3, converted: 1, conversionRate: 35 }
        },
        p25: {
          stage_1: { visitors: 1000, converted: 150, conversionRate: 15 },
          stage_2: { visitors: 150, converted: 30, conversionRate: 20 },
          stage_3: { visitors: 30, converted: 7, conversionRate: 25 },
          stage_4: { visitors: 7, converted: 3, conversionRate: 45 }
        },
        p50: {
          stage_1: { visitors: 1000, converted: 200, conversionRate: 20 },
          stage_2: { visitors: 200, converted: 60, conversionRate: 30 },
          stage_3: { visitors: 60, converted: 18, conversionRate: 30 },
          stage_4: { visitors: 18, converted: 9, conversionRate: 50 }
        },
        p75: {
          stage_1: { visitors: 1000, converted: 300, conversionRate: 30 },
          stage_2: { visitors: 300, converted: 120, conversionRate: 40 },
          stage_3: { visitors: 120, converted: 48, conversionRate: 40 },
          stage_4: { visitors: 48, converted: 31, conversionRate: 65 }
        },
        p90: {
          stage_1: { visitors: 1000, converted: 400, conversionRate: 40 },
          stage_2: { visitors: 400, converted: 200, conversionRate: 50 },
          stage_3: { visitors: 200, converted: 100, conversionRate: 50 },
          stage_4: { visitors: 100, converted: 80, conversionRate: 80 }
        }
      },
      sampleSize: 100,
      averageRates: {
        stage_1: { visitors: 1000, converted: 200, conversionRate: 20 },
        stage_2: { visitors: 200, converted: 60, conversionRate: 30 },
        stage_3: { visitors: 60, converted: 18, conversionRate: 30 },
        stage_4: { visitors: 18, converted: 9, conversionRate: 50 }
      }
    };
  }
}