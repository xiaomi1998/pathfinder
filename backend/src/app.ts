import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import funnelRoutes from '@/routes/funnels';
import funnelTemplateRoutes from '@/routes/funnel-templates';
import nodeRoutes from '@/routes/nodes';
import edgeRoutes from '@/routes/edges';
import aiRoutes from '@/routes/ai';
import organizationRoutes from '@/routes/organizations';
import metricDatasetRoutes from '@/routes/metric-datasets';

// 导入中间件
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { requestLogger } from '@/middleware/requestLogger';
import { authMiddleware } from '@/middleware/auth';

// 导入工具
import { logger } from '@/utils/logger';
import { validateEnv } from '@/utils/validateEnv';

// 加载环境变量
dotenv.config();

// 验证环境变量
validateEnv();

// 创建 Express 应用
const app = express();

// 创建 Prisma 客户端实例
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 开发环境更宽松
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// API 健康检查端点
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'connected',
          api: 'operational'
        }
      }
    });
  } catch (error) {
    logger.error('API health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service health check failed',
        details: 'Database connection error'
      }
    });
  }
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/org', organizationRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/funnels', authMiddleware, funnelRoutes);
app.use('/api/funnel-templates', authMiddleware, funnelTemplateRoutes);
app.use('/api/nodes', authMiddleware, nodeRoutes);
app.use('/api/edges', authMiddleware, edgeRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/metric-datasets', metricDatasetRoutes);

// API 根路径
app.get('/api', (req, res) => {
  res.json({
    message: 'Pathfinder API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      organizations: '/api/org',
      users: '/api/users',
      funnels: '/api/funnels',
      funnelTemplates: '/api/funnel-templates',
      nodes: '/api/nodes',
      edges: '/api/edges',
      ai: '/api/ai',
      metricDatasets: '/api/metric-datasets',
      health: '/health'
    }
  });
});

// 404 处理
app.use(notFound);

// 全局错误处理
app.use(errorHandler);

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // 关闭数据库连接
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 Pathfinder API server is running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 API endpoint: http://localhost:${PORT}/api`);
});

export default app;