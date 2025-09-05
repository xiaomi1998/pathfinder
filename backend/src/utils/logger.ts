import winston from 'winston';
import path from 'path';

// 自定义格式化函数
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 开发环境格式化
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // 添加额外的元数据信息
    if (Object.keys(meta).length > 0) {
      msg += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return msg;
  })
);

// 创建 Winston logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'development' ? developmentFormat : customFormat,
  defaultMeta: {
    service: 'pathfinder-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: []
});

// 控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: developmentFormat
  }));
} else {
  logger.add(new winston.transports.Console({
    format: customFormat
  }));
}

// 文件输出（生产环境）
if (process.env.NODE_ENV === 'production') {
  // 确保日志目录存在
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  
  // 错误日志文件
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  // 组合日志文件
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

// 如果不是生产环境，将错误日志也输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.exceptions.handle(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
  
  logger.rejections.handle(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// 扩展 logger 功能
const extendedLogger = Object.assign(logger, {
  
  // API 请求日志
  request: (message: string, meta?: any) => {
    logger.info(message, { type: 'request', ...meta });
  },
  
  // 数据库操作日志
  database: (message: string, meta?: any) => {
    logger.debug(message, { type: 'database', ...meta });
  },
  
  // 安全相关日志
  security: (message: string, meta?: any) => {
    logger.warn(message, { type: 'security', ...meta });
  },
  
  // 性能监控日志
  performance: (message: string, meta?: any) => {
    logger.info(message, { type: 'performance', ...meta });
  },
  
  // 业务逻辑日志
  business: (message: string, meta?: any) => {
    logger.info(message, { type: 'business', ...meta });
  },
  
  // AI 相关日志
  ai: (message: string, meta?: any) => {
    logger.info(message, { type: 'ai', ...meta });
  }
});

export { extendedLogger as logger };

// 默认导出
export default extendedLogger;