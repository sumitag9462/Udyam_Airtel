import request from 'supertest';
import app from '../../src/app.js';

describe('Health Endpoints', () => {
  describe('GET /healthz', () => {
    it('returns 200 with status healthy and timestamp', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /readyz', () => {
    it('returns database readiness state', async () => {
      const res = await request(app).get('/readyz');
      // When mongoose is not connected yet, it returns 503
      expect([200, 503]).toContain(res.status);
      expect(res.body.data.database).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('returns structured 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
