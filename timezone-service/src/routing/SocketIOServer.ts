import {
  ParameterMetadata,
  RoutingRegistry,
  ServiceRegistry,
  WebSocketMetadata,
} from '@shared';
import * as http from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';

export interface SocketIOClient {
  socket: Socket;
  timezone: string;
  intervalId?: NodeJS.Timeout;
}

export class SocketServer {
  private io: SocketIOServer;
  private registry = RoutingRegistry.getInstance();
  private serviceRegistry = ServiceRegistry.getInstance();
  private webSocketInstances: Map<string, unknown> = new Map();

  constructor(server: http.Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketHandling();
  }

  private setupSocketHandling(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket.io client connected: ${socket.id}`);

      // Handle timezone subscription
      socket.on('subscribe-timezone', (data: { timezone: string }) => {
        this.handleTimezoneSubscription(socket, data.timezone);
      });

      // Handle disconnect
      socket.on('disconnect', (reason: string) => {
        console.log(
          `Socket.io client disconnected: ${socket.id}, reason: ${reason}`,
        );
        this.handleDisconnect();
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(`Socket.io error for ${socket.id}:`, error);
      });
    });
  }

  private handleTimezoneSubscription(socket: Socket, timezone: string): void {
    console.log(`Client ${socket.id} subscribing to timezone: ${timezone}`);

    // Join room for the specific timezone
    const roomName = `timezone-${timezone}`;
    socket.join(roomName);

    // Find matching WebSocket route
    const webSocketRoutes = this.registry.getAllWebSockets();

    for (const [controllerClass, metadata] of webSocketRoutes) {
      const match = this.matchTimezoneRoute(timezone, metadata.path);

      if (match) {
        console.log(
          `Matched Socket.io route: ${metadata.path} for timezone: ${timezone}`,
        );

        try {
          // Get or create WebSocket controller instance
          const controllerInstance = this.getWebSocketInstance(
            controllerClass as new (...args: unknown[]) => unknown,
            metadata,
            match.params,
          );

          // Create client object
          const client: SocketIOClient = {
            socket,
            timezone,
          };

          // Call onConnect method
          if (
            controllerInstance &&
            typeof (
              controllerInstance as {
                onConnect?: (client: SocketIOClient) => void;
              }
            ).onConnect === 'function'
          ) {
            (
              controllerInstance as {
                onConnect: (client: SocketIOClient) => void;
              }
            ).onConnect(client);
          } else {
            console.warn(
              `Socket.io controller ${controllerClass.name} does not have onConnect method`,
            );
            socket.emit('error', { message: 'Controller method not found' });
          }

          return;
        } catch (error) {
          console.error('Error creating Socket.io controller instance:', error);
          socket.emit('error', { message: 'Internal server error' });
          return;
        }
      }
    }

    // No matching route found
    console.log(`No matching Socket.io route found for timezone: ${timezone}`);
    socket.emit('error', { message: 'Route not found' });
  }

  private matchTimezoneRoute(
    timezone: string,
    routePath: string,
  ): { params: Record<string, string> } | null {
    // For Socket.io, we expect route like "/time/live/:timezone"
    // and we match against the timezone parameter
    const routeParts = routePath.split('/').filter((part) => part);

    // Find the timezone parameter in the route
    const timezoneParamIndex = routeParts.findIndex(
      (part) => part === ':timezone',
    );

    if (timezoneParamIndex !== -1) {
      return {
        params: {
          timezone: timezone,
        },
      };
    }

    return null;
  }

  private handleDisconnect(): void {
    // Socket.io automatically handles room cleanup on disconnect
    // Custom cleanup logic can be added here if needed
  }

  private getWebSocketInstance(
    controllerClass: new (...args: unknown[]) => unknown,
    metadata: WebSocketMetadata,
    urlParams: Record<string, string>,
  ): unknown {
    // For Socket.io, we create instances per timezone to handle multiple clients
    const instanceKey = `${controllerClass.name}-${urlParams.timezone}`;

    if (this.webSocketInstances.has(instanceKey)) {
      return this.webSocketInstances.get(instanceKey);
    }

    // Create constructor parameters
    const constructorParams = this.resolveWebSocketParameters(
      metadata,
      urlParams,
    );

    // Create new instance
    const instance = new controllerClass(...constructorParams);

    // Store instance for reuse
    this.webSocketInstances.set(instanceKey, instance);

    return instance;
  }

  private resolveWebSocketParameters(
    metadata: WebSocketMetadata,
    urlParams: Record<string, string>,
  ): unknown[] {
    const params: unknown[] = [];

    // Sort parameters by their index to maintain correct order
    const sortedParams: ParameterMetadata[] = [...metadata.parameters].sort(
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

  // Emit to all clients in a timezone room
  emitToTimezone(timezone: string, event: string, data: unknown): void {
    const roomName = `timezone-${timezone}`;
    this.io.to(roomName).emit(event, data);
  }

  // Emit to a specific client
  emitToClient(socket: Socket, event: string, data: unknown): void {
    socket.emit(event, data);
  }

  // Get all connected clients for a timezone
  getClientsInTimezone(timezone: string): Promise<Set<string>> {
    const roomName = `timezone-${timezone}`;
    return this.io.in(roomName).allSockets();
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    console.log('Cleaning up Socket.io server...');

    // Cleanup all WebSocket controller instances
    for (const [instanceKey, instance] of this.webSocketInstances) {
      if (
        instance &&
        typeof (instance as { cleanup?: () => void }).cleanup === 'function'
      ) {
        try {
          (instance as { cleanup: () => void }).cleanup();
        } catch (error) {
          console.error(
            `Error cleaning up Socket.io controller ${instanceKey}:`,
            error,
          );
        }
      }
    }

    this.webSocketInstances.clear();

    // Close Socket.io server
    void this.io.close(() => {
      console.log('Socket.io server closed');
    });
  }

  // Get the Socket.io server instance for advanced usage
  getIOServer(): SocketIOServer {
    return this.io;
  }
}
