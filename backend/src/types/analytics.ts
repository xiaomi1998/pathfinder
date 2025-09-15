// Analytics types for funnel instance analysis and comparison

export interface InstanceAnalytics {
  id: string;
  funnelId: string;
  funnelName: string;
  instanceName?: string;
  status: 'active' | 'archived' | 'template';
  
  // Performance metrics
  performance: {
    completionRate: number;
    avgTimeToComplete: number; // in minutes
    totalEntries: number;
    totalConversions: number;
    overallConversionRate: number;
    lastDataUpdate: Date | null;
  };
  
  // Stage-by-stage breakdown
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
  
  // Historical data
  historical: {
    date: Date;
    entries: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
  }[];
  
  // Quality metrics
  quality: {
    dataCompleteness: number; // percentage of required fields filled
    dataAccuracy: number; // calculated based on validation rules
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
  
  // Comparative metrics
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
  
  // Trend analysis
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
  
  // Usage statistics
  usage: {
    totalInstances: number;
    activeInstances: number;
    archivedInstances: number;
    avgInstancesPerUser: number;
    usageGrowthRate: number; // month over month
  };
  
  // Performance overview
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
  
  // Success metrics
  success: {
    successRate: number; // percentage of instances above benchmark
    benchmarkConversionRate: number;
    highPerformers: number;
    underPerformers: number;
  };
  
  // Stage effectiveness
  stageEffectiveness: {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    avgConversionRate: number;
    varianceAcrossInstances: number;
    bestPractices: string[];
  }[];
  
  // Time-based analysis
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
  
  // Trend indicators
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
  
  // Seasonality and patterns
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

// Request/Response types
export interface AnalyticsQuery {
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeHistorical?: boolean;
  granularity?: 'daily' | 'weekly' | 'monthly';
  metrics?: string[];
}

export interface InstanceAnalyticsRequest extends AnalyticsQuery {
  instanceId: string;
}

export interface InstanceComparisonRequest extends AnalyticsQuery {
  instanceIds: string[];
  comparisonMetrics?: ('completionRate' | 'conversionRate' | 'timeToComplete' | 'revenue')[];
}

export interface TemplateAnalyticsRequest extends AnalyticsQuery {
  funnelId?: string;
  templateId?: string;
  includeStageBreakdown?: boolean;
  includeTrendAnalysis?: boolean;
}

export interface TrendAnalysisRequest extends AnalyticsQuery {
  instanceIds: string[];
  trendPeriod?: 'week' | 'month' | 'quarter' | 'year';
  includePatternAnalysis?: boolean;
}

// Usage tracking types
export interface UsageEvent {
  instanceId: string;
  eventType: 'created' | 'updated' | 'completed' | 'archived';
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}

export interface PerformanceBenchmark {
  industry?: string;
  companySize?: string;
  metric: string;
  percentile: number;
  value: number;
  sampleSize: number;
}

// Export capabilities
export interface AnalyticsExportRequest {
  type: 'instance' | 'comparison' | 'template' | 'trends';
  data: any;
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  includeCharts?: boolean;
}

export interface AnalyticsExportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}