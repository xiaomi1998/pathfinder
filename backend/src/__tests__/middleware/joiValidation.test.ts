import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate, validateBody, validateQuery, validateParams } from '@/middleware/joiValidation';
import { ApiError } from '@/utils/ApiError';

// Mock the logger
jest.mock('@/utils/logger', () => ({
  logger: {
    warn: jest.fn()
  }
}));

describe('joiValidation middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: {},
      user: { id: 'test-user-id' },
      requestId: 'test-request-id'
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate function', () => {
    it('should pass validation when all schemas are valid', () => {
      // Arrange
      const bodySchema = Joi.object({
        name: Joi.string().required()
      });
      const querySchema = Joi.object({
        page: Joi.number().default(1)
      });
      
      mockRequest.body = { name: 'test' };
      mockRequest.query = { page: '1' };

      const middleware = validate({
        body: bodySchema,
        query: querySchema
      });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'test' });
      expect(mockRequest.query).toEqual({ page: 1 }); // Should be converted to number
    });

    it('should call next with ApiError when body validation fails', () => {
      // Arrange
      const bodySchema = Joi.object({
        email: Joi.string().email().required(),
        age: Joi.number().min(18).required()
      });
      
      mockRequest.body = {
        email: 'invalid-email',
        age: 16
      };

      const middleware = validate({ body: bodySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(2);
    });

    it('should call next with ApiError when query validation fails', () => {
      // Arrange
      const querySchema = Joi.object({
        page: Joi.number().min(1).required(),
        limit: Joi.number().min(1).max(100).required()
      });
      
      mockRequest.query = {
        page: '0',
        limit: '150'
      };

      const middleware = validate({ query: querySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(2);
    });

    it('should call next with ApiError when params validation fails', () => {
      // Arrange
      const paramsSchema = Joi.object({
        id: Joi.string().uuid().required()
      });
      
      mockRequest.params = {
        id: 'invalid-uuid'
      };

      const middleware = validate({ params: paramsSchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(1);
    });

    it('should strip unknown fields when stripUnknown is true', () => {
      // Arrange
      const bodySchema = Joi.object({
        name: Joi.string().required()
      });
      
      mockRequest.body = {
        name: 'test',
        unknownField: 'should be removed'
      };

      const middleware = validate({ body: bodySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'test' });
      expect(mockRequest.body).not.toHaveProperty('unknownField');
    });

    it('should apply default values from schema', () => {
      // Arrange
      const querySchema = Joi.object({
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
        sort: Joi.string().default('createdAt')
      });
      
      mockRequest.query = {}; // Empty query

      const middleware = validate({ query: querySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10,
        sort: 'createdAt'
      });
    });
  });

  describe('validateBody function', () => {
    it('should validate only request body', () => {
      // Arrange
      const schema = Joi.object({
        username: Joi.string().min(3).required()
      });
      
      mockRequest.body = { username: 'testuser' };
      mockRequest.query = { invalid: 'should not be validated' };

      const middleware = validateBody(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ username: 'testuser' });
      expect(mockRequest.query).toEqual({ invalid: 'should not be validated' }); // Unchanged
    });
  });

  describe('validateQuery function', () => {
    it('should validate only query parameters', () => {
      // Arrange
      const schema = Joi.object({
        search: Joi.string().optional(),
        page: Joi.number().min(1).default(1)
      });
      
      mockRequest.query = { search: 'test', page: '2' };
      mockRequest.body = { invalid: 'should not be validated' };

      const middleware = validateQuery(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({ search: 'test', page: 2 });
      expect(mockRequest.body).toEqual({ invalid: 'should not be validated' }); // Unchanged
    });
  });

  describe('validateParams function', () => {
    it('should validate only path parameters', () => {
      // Arrange
      const schema = Joi.object({
        id: Joi.string().uuid().required(),
        type: Joi.string().valid('funnel', 'node').required()
      });
      
      mockRequest.params = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'funnel'
      };
      mockRequest.body = { invalid: 'should not be validated' };

      const middleware = validateParams(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.params).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'funnel'
      });
      expect(mockRequest.body).toEqual({ invalid: 'should not be validated' }); // Unchanged
    });
  });

  describe('complex validation scenarios', () => {
    it('should handle nested object validation', () => {
      // Arrange
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          preferences: Joi.object({
            theme: Joi.string().valid('light', 'dark').default('light'),
            notifications: Joi.boolean().default(true)
          }).optional()
        }).required()
      });
      
      mockRequest.body = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          preferences: {
            theme: 'dark'
          }
        }
      };

      const middleware = validateBody(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body.user.preferences.notifications).toBe(true); // Default applied
      expect(mockRequest.body.user.preferences.theme).toBe('dark');
    });

    it('should handle array validation', () => {
      // Arrange
      const schema = Joi.object({
        tags: Joi.array()
          .items(Joi.string().min(2).max(20))
          .min(1)
          .max(5)
          .required(),
        items: Joi.array()
          .items(
            Joi.object({
              id: Joi.string().uuid().required(),
              value: Joi.number().required()
            })
          )
          .optional()
      });
      
      mockRequest.body = {
        tags: ['tag1', 'tag2', 'tag3'],
        items: [
          { id: '550e8400-e29b-41d4-a716-446655440000', value: 100 },
          { id: '550e8400-e29b-41d4-a716-446655440001', value: 200 }
        ]
      };

      const middleware = validateBody(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body.tags).toHaveLength(3);
      expect(mockRequest.body.items).toHaveLength(2);
    });

    it('should provide detailed error information for nested validation failures', () => {
      // Arrange
      const schema = Joi.object({
        user: Joi.object({
          profile: Joi.object({
            firstName: Joi.string().min(2).required(),
            lastName: Joi.string().min(2).required(),
            age: Joi.number().min(18).max(120).required()
          }).required()
        }).required()
      });
      
      mockRequest.body = {
        user: {
          profile: {
            firstName: 'A', // Too short
            lastName: '', // Empty
            age: 150 // Too high
          }
        }
      };

      const middleware = validateBody(schema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as ApiError;
      expect(error.details).toHaveLength(3);
      expect(error.details[0].field).toBe('user.profile.firstName');
      expect(error.details[1].field).toBe('user.profile.lastName');
      expect(error.details[2].field).toBe('user.profile.age');
    });
  });
});