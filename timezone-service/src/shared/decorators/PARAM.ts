import { RoutingRegistry } from '@/shared';

/**
 * PARAM decorator for extracting path parameters
 * @param paramName - The name of the path parameter (e.g., "timezone" for /:timezone)
 */
export function PARAM(paramName: string) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const registry = RoutingRegistry.getInstance();
    
    // If propertyKey is undefined, this is a constructor parameter
    if (propertyKey === undefined) {
      // This is a constructor parameter (WebSocket)
      registry.registerWebSocketParam(target, paramName, parameterIndex);
    } else {
      // This is a method parameter (regular HTTP routes)
      registry.registerParam(target.constructor, propertyKey as string, paramName, parameterIndex);
    }
  };
}
