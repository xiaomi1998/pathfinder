import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, RequestUser } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 从 Authorization header 或 cookie 获取 token
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: '访问被拒绝，需要认证令牌',
        code: 'NO_TOKEN'
      });
      return;
    }

    // 验证 token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      // 将用户信息添加到请求对象
      const user: RequestUser = {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role
      };
      
      req.user = user;
      
      // 生成请求ID用于日志跟踪
      req.requestId = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: '令牌已过期',
          code: 'TOKEN_EXPIRED'
        });
        return;
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: '令牌无效',
          code: 'INVALID_TOKEN'
        });
        return;
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    logger.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
};

// 可选认证中间件（用户可能已认证也可能未认证）
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      
      try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        
        const user: RequestUser = {
          id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          organizationId: decoded.organizationId,
          role: decoded.role
        };
        
        req.user = user;
        req.requestId = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      } catch (jwtError) {
        // 对于可选认证，忽略 token 错误
        logger.warn('可选认证中间件 token 验证失败:', jwtError);
      }
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    // 对于可选认证，即使出错也继续执行
    next();
  }
};

// 管理员认证中间件
export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 首先进行普通用户认证
  authMiddleware(req, res, (error) => {
    if (error) {
      return next(error);
    }

    // 这里应该检查用户是否为管理员
    // 由于简化版本，暂时允许所有认证用户访问管理功能
    // 在实际项目中，应该从数据库查询用户角色
    
    // TODO: 实现真正的管理员权限检查
    // const user = await prisma.user.findUnique({
    //   where: { id: req.user!.id },
    //   select: { role: true }
    // });
    // 
    // if (user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     error: '需要管理员权限',
    //     code: 'ADMIN_REQUIRED'
    //   });
    // }

    next();
  });
};

// 权限检查中间件工厂
export const hasPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '需要认证',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // 简化的权限检查
      // 在实际项目中，应该从数据库查询用户权限
      logger.info(`检查用户 ${req.user.id} 的权限: ${permission}`);
      
      // TODO: 实现真正的权限检查
      // const userPermissions = await getUserPermissions(req.user.id);
      // if (!userPermissions.includes(permission)) {
      //   return res.status(403).json({
      //     success: false,
      //     error: `需要权限: ${permission}`,
      //     code: 'PERMISSION_DENIED'
      //   });
      // }

      next();
    } catch (error) {
      logger.error('权限检查中间件错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// 资源所有权验证中间件工厂
export const verifyResourceOwnership = (resourceType: 'funnel' | 'node' | 'edge' | 'aiSession') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '需要认证',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      // 这里应该根据资源类型验证用户是否拥有该资源
      // 由于简化版本，这个验证逻辑已经在各个服务中实现
      
      logger.info(`验证用户 ${req.user.id} 对资源 ${resourceType} 的所有权`);
      
      next();
    } catch (error) {
      logger.error('资源所有权验证中间件错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};