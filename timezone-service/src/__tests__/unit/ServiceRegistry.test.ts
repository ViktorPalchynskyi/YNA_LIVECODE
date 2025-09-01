import { ServiceRegistry } from '@shared/services/ServiceRegistry';
import { TimezoneService } from '@services/timezone/TimezoneService';

// Mock service for testing
class MockService {
  public readonly id: string = 'mock-service';
  
  getValue(): string {
    return 'mock-value';
  }
}

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    // Get a fresh instance for each test
    serviceRegistry = ServiceRegistry.getInstance();
    
    // Clear the internal services map for clean tests
    serviceRegistry.clear();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = ServiceRegistry.getInstance();
      const instance2 = ServiceRegistry.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getOrCreateService', () => {
    it('should create a new service instance', () => {
      const mockService = serviceRegistry.getOrCreateService(MockService);
      
      expect(mockService).toBeInstanceOf(MockService);
      expect((mockService as MockService).id).toBe('mock-service');
      expect((mockService as MockService).getValue()).toBe('mock-value');
    });

    it('should return the same instance on subsequent calls', () => {
      const service1 = serviceRegistry.getOrCreateService(MockService);
      const service2 = serviceRegistry.getOrCreateService(MockService);
      
      expect(service1).toBe(service2);
    });

    it('should create different instances for different service types', () => {
      const mockService = serviceRegistry.getOrCreateService(MockService);
      const timezoneService = serviceRegistry.getOrCreateService(TimezoneService);
      
      expect(mockService).toBeInstanceOf(MockService);
      expect(timezoneService).toBeInstanceOf(TimezoneService);
      expect(mockService).not.toBe(timezoneService);
    });

    it('should manually register and retrieve services', () => {
      const mockServiceInstance = new MockService();
      serviceRegistry.registerService(MockService, mockServiceInstance);
      
      const retrievedService = serviceRegistry.getService(MockService);
      
      expect(retrievedService).toBe(mockServiceInstance);
      expect((retrievedService as MockService).getValue()).toBe('mock-value');
    });
  });

  describe('clear', () => {
    it('should clear all registered services', () => {
      const mockService = serviceRegistry.getOrCreateService(MockService);
      const timezoneService = serviceRegistry.getOrCreateService(TimezoneService);
      
      expect(serviceRegistry.getService(MockService)).toBe(mockService);
      expect(serviceRegistry.getService(TimezoneService)).toBe(timezoneService);
      
      serviceRegistry.clear();
      
      expect(serviceRegistry.getService(MockService)).toBeUndefined();
      expect(serviceRegistry.getService(TimezoneService)).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle services that throw in constructor', () => {
      class ThrowingService {
        constructor() {
          throw new Error('Constructor error');
        }
      }
      
      expect(() => {
        serviceRegistry.getOrCreateService(ThrowingService);
      }).toThrow('Constructor error');
    });

    it('should handle getService for non-existent services', () => {
      class NonExistentService {}
      
      const service = serviceRegistry.getService(NonExistentService);
      expect(service).toBeUndefined();
    });
  });
});
