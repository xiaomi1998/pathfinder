import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // 生成请求ID（如果还没有）
  if (!req.requestId) {
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 记录请求开始
  logger.info('请求开始', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    requestId: req.requestId,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // 监听响应完成
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // 记录响应信息
    logger.info('请求完成', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: Buffer.byteLength(body || ''),
      userId: req.user?.id,
      requestId: req.requestId
    });

    // 如果是错误响应，记录更多详细信息
    if (res.statusCode >= 400) {
      logger.warn('错误响应', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        requestId: req.requestId,
        responseBody: process.env.NODE_ENV === 'development' ? body : undefined
      });
    }

    return originalSend.call(this, body);
  };

  // 监听响应错误
  res.on('error', (error) => {
    const duration = Date.now() - startTime;
    
    logger.error('响应错误', {
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      userId: req.user?.id,
      requestId: req.requestId
    });
  });

  next();
};