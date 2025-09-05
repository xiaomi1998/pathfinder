import { logger } from './logger';

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  NODE_ENV?: string;
  PORT?: string;
  FRONTEND_URL?: string;
  LOG_LEVEL?: string;
  LOG_DIR?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  MAX_FILE_SIZE?: string;
  UPLOAD_PATH?: string;
  RATE_LIMIT_WINDOW?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  BCRYPT_ROUNDS?: string;
  SESSION_SECRET?: string;
  DATABASE_LOGGING?: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const defaultValues: Partial<EnvConfig> = {
  JWT_EXPIRES_IN: '7d',
  NODE_ENV: 'development',
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:3000',
  LOG_LEVEL: 'info',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  SMTP_PORT: '587',
  MAX_FILE_SIZE: '10MB',
  UPLOAD_PATH: 'uploads/',
  RATE_LIMIT_WINDOW: '15',
  RATE_LIMIT_MAX_REQUESTS: '100',
  BCRYPT_ROUNDS: '12',
  DATABASE_LOGGING: 'false'
};

// 验证 Redis 配置
function validateRedisConfig(): void {
  const redisPort = process.env.REDIS_PORT;
  
  if (redisPort) {
    const portNumber = parseInt(redisPort, 10);
    
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      logger.error('REDIS_PORT 必须是 1-65535 之间的有效端口号');
      process.exit(1);
    }
  }

  const redisHost = process.env.REDIS_HOST;
  if (redisHost && redisHost.includes(' ')) {
    logger.error('REDIS_HOST 不能包含空格');
    process.exit(1);
  }

  // 生产环境应该设置 Redis 密码
  if (isProduction() && process.env.REDIS_HOST && !process.env.REDIS_PASSWORD) {
    logger.warn('生产环境建议设置 REDIS_PASSWORD');
  }
}

// 验证 SMTP 配置
function validateSmtpConfig(): void {
  const smtpPort = process.env.SMTP_PORT;
  
  if (smtpPort) {
    const portNumber = parseInt(smtpPort, 10);
    
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      logger.error('SMTP_PORT 必须是 1-65535 之间的有效端口号');
      process.exit(1);
    }
  }

  // 检查 SMTP 配置的完整性
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;

  if (smtpHost || smtpUser || smtpPass || smtpFrom) {
    if (!smtpHost) logger.warn('设置了部分 SMTP 配置，但缺少 SMTP_HOST');
    if (!smtpUser) logger.warn('设置了部分 SMTP 配置，但缺少 SMTP_USER');
    if (!smtpPass) logger.warn('设置了部分 SMTP 配置，但缺少 SMTP_PASS');
    if (!smtpFrom) logger.warn('设置了部分 SMTP 配置，但缺少 SMTP_FROM');
  }

  // 验证邮箱格式
  if (smtpFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpFrom)) {
    logger.error('SMTP_FROM 必须是有效的邮箱地址');
    process.exit(1);
  }
}

// 验证文件上传配置
function validateFileUploadConfig(): void {
  const maxFileSize = process.env.MAX_FILE_SIZE;
  
  if (maxFileSize) {
    // 支持两种格式：纯数字(字节)和带单位的格式(如10MB)
    const sizeRegex = /^(\d+(?:\.\d+)?)(kb|mb|gb)$/i;
    const bytesRegex = /^(\d+)$/;
    
    if (!sizeRegex.test(maxFileSize) && !bytesRegex.test(maxFileSize)) {
      logger.error(`MAX_FILE_SIZE 格式无效，当前值: "${maxFileSize}"，应该是如 "10mb", "500kb" 或纯数字(字节)的格式`);
      process.exit(1);
    }
    
    let sizeInBytes: number;
    
    const sizeMatch = maxFileSize.match(sizeRegex);
    const bytesMatch = maxFileSize.match(bytesRegex);
    
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toLowerCase();
      sizeInBytes = size;
      
      switch (unit) {
        case 'kb':
          sizeInBytes *= 1024;
          break;
        case 'mb':
          sizeInBytes *= 1024 * 1024;
          break;
        case 'gb':
          sizeInBytes *= 1024 * 1024 * 1024;
          break;
      }
    } else if (bytesMatch) {
      sizeInBytes = parseInt(bytesMatch[1], 10);
    } else {
      sizeInBytes = 0; // 默认值
    }
    
    // 警告文件大小过大
    if (sizeInBytes > 100 * 1024 * 1024) { // 100MB
      logger.warn('MAX_FILE_SIZE 设置过大，可能影响服务器性能');
    }
  }

  const uploadPath = process.env.UPLOAD_PATH;
  if (uploadPath && uploadPath.includes('..')) {
    logger.error('UPLOAD_PATH 不能包含相对路径符号(..)');
    process.exit(1);
  }
}

// 验证速率限制配置
function validateRateLimitConfig(): void {
  const window = process.env.RATE_LIMIT_WINDOW;
  const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS;
  
  if (window) {
    const windowNumber = parseInt(window, 10);
    
    if (isNaN(windowNumber) || windowNumber < 1 || windowNumber > 1440) { // 最大24小时
      logger.error('RATE_LIMIT_WINDOW 必须是 1-1440 之间的数字（分钟）');
      process.exit(1);
    }
  }

  if (maxRequests) {
    const maxNumber = parseInt(maxRequests, 10);
    
    if (isNaN(maxNumber) || maxNumber < 1 || maxNumber > 10000) {
      logger.error('RATE_LIMIT_MAX_REQUESTS 必须是 1-10000 之间的数字');
      process.exit(1);
    }
  }
}

