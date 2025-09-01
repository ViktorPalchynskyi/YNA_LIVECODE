import { RoutingRegistry } from '@/shared';

/**
 * GET decorator for marking methods as GET route handlers
 * @param path - The URL path pattern (e.g., "/time/:timezone")
 */
export function GET(path: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const registry = RoutingRegistry.getInstance();
    registry.registerRoute(target.constructor, 'GET', path, propertyKey);
    return descriptor;
  };
}
