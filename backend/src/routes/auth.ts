import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { validateBody } from '@/middleware/joiValidation';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth';
import { LoginInput, RegisterInput } from '@/types/user';

const router = Router();
const authService = new AuthService();

// 注册路由
router.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerData: RegisterInput = req.body;
      const result = await authService.register(registerData);
      res.status(201).json({
        success: true,
        data: result,
        message: '注册成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 登录路由
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginData: LoginInput = req.body;
      const result = await authService.login(loginData);
      
      // 设置 HTTP-only cookie
      res.cookie('token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.expires_in * 1000
      });
      
      res.json({
        success: true,
        data: result,
        message: '登录成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 登出路由
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 刷新令牌路由
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供令牌'
      });
    }
    
    const result = await authService.refreshToken(token);
    
    // 设置新的 HTTP-only cookie
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expires_in * 1000
    });
    
    res.json({
      success: true,
      data: result,
      message: '令牌刷新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息路由
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供令牌'
      });
    }
    
    const result = await authService.verifyToken(token);
    res.json({
      success: true,
      data: result,
      message: '获取用户信息成功'
    });
  } catch (error) {
    next(error);
  }
});

// 验证令牌路由
router.get('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供令牌'
      });
    }
    
    const result = await authService.verifyToken(token);
    res.json({
      success: true,
      data: result,
      message: '令牌有效'
    });
  } catch (error) {
    next(error);
  }
});

// 请求密码重置路由
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);
      res.json({
        success: true,
        message: '密码重置邮件已发送'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 重置密码路由
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;