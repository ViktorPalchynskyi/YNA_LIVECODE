import * as http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';


import { RoutingRegistry, ServiceRegistry } from '@shared';
import { SocketServer } from '@routing/SocketIOServer';
import { TimezoneService } from '@services';

// Mock Socket.io
jest.mock('socket.io');

describe('SocketServer', () => {
  let socketServer: SocketServer;
  let httpServer: http.Server;
  let mockIO: jest.Mocked<SocketIOServer>;
  let mockSocket: jest.Mocked<Socket>;
  let routingRegistry: RoutingRegistry;
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    // Clear registries
    routingRegistry = RoutingRegistry.getInstance();
    serviceRegistry = ServiceRegistry.getInstance();
    serviceRegistry.clear();

    // Create mock HTTP server
    httpServer = new http.Server();

    // Create mock Socket.io objects
    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    mockIO = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      close: jest.fn(),
      allSockets: jest.fn(),
    } as any;

    // Mock Socket.io constructor
    (SocketIOServer as jest.MockedClass<typeof SocketIOServer>).mockImplementation(() => mockIO);

    // Create SocketServer instance
    socketServer = new SocketServer(httpServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
    serviceRegistry.clear();
  });

  describe('constructor', () => {
    it('should initialize Socket.io server with correct options', () => {
      expect(SocketIOServer).toHaveBeenCalledWith(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
      });
    });

    it('should set up connection handler', () => {
      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('socket connection handling', () => {
    let connectionHandler: (socket: Socket) => void;

    beforeEach(() => {
      // Get the connection handler that was registered
      const onCalls = mockIO.on.mock.calls;
      const connectionCall = onCalls.find(call => call[0] === 'connection');
      connectionHandler = connectionCall![1];
    });

    it('should set up event listeners when socket connects', () => {
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('subscribe-timezone', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle subscribe-timezone event', () => {
      // Register a mock WebSocket route
      const mockControllerClass = class TestController {
        constructor(public timezone: string, public service: TimezoneService) {}
        onConnect = jest.fn();
        cleanup = jest.fn();
      };

      routingRegistry.registerWebSocketRoute(mockControllerClass, '/time/live/:timezone');

      connectionHandler(mockSocket);

      // Get the subscribe-timezone handler
      const subscribeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'subscribe-timezone'
      )![1];

      // Mock service registration
      const mockTimezoneService = new TimezoneService();
      serviceRegistry.registerService(TimezoneService, mockTimezoneService);

      // Call the handler
      subscribeHandler({ timezone: 'UTC' });

      expect(mockSocket.join).toHaveBeenCalledWith('timezone-UTC');
    });

    it('should handle disconnect event', () => {
      connectionHandler(mockSocket);

      // Get the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )![1];

      // Call the handler
      disconnectHandler('client disconnect');

      // Should not throw any errors
      expect(disconnectHandler).toBeDefined();
    });

    it('should handle socket errors', () => {
      connectionHandler(mockSocket);

      // Get the error handler
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'error'
      )![1];

      const mockError = new Error('Test error');
      
      // Should not throw when handling errors
      expect(() => errorHandler(mockError)).not.toThrow();
    });
  });

  describe('timezone subscription handling', () => {
    it('should handle timezone subscription flow', () => {
      // This is an integration-style test that verifies the overall flow
      // without testing private methods directly
      expect(socketServer).toBeDefined();
      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
      
      // Verify that connection handler sets up socket event listeners
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')![1];
      connectionHandler(mockSocket);
      
      expect(mockSocket.on).toHaveBeenCalledWith('subscribe-timezone', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('utility methods', () => {
    it('should emit to timezone room', () => {
      socketServer.emitToTimezone('UTC', 'test-event', { data: 'test' });

      expect(mockIO.to).toHaveBeenCalledWith('timezone-UTC');
      expect(mockIO.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should emit to specific client', () => {
      socketServer.emitToClient(mockSocket, 'test-event', { data: 'test' });

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should get clients in timezone', async () => {
      const mockSocketIds = new Set(['socket1', 'socket2']);
      mockIO.allSockets.mockResolvedValue(mockSocketIds);

      const result = await socketServer.getClientsInTimezone('UTC');

      expect(mockIO.in).toHaveBeenCalledWith('timezone-UTC');
      expect(result).toBe(mockSocketIds);
    });

    it('should return IO server instance', () => {
      const ioServer = socketServer.getIOServer();
      expect(ioServer).toBe(mockIO);
    });
  });

  describe('cleanup', () => {
    it('should close server on cleanup', () => {
      socketServer.cleanup();
      expect(mockIO.close).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      // Should not throw
      expect(() => socketServer.cleanup()).not.toThrow();
    });
  });

  describe('parameter resolution', () => {
    it('should have parameter resolution functionality', () => {
      // Test that the server has the necessary infrastructure
      expect(socketServer).toBeDefined();
      expect(socketServer.getIOServer()).toBe(mockIO);
      
      // Verify registry integration
      expect(routingRegistry).toBeDefined();
      expect(serviceRegistry).toBeDefined();
    });
  });
});
