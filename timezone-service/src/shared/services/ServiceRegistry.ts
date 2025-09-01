/**
 * Service registry for dependency injection
 * Manages service instances and their lifecycle
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<Function, any> = new Map();

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service instance
   * @param serviceType - Service constructor function
   * @param serviceInstance - Instance of the service
   */
  registerService<T>(serviceType: Function, serviceInstance: T): void {
    this.services.set(serviceType, serviceInstance);
  }

  /**
   * Get service instance by type
   * @param serviceType - Service constructor function
   * @returns Service instance or undefined if not found
   */
  getService<T>(serviceType: Function): T | undefined {
    return this.services.get(serviceType);
  }

  /**
   * Get or create service instance
   * @param serviceType - Service constructor function
   * @returns Service instance
   */
  getOrCreateService<T>(serviceType: Function): T {
    let service = this.services.get(serviceType);
    
    if (!service) {
      // Create new instance using constructor
      service = new (serviceType as any)();
      this.services.set(serviceType, service);
    }
    
    return service;
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.services.clear();
  }
}
