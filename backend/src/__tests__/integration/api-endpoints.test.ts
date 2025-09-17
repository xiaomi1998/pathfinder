import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('API Endpoints Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testFunnelId: string;
  let testOrganizationId: string;
  let adminToken: string;

  const testUser = {
    username: 'integration_test_user',
    email: 'integration_test@pathfinder.com',
    password: 'TestPassword123!'
  };

  const testAdmin = {
    username: 'integration_admin',
    email: 'admin_test@pathfinder.com',
    password: 'AdminPassword123!'
  };

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { email: testAdmin.email }
        ]
      }
    });

    // Create test admin user
    const hashedPassword = await bcrypt.hash(testAdmin.password, 12);
    await prisma.user.create({
      data: {
        username: testAdmin.username,
        email: testAdmin.email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.funnel.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.organization.deleteMany({
      where: { id: testOrganizationId }
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { email: testAdmin.email }
        ]
      }
    });
    
    await prisma.$disconnect();
  });

  describe('Authentication Flow', () => {
    test('POST /api/auth/register - should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password,
          confirmPassword: testUser.password
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      
      authToken = response.body.token;
      testUserId = response.body.user.id;
    });

    test('POST /api/auth/register - should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'another_user',
          email: testUser.email, // Same email
          password: testUser.password,
          confirmPassword: testUser.password
        })
        .expect(409);
    });

    test('POST /api/auth/login - should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    test('GET /api/auth/me - should return current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.username).toBe(testUser.username);
    });

    test('GET /api/auth/me - should reject without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('Organization Management', () => {
    test('POST /api/organizations - should create organization', async () => {
      const orgData = {
        name: 'Test Integration Company',
        website: 'https://test-integration.com',
        industry: 'Technology',
        size: '51-200',
        description: 'Integration test organization'
      };

      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body.name).toBe(orgData.name);
      expect(response.body.website).toBe(orgData.website);
      expect(response.body.industry).toBe(orgData.industry);
      
      testOrganizationId = response.body.id;
    });

    test('GET /api/organizations/me - should return user\'s organization', async () => {
      const response = await request(app)
        .get('/api/organizations/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testOrganizationId);
      expect(response.body.name).toBe('Test Integration Company');
    });

    test('PUT /api/organizations/me - should update organization', async () => {
      const updateData = {
        name: 'Updated Test Company',
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/api/organizations/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });
  });

  describe('Funnel Management', () => {
    test('POST /api/funnels - should create funnel', async () => {
      const funnelData = {
        name: 'Integration Test Funnel',
        description: 'Test funnel for integration testing',
        canvasData: {
          nodes: [
            {
              id: 'awareness',
              type: 'awareness',
              position: { x: 100, y: 100 },
              data: { label: 'Awareness', metrics: {} }
            },
            {
              id: 'interest',
              type: 'interest', 
              position: { x: 300, y: 100 },
              data: { label: 'Interest', metrics: {} }
            }
          ],
          edges: [
            {
              id: 'awareness-interest',
              source: 'awareness',
              target: 'interest'
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${authToken}`)
        .send(funnelData)
        .expect(201);

      expect(response.body.name).toBe(funnelData.name);
      expect(response.body.description).toBe(funnelData.description);
      expect(response.body.canvasData.nodes).toHaveLength(2);
      
      testFunnelId = response.body.id;
    });

    test('GET /api/funnels - should return user funnels', async () => {
      const response = await request(app)
        .get('/api/funnels')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });

    test('GET /api/funnels/:id - should return specific funnel', async () => {
      const response = await request(app)
        .get(`/api/funnels/${testFunnelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testFunnelId);
      expect(response.body.name).toBe('Integration Test Funnel');
    });

    test('PUT /api/funnels/:id - should update funnel', async () => {
      const updateData = {
        name: 'Updated Integration Funnel',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/funnels/${testFunnelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    test('GET /api/funnels/:id - should reject unauthorized access', async () => {
      // Try to access funnel without authentication
      await request(app)
        .get(`/api/funnels/${testFunnelId}`)
        .expect(401);
    });
  });

  describe('Metric Dataset Management', () => {
    test('POST /api/metric-datasets - should create metric dataset', async () => {
      const metricData = {
        funnelId: testFunnelId,
        period: '2024-01',
        data: {
          awareness: { value: 10000, conversion: null },
          interest: { value: 5000, conversion: 0.5 }
        }
      };

      const response = await request(app)
        .post('/api/metric-datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(metricData)
        .expect(201);

      expect(response.body.funnelId).toBe(testFunnelId);
      expect(response.body.period).toBe(metricData.period);
      expect(response.body.data).toEqual(metricData.data);
    });

    test('GET /api/metric-datasets/funnel/:funnelId - should return funnel metrics', async () => {
      const response = await request(app)
        .get(`/api/metric-datasets/funnel/${testFunnelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('period');
      expect(response.body[0]).toHaveProperty('data');
    });
  });

  describe('Analysis Endpoints', () => {
    test('GET /api/analysis/funnel/:id/diagnostics - should return funnel diagnostics', async () => {
      const response = await request(app)
        .get(`/api/analysis/funnel/${testFunnelId}/diagnostics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('diagnostics');
      expect(response.body).toHaveProperty('insights');
      expect(Array.isArray(response.body.diagnostics)).toBe(true);
    });

    test('GET /api/analysis/funnel/:id/benchmark - should return benchmark comparison', async () => {
      const response = await request(app)
        .get(`/api/analysis/funnel/${testFunnelId}/benchmark`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('comparison');
      expect(response.body).toHaveProperty('recommendations');
    });
  });

  describe('Admin Endpoints', () => {
    beforeAll(async () => {
      // Login as admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password
        })
        .expect(200);
      
      adminToken = loginResponse.body.token;
    });

    test('GET /api/admin/users - should return users list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    test('PUT /api/admin/users/:id/status - should update user status', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    test('GET /api/admin/users - should reject non-admin access', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .expect(403);
    });

    test('POST /api/admin/benchmark-data - should create benchmark data', async () => {
      const benchmarkData = {
        industry: 'Technology',
        stage: 'awareness-interest',
        p25: 0.3,
        p50: 0.5,
        p75: 0.7,
        source: 'Integration Test'
      };

      const response = await request(app)
        .post('/api/admin/benchmark-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(benchmarkData)
        .expect(201);

      expect(response.body.industry).toBe(benchmarkData.industry);
      expect(response.body.stage).toBe(benchmarkData.stage);
      expect(response.body.p50).toBe(benchmarkData.p50);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON payload', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
          // missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('should handle invalid funnel ID', async () => {
      await request(app)
        .get('/api/funnels/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limiting on auth endpoints', async () => {
      // This test depends on rate limiting configuration
      // Making multiple rapid requests to trigger rate limit
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrong'
          })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});