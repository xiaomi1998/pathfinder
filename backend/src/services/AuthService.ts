import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { LoginInput, RegisterInput, LoginResponse, UserResponse, JwtPayload, PasswordResetPayload } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import { OrganizationService } from './OrganizationService';

export class AuthService {
  private prisma: PrismaClient;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private organizationService: OrganizationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.organizationService = new OrganizationService();
  }

  async register(data: RegisterInput): Promise<LoginResponse> {
    const { name, phone, verification_code, password, password_confirmation, terms_accepted } = data;

    // 验证密码匹配
    if (password !== password_confirmation) {
      throw new ApiError('确认密码与密码不匹配', 400);
    }

    // 验证服务条款同意
    if (!terms_accepted) {
      throw new ApiError('必须同意服务条款', 400);
    }

    // TODO: 验证手机验证码
    // 目前先简单验证，实际应用中需要从Redis或数据库中验证
    if (verification_code !== '123456') {
      throw new ApiError('验证码错误或已过期', 400);
    }

    // 检查手机号是否已存在
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: phone }
    });

    if (existingPhone) {
      throw new ApiError('手机号已被注册', 409);
    }

    // 密码哈希
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      // 从name生成username（去除空格，转小写）
      let username = name.toLowerCase().replace(/\s+/g, '');
      
      // 检查用户名是否已存在，如果存在则添加数字后缀
      let counter = 1;
      let baseUsername = username;
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // 分割姓名为firstName和lastName
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 创建新用户
      const user = await this.prisma.user.create({
        data: {
          username,
          phone: phone,
          passwordHash
        }
      });

      // 创建默认组织并将用户设置为owner
      const organization = await this.organizationService.createDefaultOrganization(
        `${name}的团队`,
        user.id
      );

      // 重新获取用户信息以包含组织ID和角色
      const updatedUser = await this.prisma.user.findUniqueOrThrow({
        where: { id: user.id }
      });

      logger.info(`新用户注册: ${username} (${phone}) with organization: ${organization.name}`);

      // 生成 JWT（包含组织信息）
      const token = this.generateToken({
        userId: user.id,
        username: user.username,
        phone: user.phone ?? undefined,
        organizationId: organization.id,
        role: updatedUser.role
      });

      const userResponse: UserResponse = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        organizationId: updatedUser.organizationId,
        role: updatedUser.role,
        analysisQuota: updatedUser.analysisQuota,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lastLoginAt: updatedUser.lastLoginAt,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified,
        name: name // 直接使用传入的name
      };

      // 前端期望的格式，包含组织信息
      return {
        user: userResponse,
        organization: organization,
        access_token: token,
        refresh_token: token, // 简化处理，使用相同token
        expires_in: this.getTokenExpiresIn()
      } as any;
    } catch (error) {
      logger.error('用户注册失败:', error);
      throw new ApiError('注册失败，请稍后重试', 500);
    }
  }

  async login(data: LoginInput): Promise<LoginResponse> {
    const { email, password } = data;

    // 查找用户 - 支持邮箱或手机号登录
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: email } // 这里的email字段实际可能是手机号
        ]
      }
    });

    if (!user) {
      throw new ApiError('手机号或密码错误', 401);
    }

    // 检查账户是否激活
    if (!user.isActive) {
      throw new ApiError('账户已被停用，请联系管理员', 403);
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError('手机号或密码错误', 401);
    }

    try {
      // 更新最后登录时间
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      logger.info(`用户登录: ${user.username} (${email})`);

      // 生成 JWT
      const token = this.generateToken({
        userId: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email ?? undefined,
        phone: updatedUser.phone ?? undefined,
        organizationId: updatedUser.organizationId ?? undefined,
        role: updatedUser.role
      });

      const userResponse: UserResponse = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        organizationId: updatedUser.organizationId,
        role: updatedUser.role,
        analysisQuota: updatedUser.analysisQuota,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lastLoginAt: updatedUser.lastLoginAt,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified,
        name: updatedUser.username // 暂时使用username作为name
      };

      // 前端期望的格式
      return {
        user: userResponse,
        access_token: token,
        refresh_token: token, // 简化处理，使用相同token
        expires_in: this.getTokenExpiresIn()
      };
    } catch (error) {
      logger.error('登录失败:', error);
      throw new ApiError('登录失败，请稍后重试', 500);
    }
  }

  async verifyToken(token: string): Promise<UserResponse> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      
      // 从数据库获取最新用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new ApiError('用户不存在', 401);
      }

      if (!user.isActive) {
        throw new ApiError('账户已被停用', 403);
      }

      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        organizationId: user.organizationId,
        role: user.role,
        analysisQuota: user.analysisQuota,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        name: user.username // 添加name字段
      };

      return userResponse;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('令牌无效', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('令牌已过期', 401);
      }
      throw error;
    }
  }

  async refreshToken(token: string): Promise<LoginResponse> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw new ApiError('用户不存在或已停用', 401);
      }

      // 生成新 token
      const newToken = this.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        organizationId: user.organizationId ?? undefined,
        role: user.role
      });

      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        organizationId: user.organizationId,
        role: user.role,
        analysisQuota: user.analysisQuota,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        name: user.username // 添加name字段
      };

      return {
        user: userResponse,
        access_token: newToken,
        refresh_token: newToken, // 简化处理，使用相同token
        expires_in: this.getTokenExpiresIn()
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('令牌无效', 401);
      }
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      logger.warn(`密码重置请求，但用户不存在: ${email}`);
      return;
    }

    if (!user.isActive) {
      throw new ApiError('账户已被停用', 403);
    }

    // 生成重置令牌（这里简化处理，实际应该存储到数据库并设置过期时间）
    const resetToken = (jwt as any).sign(
      { userId: user.id, type: 'password_reset' },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    logger.info(`密码重置令牌已生成: ${user.username} (${email})`);
    
    // TODO: 发送重置邮件
    // 这里应该集成邮件服务发送重置链接
    console.log(`Reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as PasswordResetPayload;
      
      if (payload.type !== 'password_reset') {
        throw new ApiError('无效的重置令牌', 400);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        throw new ApiError('用户不存在', 404);
      }

      // 密码哈希
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      logger.info(`密码重置成功: ${user.username}`);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('重置令牌无效或已过期', 400);
      }
      throw error;
    }
  }

  private generateToken(payload: JwtPayload): string {
    return (jwt as any).sign(
      payload,
      this.jwtSecret,
      {
        expiresIn: this.jwtExpiresIn
      }
    );
  }

  private getTokenExpiresIn(): number {
    // 将过期时间转换为秒数
    const timeUnit = this.jwtExpiresIn.slice(-1);
    const timeValue = parseInt(this.jwtExpiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 3600;
      case 'd': return timeValue * 86400;
      default: return 7 * 86400; // 默认7天
    }
  }
}