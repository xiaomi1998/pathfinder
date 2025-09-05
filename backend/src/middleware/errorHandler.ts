import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误信息
  logger.error('API 错误:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    requestId: req.requestId,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // 检查响应是否已发送
  if (res.headersSent) {
    return next(error);
  }

  // 如果是我们自定义的 API 错误
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      requestId: req.requestId
    });
  }

  // Prisma 错误处理
  if (error.code && error.code.startsWith('P')) {
    return handlePrismaError(error, res, req.requestId);
  }

  // Validation 错误（express-validator）
  if (error.type === 'validation') {
    return res.status(400).json({
      success: false,
      error: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      details: error.errors,
      requestId: req.requestId
    });
  }

  // JSON 解析错误
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON 格式错误',
      code: 'JSON_PARSE_ERROR',
      requestId: req.requestId
    });
  }

  // JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '令牌无效',
      code: 'INVALID_TOKEN',
      requestId: req.requestId
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '令牌已过期',
      code: 'TOKEN_EXPIRED',
      requestId: req.requestId
    });
  }

  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: '文件大小超出限制',
      code: 'FILE_TOO_LARGE',
      requestId: req.requestId
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: '意外的文件字段',
      code: 'UNEXPECTED_FILE',
      requestId: req.requestId
    });
  }

  // 数据库连接错误
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: '数据库连接失败',
      code: 'DATABASE_CONNECTION_ERROR',
      requestId: req.requestId
    });
  }

  // 默认服务器内部错误
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : error.message || '服务器内部错误';

  return res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

// Prisma 错误处理
const handlePrismaError = (error: any, res: Response, requestId?: string) => {
  let message = '数据库操作失败';
  let statusCode = 500;
  let code = 'DATABASE_ERROR';

  switch (error.code) {
    case 'P2000':
      message = '提供的值对字段来说太长';
      statusCode = 400;
      code = 'VALUE_TOO_LONG';
      break;

    case 'P2001':
      message = '查询的记录不存在';
      statusCode = 404;
      code = 'RECORD_NOT_FOUND';
      break;

    case 'P2002':
      message = '唯一约束失败';
      statusCode = 409;
      code = 'UNIQUE_CONSTRAINT_FAILED';
      break;

    case 'P2003':
      message = '外键约束失败';
      statusCode = 400;
      code = 'FOREIGN_KEY_CONSTRAINT_FAILED';
      break;

    case 'P2004':
      message = '数据库约束失败';
      statusCode = 400;
      code = 'CONSTRAINT_FAILED';
      break;

    case 'P2005':
      message = '字段值无效';
      statusCode = 400;
      code = 'INVALID_FIELD_VALUE';
      break;

    case 'P2006':
      message = '提供的值对字段类型无效';
      statusCode = 400;
      code = 'INVALID_VALUE_TYPE';
      break;

    case 'P2007':
      message = '数据验证错误';
      statusCode = 400;
      code = 'DATA_VALIDATION_ERROR';
      break;

    case 'P2008':
      message = '查询解析失败';
      statusCode = 400;
      code = 'QUERY_PARSE_ERROR';
      break;

    case 'P2009':
      message = '查询验证失败';
      statusCode = 400;
      code = 'QUERY_VALIDATION_ERROR';
      break;

    case 'P2010':
      message = '原始查询失败';
      statusCode = 400;
      code = 'RAW_QUERY_FAILED';
      break;

    case 'P2011':
      message = '空约束违规';
      statusCode = 400;
      code = 'NULL_CONSTRAINT_VIOLATION';
      break;

    case 'P2012':
      message = '缺少必需值';
      statusCode = 400;
      code = 'MISSING_REQUIRED_VALUE';
      break;

    case 'P2013':
      message = '缺少必需参数';
      statusCode = 400;
      code = 'MISSING_REQUIRED_ARGUMENT';
      break;

    case 'P2014':
      message = '关系违规';
      statusCode = 400;
      code = 'RELATION_VIOLATION';
      break;

    case 'P2015':
      message = '找不到相关记录';
      statusCode = 404;
      code = 'RELATED_RECORD_NOT_FOUND';
      break;

    case 'P2016':
      message = '查询解释错误';
      statusCode = 400;
      code = 'QUERY_INTERPRETATION_ERROR';
      break;

    case 'P2017':
      message = '记录之间的关系未连接';
      statusCode = 400;
      code = 'RECORDS_NOT_CONNECTED';
      break;

    case 'P2018':
      message = '找不到所需的连接记录';
      statusCode = 400;
      code = 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND';
      break;

    case 'P2019':
      message = '输入错误';
      statusCode = 400;
      code = 'INPUT_ERROR';
      break;

    case 'P2020':
      message = '值超出范围';
      statusCode = 400;
      code = 'VALUE_OUT_OF_RANGE';
      break;

    case 'P2021':
      message = '表不存在';
      statusCode = 400;
      code = 'TABLE_NOT_EXISTS';
      break;

    case 'P2022':
      message = '列不存在';
      statusCode = 400;
      code = 'COLUMN_NOT_EXISTS';
      break;

    case 'P2025':
      message = '操作失败，因为依赖于不存在的记录';
      statusCode = 400;
      code = 'RECORD_NOT_FOUND';
      break;

    default:
      logger.error('未处理的 Prisma 错误:', error);
      break;
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
    requestId,
    ...(process.env.NODE_ENV === 'development' && {
      prismaError: error.code,
      details: error.meta
    })
  });
};