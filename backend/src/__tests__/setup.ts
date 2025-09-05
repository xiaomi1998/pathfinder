import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma Client for testing
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockDeep<PrismaClient>())
}));

// Create a mock instance that we can control in tests
export const prismaMock = mockDeep<PrismaClient>();

// Mock the Prisma Client constructor to return our mock
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/pathfinder_test';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set up global test timeout
jest.setTimeout(10000);

// Mock Date.now() for consistent timestamps in tests
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

// Mock crypto randomUUID for consistent UUIDs in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000')
  }
});

// Helper function to create test user data
export const createTestUser = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: '$2a$12$hash',
  createdAt: mockDate,
  updatedAt: mockDate,
  lastLoginAt: null,
  isActive: true
});

// Helper function to create test funnel data
export const createTestFunnel = (userId: string) => ({
  id: '550e8400-e29b-41d4-a716-446655440001',
  userId,
  name: 'Test Funnel',
  description: 'A test funnel',
  canvasData: null,
  createdAt: mockDate,
  updatedAt: mockDate
});

// Helper function to create test node data
export const createTestNode = (funnelId: string) => ({
  id: '550e8400-e29b-41d4-a716-446655440002',
  funnelId,
  nodeType: 'awareness' as const,
  label: 'Test Node',
  positionX: 100,
  positionY: 200,
  createdAt: mockDate,
  updatedAt: mockDate
});

// Helper function to create test edge data
export const createTestEdge = (funnelId: string, sourceNodeId: string, targetNodeId: string) => ({
  id: '550e8400-e29b-41d4-a716-446655440003',
  funnelId,
  sourceNodeId,
  targetNodeId,
  createdAt: mockDate
});

// Helper function to create test node data
export const createTestNodeData = (nodeId: string) => ({
  id: '550e8400-e29b-41d4-a716-446655440004',
  nodeId,
  weekStartDate: new Date('2024-01-01'),
  entryCount: 1000,
  convertedCount: 800,
  conversionRate: 0.8,
  createdAt: mockDate,
  updatedAt: mockDate
});

// Clean up after all tests
afterAll(async () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});