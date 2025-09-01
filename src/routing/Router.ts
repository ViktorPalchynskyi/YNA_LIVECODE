import {
  ControllerInstance,
  FlexibleRouteHandler,
  ParameterMetadata,
  RouteMetadata,
  RoutingRegistry,
  ServiceRegistry,
  sendErrorResponse,
} from '@shared';
import * as http from 'http';
import * as url from 'url';

export class Router {
  private controllers: ControllerInstance[] = [];
  private registry = RoutingRegistry.getInstance();
  private serviceRegistry = ServiceRegistry.getInstance();

  // Register controller instances
  registerController(controller: ControllerInstance): void {
    this.controllers.push(controller);
  }

  // Handle incoming HTTP requests
  async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<boolean> {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '';
    const method = req.method || 'GET';

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Find matching route
    for (const controller of this.controllers) {
      const controllerClass = controller.constructor;
      const metadata = this.registry.getControllerMetadata(controllerClass);

      if (!metadata) continue;

      for (const route of metadata.routes) {
        if (route.method !== method) continue;

        const match = this.matchRoute(pathname, route.path);

        if (match) {
          const handler = controller[route.handler] as FlexibleRouteHandler;
          if (handler) {
            try {
              // Extract parameters based on parameter decorators and dependency injection
              const params = this.extractParameters(
                match.params,
                route,
                req,
                res,
              );
              const result = await handler.apply(controller, params);

              // If handler returns a value, send it as JSON response
              if (result !== undefined) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              }

              return true;
            } catch (error) {
              console.error('Route handler error:', error);

              // Handle validation errors (400) vs internal errors (500)
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'An error occurred while processing the request';
              const isValidationError =
                errorMessage.includes('timezone') ||
                errorMessage.includes('Invalid');

              sendErrorResponse(
                res,
                isValidationError ? 400 : 500,
                isValidationError
                  ? 'Invalid timezone'
                  : 'Internal server error',
                errorMessage,
                isValidationError
                  ? { requested_timezone: match.params.timezone }
                  : undefined,
              );
              return true;
            }
          }
        }
      }
    }

    return false; // No route found
  }

  // Match URL path against route pattern
  private matchRoute(
    pathname: string,
    routePath: string,
  ): { params: Record<string, string> } | null {
    const routeParts = routePath.split('/').filter((part) => part);
    const pathParts = pathname.split('/').filter((part) => part);

    // Special handling for routes with wildcard parameters (like timezone identifiers with slashes)
    const params: Record<string, string> = {};

    // Check if we have fewer route parts than path parts and the last route part is a parameter
    if (
      routeParts.length > 0 &&
      routeParts[routeParts.length - 1].startsWith(':')
    ) {
      const lastParamIndex = routeParts.length - 1;

      // Check that all literal parts match
      for (let i = 0; i < lastParamIndex; i++) {
        if (i >= pathParts.length || routeParts[i] !== pathParts[i]) {
          return null;
        }
      }

      // If we have enough path parts, capture the remaining parts as the parameter
      if (pathParts.length >= routeParts.length) {
        const paramName = routeParts[lastParamIndex].slice(1);
        const remainingParts = pathParts.slice(lastParamIndex);
        params[paramName] = decodeURIComponent(remainingParts.join('/'));

        return { params };
      }
    }

    // Standard matching for exact length routes
    if (routeParts.length !== pathParts.length) {
      return null;
    }

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        // Parameter part
        const paramName = routePart.slice(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (routePart !== pathPart) {
        // Literal part doesn't match

        return null;
      }
    }

    return { params };
  }

  // Extract and order parameters for method call with dependency injection
  private extractParameters(
    urlParams: Record<string, string>,
    route: RouteMetadata,
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): unknown[] {
    // If no parameters metadata, use legacy behavior
    if (!route.parameters || route.parameters.length === 0) {
      const params: unknown[] = [req, res];

      // Add path parameters in the order they were declared
      for (let i = 0; i < route.paramNames.length; i++) {
        const paramName = route.paramNames[i];
        if (paramName && urlParams[paramName] !== undefined) {
          params.push(urlParams[paramName]);
        }
      }

      return params;
    }

    // Use new dependency injection system
    const params: unknown[] = [];

    // Sort parameters by their index to maintain correct order
    const sortedParams: ParameterMetadata[] = [...route.parameters].sort(
      (a: ParameterMetadata, b: ParameterMetadata) => a.index - b.index,
    );

    // Fill parameters array with correct values
    for (const param of sortedParams) {
      if (param.type === 'param') {
        // Extract URL parameter
        const value = param.name ? urlParams[param.name] : undefined;
        params[param.index] = value;
      } else if (param.type === 'service') {
        // Inject service instance
        const service = param.serviceType
          ? this.serviceRegistry.getOrCreateService(param.serviceType)
          : undefined;
        params[param.index] = service;
      }
    }

    return params;
  }
}
