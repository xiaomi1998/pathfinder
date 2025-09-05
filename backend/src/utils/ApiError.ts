export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string, 
    statusCode: number = 500, 
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // 确保堆栈跟踪正确指向这个错误
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // 静态方法用于创建常见的错误
  static badRequest(message: string = '请求参数错误', details?: any): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = '未授权访问'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = '访问被拒绝'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = '资源不存在'): ApiError {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string = '资源冲突'): ApiError {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static unprocessableEntity(message: string = '无法处理的实体', details?: any): ApiError {
    return new ApiError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message: string = '请求过于频繁'): ApiError {
    return new ApiError(message, 429, 'TOO_MANY_REQUESTS');
  }

  static internalServerError(message: string = '服务器内部错误', details?: any): ApiError {
    return new ApiError(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }

  static serviceUnavailable(message: string = '服务不可用'): ApiError {
    return new ApiError(message, 503, 'SERVICE_UNAVAILABLE');
  }

  // 转换为 JSON 响应格式
  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details })
    };
  }
}