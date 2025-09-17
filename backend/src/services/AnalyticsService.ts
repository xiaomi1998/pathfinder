import { PrismaClient } from '@prisma/client';
import { 
  InstanceAnalytics, 
  InstanceComparison, 
  TemplateAnalytics, 
  InstanceTrendData,
  AnalyticsQuery,
  UsageEvent,
  PerformanceBenchmark
} from '@/types/analytics';

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Get comprehensive analytics for a specific funnel instance
   */
  async getInstanceAnalytics(
    instanceId: string, 
    userId: string, 
    query: AnalyticsQuery = {}
  ): Promise<InstanceAnalytics> {
    // Verify user has access to this funnel
    const funnel = await this.prisma.funnel.findFirst({
      where: {
        id: instanceId,
        userId: userId
      },
      include: {
        nodes: {
          include: {
            nodeData: {
              where: query.dateRange ? {
                weekStartDate: {
                  gte: query.dateRange.start,
                  lte: query.dateRange.end
                }
              } : undefined,
              orderBy: { weekStartDate: 'desc' }
            },
            nodeMetrics: {
              where: query.dateRange ? {
                periodStartDate: {
                  gte: query.dateRange.start,
                  lte: query.dateRange.end
                }
              } : undefined,
              orderBy: { createdAt: 'desc' }  // 按录入时间排序
            }
          }
        },
        funnelMetrics: {
          where: query.dateRange ? {
            periodStartDate: {
              gte: query.dateRange.start,
              lte: query.dateRange.end
            }
          } : undefined,
          orderBy: { createdAt: 'desc' }  // 按录入时间排序
        }
      }
    });

    if (!funnel) {
      throw new Error('Funnel not found or access denied');
    }

    // Calculate performance metrics
    const latestMetrics = funnel.funnelMetrics[0];
    const totalEntries = latestMetrics?.totalEntries || 0;
    const totalConversions = latestMetrics?.totalConversions || 0;
    const overallConversionRate = totalEntries > 0 ? (totalConversions / totalEntries) * 100 : 0;

    // Calculate completion rate (percentage of nodes with data)
    const nodesWithData = funnel.nodes.filter(node => node.nodeData.length > 0);
    const completionRate = funnel.nodes.length > 0 ? (nodesWithData.length / funnel.nodes.length) * 100 : 0;

    // Calculate average time to complete
    const avgTimeToComplete = await this.calculateAverageCompletionTime(instanceId);

    // Build stage analytics
    const stageAnalytics = funnel.nodes.map(node => {
      const latestNodeData = node.nodeData[0];
      const latestNodeMetrics = node.nodeMetrics[0];
      
      return {
        nodeId: node.id,
        nodeName: node.label,
        nodeType: node.nodeType,
        entryCount: latestNodeData?.entryCount || latestNodeMetrics?.entryCount || 0,
        convertedCount: latestNodeData?.convertedCount || latestNodeMetrics?.convertedCount || 0,
        conversionRate: latestNodeData?.conversionRate ? parseFloat(latestNodeData.conversionRate.toString()) : 0,
        avgTimeSpent: latestNodeData?.avgTimeSpent || latestNodeMetrics?.avgTimeSpent || 0,
        bounceCount: latestNodeData?.bounceCount || latestNodeMetrics?.bounceCount || 0,
        revenue: latestNodeData?.revenue ? parseFloat(latestNodeData.revenue.toString()) : undefined,
        cost: latestNodeData?.cost ? parseFloat(latestNodeData.cost.toString()) : undefined
      };
    });

    // Build historical data
    const historical = query.includeHistorical ? await this.buildHistoricalData(instanceId, query) : [];

    // Calculate data quality metrics
    const quality = await this.calculateDataQuality(instanceId);

    return {
      id: funnel.id,
      funnelId: funnel.id,
      funnelName: funnel.name,
      instanceName: funnel.name,
      status: funnel.status,
      performance: {
        completionRate,
        avgTimeToComplete,
        totalEntries,
        totalConversions,
        overallConversionRate,
        lastDataUpdate: latestMetrics?.updatedAt || null
      },
      stageAnalytics,
      historical,
      quality,
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt
    };
  }

  /**
   * Compare multiple funnel instances
   */
  async compareInstances(
    instanceIds: string[], 
    userId: string, 
    query: AnalyticsQuery = {}
  ): Promise<InstanceComparison> {
    // Get analytics for each instance
    const instanceAnalytics = await Promise.all(
      instanceIds.map(id => this.getInstanceAnalytics(id, userId, query))
    );

    // Build comparison data
    const instances = instanceAnalytics.map(analytics => ({
      id: analytics.id,
      name: analytics.instanceName || analytics.funnelName,
      completionRate: analytics.performance.completionRate,
      avgTimeToComplete: analytics.performance.avgTimeToComplete,
      overallConversionRate: analytics.performance.overallConversionRate,
      totalRevenue: analytics.stageAnalytics.reduce((sum, stage) => 
        sum + (stage.revenue || 0), 0),
      lastUpdated: analytics.updatedAt
    }));

    // Calculate comparative metrics
    const completionRates = instances.map(i => i.completionRate);
    const conversionRates = instances.map(i => i.overallConversionRate);
    const timesToComplete = instances.map(i => i.avgTimeToComplete);

    const best = {
      instanceId: instances[conversionRates.indexOf(Math.max(...conversionRates))].id,
      metric: 'conversionRate',
      value: Math.max(...conversionRates)
    };

    const worst = {
      instanceId: instances[conversionRates.indexOf(Math.min(...conversionRates))].id,
      metric: 'conversionRate',
      value: Math.min(...conversionRates)
    };

    const average = {
      completionRate: completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length,
      avgTimeToComplete: timesToComplete.reduce((sum, time) => sum + time, 0) / timesToComplete.length,
      overallConversionRate: conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length
    };

    // Calculate trends
    const trends = await Promise.all(
      instanceIds.map(async (id) => {
        const trend = await this.calculateInstanceTrend(id, userId);
        return {
          instanceId: id,
          trend: trend.direction,
          changePercent: trend.changePercent,
          timeframe: 'month' as const
        };
      })
    );

    return {
      instances,
      comparison: { best, worst, average },
      trends
    };
  }

  /**
   * Get template-level analytics across all instances
   */
  async getTemplateAnalytics(
    funnelId: string, 
    userId: string, 
    query: AnalyticsQuery = {}
  ): Promise<TemplateAnalytics> {
    // Note: In this schema, we treat each funnel as a template
    // In a real implementation, you might want to add template relationships
    
    const funnel = await this.prisma.funnel.findFirst({
      where: {
        id: funnelId,
        userId: userId
      },
      include: {
        nodes: {
          include: {
            nodeData: true,
            nodeMetrics: true
          }
        },
        funnelMetrics: {
          orderBy: { createdAt: 'desc' }  // 按录入时间排序
        }
      }
    });

    if (!funnel) {
      throw new Error('Funnel not found or access denied');
    }

    // For now, treat this as a single instance analysis
    // In a real template system, you'd query all instances of this template
    const instanceAnalytics = await this.getInstanceAnalytics(funnelId, userId, query);

    // Calculate stage effectiveness
    const stageEffectiveness = funnel.nodes.map(node => {
      const nodeData = node.nodeData;
      const avgConversionRate = nodeData.length > 0 
        ? nodeData.reduce((sum, data) => 
            sum + (data.conversionRate ? parseFloat(data.conversionRate.toString()) : 0), 0) / nodeData.length
        : 0;

      return {
        nodeId: node.id,
        nodeName: node.label,
        nodeType: node.nodeType,
        avgConversionRate,
        varianceAcrossInstances: 0, // Would calculate across multiple instances
        bestPractices: [] // Would be generated based on high-performing instances
      };
    });

    // Build timeline data
    const timeline = funnel.funnelMetrics.map(metric => ({
      period: metric.periodStartDate,
      newInstances: 1, // Placeholder
      completedInstances: metric.totalConversions > 0 ? 1 : 0,
      avgPerformance: metric.overallConversionRate ? 
        parseFloat(metric.overallConversionRate.toString()) : 0
    }));

    return {
      funnelId: funnel.id,
      funnelName: funnel.name,
      usage: {
        totalInstances: 1, // Placeholder - would count all instances
        activeInstances: funnel.status === 'active' ? 1 : 0,
        archivedInstances: funnel.status === 'archived' ? 1 : 0,
        avgInstancesPerUser: 1,
        usageGrowthRate: 0
      },
      performance: {
        avgCompletionRate: instanceAnalytics.performance.completionRate,
        avgConversionRate: instanceAnalytics.performance.overallConversionRate,
        avgTimeToComplete: instanceAnalytics.performance.avgTimeToComplete,
        bestPerformingInstance: {
          id: funnel.id,
          name: funnel.name,
          conversionRate: instanceAnalytics.performance.overallConversionRate
        },
        worstPerformingInstance: {
          id: funnel.id,
          name: funnel.name,
          conversionRate: instanceAnalytics.performance.overallConversionRate
        }
      },
      success: {
        successRate: instanceAnalytics.performance.overallConversionRate > 10 ? 100 : 0,
        benchmarkConversionRate: 10, // Industry benchmark
        highPerformers: instanceAnalytics.performance.overallConversionRate > 15 ? 1 : 0,
        underPerformers: instanceAnalytics.performance.overallConversionRate < 5 ? 1 : 0
      },
      stageEffectiveness,
      timeline
    };
  }

  /**
   * Get trend data for multiple instances
   */
  async getInstanceTrends(
    instanceIds: string[], 
    userId: string, 
    query: AnalyticsQuery = {}
  ): Promise<InstanceTrendData[]> {
    return Promise.all(
      instanceIds.map(async (instanceId) => {
        const timeSeriesData = await this.buildTimeSeriesData(instanceId, userId, query);
        const trends = await this.calculateTrends(timeSeriesData);
        const patterns = await this.detectPatterns(timeSeriesData);

        return {
          instanceId,
          timeSeriesData,
          trends,
          patterns
        };
      })
    );
  }

  /**
   * Track usage events for analytics
   */
  async trackUsageEvent(event: UsageEvent): Promise<void> {
    // This would typically go to a separate analytics table
    // For now, we'll log it or store in a simple way
    console.log('Usage event tracked:', event);
  }

  /**
   * Private helper methods
   */
  private async calculateAverageCompletionTime(instanceId: string): Promise<number> {
    // Calculate average time between funnel creation and last data update
    // This is a simplified version - you'd want more sophisticated tracking
    const funnel = await this.prisma.funnel.findUnique({
      where: { id: instanceId },
      include: {
        nodes: {
          include: {
            nodeData: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!funnel || !funnel.nodes.length) return 0;

    const lastDataUpdate = funnel.nodes
      .map(node => node.nodeData[0]?.createdAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];

    if (!lastDataUpdate) return 0;

    const timeDiff = lastDataUpdate.getTime() - funnel.createdAt.getTime();
    return Math.round(timeDiff / (1000 * 60)); // Convert to minutes
  }

  private async calculateDataQuality(instanceId: string): Promise<{ dataCompleteness: number; dataAccuracy: number; lastUpdated: Date }> {
    const funnel = await this.prisma.funnel.findUnique({
      where: { id: instanceId },
      include: {
        nodes: {
          include: {
            nodeData: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!funnel) {
      return { dataCompleteness: 0, dataAccuracy: 0, lastUpdated: new Date() };
    }

    // Calculate data completeness
    const nodesWithData = funnel.nodes.filter(node => 
      node.nodeData.length > 0 && node.nodeData[0].entryCount > 0
    );
    const dataCompleteness = funnel.nodes.length > 0 ? 
      (nodesWithData.length / funnel.nodes.length) * 100 : 0;

    // Calculate data accuracy (simplified - would include validation rules)
    const dataAccuracy = 95; // Placeholder

    const lastUpdated = funnel.nodes
      .map(node => node.nodeData[0]?.updatedAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] || funnel.updatedAt;

    return {
      dataCompleteness,
      dataAccuracy,
      lastUpdated
    };
  }

  private async buildHistoricalData(instanceId: string, query: AnalyticsQuery): Promise<any[]> {
    const funnelMetrics = await this.prisma.funnelMetrics.findMany({
      where: {
        funnelId: instanceId,
        ...(query.dateRange && {
          periodStartDate: {
            gte: query.dateRange.start,
            lte: query.dateRange.end
          }
        })
      },
      orderBy: { createdAt: 'asc' }  // 按录入时间排序
    });

    return funnelMetrics.map(metric => ({
      date: metric.periodStartDate,
      entries: metric.totalEntries,
      conversions: metric.totalConversions,
      conversionRate: metric.overallConversionRate ? 
        parseFloat(metric.overallConversionRate.toString()) : 0,
      revenue: metric.totalRevenue ? 
        parseFloat(metric.totalRevenue.toString()) : undefined
    }));
  }

  private async calculateInstanceTrend(instanceId: string, userId: string): Promise<{
    direction: 'improving' | 'declining' | 'stable';
    changePercent: number;
  }> {
    // Get last two months of data for trend calculation
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 2);

    const metrics = await this.prisma.funnelMetrics.findMany({
      where: {
        funnelId: instanceId,
        periodStartDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }  // 按录入时间排序
    });

    if (metrics.length < 2) {
      return { direction: 'stable', changePercent: 0 };
    }

    const firstMetric = metrics[0];
    const lastMetric = metrics[metrics.length - 1];
    
    const firstRate = firstMetric.overallConversionRate ? 
      parseFloat(firstMetric.overallConversionRate.toString()) : 0;
    const lastRate = lastMetric.overallConversionRate ? 
      parseFloat(lastMetric.overallConversionRate.toString()) : 0;

    const changePercent = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;
    
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      direction = changePercent > 0 ? 'improving' : 'declining';
    }

    return { direction, changePercent };
  }

  private async buildTimeSeriesData(instanceId: string, userId: string, query: AnalyticsQuery): Promise<any[]> {
    const nodeData = await this.prisma.nodeData.findMany({
      where: {
        node: {
          funnelId: instanceId,
          funnel: {
            userId: userId
          }
        },
        ...(query.dateRange && {
          weekStartDate: {
            gte: query.dateRange.start,
            lte: query.dateRange.end
          }
        })
      },
      orderBy: { weekStartDate: 'asc' }
    });

    // Aggregate data by date
    const dataByDate = new Map();
    nodeData.forEach(data => {
      const dateKey = data.weekStartDate.toISOString().split('T')[0];
      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, {
          date: data.weekStartDate,
          entries: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
          dataPoints: 0
        });
      }
      
      const existing = dataByDate.get(dateKey);
      existing.entries += data.entryCount;
      existing.conversions += data.convertedCount;
      existing.revenue += data.revenue ? parseFloat(data.revenue.toString()) : 0;
      existing.cost += data.cost ? parseFloat(data.cost.toString()) : 0;
      existing.dataPoints += 1;
    });

    return Array.from(dataByDate.values()).map(data => ({
      ...data,
      conversionRate: data.entries > 0 ? (data.conversions / data.entries) * 100 : 0,
      dataQuality: data.dataPoints > 0 ? Math.min(100, data.dataPoints * 20) : 0
    }));
  }

  private async calculateTrends(timeSeriesData: any[]): Promise<any> {
    if (timeSeriesData.length < 2) {
      return {
        conversionRate: { direction: 'stable', changePercent: 0, significance: 'low' },
        volume: { direction: 'stable', changePercent: 0, significance: 'low' },
        quality: { direction: 'stable', changePercent: 0, significance: 'low' }
      };
    }

    const first = timeSeriesData[0];
    const last = timeSeriesData[timeSeriesData.length - 1];

    const calculateTrend = (startValue: number, endValue: number) => {
      const changePercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
      const direction = Math.abs(changePercent) > 5 ? 
        (changePercent > 0 ? 'up' : 'down') : 'stable';
      const significance = Math.abs(changePercent) > 15 ? 'high' : 
        Math.abs(changePercent) > 5 ? 'medium' : 'low';
      
      return { direction, changePercent, significance };
    };

    return {
      conversionRate: calculateTrend(first.conversionRate, last.conversionRate),
      volume: calculateTrend(first.entries, last.entries),
      quality: calculateTrend(first.dataQuality, last.dataQuality)
    };
  }

  private async detectPatterns(timeSeriesData: any[]): Promise<any> {
    // Simplified pattern detection
    return {
      seasonality: 'none' as const,
      cyclical: false,
      outliers: []
    };
  }
}