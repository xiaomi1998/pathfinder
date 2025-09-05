import { User } from '@prisma/client';

// 用户创建输入类型
export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

// 用户更新输入类型
export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

// 用户响应类型（排除敏感信息）
export type UserResponse = Omit<User, 'passwordHash'> & {
  name?: string; // 为前端兼容添加name字段
};

// 登录输入类型
export interface LoginInput {
  email: string;
  password: string;
}

// 注册输入类型
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms_accepted: boolean;
}

// 登录响应类型
export interface LoginResponse {
  user: UserResponse;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// 用户统计类型
export interface UserStats {
  totalFunnels: number;
  totalNodes: number;
  totalAiSessions: number;
  lastLoginAt: Date | null;
  accountAge: number; // 天数
}

// 用户详情类型
export interface UserDetails extends UserResponse {
  stats: UserStats;
}