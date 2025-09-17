import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Performance Tests', () => {
  let authToken: string;
  let funnelId: string;
  const performanceResults: { endpoint: string; avgTime: number; maxTime: number; minTime: number }[] = [];

  beforeAll(async () => {
    // Create test user and login
    const testUser = {
      username: 'perf_test_user',
      email: 'perftest@pathfinder.com',
      password: 'PerfTest123!'
    };

    // Clean up existing test data
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });

    // Register and login
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password
      });

    authToken = registerResponse.body.token;

    // Create test funnel with data
    const funnelResponse = await request(app)
      .post('/api/funnels')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Performance Test Funnel',
        canvasData: {
          nodes: [
            { id: 'awareness', type: 'awareness', position: { x: 0, y: 0 } },
            { id: 'interest', type: 'interest', position: { x: 200, y: 0 } },
            { id: 'purchase', type: 'purchase', position: { x: 400, y: 0 } }
          ],
          edges: [
            { id: 'e1', source: 'awareness', target: 'interest' },
            { id: 'e2', source: 'interest', target: 'purchase' }
          ]
        }
      });

    funnelId = funnelResponse.body.id;

    // Add metrics data
    await request(app)
      .post('/api/metric-datasets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        funnelId,
        period: '2024-01',
        data: {
          awareness: { value: 10000, conversion: null },
          interest: { value: 2500, conversion: 0.25 },
          purchase: { value: 250, conversion: 0.10 }
        }
      });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.funnel.deleteMany({
      where: { name: 'Performance Test Funnel' }
    });
    await prisma.user.deleteMany({
      where: { email: 'perftest@pathfinder.com' }
    });
    
    // Log performance results
    console.log('\n📊 API Performance Test Results:');
    console.log('='.repeat(80));
    performanceResults.forEach(result => {
      const status = result.avgTime < 2000 ? '✅' : result.avgTime < 5000 ? '⚠️' : '❌';
      console.log(`${status} ${result.endpoint}`);
      console.log(`   Average: ${result.avgTime}ms | Min: ${result.minTime}ms | Max: ${result.maxTime}ms`);
    });
    
    await prisma.$disconnect();
  });

  async function measureEndpoint(
    name: string,
    requestFn: () => Promise<request.Response>,
    iterations: number = 10
  ) {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await requestFn();
      const duration = Date.now() - startTime;
      times.push(duration);
    }

    const avgTime = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    performanceResults.push({
      endpoint: name,
      avgTime,
      minTime,
      maxTime
    });

    return { avgTime, minTime, maxTime };
  }

  describe('Core API Performance Requirements', () => {
    test('Data query response time < 1 second', async () => {
      const result = await measureEndpoint(
        'GET /api/funnels',
        () => request(app)
          .get('/api/funnels')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );

      expect(result.avgTime).toBeLessThan(1000);
    });

    test('Page load supporting APIs < 2 seconds', async () => {
      const result = await measureEndpoint(
        'GET /api/auth/me',
        () => request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );

      expect(result.avgTime).toBeLessThan(2000);
    });

    test('AI analysis response time < 5 seconds', async () => {
      const result = await measureEndpoint(
        'GET /api/analysis/funnel/:id/diagnostics',
        () => request(app)
          .get(`/api/analysis/funnel/${funnelId}/diagnostics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
        5 // Fewer iterations for AI tests as they're slower
      );

      expect(result.avgTime).toBeLessThan(5000);
    });

    test('Data entry operations < 2 seconds', async () => {
      let counter = 0;
      const result = await measureEndpoint(
        'POST /api/metric-datasets',
        () => request(app)
          .post('/api/metric-datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            funnelId,
            period: `2024-${String(++counter).padStart(2, '0')}`,
            data: {
              awareness: { value: 10000 + counter, conversion: null },
              interest: { value: 2500 + counter, conversion: 0.25 },
              purchase: { value: 250 + counter, conversion: 0.10 }
            }
          })
          .expect(201)
      );

      expect(result.avgTime).toBeLessThan(2000);
    });

    test('Benchmark comparison < 1 second', async () => {
      const result = await measureEndpoint(
        'GET /api/analysis/funnel/:id/benchmark',
        () => request(app)
          .get(`/api/analysis/funnel/${funnelId}/benchmark`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      );

      expect(result.avgTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent User Load Tests', () => {
    test('Handle 10 concurrent requests', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/funnels')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(5000);

      console.log(`✅ 10 concurrent requests completed in ${totalTime}ms`);
    });

    test('Handle 25 concurrent data entry requests', async () => {
      const concurrentRequests = Array(25).fill(null).map((_, index) =>
        request(app)
          .post('/api/metric-datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            funnelId,
            period: `2024-concurrent-${index}`,
            data: {
              awareness: { value: 10000 + index, conversion: null },
              interest: { value: 2500 + index, conversion: 0.25 },
              purchase: { value: 250 + index, conversion: 0.10 }
            }
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(20); // Allow some failures under load

      console.log(`✅ ${successCount}/25 concurrent data entries completed in ${totalTime}ms`);
    });

    test('Stress test: 50 rapid sequential requests', async () => {
      const startTime = Date.now();
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < 50; i++) {
        try {
          const response = await request(app)
            .get('/api/funnels')
            .set('Authorization', `Bearer ${authToken}`);
          
          if (response.status === 200) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 50;

      // Should handle majority of requests successfully
      expect(successCount).toBeGreaterThan(40);
      expect(avgTime).toBeLessThan(1000); // Average response time

      console.log(`✅ Stress test: ${successCount}/50 requests successful, avg ${avgTime.toFixed(1)}ms per request`);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Memory usage should remain stable under load', async () => {
      const initialMemory = process.memoryUsage();

      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get(`/api/analysis/funnel/${funnelId}/diagnostics`)
          .set('Authorization', `Bearer ${authToken}`);
      }

      const finalMemory = process.memoryUsage();
      
      // Memory increase should be reasonable (less than 100MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      expect(memoryIncreaseMB).toBeLessThan(100);

      console.log(`💾 Memory usage increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    });

    test('Database connection pool efficiency', async () => {
      // Test rapid database operations
      const startTime = Date.now();
      
      const promises = Array(50).fill(null).map(() =>
        prisma.user.count()
      );

      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000);

      console.log(`🗄️ 50 database operations completed in ${totalTime}ms`);
    });
  });

  describe('Large Dataset Performance', () => {
    test('Handle large funnel with many metrics', async () => {
      // Create funnel with many nodes
      const largeCanvasData = {
        nodes: Array(20).fill(null).map((_, i) => ({
          id: `node-${i}`,
          type: 'awareness',
          position: { x: i * 100, y: 0 },
          data: { label: `Stage ${i}` }
        })),
        edges: Array(19).fill(null).map((_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`
        }))
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/funnels')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Large Performance Test Funnel',
          canvasData: largeCanvasData
        })
        .expect(201);

      const createTime = Date.now() - startTime;
      expect(createTime).toBeLessThan(5000);

      // Test retrieving large funnel
      const retrieveStart = Date.now();
      await request(app)
        .get(`/api/funnels/${response.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const retrieveTime = Date.now() - retrieveStart;
      expect(retrieveTime).toBeLessThan(2000);

      console.log(`📊 Large funnel (20 nodes): Create ${createTime}ms, Retrieve ${retrieveTime}ms`);

      // Clean up
      await prisma.funnel.delete({ where: { id: response.body.id } });
    });

    test('Handle multiple metrics periods for same funnel', async () => {
      // Add metrics for 12 months
      const periods = Array(12).fill(null).map((_, i) => 
        `2024-${String(i + 1).padStart(2, '0')}`
      );

      const startTime = Date.now();

      for (const period of periods) {
        await request(app)
          .post('/api/metric-datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            funnelId,
            period,
            data: {
              awareness: { value: 10000 + Math.random() * 1000, conversion: null },
              interest: { value: 2500 + Math.random() * 500, conversion: 0.25 },
              purchase: { value: 250 + Math.random() * 50, conversion: 0.10 }
            }
          })
          .expect(201);
      }

      const insertTime = Date.now() - startTime;

      // Test retrieving all metrics
      const retrieveStart = Date.now();
      const response = await request(app)
        .get(`/api/metric-datasets/funnel/${funnelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const retrieveTime = Date.now() - retrieveStart;

      expect(insertTime).toBeLessThan(10000); // 10 seconds for 12 inserts
      expect(retrieveTime).toBeLessThan(2000);  // 2 seconds for retrieval
      expect(response.body.length).toBeGreaterThanOrEqual(12);

      console.log(`📈 12-month metrics: Insert ${insertTime}ms, Retrieve ${retrieveTime}ms`);
    });
  });
});