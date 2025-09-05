import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminRole } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import { AdminService, AdminJwtPayload } from '@/services/AdminService';

// Extend Request interface to include admin
export interface RequestAdmin {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
}

declare global {
  namespace Express {
    interface Request {
      admin?: RequestAdmin;
    }
  }
}

/**
 * Admin authentication middleware
 */
export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: '访问被拒绝，需要管理员认证令牌',
        code: 'NO_ADMIN_TOKEN'
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as AdminJwtPayload;
      
      // Check if this is an admin token
      if (decoded.type !== 'admin') {
        res.status(401).json({
          success: false,
          error: '无效的管理员令牌',
          code: 'INVALID_ADMIN_TOKEN'
        });
        return;
      }

      // Verify admin exists and is active using AdminService
      const adminService = new AdminService();
      const admin = await adminService.verifyToken(token);
      
      // Add admin info to request object
      req.admin = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      };
      
      // Generate request ID for logging
      req.requestId = `admin-${admin.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: '管理员令牌已过期',
          code: 'ADMIN_TOKEN_EXPIRED'
        });
        return;
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: '管理员令牌无效',
          code: 'INVALID_ADMIN_TOKEN'
        });
        return;
      } else if (jwtError instanceof ApiError) {
        res.status(jwtError.statusCode).json({
          success: false,
          error: jwtError.message,
          code: 'ADMIN_AUTH_ERROR'
        });
        return;
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    logger.error('管理员认证中间件错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Super admin role check middleware
 */
export const superAdminOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: '需要管理员认证',
        code: 'ADMIN_REQUIRED'
      });
      return;
    }

    if (req.admin.role !== AdminRole.super_admin) {
      res.status(403).json({
        success: false,
        error: '需要超级管理员权限',
        code: 'SUPER_ADMIN_REQUIRED'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('超级管理员权限检查错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Admin role check middleware (both admin and super_admin allowed)
 */
export const adminRoleOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        error: '需要管理员认证',
        code: 'ADMIN_REQUIRED'
      });
      return;
    }

    if (![AdminRole.admin, AdminRole.super_admin].includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        error: '需要管理员权限',
        code: 'ADMIN_ROLE_REQUIRED'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('管理员角色检查错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get client IP address helper
 */
export const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Get user agent helper
 */
export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};