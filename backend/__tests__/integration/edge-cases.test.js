import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

describe('Edge Cases and Security Tests', () => {
  let app;

  beforeAll(async () => {
    const serverModule = await import('../../src/server.js');
    app = serverModule.default || serverModule.app;
  });

  describe('Input Validation', () => {
    it('should reject extremely large payloads', async () => {
      const largePayload = {
        clues: Array(10000).fill({ clue: 'test', location: 'test' }),
        answers: Array(10000).fill({ lat: 0, long: 0 })
      };

      const response = await request(app)
        .post('/encrypt')
        .send(largePayload)
        .expect(413); // Payload too large
    });

    it('should handle special characters in riddle generation', async () => {
      const requestData = {
        locations: [
          { name: 'Test <script>alert("xss")</script>', lat: 0, lng: 0 }
        ],
        theme: 'mystery & adventure'
      };

      const response = await request(app)
        .post('/generate-riddles')
        .send(requestData);

      // Should either sanitize or reject
      expect([200, 400]).toContain(response.status);
    });

    it('should handle null values gracefully', async () => {
      const response = await request(app)
        .post('/encrypt')
        .send({ clues: null, answers: null })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle undefined values gracefully', async () => {
      const response = await request(app)
        .post('/decrypt-ans')
        .send({ cLat: undefined, cLong: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});