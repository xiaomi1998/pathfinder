import { client } from './client';

// Analytics API types (matching backend)
export interface InstanceAnalytics {
  id: string;
  funnelId: string;
  funnelName: string;
  instanceName?: string;
  status: 'active' | 'archived' | 'template';
  
  performance: {
    completionRate: number;
    avgTimeToComplete: number;
    totalEntries: number;
    totalConversions: number;
    overallConversionRate: number;
    lastDataUpdate: Date | null;
  };
  
  stageAnalytics: {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    entryCount: number;
    convertedCount: number;
    conversionRate: number;
    avgTimeSpent: number;
    bounceCount: number;
    revenue?: number;
    cost?: number;
  }[];
  
  historical: {
    date: Date;
    entries: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
  }[];
  
  quality: {
    dataCompleteness: number;
    dataAccuracy: number;
    lastUpdated: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InstanceComparison {
  instances: {
    id: string;
    name: string;
    completionRate: number;
    avgTimeToComplete: number;
    overallConversionRate: number;
    totalRevenue?: number;
    lastUpdated: Date;
  }[];
  
  comparison: {
    best: {
      instanceId: string;
      metric: string;
      value: number;
    };
    worst: {
      instanceId: string;
      metric: string;
      value: number;
    };
    average: {
      completionRate: number;
      avgTimeToComplete: number;
      overallConversionRate: number;
    };
  };
  
  trends: {
    instanceId: string;
    trend: 'improving' | 'declining' | 'stable';
    changePercent: number;
    timeframe: 'week' | 'month' | 'quarter';
  }[];
}

export interface TemplateAnalytics {
  templateId?: string;
  templateName?: string;
  funnelId: string;
  funnelName: string;
  
  usage: {
    totalInstances: number;
    activeInstances: number;
    archivedInstances: number;
    avgInstancesPerUser: number;
    usageGrowthRate: number;
  };
  
  performance: {
    avgCompletionRate: number;
    avgConversionRate: number;
    avgTimeToComplete: number;
    bestPerformingInstance: {
      id: string;
      name: string;
      conversionRate: number;
    };
    worstPerformingInstance: {
      id: string;
      name: string;
      conversionRate: number;
    };
  };
  
  success: {
    successRate: number;
    benchmarkConversionRate: number;
    highPerformers: number;
    underPerformers: number;
  };
  
  stageEffectiveness: {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    avgConversionRate: number;
    varianceAcrossInstances: number;
    bestPractices: string[];
  }[];
  
  timeline: {
    period: Date;
    newInstances: number;
    completedInstances: number;
    avgPerformance: number;
  }[];
}

export interface InstanceTrendData {
  instanceId: string;
  timeSeriesData: {
    date: Date;
    entries: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
    cost?: number;
    dataQuality: number;
  }[];
  
  trends: {
    conversionRate: {
      direction: 'up' | 'down' | 'stable';
      changePercent: number;
      significance: 'high' | 'medium' | 'low';
    };
    volume: {
      direction: 'up' | 'down' | 'stable';
      changePercent: number;
      significance: 'high' | 'medium' | 'low';
    };
    quality: {
      direction: 'up' | 'down' | 'stable';
      changePercent: number;
      significance: 'high' | 'medium' | 'low';
    };
  };
  
  patterns: {
    seasonality: 'weekly' | 'monthly' | 'none';
    cyclical: boolean;
    outliers: {
      date: Date;
      type: 'spike' | 'drop';
      severity: 'high' | 'medium' | 'low';
      possibleCause?: string;
    }[];
  };
}

export interface AnalyticsQuery {
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeHistorical?: boolean;
  granularity?: 'daily' | 'weekly' | 'monthly';
  metrics?: string[];
}

export interface UsageStatistics {
  totalFunnels: number;
  activeFunnels: number;
  totalUsers: number;
  recentActivity: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceBenchmark {
  industry: string;
  metricType: string;
  metricName: string;
  percentile: number;
  value: number;
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
}

class AnalyticsAPI {
  /**
   * Get analytics for a specific funnel instance
   */
  async getInstanceAnalytics(
    instanceId: string, 
    query?: AnalyticsQuery
  ): Promise<InstanceAnalytics> {
    const params = new URLSearchParams();
    
    if (query?.dateRange) {
      params.append('dateRange', JSON.stringify({
        start: query.dateRange.start.toISOString(),
        end: query.dateRange.end.toISOString()
      }));
    }
    
    if (query?.includeHistorical) {
      params.append('includeHistorical', query.includeHistorical.toString());
    }
    
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }
    
    if (query?.metrics) {
      query.metrics.forEach(metric => params.append('metrics', metric));
    }

    const response = await client.get(`/analytics/instances/${instanceId}?${params.toString()}`);
    return response.data;
  }

  /**
   * Compare multiple funnel instances
   */
  async compareInstances(
    instanceIds: string[],
    query?: AnalyticsQuery & {
      comparisonMetrics?: ('completionRate' | 'conversionRate' | 'timeToComplete' | 'revenue')[];
    }
  ): Promise<InstanceComparison> {
    const payload = {
      instanceIds,
      ...query,
      dateRange: query?.dateRange ? {
        start: query.dateRange.start.toISOString(),
        end: query.dateRange.end.toISOString()
      } : undefined
    };

    const response = await client.post('/analytics/instances/compare', payload);
    return response.data;
  }

  /**
   * Get template-level analytics for a funnel
   */
  async getTemplateAnalytics(
    funnelId: string,
    query?: AnalyticsQuery & {
      includeStageBreakdown?: boolean;
      includeTrendAnalysis?: boolean;
    }
  ): Promise<TemplateAnalytics> {
    const params = new URLSearchParams();
    
    if (query?.dateRange) {
      params.append('dateRange', JSON.stringify({
        start: query.dateRange.start.toISOString(),
        end: query.dateRange.end.toISOString()
      }));
    }
    
    if (query?.includeStageBreakdown) {
      params.append('includeStageBreakdown', query.includeStageBreakdown.toString());
    }
    
    if (query?.includeTrendAnalysis) {
      params.append('includeTrendAnalysis', query.includeTrendAnalysis.toString());
    }

    const response = await client.get(`/analytics/templates/${funnelId}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get trend analysis for multiple instances
   */
  async getInstanceTrends(
    instanceIds: string[],
    query?: AnalyticsQuery & {
      trendPeriod?: 'week' | 'month' | 'quarter' | 'year';
      includePatternAnalysis?: boolean;
    }
  ): Promise<InstanceTrendData[]> {
    const payload = {
      instanceIds,
      ...query,
      dateRange: query?.dateRange ? {
        start: query.dateRange.start.toISOString(),
        end: query.dateRange.end.toISOString()
      } : undefined
    };

    const response = await client.post('/analytics/trends', payload);
    return response.data;
  }

  /**
   * Get organization usage statistics
   */
  async getUsageStatistics(): Promise<UsageStatistics> {
    const response = await client.get('/analytics/usage/organization');
    return response.data;
  }

  /**
   * Get performance benchmarks
   */
  async getBenchmarks(filters?: {
    industry?: string;
    metric?: string;
    percentile?: number;
  }): Promise<PerformanceBenchmark[]> {
    const params = new URLSearchParams();
    
    if (filters?.industry) {
      params.append('industry', filters.industry);
    }
    
    if (filters?.metric) {
      params.append('metric', filters.metric);
    }
    
    if (filters?.percentile) {
      params.append('percentile', filters.percentile.toString());
    }

    const response = await client.get(`/analytics/benchmarks?${params.toString()}`);
    return response.data;
  }

  /**
   * Export analytics data
   */
  async exportData(
    type: 'instance' | 'comparison' | 'template' | 'trends',
    data: any,
    format: 'csv' | 'xlsx' | 'pdf' | 'json' = 'csv'
  ): Promise<{ downloadUrl: string; filename: string }> {
    const response = await client.post('/analytics/export', {
      type,
      data,
      format,
      includeCharts: format === 'pdf'
    });
    
    return response.data;
  }
}

export const analyticsAPI = new AnalyticsAPI();