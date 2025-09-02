import 'reflect-metadata';

import { RoutingRegistry } from '../types/routing';

/**
 * WebSocket route decorator
 * Registers a WebSocket route for the decorated class
 * @param path - WebSocket route path (e.g., "/time/live/:timezone")
 */
export function WebSocket(path: string) {
  return function <T extends { new (...args: any[]): any }>(
    constructor: T,
  ): T {
    const registry = RoutingRegistry.getInstance();
    registry.registerWebSocketRoute(constructor, path);
    return constructor;
  };
}
