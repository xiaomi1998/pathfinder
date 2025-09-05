/**
 * 性能基准数据库和历史对比系统
 * Agent 9: 持久化基准数据、历史趋势分析和性能回归检测
 */

// 基准数据记录
export interface BenchmarkRecord {
  id: string;
  timestamp: number;
  version: string;
  commit?: string;
  environment: BenchmarkEnvironment;
  results: BenchmarkTestResults;
  metadata: BenchmarkMetadata;
}

// 测试环境信息
export interface BenchmarkEnvironment {
  browser: string;
  browserVersion: string;
  os: string;
  device: string;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  memory: {
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  cpu: {
    cores: number;
    architecture: string;
  };
  network?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

// 基准测试结果
export interface BenchmarkTestResults {
  overall_score: number;
  categories: {
    drag_performance: CategoryResults;
    rendering: CategoryResults;
    memory: CategoryResults;
    interaction: CategoryResults;
    stability: CategoryResults;
  };
  individual_tests: Map<string, TestResult>;
}

// 分类结果
export interface CategoryResults {
  score: number;
  percentile: number;
  tests: TestResult[];
}

// 单个测试结果
export interface TestResult {
  name: string;
  value: number;
  unit: string;
  baseline: number;
  improvement: number; // 相对于基线的改进百分比
  status: 'better' | 'same' | 'worse';
  confidence: number;
}

// 基准元数据
export interface BenchmarkMetadata {
  build_number?: string;
  branch: string;
  test_duration: number;
  node_count: number;
  scenario: string;
  notes?: string;
  tags: string[];
}

// 历史趋势分析结果
export interface TrendAnalysis {
  metric: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  trend: 'improving' | 'stable' | 'declining';
  change_rate: number; // 变化率（每天）
  significance: number; // 0-1，变化的显著性
  data_points: Array<{
    timestamp: number;
    value: number;
  }>;
  forecast?: {
    next_value: number;
    confidence_interval: [number, number];
  };
}

// 性能回归检测结果
export interface RegressionDetection {
  detected: boolean;
  severity: 'minor' | 'major' | 'critical';
  affected_metrics: string[];
  performance_drop: number; // 百分比
  confidence: number;
  comparison: {
    baseline: BenchmarkRecord;
    current: BenchmarkRecord;
    differences: MetricDifference[];
  };
  root_cause_suggestions: string[];
}

// 指标差异
export interface MetricDifference {
  metric: string;
  baseline_value: number;
  current_value: number;
  change_percent: number;
  significance: 'low' | 'medium' | 'high';
}

// 基准配置
export interface BenchmarkDatabaseConfig {
  storage_type: 'localStorage' | 'indexedDB' | 'memory';
  max_records: number;
  retention_days: number;
  compression_enabled: boolean;
  auto_cleanup: boolean;
}

/**
 * 性能基准数据库系统
 */
export class BenchmarkDatabaseSystem {
  private config: BenchmarkDatabaseConfig;
  private records: Map<string, BenchmarkRecord> = new Map();
  private storage: BenchmarkStorage;
  private trendAnalyzer: TrendAnalyzer;
  private regressionDetector: RegressionDetector;

  constructor(config?: Partial<BenchmarkDatabaseConfig>) {
    this.config = {
      storage_type: 'localStorage',
      max_records: 1000,
      retention_days: 90,
      compression_enabled: true,
      auto_cleanup: true,
      ...config
    };

    this.storage = this.createStorage();
    this.trendAnalyzer = new TrendAnalyzer();
    this.regressionDetector = new RegressionDetector();
    
    this.initialize();
  }

  /**
   * 初始化数据库
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadRecords();
      
      if (this.config.auto_cleanup) {
        this.performAutoCleanup();
      }
      
      console.log(`Benchmark database initialized with ${this.records.size} records`);
    } catch (error) {
      console.error('Failed to initialize benchmark database:', error);
    }
  }

  /**
   * 存储基准测试结果
   */
  async storeBenchmarkResult(
    version: string,
    results: BenchmarkTestResults,
    metadata: Partial<BenchmarkMetadata> = {}
  ): Promise<string> {
    const id = this.generateRecordId();
    const environment = await this.collectEnvironmentInfo();
    
    const record: BenchmarkRecord = {
      id,
      timestamp: Date.now(),
      version,
      environment,
      results,
      metadata: {
        branch: 'main',
        test_duration: 0,
        node_count: 1000,
        scenario: 'standard',
        tags: [],
        ...metadata
      }
    };

    this.records.set(id, record);
    await this.storage.save(id, record);
    
    // 检查是否需要清理旧记录
    if (this.records.size > this.config.max_records) {
      await this.cleanupOldRecords();
    }

    console.log(`Benchmark record stored: ${id}`);
    return id;
  }

  /**
   * 获取基准记录
   */
  getBenchmarkRecord(id: string): BenchmarkRecord | null {
    return this.records.get(id) || null;
  }

  /**
   * 查询基准记录
   */
  queryBenchmarkRecords(criteria: {
    version?: string;
    branch?: string;
    timeframe?: [number, number];
    environment?: Partial<BenchmarkEnvironment>;
    tags?: string[];
    limit?: number;
  }): BenchmarkRecord[] {
    let filtered = Array.from(this.records.values());

    // 按版本过滤
    if (criteria.version) {
      filtered = filtered.filter(r => r.version === criteria.version);
    }

    // 按分支过滤
    if (criteria.branch) {
      filtered = filtered.filter(r => r.metadata.branch === criteria.branch);
    }

    // 按时间范围过滤
    if (criteria.timeframe) {
      const [start, end] = criteria.timeframe;
      filtered = filtered.filter(r => r.timestamp >= start && r.timestamp <= end);
    }

    // 按环境过滤
    if (criteria.environment) {
      filtered = filtered.filter(r => this.matchesEnvironment(r.environment, criteria.environment!));
    }

    // 按标签过滤
    if (criteria.tags && criteria.tags.length > 0) {
      filtered = filtered.filter(r => 
        criteria.tags!.some(tag => r.metadata.tags.includes(tag))
      );
    }

    // 按时间排序（最新的在前）
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // 限制结果数量
    if (criteria.limit) {
      filtered = filtered.slice(0, criteria.limit);
    }

    return filtered;
  }

  /**
   * 分析性能趋势
   */
  analyzeTrends(
    metric: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): TrendAnalysis {
    const endTime = Date.now();
    const timeframes = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    
    const startTime = endTime - timeframes[timeframe];
    
    const records = this.queryBenchmarkRecords({
      timeframe: [startTime, endTime]
    });

    return this.trendAnalyzer.analyzeTrend(metric, records, timeframe);
  }

  /**
   * 检测性能回归
   */
  detectRegression(
    currentRecord: BenchmarkRecord,
    baselineVersion?: string
  ): RegressionDetection {
    let baseline: BenchmarkRecord | null = null;

    if (baselineVersion) {
      // 使用指定版本作为基线
      const baselineRecords = this.queryBenchmarkRecords({
        version: baselineVersion,
        limit: 1
      });
      baseline = baselineRecords[0] || null;
    } else {
      // 使用最近的稳定版本作为基线
      baseline = this.findStableBaseline(currentRecord);
    }

    if (!baseline) {
      return {
        detected: false,
        severity: 'minor',
        affected_metrics: [],
        performance_drop: 0,
        confidence: 0,
        comparison: {
          baseline: currentRecord,
          current: currentRecord,
          differences: []
        },
        root_cause_suggestions: ['无法找到合适的基线进行对比']
      };
    }

    return this.regressionDetector.detectRegression(baseline, currentRecord);
  }

  /**
   * 获取性能历史报告
   */
  generateHistoryReport(
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): string {
    const endTime = Date.now();
    const timeframes = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    
    const startTime = endTime - timeframes[timeframe];
    const records = this.queryBenchmarkRecords({
      timeframe: [startTime, endTime]
    });

    if (records.length === 0) {
      return '指定时间范围内无性能数据';
    }

    let report = `性能历史报告 (${timeframe})\n`;
    report += '='.repeat(30) + '\n\n';
    
    report += `时间范围: ${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()}\n`;
    report += `数据点数量: ${records.length}\n\n`;

    // 分析主要指标的趋势
    const keyMetrics = ['overall_score', 'drag_performance', 'rendering', 'memory', 'stability'];
    
    report += '趋势分析:\n';
    keyMetrics.forEach(metric => {
      const trend = this.analyzeTrends(metric, timeframe);
      const trendIcon = trend.trend === 'improving' ? '📈' : 
                       trend.trend === 'declining' ? '📉' : '➡️';
      
      report += `${trendIcon} ${metric}: ${trend.trend} (${trend.change_rate > 0 ? '+' : ''}${(trend.change_rate * 100).toFixed(2)}%/天)\n`;
    });
    
    report += '\n';

    // 最近的性能记录
    if (records.length > 0) {
      const latest = records[0];
      report += '最新性能数据:\n';
      report += `版本: ${latest.version}\n`;
      report += `时间: ${new Date(latest.timestamp).toLocaleString()}\n`;
      report += `总分: ${latest.results.overall_score.toFixed(1)}/100\n`;
      report += `拖拽性能: ${latest.results.categories.drag_performance.score.toFixed(1)}\n`;
      report += `渲染性能: ${latest.results.categories.rendering.score.toFixed(1)}\n`;
      report += `内存效率: ${latest.results.categories.memory.score.toFixed(1)}\n`;
      report += `系统稳定性: ${latest.results.categories.stability.score.toFixed(1)}\n\n`;
    }

    // 性能回归检测
    if (records.length >= 2) {
      const regression = this.detectRegression(records[0]);
      if (regression.detected) {
        report += `⚠️  检测到性能回归!\n`;
        report += `严重程度: ${regression.severity}\n`;
        report += `性能下降: ${regression.performance_drop.toFixed(1)}%\n`;
        report += `影响指标: ${regression.affected_metrics.join(', ')}\n\n`;
      } else {
        report += '✅ 未检测到显著的性能回归\n\n';
      }
    }

    return report;
  }

  /**
   * 导出基准数据
   */
  exportBenchmarkData(format: 'json' | 'csv' = 'json'): string {
    const records = Array.from(this.records.values());
    
    if (format === 'csv') {
      return this.exportAsCSV(records);
    } else {
      return JSON.stringify({
        exported_at: Date.now(),
        total_records: records.length,
        config: this.config,
        records
      }, null, 2);
    }
  }

  /**
   * 导入基准数据
   */
  async importBenchmarkData(data: string, format: 'json' | 'csv' = 'json'): Promise<number> {
    let records: BenchmarkRecord[] = [];
    
    if (format === 'csv') {
      records = this.importFromCSV(data);
    } else {
      try {
        const parsed = JSON.parse(data);
        records = parsed.records || [];
      } catch (error) {
        throw new Error(`Invalid JSON data: ${error}`);
      }
    }

    let importedCount = 0;
    for (const record of records) {
      if (this.validateRecord(record)) {
        this.records.set(record.id, record);
        await this.storage.save(record.id, record);
        importedCount++;
      }
    }

    console.log(`Imported ${importedCount} benchmark records`);
    return importedCount;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    total_records: number;
    date_range: [number, number] | null;
    versions: string[];
    branches: string[];
    average_score: number;
    storage_usage: string;
  } {
    const records = Array.from(this.records.values());
    
    if (records.length === 0) {
      return {
        total_records: 0,
        date_range: null,
        versions: [],
        branches: [],
        average_score: 0,
        storage_usage: '0 bytes'
      };
    }

    const timestamps = records.map(r => r.timestamp);
    const versions = [...new Set(records.map(r => r.version))];
    const branches = [...new Set(records.map(r => r.metadata.branch))];
    const averageScore = records.reduce((sum, r) => sum + r.results.overall_score, 0) / records.length;
    
    return {
      total_records: records.length,
      date_range: [Math.min(...timestamps), Math.max(...timestamps)],
      versions: versions.sort(),
      branches: branches.sort(),
      average_score: averageScore,
      storage_usage: this.calculateStorageUsage()
    };
  }

  // 私有辅助方法

  private createStorage(): BenchmarkStorage {
    switch (this.config.storage_type) {
      case 'indexedDB':
        return new IndexedDBStorage();
      case 'localStorage':
        return new LocalStorage();
      default:
        return new MemoryStorage();
    }
  }

  private async loadRecords(): Promise<void> {
    const records = await this.storage.loadAll();
    records.forEach(record => {
      this.records.set(record.id, record);
    });
  }

  private generateRecordId(): string {
    return `benchmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async collectEnvironmentInfo(): Promise<BenchmarkEnvironment> {
    const nav = navigator as any;
    
    const environment: BenchmarkEnvironment = {
      browser: this.getBrowserName(),
      browserVersion: this.getBrowserVersion(),
      os: nav.platform || 'Unknown',
      device: this.getDeviceInfo(),
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1
      },
      memory: {
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      },
      cpu: {
        cores: nav.hardwareConcurrency || 1,
        architecture: nav.platform || 'Unknown'
      }
    };

    // 添加内存信息（如果可用）
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      environment.memory = {
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit
      };
    }

    // 添加网络信息（如果可用）
    if ('connection' in nav) {
      const connection = nav.connection;
      environment.network = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      };
    }

    return environment;
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private getDeviceInfo(): string {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const isTablet = /Tablet|iPad/i.test(navigator.userAgent);
    
    if (isMobile) return 'Mobile';
    if (isTablet) return 'Tablet';
    return 'Desktop';
  }

  private matchesEnvironment(env: BenchmarkEnvironment, criteria: Partial<BenchmarkEnvironment>): boolean {
    if (criteria.browser && env.browser !== criteria.browser) return false;
    if (criteria.os && env.os !== criteria.os) return false;
    if (criteria.device && env.device !== criteria.device) return false;
    return true;
  }

  private findStableBaseline(currentRecord: BenchmarkRecord): BenchmarkRecord | null {
    const candidates = this.queryBenchmarkRecords({
      branch: currentRecord.metadata.branch,
      limit: 10
    }).filter(r => r.id !== currentRecord.id);

    // 找到最近的稳定版本（版本号不包含 alpha、beta、rc 等）
    const stableRecord = candidates.find(r => 
      !/alpha|beta|rc|dev|snapshot/i.test(r.version)
    );

    return stableRecord || (candidates.length > 0 ? candidates[0] : null);
  }

  private performAutoCleanup(): void {
    const cutoffTime = Date.now() - (this.config.retention_days * 24 * 60 * 60 * 1000);
    const recordsToDelete: string[] = [];

    for (const [id, record] of this.records) {
      if (record.timestamp < cutoffTime) {
        recordsToDelete.push(id);
      }
    }

    recordsToDelete.forEach(id => {
      this.records.delete(id);
      this.storage.delete(id);
    });

    if (recordsToDelete.length > 0) {
      console.log(`Auto-cleanup removed ${recordsToDelete.length} old benchmark records`);
    }
  }

  private async cleanupOldRecords(): Promise<void> {
    const records = Array.from(this.records.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const excessCount = records.length - this.config.max_records + 100; // 留点余量
    
    for (let i = 0; i < excessCount; i++) {
      const [id] = records[i];
      this.records.delete(id);
      await this.storage.delete(id);
    }

    console.log(`Cleaned up ${excessCount} old benchmark records`);
  }

  private validateRecord(record: any): record is BenchmarkRecord {
    return record &&
           typeof record.id === 'string' &&
           typeof record.timestamp === 'number' &&
           typeof record.version === 'string' &&
           record.environment &&
           record.results &&
           record.metadata;
  }

  private exportAsCSV(records: BenchmarkRecord[]): string {
    const headers = [
      'id', 'timestamp', 'version', 'branch', 'overall_score',
      'drag_performance', 'rendering', 'memory', 'interaction', 'stability',
      'browser', 'os', 'device'
    ];

    const rows = records.map(record => [
      record.id,
      record.timestamp,
      record.version,
      record.metadata.branch,
      record.results.overall_score,
      record.results.categories.drag_performance.score,
      record.results.categories.rendering.score,
      record.results.categories.memory.score,
      record.results.categories.interaction.score,
      record.results.categories.stability.score,
      record.environment.browser,
      record.environment.os,
      record.environment.device
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private importFromCSV(csvData: string): BenchmarkRecord[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const records: BenchmarkRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;

      try {
        // 这里只是一个简化的CSV导入实现
        // 实际应用中需要更完整的数据重构
        const record: Partial<BenchmarkRecord> = {
          id: values[0],
          timestamp: parseInt(values[1]),
          version: values[2]
          // ... 其他字段的解析
        };

        // 验证和补全记录
        if (this.validateRecord(record)) {
          records.push(record as BenchmarkRecord);
        }
      } catch (error) {
        console.warn(`Failed to parse CSV line ${i}: ${error}`);
      }
    }

    return records;
  }

  private calculateStorageUsage(): string {
    const dataSize = JSON.stringify(Array.from(this.records.values())).length;
    const units = ['bytes', 'KB', 'MB', 'GB'];
    let size = dataSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

/**
 * 趋势分析器
 */
class TrendAnalyzer {
  analyzeTrend(metric: string, records: BenchmarkRecord[], timeframe: string): TrendAnalysis {
    const dataPoints = this.extractMetricValues(metric, records);
    
    if (dataPoints.length < 3) {
      return {
        metric,
        timeframe: timeframe as any,
        trend: 'stable',
        change_rate: 0,
        significance: 0,
        data_points: dataPoints
      };
    }

    const trend = this.calculateTrend(dataPoints);
    const forecast = this.generateForecast(dataPoints);

    return {
      metric,
      timeframe: timeframe as any,
      trend: trend.direction,
      change_rate: trend.rate,
      significance: trend.significance,
      data_points: dataPoints,
      forecast
    };
  }

  private extractMetricValues(metric: string, records: BenchmarkRecord[]): Array<{timestamp: number, value: number}> {
    return records.map(record => ({
      timestamp: record.timestamp,
      value: this.getMetricValue(metric, record)
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  private getMetricValue(metric: string, record: BenchmarkRecord): number {
    switch (metric) {
      case 'overall_score':
        return record.results.overall_score;
      case 'drag_performance':
        return record.results.categories.drag_performance.score;
      case 'rendering':
        return record.results.categories.rendering.score;
      case 'memory':
        return record.results.categories.memory.score;
      case 'interaction':
        return record.results.categories.interaction.score;
      case 'stability':
        return record.results.categories.stability.score;
      default:
        return 0;
    }
  }

  private calculateTrend(dataPoints: Array<{timestamp: number, value: number}>): {
    direction: 'improving' | 'stable' | 'declining';
    rate: number;
    significance: number;
  } {
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(p => p.value);

    // 线性回归
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const slope = denominator !== 0 ? numerator / denominator : 0;

    // 计算显著性
    const yPred = x.map(xi => yMean + slope * (xi - xMean));
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const rSquared = totalSumSquares !== 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

    let direction: 'improving' | 'stable' | 'declining';
    if (Math.abs(slope) < 0.1 || rSquared < 0.5) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    // 转换为每日变化率
    const timeSpan = (dataPoints[n-1].timestamp - dataPoints[0].timestamp) / (24 * 60 * 60 * 1000); // 天数
    const dailyRate = timeSpan > 0 ? (slope * (n-1)) / timeSpan / 100 : 0; // 每日百分比变化

    return {
      direction,
      rate: dailyRate,
      significance: rSquared
    };
  }

  private generateForecast(dataPoints: Array<{timestamp: number, value: number}>): {
    next_value: number;
    confidence_interval: [number, number];
  } | undefined {
    if (dataPoints.length < 5) return undefined;

    const values = dataPoints.map(p => p.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const lastValue = values[values.length - 1];
    
    // 简单的移动平均预测
    const recentValues = values.slice(-3);
    const recentMean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    // 计算标准差作为置信区间
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      next_value: recentMean,
      confidence_interval: [recentMean - stdDev, recentMean + stdDev]
    };
  }
}

/**
 * 回归检测器
 */
class RegressionDetector {
  detectRegression(baseline: BenchmarkRecord, current: BenchmarkRecord): RegressionDetection {
    const differences = this.calculateDifferences(baseline, current);
    const significantDifferences = differences.filter(d => d.significance === 'high');
    
    const detected = significantDifferences.length > 0;
    const performanceDrop = this.calculateOverallPerformanceDrop(baseline, current);
    const severity = this.determineSeverity(performanceDrop, significantDifferences.length);
    const confidence = this.calculateConfidence(differences);
    
    return {
      detected,
      severity,
      affected_metrics: significantDifferences.map(d => d.metric),
      performance_drop: Math.abs(performanceDrop),
      confidence,
      comparison: {
        baseline,
        current,
        differences
      },
      root_cause_suggestions: this.generateRootCauseSuggestions(differences)
    };
  }

  private calculateDifferences(baseline: BenchmarkRecord, current: BenchmarkRecord): MetricDifference[] {
    const metrics = [
      { name: 'overall_score', baseline: baseline.results.overall_score, current: current.results.overall_score },
      { name: 'drag_performance', baseline: baseline.results.categories.drag_performance.score, current: current.results.categories.drag_performance.score },
      { name: 'rendering', baseline: baseline.results.categories.rendering.score, current: current.results.categories.rendering.score },
      { name: 'memory', baseline: baseline.results.categories.memory.score, current: current.results.categories.memory.score },
      { name: 'interaction', baseline: baseline.results.categories.interaction.score, current: current.results.categories.interaction.score },
      { name: 'stability', baseline: baseline.results.categories.stability.score, current: current.results.categories.stability.score }
    ];

    return metrics.map(metric => {
      const changePercent = ((metric.current - metric.baseline) / metric.baseline) * 100;
      const significance = Math.abs(changePercent) >= 10 ? 'high' : 
                          Math.abs(changePercent) >= 5 ? 'medium' : 'low';

      return {
        metric: metric.name,
        baseline_value: metric.baseline,
        current_value: metric.current,
        change_percent: changePercent,
        significance: significance as 'low' | 'medium' | 'high'
      };
    });
  }

  private calculateOverallPerformanceDrop(baseline: BenchmarkRecord, current: BenchmarkRecord): number {
    return ((current.results.overall_score - baseline.results.overall_score) / baseline.results.overall_score) * 100;
  }

  private determineSeverity(performanceDrop: number, significantCount: number): 'minor' | 'major' | 'critical' {
    if (Math.abs(performanceDrop) >= 20 || significantCount >= 3) {
      return 'critical';
    } else if (Math.abs(performanceDrop) >= 10 || significantCount >= 2) {
      return 'major';
    } else {
      return 'minor';
    }
  }

  private calculateConfidence(differences: MetricDifference[]): number {
    const significantChanges = differences.filter(d => d.significance !== 'low');
    const consistencyRatio = significantChanges.length / differences.length;
    
    const avgChangeIntensity = differences.reduce((sum, d) => sum + Math.abs(d.change_percent), 0) / differences.length;
    const intensityFactor = Math.min(1, avgChangeIntensity / 20); // 标准化到0-1

    return Math.min(1, consistencyRatio * 0.7 + intensityFactor * 0.3);
  }

  private generateRootCauseSuggestions(differences: MetricDifference[]): string[] {
    const suggestions: string[] = [];
    
    differences.forEach(diff => {
      if (diff.significance === 'high' && diff.change_percent < 0) {
        switch (diff.metric) {
          case 'drag_performance':
            suggestions.push('检查拖拽相关代码是否有性能回归');
            suggestions.push('验证事件处理和计算精度相关的更改');
            break;
          case 'rendering':
            suggestions.push('检查渲染管道的性能优化是否失效');
            suggestions.push('验证DOM操作和样式更新的效率');
            break;
          case 'memory':
            suggestions.push('检查是否引入了内存泄漏');
            suggestions.push('验证缓存和对象管理策略');
            break;
          case 'interaction':
            suggestions.push('检查用户交互响应时间');
            suggestions.push('验证事件绑定和解绑逻辑');
            break;
          case 'stability':
            suggestions.push('检查系统稳定性相关的代码更改');
            suggestions.push('验证错误处理和异常恢复机制');
            break;
        }
      }
    });

    if (suggestions.length === 0) {
      suggestions.push('建议进行详细的性能分析以确定根本原因');
    }

    return [...new Set(suggestions)]; // 去重
  }
}

// 存储接口和实现

interface BenchmarkStorage {
  save(id: string, record: BenchmarkRecord): Promise<void>;
  load(id: string): Promise<BenchmarkRecord | null>;
  loadAll(): Promise<BenchmarkRecord[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

class LocalStorage implements BenchmarkStorage {
  private readonly prefix = 'benchmark_';

  async save(id: string, record: BenchmarkRecord): Promise<void> {
    try {
      localStorage.setItem(this.prefix + id, JSON.stringify(record));
    } catch (error) {
      throw new Error(`Failed to save to localStorage: ${error}`);
    }
  }

  async load(id: string): Promise<BenchmarkRecord | null> {
    try {
      const data = localStorage.getItem(this.prefix + id);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Failed to load from localStorage: ${error}`);
      return null;
    }
  }

