import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '@/utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
      location: error.type === 'field' ? (error as any).location : undefined
    }));

    logger.warn('请求验证失败:', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      body: req.body,
      query: req.query,
      params: req.params,
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(400).json({
      success: false,
      error: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      details: errorMessages,
      requestId: req.requestId
    });
    return;
  }

  next();
};