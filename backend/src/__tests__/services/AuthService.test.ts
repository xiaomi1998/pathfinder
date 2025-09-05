import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '@/services/AuthService';
import { ApiError } from '@/utils/ApiError';
import { prismaMock, createTestUser } from '../setup';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock)
}));

describe('AuthService', () => {
  let authService: AuthService;
  const testUser = createTestUser();

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    it('should successfully register a new user', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // username check
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // email check
      mockedBcrypt.hash.mockResolvedValue('hashedPassword');
      prismaMock.user.create.mockResolvedValue(testUser);
      mockedJwt.sign.mockReturnValue('mockToken' as any);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('TestPassword123!', 12);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedPassword'
        }
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
    });

    it('should throw error if passwords do not match', async () => {
      // Arrange
      const invalidData = {
        ...registerData,
        confirmPassword: 'DifferentPassword123!'
      };

      // Act & Assert
      await expect(authService.register(invalidData)).rejects.toThrow(
        new ApiError('确认密码与密码不匹配', 400)
      );
    });

    it('should throw error if username already exists', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValueOnce(testUser);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        new ApiError('用户名已存在', 409)
      );
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // username check
      prismaMock.user.findUnique.mockResolvedValueOnce(testUser); // email check

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        new ApiError('邮箱已被注册', 409)
      );
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue(testUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prismaMock.user.update.mockResolvedValue({ ...testUser, lastLoginAt: new Date() });
      mockedJwt.sign.mockReturnValue('mockToken' as any);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('TestPassword123!', testUser.passwordHash);
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should throw error if user does not exist', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new ApiError('邮箱或密码错误', 401)
      );
    });

    it('should throw error if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...testUser, isActive: false };
      prismaMock.user.findUnique.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new ApiError('账户已被停用，请联系管理员', 403)
      );
    });

    it('should throw error if password is invalid', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue(testUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        new ApiError('邮箱或密码错误', 401)
      );
    });
  });

  describe('verifyToken', () => {
    const mockToken = 'mockToken';
    const mockPayload = {
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email
    };

    it('should successfully verify a valid token', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockPayload as any);
      prismaMock.user.findUnique.mockResolvedValue(testUser);

      // Act
      const result = await authService.verifyToken(mockToken);

      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: testUser.id } });
      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe(testUser.username);
    });

    it('should throw error if token is invalid', async () => {
      // Arrange
      mockedJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(
        new ApiError('令牌无效', 401)
      );
    });

    it('should throw error if token is expired', async () => {
      // Arrange
      mockedJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(
        new ApiError('令牌已过期', 401)
      );
    });

    it('should throw error if user does not exist', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockPayload as any);
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(
        new ApiError('用户不存在', 401)
      );
    });

    it('should throw error if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...testUser, isActive: false };
      mockedJwt.verify.mockReturnValue(mockPayload as any);
      prismaMock.user.findUnique.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.verifyToken(mockToken)).rejects.toThrow(
        new ApiError('账户已被停用', 403)
      );
    });
  });

  describe('refreshToken', () => {
    const mockToken = 'mockToken';
    const mockPayload = {
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email
    };

    it('should successfully refresh a valid token', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockPayload as any);
      prismaMock.user.findUnique.mockResolvedValue(testUser);
      mockedJwt.sign.mockReturnValue('newMockToken' as any);

      // Act
      const result = await authService.refreshToken(mockToken);

      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: testUser.id } });
      expect(mockedJwt.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'newMockToken');
    });

    it('should throw error if token is invalid', async () => {
      // Arrange
      mockedJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken(mockToken)).rejects.toThrow(
        new ApiError('令牌无效', 401)
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should handle password reset request for existing user', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue(testUser);
      mockedJwt.sign.mockReturnValue('resetToken' as any);

      // Act
      await authService.requestPasswordReset('test@example.com');

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockedJwt.sign).toHaveBeenCalled();
    });

    it('should handle password reset request for non-existing user silently', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.requestPasswordReset('nonexistent@example.com')).resolves.not.toThrow();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
    });
  });

  describe('resetPassword', () => {
    const resetToken = 'resetToken';
    const newPassword = 'NewPassword123!';
    const mockPayload = {
      userId: testUser.id,
      type: 'password_reset'
    };

    it('should successfully reset password with valid token', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockPayload as any);
      prismaMock.user.findUnique.mockResolvedValue(testUser);
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword');
      prismaMock.user.update.mockResolvedValue(testUser);

      // Act
      await authService.resetPassword(resetToken, newPassword);

      // Assert
      expect(mockedJwt.verify).toHaveBeenCalledWith(resetToken, process.env.JWT_SECRET);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: testUser.id } });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: { passwordHash: 'newHashedPassword' }
      });
    });

    it('should throw error if token type is invalid', async () => {
      // Arrange
      const invalidPayload = { ...mockPayload, type: 'invalid' };
      mockedJwt.verify.mockReturnValue(invalidPayload as any);

      // Act & Assert
      await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow(
        new ApiError('无效的重置令牌', 400)
      );
    });

    it('should throw error if user does not exist', async () => {
      // Arrange
      mockedJwt.verify.mockReturnValue(mockPayload as any);
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow(
        new ApiError('用户不存在', 404)
      );
    });

    it('should throw error if token is invalid', async () => {
      // Arrange
      mockedJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      // Act & Assert
      await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow(
        new ApiError('重置令牌无效或已过期', 400)
      );
    });
  });
});