  async loadAll(): Promise<BenchmarkRecord[]> {
    const records: BenchmarkRecord[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const data = localStorage.getItem(key);
          if (data) {
            records.push(JSON.parse(data));
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load all from localStorage: ${error}`);
    }
    
    return records;
  }

  async delete(id: string): Promise<void> {
    localStorage.removeItem(this.prefix + id);
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

class IndexedDBStorage implements BenchmarkStorage {
  private dbName = 'BenchmarkDB';
  private storeName = 'benchmarks';
  private version = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async save(id: string, record: BenchmarkRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(record);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async load(id: string): Promise<BenchmarkRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async loadAll(): Promise<BenchmarkRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

class MemoryStorage implements BenchmarkStorage {
  private records = new Map<string, BenchmarkRecord>();

  async save(id: string, record: BenchmarkRecord): Promise<void> {
    this.records.set(id, { ...record });
  }

  async load(id: string): Promise<BenchmarkRecord | null> {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  async loadAll(): Promise<BenchmarkRecord[]> {
    return Array.from(this.records.values()).map(r => ({ ...r }));
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

// 导出工厂函数
export function createBenchmarkDatabase(config?: Partial<BenchmarkDatabaseConfig>): BenchmarkDatabaseSystem {
  return new BenchmarkDatabaseSystem(config);
}