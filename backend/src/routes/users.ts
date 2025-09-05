import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserService } from '@/services/UserService';
import { validateRequest } from '@/middleware/validateRequest';
import { UpdateUserInput } from '@/types/user';

const router = Router();
const userService = new UserService();

// 获取当前用户信息
router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getCurrentUser(req.user!.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// 更新当前用户信息
router.put(
  '/me',
  [
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const updateData: UpdateUserInput = req.body;
      const user = await userService.updateUser(req.user!.id, updateData);
      res.json({
        success: true,
        data: user,
        message: '用户信息更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更改密码
router.put(
  '/me/password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('新密码长度不能少于8个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('新密码必须包含大小写字母、数字和特殊字符'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('确认密码与新密码不匹配');
        }
        return true;
      })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user!.id, currentPassword, newPassword);
      res.json({
        success: true,
        message: '密码更改成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取用户统计信息
router.get('/me/stats', async (req, res, next) => {
  try {
    const stats = await userService.getUserStats(req.user!.id);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户活动历史
router.get(
  '/me/activity',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页条数必须在1-100之间'),
    
    query('type')
      .optional()
      .isIn(['funnel', 'node', 'ai_session', 'all'])
      .withMessage('活动类型无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string || 'all';
      
      const activity = await userService.getUserActivity(req.user!.id, { page, limit, type });
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除账户
router.delete('/me', async (req, res, next) => {
  try {
    await userService.deleteUser(req.user!.id);
    res.clearCookie('token');
    res.json({
      success: true,
      message: '账户已删除'
    });
  } catch (error) {
    next(error);
  }
});

// 停用账户
router.put('/me/deactivate', async (req, res, next) => {
  try {
    await userService.deactivateUser(req.user!.id);
    res.clearCookie('token');
    res.json({
      success: true,
      message: '账户已停用'
    });
  } catch (error) {
    next(error);
  }
});

// 管理员路由 - 获取所有用户（需要管理员权限）
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页条数必须在1-100之间'),
    
    query('search')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('搜索关键词长度不能超过255个字符'),
    
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('账户状态必须是布尔值')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // 这里应该添加管理员权限检查
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      
      const users = await userService.getUsers({ page, limit, search, isActive });
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
);

// 管理员路由 - 获取特定用户
router.get(
  '/:userId',
  [
    param('userId')
      .isUUID()
      .withMessage('用户ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // 这里应该添加管理员权限检查
      const user = await userService.getUserById(req.params.userId);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;