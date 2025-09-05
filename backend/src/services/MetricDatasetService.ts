import { PrismaClient } from '@prisma/client';
import { 
  MetricDataset,
  CreateMetricDatasetRequest,
  UpdateMetricDatasetRequest,
  CreateFunnelMetricDatasetRequest,
  FunnelMetricData,
  FunnelStageData,
  AnalysisResult,
  BenchmarkData,
  MetricDatasetWithFunnelData
} from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class MetricDatasetService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 创建指标数据集
   */
  async createDataset(
    organizationId: string, 
    createdBy: string, 
    data: CreateMetricDatasetRequest
  ): Promise<MetricDataset> {
    try {
      // TODO: 实现数据集创建逻辑
      // - 验证用户权限
      // - 验证数据源配置
      // - 测试数据连接（如果是API数据源）
      // - 创建数据集记录
      
      logger.info(`Creating metric dataset: ${data.name} for organization: ${organizationId}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error creating metric dataset:', error);
      throw new ApiError('创建指标数据集失败', 500);
    }
  }

  /**
   * 创建漏斗指标数据集
   */
  async createFunnelDataset(
    organizationId: string,
    createdBy: string,
    data: CreateFunnelMetricDatasetRequest
  ): Promise<MetricDatasetWithFunnelData> {
    try {
      logger.info(`Creating funnel metric dataset: ${data.name} for organization: ${organizationId}`);
      
      // 计算转化率
      const processedStageData = this.calculateConversionRates(data.stageData);
      
      // 准备数据集配置
      const config = {
        stageData: processedStageData,
        industry: data.industry || 'general',
        dataSource: data.dataSource || 'manual',
        stageNames: [
          '线索生成',
          '有效触达', 
          '商机转化',
          '成交完成'
        ]
      };
      
      // 创建数据集记录
      const dataset = await this.prisma.metricDataset.create({
        data: {
          name: data.name,
          datasetType: 'funnel_conversion',
          dataSource: data.dataSource || 'manual',
          config,
          organizationId,
          createdBy
        }
      });
      
      // 返回带有漏斗数据的数据集
      return {
        ...dataset,
        funnelData: processedStageData
      };
    } catch (error) {
      logger.error('Error creating funnel metric dataset:', error);
      throw new ApiError('创建漏斗指标数据集失败', 500);
    }
  }

  /**
   * 获取数据集详情
   */
  async getDatasetById(id: string, organizationId: string): Promise<MetricDataset | null> {
    try {
      logger.info(`Getting metric dataset: ${id}`);
      
      const dataset = await this.prisma.metricDataset.findFirst({
        where: {
          id,
          organizationId
        }
      });
      
      return dataset;
    } catch (error) {
      logger.error('Error getting metric dataset:', error);
      throw new ApiError('获取指标数据集失败', 500);
    }
  }
  
  /**
   * 获取漏斗数据集的分析结果
   */
  async getAnalysisById(datasetId: string, organizationId: string, options: {
    includeBenchmarks?: boolean;
    includeSuggestions?: boolean;
  } = {}): Promise<AnalysisResult> {
    try {
      logger.info(`Getting analysis for dataset: ${datasetId}`);
      
      // 获取数据集
      const dataset = await this.getDatasetById(datasetId, organizationId);
      if (!dataset) {
        throw new ApiError('数据集不存在', 404);
      }
      
      if (dataset.datasetType !== 'funnel_conversion') {
        throw new ApiError('该数据集不是漏斗转化类型', 400);
      }
      
      const funnelData = dataset.config.stageData as FunnelMetricData;
      const industry = dataset.config.industry || 'general';
      
      // 获取基准数据
      const benchmarkData = options.includeBenchmarks !== false 
        ? await this.getBenchmarkData(industry)
        : null;
      
      // 计算对比分析
      const comparison = benchmarkData 
        ? this.calculateComparison(funnelData, benchmarkData)
        : null;
        
      // 生成建议
      const recommendations = options.includeSuggestions !== false && comparison
        ? this.generateRecommendations(funnelData, comparison)
        : [];
      
      return {
        id: `analysis_${datasetId}`,
        datasetId,
        companyData: {
          ...funnelData,
          overallConversionRate: this.calculateOverallConversionRate(funnelData),
          stageNames: dataset.config.stageNames || ['阶段1', '阶段2', '阶段3', '阶段4']
        },
        benchmarkData: benchmarkData || {
          industry,
          averageRates: this.getDefaultBenchmarkData(),
          percentiles: {
            p25: this.getDefaultBenchmarkData(),
            p50: this.getDefaultBenchmarkData(), 
            p75: this.getDefaultBenchmarkData(),
            p90: this.getDefaultBenchmarkData()
          }
        },
        comparison: comparison || {
          performanceGrade: 'C',
          improvementPotential: { stage_1: 0, stage_2: 0, stage_3: 0, stage_4: 0 },
          recommendations: []
        },
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error getting analysis:', error);
      throw new ApiError('获取分析数据失败', 500);
    }
  }

  /**
   * 更新数据集
   */
  async updateDataset(
    id: string, 
    organizationId: string, 
    userId: string, 
    data: UpdateMetricDatasetRequest
  ): Promise<MetricDataset> {
    try {
      // TODO: 实现数据集更新逻辑
      // - 验证权限（创建者或管理员）
      // - 测试新的数据源配置
      // - 更新数据集
      
      logger.info(`Updating metric dataset: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error updating metric dataset:', error);
      throw new ApiError('更新指标数据集失败', 500);
    }
  }

  /**
   * 删除数据集
   */
  async deleteDataset(id: string, organizationId: string, userId: string): Promise<void> {
    try {
      // TODO: 实现数据集删除逻辑
      // - 验证权限
      // - 检查是否有依赖的漏斗或分析
      // - 删除数据集
      
      logger.info(`Deleting metric dataset: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error deleting metric dataset:', error);
      throw new ApiError('删除指标数据集失败', 500);
    }
  }

  /**
   * 获取组织的数据集列表
   */
  async getDatasetsByOrganization(
    organizationId: string, 
    options: { 
      page?: number; 
      limit?: number; 
      datasetType?: string;
      dataSource?: string;
    } = {}
  ): Promise<MetricDataset[]> {
    try {
      // TODO: 实现获取数据集列表逻辑
      // - 分页支持
      // - 按类型和数据源过滤
      // - 按创建时间排序
      
      logger.info(`Getting metric datasets for organization: ${organizationId}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error getting metric datasets:', error);
      throw new ApiError('获取指标数据集列表失败', 500);
    }
  }

  /**
   * 测试数据源连接
   */
  async testConnection(organizationId: string, config: any): Promise<boolean> {
    try {
      // TODO: 实现数据源连接测试逻辑
      // - 根据数据源类型进行连接测试
      // - API数据源：测试认证和端点
      // - 数据库数据源：测试连接字符串
      // - 文件数据源：验证访问权限
      
      logger.info(`Testing data source connection for organization: ${organizationId}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error testing data source connection:', error);
      throw new ApiError('测试数据源连接失败', 500);
    }
  }

  /**
   * 同步数据
   */
  async syncData(id: string, organizationId: string): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      // TODO: 实现数据同步逻辑
      // - 验证权限
      // - 根据数据源配置获取数据
      // - 处理和验证数据格式
      // - 更新相关指标
      
      logger.info(`Syncing data for dataset: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error syncing dataset data:', error);
      throw new ApiError('同步数据失败', 500);
    }
  }

  /**
   * 获取数据预览
   */
  async getDataPreview(id: string, organizationId: string, limit: number = 10): Promise<any[]> {
    try {
      // TODO: 实现数据预览逻辑
      // - 验证权限
      // - 获取数据样本
      // - 返回脱敏的预览数据
      
      logger.info(`Getting data preview for dataset: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error getting data preview:', error);
      throw new ApiError('获取数据预览失败', 500);
    }
  }

  /**
   * 获取数据统计
   */
  async getDataStats(id: string, organizationId: string): Promise<{
    totalRecords: number;
    lastSyncAt: Date | null;
    dataQuality: number;
    errorRate: number;
  }> {
    try {
      // TODO: 实现数据统计逻辑
      // - 计算记录总数
      // - 最后同步时间
      // - 数据质量评分
      // - 错误率统计
      
      logger.info(`Getting data stats for dataset: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error getting data stats:', error);
      throw new ApiError('获取数据统计失败', 500);
    }
  }

  /**
   * 验证数据集配置
   */
  private validateDatasetConfig(datasetType: string, dataSource: string, config: any): boolean {
    try {
      // TODO: 实现配置验证逻辑
      // - 根据数据源类型验证必要配置项
      // - 验证配置格式和数据类型
      // - 验证安全性（避免敏感信息泄露）
      
      return true;
    } catch (error) {
      logger.error('Error validating dataset config:', error);
      return false;
    }
  }
  
  /**
   * 计算转化率
   */
  private calculateConversionRates(stageData: FunnelMetricData): FunnelMetricData {
    const calculateRate = (stage: FunnelStageData): FunnelStageData => ({
      ...stage,
      conversionRate: stage.visitors > 0 ? Number((stage.converted / stage.visitors * 100).toFixed(2)) : 0
    });
    
    return {
      stage_1: calculateRate(stageData.stage_1),
      stage_2: calculateRate(stageData.stage_2), 
      stage_3: calculateRate(stageData.stage_3),
      stage_4: calculateRate(stageData.stage_4)
    };
  }
  
  /**
   * 计算整体转化率
   */
  private calculateOverallConversionRate(stageData: FunnelMetricData): number {
    const stage1Visitors = stageData.stage_1.visitors;
    const stage4Converted = stageData.stage_4.converted;
    
    if (stage1Visitors === 0) return 0;
    return Number((stage4Converted / stage1Visitors * 100).toFixed(2));
  }
  
  /**
   * 获取基准数据
   */
  private async getBenchmarkData(industry: string): Promise<any> {
    // TODO: 从数据库获取实际基准数据
    // 现在返回模拟数据
    return {
      industry,
      averageRates: {
        stage_1: { visitors: 1000, converted: 200, conversionRate: 20 },
        stage_2: { visitors: 200, converted: 60, conversionRate: 30 },
        stage_3: { visitors: 60, converted: 18, conversionRate: 30 },
        stage_4: { visitors: 18, converted: 9, conversionRate: 50 }
      },
      percentiles: {
        p25: {
          stage_1: { visitors: 1000, converted: 150, conversionRate: 15 },
          stage_2: { visitors: 150, converted: 30, conversionRate: 20 },
          stage_3: { visitors: 30, converted: 6, conversionRate: 20 },
          stage_4: { visitors: 6, converted: 2, conversionRate: 33 }
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
          stage_4: { visitors: 48, converted: 32, conversionRate: 67 }
        },
        p90: {
          stage_1: { visitors: 1000, converted: 400, conversionRate: 40 },
          stage_2: { visitors: 400, converted: 200, conversionRate: 50 },
          stage_3: { visitors: 200, converted: 100, conversionRate: 50 },
          stage_4: { visitors: 100, converted: 80, conversionRate: 80 }
        }
      }
    };
  }
  
  /**
   * 计算对比分析
   */
  private calculateComparison(companyData: FunnelMetricData, benchmarkData: any): any {
    const benchmarkAverage = benchmarkData.averageRates;
    
    // 计算性能评分
    const scores = [
      this.getPerformanceScore(companyData.stage_1.conversionRate || 0, benchmarkData.percentiles),
      this.getPerformanceScore(companyData.stage_2.conversionRate || 0, benchmarkData.percentiles),
      this.getPerformanceScore(companyData.stage_3.conversionRate || 0, benchmarkData.percentiles),
      this.getPerformanceScore(companyData.stage_4.conversionRate || 0, benchmarkData.percentiles)
    ];
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const grade = this.getGradeFromScore(averageScore);
    
    // 计算改进潜力
    const improvementPotential = {
      stage_1: Math.max(0, benchmarkAverage.stage_1.conversionRate - (companyData.stage_1.conversionRate || 0)),
      stage_2: Math.max(0, benchmarkAverage.stage_2.conversionRate - (companyData.stage_2.conversionRate || 0)),
      stage_3: Math.max(0, benchmarkAverage.stage_3.conversionRate - (companyData.stage_3.conversionRate || 0)),
      stage_4: Math.max(0, benchmarkAverage.stage_4.conversionRate - (companyData.stage_4.conversionRate || 0))
    };
    
    return {
      performanceGrade: grade,
      improvementPotential,
      recommendations: []
    };
  }
  
  /**
   * 获取性能评分
   */
  private getPerformanceScore(value: number, percentiles: any): number {
    const stage1Percentiles = percentiles;
    if (value >= stage1Percentiles.p90.stage_1.conversionRate) return 90;
    if (value >= stage1Percentiles.p75.stage_1.conversionRate) return 75;
    if (value >= stage1Percentiles.p50.stage_1.conversionRate) return 50;
    if (value >= stage1Percentiles.p25.stage_1.conversionRate) return 25;
    return 10;
  }
  
  /**
   * 根据评分获取等级
   */
  private getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  }
  
  /**
   * 生成建议
   */
  private generateRecommendations(companyData: FunnelMetricData, comparison: any): string[] {
    const recommendations: string[] = [];
    
    // 根据改进潜力生成建议
    if (comparison.improvementPotential.stage_1 > 5) {
      recommendations.push('线索质量有待提升，建议优化获客渠道和线索筛选机制');
    }
    
    if (comparison.improvementPotential.stage_2 > 5) {
      recommendations.push('有效触达率偏低，建议改进联系策略和时机把握');
    }
    
    if (comparison.improvementPotential.stage_3 > 5) {
      recommendations.push('商机转化需要加强，建议完善需求挖掘和方案设计');
    }
    
    if (comparison.improvementPotential.stage_4 > 5) {
      recommendations.push('成交率有提升空间，建议优化谈判技巧和价格策略');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('整体表现良好，建议保持当前策略并关注行业趋势');
    }
    
    return recommendations;
  }
  
  /**
   * 获取默认基准数据
   */
  private getDefaultBenchmarkData(): FunnelMetricData {
    return {
      stage_1: { visitors: 1000, converted: 200, conversionRate: 20 },
      stage_2: { visitors: 200, converted: 60, conversionRate: 30 },
      stage_3: { visitors: 60, converted: 18, conversionRate: 30 },
      stage_4: { visitors: 18, converted: 9, conversionRate: 50 }
    };
  }
}