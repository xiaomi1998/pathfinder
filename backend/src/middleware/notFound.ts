import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `路由 ${req.originalUrl} 不存在`,
    code: 'ROUTE_NOT_FOUND',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
};