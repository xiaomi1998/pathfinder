import { client } from './client';

// 漏斗阶段数据类型
export interface FunnelStageData {
  visitors: number;
  converted: number;
  conversionRate?: number;
}

// 4阶段漏斗数据类型
export interface FunnelMetricData {
  stage_1: FunnelStageData; // 线索
  stage_2: FunnelStageData; // 有效触达
  stage_3: FunnelStageData; // 商机
  stage_4: FunnelStageData; // 成交
}

// 创建漏斗数据集请求类型
export interface CreateFunnelMetricDatasetRequest {
  name: string;
  description?: string;
  stageData: FunnelMetricData;
  industry?: string;
  dataSource?: string;
}

// 指标数据集类型
export interface MetricDataset {
  id: string;
  name: string;
  datasetType: string;
  dataSource: string;
  config: any;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  funnelData?: FunnelMetricData;
}

// 分析结果类型
export interface AnalysisResult {
  id: string;
  datasetId: string;
  companyData: FunnelMetricData & {
    overallConversionRate: number;
    stageNames: string[];
  };
  benchmarkData: {
    industry: string;
    averageRates: FunnelMetricData;
    percentiles: {
      p25: FunnelMetricData;
      p50: FunnelMetricData;
      p75: FunnelMetricData;
      p90: FunnelMetricData;
    };
  };
  comparison: {
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    improvementPotential: {
      stage_1: number;
      stage_2: number;
      stage_3: number;
      stage_4: number;
    };
    recommendations: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// 数据集查询参数
export interface DatasetQueryParams {
  page?: number;
  limit?: number;
  datasetType?: string;
  dataSource?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分析查询参数
export interface AnalysisQueryParams {
  includeBenchmarks?: boolean;
  includeSuggestions?: boolean;
}

class MetricDatasetAPI {
  /**
   * 创建漏斗指标数据集
   */
  async createFunnelDataset(data: CreateFunnelMetricDatasetRequest): Promise<MetricDataset> {
    const response = await client.post<MetricDataset>('/api/metric-datasets', data);
    return response.data;
  }

  /**
   * 获取数据集列表
   */
  async getDatasets(params?: DatasetQueryParams): Promise<MetricDataset[]> {
    const response = await client.get<MetricDataset[]>('/api/metric-datasets', {
      params
    });
    return response.data;
  }

  /**
   * 获取单个数据集详情
   */
  async getDatasetById(id: string): Promise<MetricDataset> {
    const response = await client.get<MetricDataset>(`/api/metric-datasets/${id}`);
    return response.data;
  }

  /**
   * 获取分析详情
   */
  async getAnalysis(datasetId: string, params?: AnalysisQueryParams): Promise<AnalysisResult> {
    const response = await client.get<AnalysisResult>(
      `/api/metric-datasets/analysis/${datasetId}`,
      { params }
    );
    return response.data;
  }

  /**
   * 更新数据集
   */
  async updateDataset(id: string, data: Partial<CreateFunnelMetricDatasetRequest>): Promise<MetricDataset> {
    const response = await client.put<MetricDataset>(`/api/metric-datasets/${id}`, data);
    return response.data;
  }

  /**
   * 删除数据集
   */
  async deleteDataset(id: string): Promise<void> {
    await client.delete(`/api/metric-datasets/${id}`);
  }

  /**
   * 验证漏斗数据一致性
   */
  validateFunnelData(data: FunnelMetricData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stages = [data.stage_1, data.stage_2, data.stage_3, data.stage_4];
    const stageNames = ['线索生成', '有效触达', '商机转化', '成交完成'];

    // 验证每个阶段的数据
    stages.forEach((stage, index) => {
      if (stage.visitors < 0) {
        errors.push(`${stageNames[index]}阶段的访问者数不能为负数`);
      }
      if (stage.converted < 0) {
        errors.push(`${stageNames[index]}阶段的转化数不能为负数`);
      }
      if (stage.converted > stage.visitors) {
        errors.push(`${stageNames[index]}阶段的转化数不能超过访问者数`);
      }
    });

    // 验证漏斗流程一致性
    for (let i = 1; i < stages.length; i++) {
      if (stages[i].visitors > stages[i - 1].converted) {
        errors.push(
          `${stageNames[i]}阶段的访问者数(${stages[i].visitors})不能超过${stageNames[i - 1]}阶段的转化数(${stages[i - 1].converted})`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 计算转化率
   */
  calculateConversionRate(visitors: number, converted: number): number {
    if (visitors === 0) return 0;
    return Math.round((converted / visitors) * 10000) / 100; // 保留2位小数
  }

  /**
   * 计算整体转化率
   */
  calculateOverallConversionRate(data: FunnelMetricData): number {
    if (data.stage_1.visitors === 0) return 0;
    return this.calculateConversionRate(data.stage_1.visitors, data.stage_4.converted);
  }

  /**
   * 获取性能评级颜色
   */
  getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
    const colors = {
      A: '#10B981', // green-500
      B: '#3B82F6', // blue-500  
      C: '#F59E0B', // amber-500
      D: '#F97316', // orange-500
      F: '#EF4444'  // red-500
    };
    return colors[grade];
  }

  /**
   * 获取默认漏斗数据
   */
  getDefaultFunnelData(): FunnelMetricData {
    return {
      stage_1: { visitors: 1000, converted: 0 },
      stage_2: { visitors: 0, converted: 0 },
      stage_3: { visitors: 0, converted: 0 },
      stage_4: { visitors: 0, converted: 0 }
    };
  }

  /**
   * 获取行业基准数据（模拟）
   */
  getIndustryBenchmarks(industry: string = 'general'): FunnelMetricData {
    const benchmarks: Record<string, FunnelMetricData> = {
      general: {
        stage_1: { visitors: 1000, converted: 200, conversionRate: 20 },
        stage_2: { visitors: 200, converted: 60, conversionRate: 30 },
        stage_3: { visitors: 60, converted: 18, conversionRate: 30 },
        stage_4: { visitors: 18, converted: 9, conversionRate: 50 }
      },
      technology: {
        stage_1: { visitors: 1000, converted: 250, conversionRate: 25 },
        stage_2: { visitors: 250, converted: 100, conversionRate: 40 },
        stage_3: { visitors: 100, converted: 35, conversionRate: 35 },
        stage_4: { visitors: 35, converted: 21, conversionRate: 60 }
      },
      finance: {
        stage_1: { visitors: 1000, converted: 150, conversionRate: 15 },
        stage_2: { visitors: 150, converted: 30, conversionRate: 20 },
        stage_3: { visitors: 30, converted: 12, conversionRate: 40 },
        stage_4: { visitors: 12, converted: 8, conversionRate: 67 }
      }
    };

    return benchmarks[industry] || benchmarks.general;
  }
}

// 导出单例实例
export const metricDatasetAPI = new MetricDatasetAPI();