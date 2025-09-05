/**
 * 自动化性能回归检测系统
 * Agent 9: 智能回归检测、自动化CI/CD集成和性能警告系统
 */

import { BenchmarkDatabaseSystem, type BenchmarkRecord, type RegressionDetection } from './benchmark-database-system';

// 回归检测配置
export interface RegressionDetectionConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  thresholds: {
    critical: number; // 百分比
    major: number;
    minor: number;
  };
  baseline_strategy: 'last_stable' | 'last_release' | 'main_branch' | 'custom';
  custom_baseline?: string;
  notification_channels: ('console' | 'webhook' | 'email' | 'slack')[];
  auto_bisect: boolean;
  continuous_monitoring: boolean;
  monitoring_interval: number; // 毫秒
}

// 回归检测结果
export interface RegressionResult {
  id: string;
  timestamp: number;
  detected: boolean;
  regression: RegressionDetection | null;
  baseline_record: BenchmarkRecord | null;
  current_record: BenchmarkRecord;
  action_taken: RegressionAction[];
  notification_sent: boolean;
}

// 回归处理操作
export interface RegressionAction {
  type: 'notify' | 'block_deploy' | 'auto_rollback' | 'create_issue' | 'bisect';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  details: any;
  error?: string;
}

// 通知配置
export interface NotificationConfig {
  webhook_url?: string;
  email_config?: {
    smtp_host: string;
    smtp_port: number;
    username: string;
    password: string;
    from_email: string;
    to_emails: string[];
  };
  slack_config?: {
    webhook_url: string;
    channel: string;
    username: string;
  };
}

// CI/CD集成配置
export interface CIIntegrationConfig {
  enabled: boolean;
  provider: 'github' | 'gitlab' | 'jenkins' | 'circle_ci' | 'custom';
  api_endpoint?: string;
  auth_token?: string;
  repository?: string;
  branch_protection: boolean;
  auto_comment: boolean;
}

// 性能警告
export interface PerformanceAlert {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metric: string;
  current_value: number;
  threshold_value: number;
  trend: 'improving' | 'stable' | 'degrading';
  actions_recommended: string[];
  auto_resolved: boolean;
}

/**
 * 自动化回归检测器
 */
export class AutomatedRegressionDetector {
  private config: RegressionDetectionConfig;
  private notificationConfig: NotificationConfig;
  private ciConfig: CIIntegrationConfig;
  private database: BenchmarkDatabaseSystem;
  private regressionResults: Map<string, RegressionResult> = new Map();
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval: number | null = null;
  private isMonitoring = false;

  constructor(
    database: BenchmarkDatabaseSystem,
    config?: Partial<RegressionDetectionConfig>,
    notificationConfig?: NotificationConfig,
    ciConfig?: CIIntegrationConfig
  ) {
    this.database = database;
    this.config = {
      enabled: true,
      sensitivity: 'medium',
      thresholds: {
        critical: 20, // 20%性能下降
        major: 10,
        minor: 5
      },
      baseline_strategy: 'last_stable',
      notification_channels: ['console'],
      auto_bisect: false,
      continuous_monitoring: false,
      monitoring_interval: 5 * 60 * 1000, // 5分钟
      ...config
    };

    this.notificationConfig = notificationConfig || {};
    this.ciConfig = {
      enabled: false,
      provider: 'github',
      branch_protection: false,
      auto_comment: false,
      ...ciConfig
    };

    this.setupSensitivityThresholds();
  }

  /**
   * 启动连续监控
   */
  startContinuousMonitoring(): void {
    if (!this.config.continuous_monitoring || this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.performAutomaticDetection();
    }, this.config.monitoring_interval);

