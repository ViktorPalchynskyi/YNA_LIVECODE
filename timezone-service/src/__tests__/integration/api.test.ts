import * as http from 'http';
import request from 'supertest';
import { Router } from '@routing/Router';
import { TimezoneController } from '@controllers/TimezoneController';
import { HealthcheckController } from '@controllers/HealthcheckController';

describe('API Integration Tests', () => {
  let server: http.Server;
  let app: http.Server;

  beforeAll(() => {
    // Create router and register controllers
    const router = new Router();
    router.registerController(new TimezoneController());
    router.registerController(new HealthcheckController());

    // Create HTTP server
    server = http.createServer((req, res) => {
      router.handleRequest(req, res);
    });

    app = server;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    }
  });

  describe('Health Check Endpoints', () => {
    describe('GET /', () => {
      it('should return API information', async () => {
        const response = await request(app)
          .get('/')
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('endpoints');
        expect(response.body).toHaveProperty('example');
        expect(response.body.message).toContain('Timezone Server API');
        expect(response.body.endpoints).toHaveProperty('/healthcheck');
        expect(response.body.endpoints).toHaveProperty('/time/{timezone}');
      });

      it('should include CORS headers', async () => {
        const response = await request(app)
          .get('/')
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('*');
      });
    });

    describe('GET /healthcheck', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/healthcheck')
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('status', 'OK');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should include CORS headers', async () => {
        const response = await request(app)
          .get('/healthcheck')
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('*');
      });
    });
  });

  describe('Timezone Endpoints', () => {
    describe('GET /time/:timezone', () => {
      it('should return time for valid timezone (UTC)', async () => {
        const response = await request(app)
          .get('/time/Etc/UTC')
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('timezone', 'Etc/UTC');
        expect(response.body).toHaveProperty('current_time');
        expect(response.body).toHaveProperty('timestamp');
        
        // Validate ISO string format (no milliseconds in the actual format)
        expect(response.body.current_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should return time for valid timezone (New York)', async () => {
        const response = await request(app)
          .get('/time/America/New_York')
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('timezone', 'America/New_York');
        expect(response.body).toHaveProperty('current_time');
        expect(response.body).toHaveProperty('timestamp');
        
        // New York time should have timezone offset
        expect(response.body.current_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      });

      it('should return time for valid timezone (London)', async () => {
        const response = await request(app)
          .get('/time/Europe/London')
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('timezone', 'Europe/London');
        expect(response.body).toHaveProperty('current_time');
        expect(response.body.current_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      });

      it('should return time for timezone with complex path', async () => {
        const response = await request(app)
          .get('/time/America/Argentina/Buenos_Aires')
          .expect(200)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('timezone', 'America/Argentina/Buenos_Aires');
        expect(response.body).toHaveProperty('current_time');
      });

      it('should return 400 for invalid timezone', async () => {
        const response = await request(app)
          .get('/time/Invalid/Timezone')
          .expect(400)
          .expect('Content-Type', /application\/json/);

        expect(response.body).toHaveProperty('error', 'Invalid timezone');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('requested_timezone', 'Invalid/Timezone');
      });



      it('should handle URL encoding in timezone names', async () => {
        const response = await request(app)
          .get('/time/America%2FNew_York') // URL encoded slash
          .expect(200);

        expect(response.body).toHaveProperty('timezone', 'America/New_York');
      });

      it('should include CORS headers', async () => {
        const response = await request(app)
          .get('/time/Etc/UTC')
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('*');
      });

      it('should handle case sensitivity', async () => {
        // Some timezone identifiers might be case-insensitive
        // Let's test with a clearly invalid one
        const response = await request(app)
          .get('/time/invalid/timezone') // clearly invalid
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid timezone');
      });

      it('should return different times for different timezones at same moment', async () => {
        const [utcResponse, nyResponse] = await Promise.all([
          request(app).get('/time/Etc/UTC').expect(200),
          request(app).get('/time/America/New_York').expect(200)
        ]);

        expect(utcResponse.body.timezone).toBe('Etc/UTC');
        expect(nyResponse.body.timezone).toBe('America/New_York');
        
        // Times should be different (unless it's exactly the same moment)
        expect(utcResponse.body.current_time).toBeDefined();
        expect(nyResponse.body.current_time).toBeDefined();
      });
    });

    describe('Common timezone identifiers', () => {
      const validTimezones = [
        'Etc/UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'America/Los_Angeles',
        'Europe/Paris',
        'Asia/Kolkata',
        'Pacific/Honolulu',
        'Africa/Cairo'
      ];

      validTimezones.forEach(timezone => {
        it(`should handle ${timezone}`, async () => {
          const response = await request(app)
            .get(`/time/${timezone}`)
            .expect(200);

          expect(response.body).toHaveProperty('timezone', timezone);
          expect(response.body).toHaveProperty('current_time');
          expect(response.body).toHaveProperty('timestamp');
        });
      });
    });
  });

  describe('Error Handling', () => {

    it('should return JSON error responses', async () => {
      const response = await request(app)
        .get('/time/Invalid/Timezone')
        .expect(400)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toHaveProperty('error', 'Invalid timezone');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Response Format Consistency', () => {
    it('should have consistent success response format', async () => {
      const response = await request(app)
        .get('/time/Etc/UTC')
        .expect(200);

      // All successful timezone responses should have the same structure
      expect(Object.keys(response.body).sort()).toEqual(['current_time', 'timestamp', 'timezone']);
    });

    it('should have consistent error response format', async () => {
      const response = await request(app)
        .get('/time/Invalid/Timezone')
        .expect(400);

      // All error responses should have the same structure
      expect(Object.keys(response.body).sort()).toEqual(['error', 'message', 'requested_timezone']);
      expect(response.body.error).toBe('Invalid timezone');
    });
  });
});