// 验证安全配置
function validateSecurityConfig(): void {
  const bcryptRounds = process.env.BCRYPT_ROUNDS;
  
  if (bcryptRounds) {
    const rounds = parseInt(bcryptRounds, 10);
    
    if (isNaN(rounds) || rounds < 8 || rounds > 15) {
      logger.error('BCRYPT_ROUNDS 必须是 8-15 之间的数字');
      process.exit(1);
    }
    
    if (rounds < 12) {
      logger.warn('BCRYPT_ROUNDS 建议设置为 12 或更高以提高安全性');
    }
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret && sessionSecret.length < 32) {
    logger.warn('SESSION_SECRET 长度过短，建议使用至少32个字符的强密钥');
  }

  // 生产环境安全检查
  if (isProduction()) {
    if (process.env.JWT_SECRET === 'your-secret-key' || 
        process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
      logger.error('生产环境不能使用默认的 JWT_SECRET');
      process.exit(1);
    }

    if (sessionSecret === 'your-session-secret-key') {
      logger.error('生产环境不能使用默认的 SESSION_SECRET');
      process.exit(1);
    }

    if (process.env.FRONTEND_URL?.includes('localhost')) {
      logger.warn('生产环境中 FRONTEND_URL 包含 localhost，请检查配置');
    }
  }
}

// 检查是否为生产环境
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// 检查是否为开发环境
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// 检查是否为测试环境
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

function validateDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return; // 已在必需检查中处理
  }

  try {
    const url = new URL(databaseUrl);
    
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      logger.warn('数据库 URL 可能不是 PostgreSQL 格式');
    }
    
    if (!url.hostname || !url.pathname) {
      logger.error('数据库 URL 格式无效');
      process.exit(1);
    }
  } catch (error) {
    logger.error('数据库 URL 格式无效:', error);
    process.exit(1);
  }
}

function validateJwtConfig(): void {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;

  if (jwtSecret && jwtSecret.length < 32) {
    logger.warn('JWT_SECRET 长度过短，建议使用至少32个字符的强密钥');
  }

  if (jwtExpiresIn) {
    const validFormats = /^(\d+[smhd]|\d+)$/;
    if (!validFormats.test(jwtExpiresIn)) {
      logger.error('JWT_EXPIRES_IN 格式无效，应该是如 "7d", "24h", "60m" 的格式');
      process.exit(1);
    }
  }
}

function validatePortConfig(): void {
  const port = process.env.PORT;
  
  if (port) {
    const portNumber = parseInt(port, 10);
    
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      logger.error('PORT 必须是 1-65535 之间的有效端口号');
      process.exit(1);
    }
    
    if (portNumber < 1024 && process.getuid && process.getuid() !== 0) {
      logger.warn('使用小于1024的端口可能需要管理员权限');
    }
  }
}

function validateLogLevel(): void {
  const logLevel = process.env.LOG_LEVEL;
  const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  
  if (logLevel && !validLevels.includes(logLevel)) {
    logger.error(`LOG_LEVEL 无效，有效值为: ${validLevels.join(', ')}`);
    process.exit(1);
  }
}

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需的环境变量
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`缺少必需的环境变量: ${envVar}`);
    }
  }

  // 设置默认值
  for (const [key, defaultValue] of Object.entries(defaultValues)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      warnings.push(`环境变量 ${key} 未设置，使用默认值: ${defaultValue}`);
    }
  }

  // 验证环境变量格式
  validateDatabaseUrl();
  validateJwtConfig();
  validatePortConfig();
  validateLogLevel();
  validateRedisConfig();
  validateSmtpConfig();
  validateFileUploadConfig();
  validateRateLimitConfig();
  validateSecurityConfig();

  // 输出验证结果
  if (errors.length > 0) {
    logger.error('环境变量验证失败:', { errors });
    process.exit(1);
  }

  if (warnings.length > 0) {
    logger.warn('环境变量警告:', { warnings });
  }

  logger.info('环境变量验证通过', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    frontendUrl: process.env.FRONTEND_URL
  });
}

// 获取环境配置对象
export function getEnvConfig(): EnvConfig {
  validateEnv();
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_DIR: process.env.LOG_DIR
  };
}

// 获取 Redis 配置
export function getRedisConfig(): { host: string; port: number; password?: string } | null {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  
  if (!host || !port) {
    return null;
  }
  
  return {
    host,
    port: parseInt(port, 10),
    password: process.env.REDIS_PASSWORD || undefined
  };
}

// 获取 SMTP 配置
export function getSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
} | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  
  if (!host || !port || !user || !pass || !from) {
    return null;
  }
  
  return {
    host,
    port: parseInt(port, 10),
    user,
    pass,
    from
  };
}

// 获取文件上传限制（字节）
export function getMaxFileSizeInBytes(): number {
  const maxFileSize = process.env.MAX_FILE_SIZE || '10mb';
  const sizeRegex = /^(\d+(?:\.\d+)?)(kb|mb|gb)$/i;
  const match = maxFileSize.match(sizeRegex);
  
  if (!match) {
    return 10 * 1024 * 1024; // 默认 10MB
  }
  
  const size = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'kb':
      return size * 1024;
    case 'mb':
      return size * 1024 * 1024;
    case 'gb':
      return size * 1024 * 1024 * 1024;
    default:
      return 10 * 1024 * 1024;
  }
}