    console.log('Automated regression detection started');
  }

  /**
   * 停止连续监控
   */
  stopContinuousMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Automated regression detection stopped');
  }

  /**
   * 检测性能回归
   */
  async detectRegression(
    currentRecord: BenchmarkRecord,
    customBaseline?: BenchmarkRecord
  ): Promise<RegressionResult> {
    const resultId = this.generateResultId();
    const timestamp = Date.now();

    let baselineRecord: BenchmarkRecord | null = null;
    
    if (customBaseline) {
      baselineRecord = customBaseline;
    } else {
      baselineRecord = await this.findBaseline(currentRecord);
    }

    let regression: RegressionDetection | null = null;
    let detected = false;

    if (baselineRecord) {
      regression = this.database.detectRegression(currentRecord, baselineRecord.version);
      detected = regression.detected && this.isSignificantRegression(regression);
    }

    const result: RegressionResult = {
      id: resultId,
      timestamp,
      detected,
      regression,
      baseline_record: baselineRecord,
      current_record: currentRecord,
      action_taken: [],
      notification_sent: false
    };

    // 如果检测到回归，执行相应操作
    if (detected && regression) {
      await this.handleRegression(result, regression);
    }

    this.regressionResults.set(resultId, result);
    return result;
  }

  /**
   * 执行自动检测
   */
  private async performAutomaticDetection(): Promise<void> {
    try {
      // 获取最新的基准记录
      const recentRecords = this.database.queryBenchmarkRecords({
        limit: 1
      });

      if (recentRecords.length === 0) return;

      const latestRecord = recentRecords[0];
      
      // 检查是否已经检测过这个记录
      const existingResult = Array.from(this.regressionResults.values())
        .find(r => r.current_record.id === latestRecord.id);

      if (existingResult) return;

      // 执行回归检测
      await this.detectRegression(latestRecord);

    } catch (error) {
      console.error('Automatic regression detection failed:', error);
    }
  }

  /**
   * 查找基线记录
   */
  private async findBaseline(currentRecord: BenchmarkRecord): Promise<BenchmarkRecord | null> {
    switch (this.config.baseline_strategy) {
      case 'last_stable':
        return this.findLastStableVersion(currentRecord);
      
      case 'last_release':
        return this.findLastReleaseVersion(currentRecord);
      
      case 'main_branch':
        return this.findMainBranchBaseline(currentRecord);
      
      case 'custom':
        if (this.config.custom_baseline) {
          const records = this.database.queryBenchmarkRecords({
            version: this.config.custom_baseline,
            limit: 1
          });
          return records[0] || null;
        }
        break;
    }

    return null;
  }

  /**
   * 查找最后稳定版本
   */
  private findLastStableVersion(currentRecord: BenchmarkRecord): BenchmarkRecord | null {
    const candidates = this.database.queryBenchmarkRecords({
      branch: currentRecord.metadata.branch,
      limit: 20
    }).filter(r => r.id !== currentRecord.id);

    // 找到最近的稳定版本（版本号不包含预发布标识符）
    return candidates.find(r => 
      !/alpha|beta|rc|dev|snapshot|canary/i.test(r.version)
    ) || null;
  }

  /**
   * 查找最后发布版本
   */
  private findLastReleaseVersion(currentRecord: BenchmarkRecord): BenchmarkRecord | null {
    const candidates = this.database.queryBenchmarkRecords({
      limit: 50
    }).filter(r => r.id !== currentRecord.id);

    // 找到最近的发布版本（通常有release标签）
    return candidates.find(r => 
      r.metadata.tags.includes('release') || 
      /^v?\d+\.\d+\.\d+$/.test(r.version)
    ) || null;
  }

  /**
   * 查找主分支基线
   */
  private findMainBranchBaseline(currentRecord: BenchmarkRecord): BenchmarkRecord | null {
    const candidates = this.database.queryBenchmarkRecords({
      branch: 'main',
      limit: 10
    }).filter(r => r.id !== currentRecord.id);

    return candidates[0] || null;
  }

  /**
   * 判断是否为显著回归
   */
  private isSignificantRegression(regression: RegressionDetection): boolean {
    const thresholds = this.config.thresholds;
    
    switch (regression.severity) {
      case 'critical':
        return regression.performance_drop >= thresholds.critical;
      case 'major':
        return regression.performance_drop >= thresholds.major;
      case 'minor':
        return regression.performance_drop >= thresholds.minor;
      default:
        return false;
    }
  }

  /**
   * 处理检测到的回归
   */
  private async handleRegression(result: RegressionResult, regression: RegressionDetection): Promise<void> {
    const actions: RegressionAction[] = [];

    // 发送通知
    if (this.config.notification_channels.length > 0) {
      const notifyAction: RegressionAction = {
        type: 'notify',
        status: 'pending',
        timestamp: Date.now(),
        details: { channels: this.config.notification_channels }
      };

      try {
        await this.sendNotifications(regression, result.current_record);
        notifyAction.status = 'completed';
        result.notification_sent = true;
      } catch (error) {
        notifyAction.status = 'failed';
        notifyAction.error = String(error);
      }

      actions.push(notifyAction);
    }

    // CI/CD集成操作
    if (this.ciConfig.enabled) {
      const ciActions = await this.performCIIntegrationActions(regression, result);
      actions.push(...ciActions);
    }

    // 创建性能警告
    this.createPerformanceAlert(regression, result.current_record);

    // 自动二分查找（如果启用）
    if (this.config.auto_bisect && regression.severity === 'critical') {
      const bisectAction: RegressionAction = {
        type: 'bisect',
        status: 'pending',
        timestamp: Date.now(),
        details: {}
      };

      try {
        await this.performAutoBisect(result.baseline_record!, result.current_record);
        bisectAction.status = 'completed';
      } catch (error) {
        bisectAction.status = 'failed';
        bisectAction.error = String(error);
      }

      actions.push(bisectAction);
    }

    result.action_taken = actions;
  }

  /**
   * 发送通知
   */
  private async sendNotifications(regression: RegressionDetection, currentRecord: BenchmarkRecord): Promise<void> {
    const message = this.formatRegressionMessage(regression, currentRecord);

    for (const channel of this.config.notification_channels) {
      switch (channel) {
        case 'console':
          console.warn('Performance Regression Detected:', message);
          break;
        
        case 'webhook':
          if (this.notificationConfig.webhook_url) {
            await this.sendWebhookNotification(message);
          }
          break;
        
        case 'email':
          if (this.notificationConfig.email_config) {
            await this.sendEmailNotification(message);
          }
          break;
        
        case 'slack':
          if (this.notificationConfig.slack_config) {
            await this.sendSlackNotification(message);
          }
          break;
      }
    }
  }

  /**
   * 格式化回归消息
   */
  private formatRegressionMessage(regression: RegressionDetection, currentRecord: BenchmarkRecord): string {
    const severityEmoji = {
      minor: '⚠️',
      major: '🚨',
      critical: '💥'
    };

    let message = `${severityEmoji[regression.severity]} Performance Regression Detected!\n\n`;
    message += `Version: ${currentRecord.version}\n`;
    message += `Severity: ${regression.severity.toUpperCase()}\n`;
    message += `Performance Drop: ${regression.performance_drop.toFixed(1)}%\n`;
    message += `Confidence: ${(regression.confidence * 100).toFixed(1)}%\n`;
    message += `Affected Metrics: ${regression.affected_metrics.join(', ')}\n\n`;

    if (regression.comparison.differences.length > 0) {
      message += 'Metric Changes:\n';
      regression.comparison.differences
        .filter(d => d.significance === 'high')
        .forEach(diff => {
          const arrow = diff.change_percent > 0 ? '📈' : '📉';
          message += `${arrow} ${diff.metric}: ${diff.current_value.toFixed(1)} (${diff.change_percent > 0 ? '+' : ''}${diff.change_percent.toFixed(1)}%)\n`;
        });
      message += '\n';
    }

    if (regression.root_cause_suggestions.length > 0) {
      message += 'Suggested Actions:\n';
      regression.root_cause_suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }

    return message;
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhookNotification(message: string): Promise<void> {
    if (!this.notificationConfig.webhook_url) return;

    const payload = {
      text: message,
      timestamp: Date.now(),
      type: 'performance_regression'
    };

    const response = await fetch(this.notificationConfig.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(message: string): Promise<void> {
    // 这里需要实际的邮件发送实现
    // 由于浏览器环境限制，通常需要通过后端服务发送邮件
    console.log('Email notification would be sent:', message);
  }

  /**
   * 发送Slack通知
   */
  private async sendSlackNotification(message: string): Promise<void> {
    if (!this.notificationConfig.slack_config) return;

    const payload = {
      text: message,
      channel: this.notificationConfig.slack_config.channel,
      username: this.notificationConfig.slack_config.username || 'Performance Bot'
    };

    const response = await fetch(this.notificationConfig.slack_config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  /**
   * 执行CI/CD集成操作
   */
  private async performCIIntegrationActions(
    regression: RegressionDetection, 
    result: RegressionResult
  ): Promise<RegressionAction[]> {
    const actions: RegressionAction[] = [];

    // 创建Issue
    if (regression.severity === 'critical' || regression.severity === 'major') {
      const issueAction: RegressionAction = {
        type: 'create_issue',
        status: 'pending',
        timestamp: Date.now(),
        details: {}
      };

      try {
        await this.createPerformanceIssue(regression, result.current_record);
        issueAction.status = 'completed';
      } catch (error) {
        issueAction.status = 'failed';
        issueAction.error = String(error);
      }

      actions.push(issueAction);
    }

    // 自动评论
    if (this.ciConfig.auto_comment) {
      const commentAction: RegressionAction = {
        type: 'notify',
        status: 'pending',
        timestamp: Date.now(),
        details: { type: 'pr_comment' }
      };

      try {
        await this.addPerformanceComment(regression, result.current_record);
        commentAction.status = 'completed';
      } catch (error) {
        commentAction.status = 'failed';
        commentAction.error = String(error);
      }

      actions.push(commentAction);
    }

    // 阻止部署
    if (regression.severity === 'critical' && this.ciConfig.branch_protection) {
      const blockAction: RegressionAction = {
        type: 'block_deploy',
        status: 'pending',
        timestamp: Date.now(),
        details: {}
      };

      try {
        await this.blockDeployment(result.current_record);
        blockAction.status = 'completed';
      } catch (error) {
        blockAction.status = 'failed';
        blockAction.error = String(error);
      }

      actions.push(blockAction);
    }

    return actions;
  }

  /**
   * 创建性能问题
   */
  private async createPerformanceIssue(regression: RegressionDetection, record: BenchmarkRecord): Promise<void> {
    const title = `Performance Regression in ${record.version} - ${regression.severity} (${regression.performance_drop.toFixed(1)}% drop)`;
    const body = this.formatRegressionMessage(regression, record);

    // 这里需要根据具体的CI/CD平台实现
    // 例如GitHub API、GitLab API等
    console.log('Would create issue:', { title, body });
  }

  /**
   * 添加性能评论
   */
  private async addPerformanceComment(regression: RegressionDetection, record: BenchmarkRecord): Promise<void> {
    const comment = this.formatRegressionMessage(regression, record);
    console.log('Would add PR comment:', comment);
  }

  /**
   * 阻止部署
   */
  private async blockDeployment(record: BenchmarkRecord): Promise<void> {
    console.log('Would block deployment for:', record.version);
  }

  /**
   * 自动二分查找
   */
  private async performAutoBisect(baseline: BenchmarkRecord, current: BenchmarkRecord): Promise<void> {
    console.log('Would perform auto-bisect between:', baseline.version, 'and', current.version);
    
    // 这里需要实现自动二分查找逻辑
    // 1. 获取两个版本之间的所有commit
    // 2. 自动测试中间的commit
    // 3. 找到引入回归的具体commit
  }

  /**
   * 创建性能警告
   */
  private createPerformanceAlert(regression: RegressionDetection, record: BenchmarkRecord): void {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      timestamp: Date.now(),
      level: this.mapSeverityToLevel(regression.severity),
      title: `Performance Regression in ${record.version}`,
      message: `Performance dropped by ${regression.performance_drop.toFixed(1)}% in ${regression.affected_metrics.join(', ')}`,
      metric: regression.affected_metrics[0] || 'overall',
      current_value: regression.comparison.current.results.overall_score,
      threshold_value: regression.comparison.baseline.results.overall_score,
      trend: 'degrading',
      actions_recommended: regression.root_cause_suggestions,
      auto_resolved: false
    };

    this.alerts.push(alert);

    // 保持警告列表在合理大小
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  /**
   * 映射严重性到警告级别
   */
  private mapSeverityToLevel(severity: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'major': return 'error';
      case 'minor': return 'warning';
      default: return 'info';
    }
  }

  /**
   * 设置敏感度阈值
   */
  private setupSensitivityThresholds(): void {
    switch (this.config.sensitivity) {
      case 'low':
        this.config.thresholds = { critical: 30, major: 20, minor: 10 };
        break;
      case 'high':
        this.config.thresholds = { critical: 10, major: 5, minor: 2 };
        break;
      default: // medium
        this.config.thresholds = { critical: 20, major: 10, minor: 5 };
    }
  }

  /**
   * 生成结果ID
   */
  private generateResultId(): string {
    return `regression-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成警告ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 公共API方法

  /**
   * 获取回归检测结果
   */
  getRegressionResults(): RegressionResult[] {
    return Array.from(this.regressionResults.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取性能警告
   */
  getPerformanceAlerts(): PerformanceAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取活跃警告
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.auto_resolved);
  }

  /**
   * 解决警告
   */
  resolveAlert(alertId: string, autoResolved = false): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.auto_resolved = autoResolved;
      return true;
    }
    return false;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RegressionDetectionConfig>): void {
    Object.assign(this.config, config);
    this.setupSensitivityThresholds();
  }

  /**
   * 更新通知配置
   */
  updateNotificationConfig(config: NotificationConfig): void {
    this.notificationConfig = { ...config };
  }

  /**
   * 更新CI集成配置
   */
  updateCIConfig(config: CIIntegrationConfig): void {
    this.ciConfig = { ...config };
  }

  /**
   * 生成回归检测报告
   */
  generateRegressionReport(): string {
    const results = this.getRegressionResults();
    const alerts = this.getActiveAlerts();

    let report = '自动化回归检测报告\n';
    report += '='.repeat(30) + '\n\n';

    report += `检测配置:\n`;
    report += `  - 启用状态: ${this.config.enabled ? '是' : '否'}\n`;
    report += `  - 敏感度: ${this.config.sensitivity}\n`;
    report += `  - 基线策略: ${this.config.baseline_strategy}\n`;
    report += `  - 连续监控: ${this.config.continuous_monitoring ? '是' : '否'}\n\n`;

    if (results.length > 0) {
      report += `检测结果 (最近10次):\n`;
      results.slice(0, 10).forEach((result, index) => {
        report += `${index + 1}. ${new Date(result.timestamp).toLocaleString()}\n`;
        report += `   版本: ${result.current_record.version}\n`;
        report += `   检测到回归: ${result.detected ? '是' : '否'}\n`;
        if (result.detected && result.regression) {
          report += `   严重程度: ${result.regression.severity}\n`;
          report += `   性能下降: ${result.regression.performance_drop.toFixed(1)}%\n`;
        }
        report += `   通知已发送: ${result.notification_sent ? '是' : '否'}\n\n`;
      });
    } else {
      report += '暂无回归检测结果\n\n';
    }

    if (alerts.length > 0) {
      report += `活跃警告 (${alerts.length}个):\n`;
      alerts.slice(0, 5).forEach((alert, index) => {
        report += `${index + 1}. ${alert.title}\n`;
        report += `   级别: ${alert.level}\n`;
        report += `   时间: ${new Date(alert.timestamp).toLocaleString()}\n`;
        report += `   消息: ${alert.message}\n\n`;
      });
    } else {
      report += '当前无活跃警告\n\n';
    }

    // 统计信息
    const totalDetections = results.length;
    const regressionsDetected = results.filter(r => r.detected).length;
    const criticalRegressions = results.filter(r => 
      r.detected && r.regression?.severity === 'critical'
    ).length;

    report += `统计信息:\n`;
    report += `  - 总检测次数: ${totalDetections}\n`;
    report += `  - 检测到回归: ${regressionsDetected}\n`;
    report += `  - 严重回归: ${criticalRegressions}\n`;
    report += `  - 回归检测率: ${totalDetections > 0 ? ((regressionsDetected / totalDetections) * 100).toFixed(1) : 0}%\n`;

    return report;
  }

  /**
   * 导出数据
   */
  exportData(): any {
    return {
      config: this.config,
      notification_config: this.notificationConfig,
      ci_config: this.ciConfig,
      regression_results: Array.from(this.regressionResults.values()),
      alerts: this.alerts,
      timestamp: Date.now()
    };
  }

  /**
   * 清空数据
   */
  clearData(): void {
    this.regressionResults.clear();
    this.alerts = [];
  }
}

// 导出工厂函数
export function createAutomatedRegressionDetector(
  database: BenchmarkDatabaseSystem,
  config?: Partial<RegressionDetectionConfig>,
  notificationConfig?: NotificationConfig,
  ciConfig?: CIIntegrationConfig
): AutomatedRegressionDetector {
  return new AutomatedRegressionDetector(database, config, notificationConfig, ciConfig);
}