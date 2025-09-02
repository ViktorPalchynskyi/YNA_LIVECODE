
import * as http from 'http';
import 'reflect-metadata';

// Parameter metadata for dependency injection
export interface ParameterMetadata {
  index: number;
  type: 'param' | 'service';
  name?: string; // for @Param decorators
  serviceType?: Function; // for service injection
}

// Route metadata interface
export interface RouteMetadata {
  method: string;
  path: string;
  handler: string; // method name
  paramNames: string[];
  parameters: ParameterMetadata[]; // for dependency injection
}

// WebSocket metadata interface
export interface WebSocketMetadata {
  path: string;
  controllerClass: Function;
  parameters: ParameterMetadata[]; // for dependency injection
}

// Controller metadata interface
export interface ControllerMetadata {
  routes: RouteMetadata[];
}

// Route handler function type
export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>) => void | Promise<void>;

// More flexible route handler that can accept any parameters
export type FlexibleRouteHandler = (...args: unknown[]) => unknown;

// Controller instance with route handlers
export interface ControllerInstance {
  [key: string]: any;
}

// Global routing registry
export class RoutingRegistry {
  private static instance: RoutingRegistry;
  private controllers: Map<Function, ControllerMetadata> = new Map();
  private webSockets: Map<Function, WebSocketMetadata> = new Map();

  static getInstance(): RoutingRegistry {
    if (!RoutingRegistry.instance) {
      RoutingRegistry.instance = new RoutingRegistry();
    }
    return RoutingRegistry.instance;
  }

  registerRoute(target: Function, method: string, path: string, handler: string): void {
    if (!this.controllers.has(target)) {
      this.controllers.set(target, { routes: [] });
    }
    
    const metadata = this.controllers.get(target)!;
    const existingRoute = metadata.routes.find(route => route.handler === handler);
    
    if (existingRoute) {
      existingRoute.method = method;
      existingRoute.path = path;
    } else {
      const route = {
        method,
        path,
        handler,
        paramNames: [],
        parameters: []
      };
      metadata.routes.push(route);
      
      // Auto-detect service parameters using reflection
      this.autoDetectServiceParameters(target, handler, route);
    }
  }

  registerParam(target: Function, handler: string, paramName: string, paramIndex: number): void {
    if (!this.controllers.has(target)) {
      this.controllers.set(target, { routes: [] });
    }
    
    const metadata = this.controllers.get(target)!;
    let route = metadata.routes.find(r => r.handler === handler);
    
    if (!route) {
      route = {
        method: '',
        path: '',
        handler,
        paramNames: [],
        parameters: []
      };
      metadata.routes.push(route);
    }
    
    route.paramNames[paramIndex] = paramName;
    
    // Register parameter metadata for dependency injection
    const existingParam = route.parameters.find(p => p.index === paramIndex);
    if (existingParam) {
      existingParam.type = 'param';
      existingParam.name = paramName;
    } else {
      route.parameters.push({
        index: paramIndex,
        type: 'param',
        name: paramName
      });
    }
  }

  registerServiceParameter(target: Function, handler: string, paramIndex: number, serviceType: Function): void {
    if (!this.controllers.has(target)) {
      this.controllers.set(target, { routes: [] });
    }
    
    const metadata = this.controllers.get(target)!;
    let route = metadata.routes.find(r => r.handler === handler);
    
    if (!route) {
      route = {
        method: '',
        path: '',
        handler,
        paramNames: [],
        parameters: []
      };
      metadata.routes.push(route);
    }
    
    // Register service parameter metadata
    const existingParam = route.parameters.find(p => p.index === paramIndex);
    if (existingParam) {
      existingParam.type = 'service';
      existingParam.serviceType = serviceType;
    } else {
      route.parameters.push({
        index: paramIndex,
        type: 'service',
        serviceType
      });
    }
  }

  getControllerMetadata(target: Function): ControllerMetadata | undefined {
    return this.controllers.get(target);
  }

  getAllControllers(): Map<Function, ControllerMetadata> {
    return this.controllers;
  }

  registerWebSocketRoute(target: Function, path: string): void {
    const webSocketMetadata: WebSocketMetadata = {
      path,
      controllerClass: target,
      parameters: []
    };
    
    // Auto-detect constructor parameters for dependency injection
    this.autoDetectWebSocketParameters(target, webSocketMetadata);
    
    this.webSockets.set(target, webSocketMetadata);
  }

  getWebSocketMetadata(target: Function): WebSocketMetadata | undefined {
    return this.webSockets.get(target);
  }

  getAllWebSockets(): Map<Function, WebSocketMetadata> {
    return this.webSockets;
  }

  /**
   * Auto-detect service parameters using reflection metadata
   * This identifies parameters that should be dependency injected
   */
  private autoDetectServiceParameters(target: Function, handler: string, route: RouteMetadata): void {
    try {
      // Get parameter types from reflection metadata
      const paramTypes = Reflect.getMetadata('design:paramtypes', target.prototype, handler) || [];
      
      // Register service parameters for non-primitive types
      paramTypes.forEach((paramType: any, index: number) => {
        if (paramType && this.isServiceType(paramType)) {
          // Check if this parameter index is already registered as a @Param
          const existingParam = route.parameters.find(p => p.index === index);
          if (!existingParam) {
            route.parameters.push({
              index,
              type: 'service',
              serviceType: paramType
            });
          }
        }
      });
    } catch (error) {
      // Reflection metadata might not be available, that's okay
      console.warn(`Could not auto-detect service parameters for ${target.name}.${handler}:`, error);
    }
  }

  /**
   * Auto-detect WebSocket constructor parameters using reflection metadata
   */
  private autoDetectWebSocketParameters(target: Function, metadata: WebSocketMetadata): void {
    try {
      // Get constructor parameter types from reflection metadata
      const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
      
      // Register service parameters for non-primitive types
      paramTypes.forEach((paramType: any, index: number) => {
        if (paramType && this.isServiceType(paramType)) {
          metadata.parameters.push({
            index,
            type: 'service',
            serviceType: paramType
          });
        } else if (paramType === String) {
          // String parameters might be @Param decorated
          metadata.parameters.push({
            index,
            type: 'param'
          });
        }
      });
    } catch (error) {
      // Reflection metadata might not be available, that's okay
      console.warn(`Could not auto-detect WebSocket parameters for ${target.name}:`, error);
    }
  }

  /**
   * Register a WebSocket parameter (for @Param decorators in constructor)
   */
  registerWebSocketParam(target: Function, paramName: string, paramIndex: number): void {
    const metadata = this.webSockets.get(target);
    if (metadata) {
      const existingParam = metadata.parameters.find(p => p.index === paramIndex);
      if (existingParam) {
        existingParam.type = 'param';
        existingParam.name = paramName;
      } else {
        metadata.parameters.push({
          index: paramIndex,
          type: 'param',
          name: paramName
        });
      }
    }
  }

  /**
   * Determines if a type should be treated as a service for dependency injection
   * Services are typically classes (functions with prototype) that aren't primitive types
   */
  private isServiceType(type: any): boolean {
    // Exclude primitive types and built-in objects
    if (!type || typeof type !== 'function') {
      return false;
    }
    
    // Exclude built-in types
    const builtInTypes = [String, Number, Boolean, Date, Array, Object, RegExp];
    if (builtInTypes.includes(type)) {
      return false;
    }
    
    // Must have a prototype (is a class/constructor function)
    return type.prototype && type.prototype.constructor === type;
  }
}
