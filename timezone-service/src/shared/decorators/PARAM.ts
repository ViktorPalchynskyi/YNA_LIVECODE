import { RoutingRegistry } from '@/shared';

/**
 * PARAM decorator for extracting path parameters
 * @param paramName - The name of the path parameter (e.g., "timezone" for /:timezone)
 */
export function PARAM(paramName: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const registry = RoutingRegistry.getInstance();
    registry.registerParam(target.constructor, propertyKey, paramName, parameterIndex);
  };
}
