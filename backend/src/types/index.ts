// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 查询参数类型
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// 错误类型
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

// JWT 载荷类型
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

// 密码重置JWT载荷类型
export interface PasswordResetPayload {
  userId: string;
  type: 'password_reset';
  iat?: number;
  exp?: number;
}

// 请求用户类型
export interface RequestUser {
  id: string;
  username: string;
  email: string;
}

// Express Request 扩展
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      requestId?: string;
    }
  }
}

export * from './user';
export * from './funnel';
export * from './node';
export * from './edge';
export * from './ai';
export * from './organization';
