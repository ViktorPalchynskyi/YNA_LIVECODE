import * as http from 'http';
import { sendJsonResponse, sendSuccessResponse } from '@shared/utils/helpers/responseHelpers';

// Mock http.ServerResponse
const createMockResponse = () => {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    ended: false,
    setHeader: jest.fn((name: string, value: string) => {
      response.headers[name] = value;
    }),
    writeHead: jest.fn((statusCode: number, headers?: Record<string, string>) => {
      response.statusCode = statusCode;
      if (headers) {
        Object.assign(response.headers, headers);
      }
    }),
    write: jest.fn((chunk: string) => {
      response.body += chunk;
    }),
    end: jest.fn((data?: string) => {
      if (data) {
        response.body += data;
      }
      response.ended = true;
    })
  };
  
  return response as unknown as http.ServerResponse;
};

describe('Response Helpers', () => {
  describe('sendJsonResponse', () => {
    it('should send JSON response with correct headers and status', () => {
      const mockRes = createMockResponse();
      const data = { message: 'test', value: 123 };
      
      sendJsonResponse(mockRes, 200, data);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(data, null, 0));
      expect((mockRes as any).ended).toBe(true);
    });

    it('should handle different status codes', () => {
      const mockRes = createMockResponse();
      const data = { error: 'Not found' };
      
      sendJsonResponse(mockRes, 404, data);
      
      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should handle null data', () => {
      const mockRes = createMockResponse();
      
      sendJsonResponse(mockRes, 204, null);
      
      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.end).toHaveBeenCalledWith('null');
    });

    it('should handle undefined data', () => {
      const mockRes = createMockResponse();
      
      sendJsonResponse(mockRes, 200, undefined);
      
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(undefined, null, 0));
    });

    it('should handle complex nested objects', () => {
      const mockRes = createMockResponse();
      const complexData = {
        user: {
          id: 1,
          name: 'John',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        items: [1, 2, 3],
        timestamp: new Date('2023-01-01T00:00:00.000Z')
      };
      
      sendJsonResponse(mockRes, 200, complexData);
      
      const expectedJson = JSON.stringify(complexData, null, 0);
      expect(mockRes.end).toHaveBeenCalledWith(expectedJson);
    });

    it('should format JSON differently for success vs error status codes', () => {
      const data = { test: 'data' };
      
      const mockRes200 = createMockResponse();
      sendJsonResponse(mockRes200, 200, data);
      expect(mockRes200.end).toHaveBeenCalledWith(JSON.stringify(data, null, 0));
      
      const mockRes400 = createMockResponse();
      sendJsonResponse(mockRes400, 400, data);
      expect(mockRes400.end).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });
  });

  describe('sendSuccessResponse', () => {
    it('should send success response with status 200', () => {
      const mockRes = createMockResponse();
      const data = { userId: 123, name: 'John' };
      
      sendSuccessResponse(mockRes, data);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(data, null, 0));
    });

    it('should handle null data in success response', () => {
      const mockRes = createMockResponse();
      
      sendSuccessResponse(mockRes, null);
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.end).toHaveBeenCalledWith('null');
    });

    it('should handle undefined data in success response', () => {
      const mockRes = createMockResponse();
      
      sendSuccessResponse(mockRes, undefined);
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(undefined, null, 0));
    });

    it('should handle array data', () => {
      const mockRes = createMockResponse();
      const arrayData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      
      sendSuccessResponse(mockRes, arrayData);
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(arrayData, null, 0));
    });

    it('should handle empty object', () => {
      const mockRes = createMockResponse();
      const emptyData = {};
      
      sendSuccessResponse(mockRes, emptyData);
      
      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(emptyData, null, 0));
    });
  });

  describe('JSON formatting', () => {
    it('should use compact formatting for status 200', () => {
      const mockRes = createMockResponse();
      const data = { key: 'value', nested: { prop: 123 } };
      
      sendJsonResponse(mockRes, 200, data);
      
      // Compact formatting (no indentation)
      expect(mockRes.end).toHaveBeenCalledWith('{"key":"value","nested":{"prop":123}}');
    });

    it('should use pretty formatting for non-200 status codes', () => {
      const mockRes = createMockResponse();
      const data = { error: 'test', code: 400 };
      
      sendJsonResponse(mockRes, 400, data);
      
      // Pretty formatting (with indentation)
      const expectedJson = JSON.stringify(data, null, 2);
      expect(mockRes.end).toHaveBeenCalledWith(expectedJson);
    });
  });
});