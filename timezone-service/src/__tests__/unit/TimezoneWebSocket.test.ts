import { Socket } from 'socket.io';

import { SocketIOClient, TimezoneWebSocket } from '@controllers/TimezoneWebSocket';
import { TimezoneService } from '@services';

// Mock TimezoneService
jest.mock('@services', () => ({
  TimezoneService: jest.fn().mockImplementation(() => ({
    getValidatedTimeInTimezone: jest.fn(),
  })),
}));

describe('TimezoneWebSocket', () => {
  let timezoneWebSocket: TimezoneWebSocket;
  let mockTimezoneService: jest.Mocked<TimezoneService>;
  let mockSocket: jest.Mocked<Socket>;
  let mockClient: SocketIOClient;

  beforeEach(() => {
    // Create mock socket
    mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    // Create mock timezone service
    mockTimezoneService = new TimezoneService() as jest.Mocked<TimezoneService>;

    // Create TimezoneWebSocket instance
    timezoneWebSocket = new TimezoneWebSocket('UTC', mockTimezoneService);

    // Create mock client
    mockClient = {
      socket: mockSocket,
      timezone: 'UTC',
    };

    // Setup default successful response
    mockTimezoneService.getValidatedTimeInTimezone.mockReturnValue({
      success: true,
      time: '2023-01-01T12:00:00.000Z',
    });

    // Mock Date.prototype.toISOString for consistent timestamps
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T12:00:00.000Z');

    // Use fake timers
    jest.useFakeTimers();

    // Mock setInterval and clearInterval
    global.setInterval = jest.fn(global.setInterval) as any;
    global.clearInterval = jest.fn(global.clearInterval) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with timezone and service', () => {
      expect(timezoneWebSocket).toBeDefined();
      expect(timezoneWebSocket['timezone']).toBe('UTC');
      expect(timezoneWebSocket['timezoneService']).toBe(mockTimezoneService);
    });

    it('should initialize empty clients set', () => {
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(0);
    });
  });

  describe('onConnect', () => {
    it('should add client to clients set', () => {
      timezoneWebSocket.onConnect(mockClient);

      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(1);
    });

    it('should send initial time update', () => {
      timezoneWebSocket.onConnect(mockClient);

      expect(mockSocket.emit).toHaveBeenCalledWith('time-update', {
        type: 'time_update',
        timezone: 'UTC',
        current_time: '2023-01-01T12:00:00.000Z',
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });

    it('should set up interval for periodic updates', () => {
      timezoneWebSocket.onConnect(mockClient);

      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should set up disconnect event listener', () => {
      timezoneWebSocket.onConnect(mockClient);

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should set up get-time event listener', () => {
      timezoneWebSocket.onConnect(mockClient);

      expect(mockSocket.on).toHaveBeenCalledWith('get-time', expect.any(Function));
    });

    it('should set up change-timezone event listener', () => {
      timezoneWebSocket.onConnect(mockClient);

      expect(mockSocket.on).toHaveBeenCalledWith('change-timezone', expect.any(Function));
    });

    it('should handle get-time event', () => {
      timezoneWebSocket.onConnect(mockClient);

      // Find and call the get-time handler
      const getTimeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'get-time')?.[1];
      expect(getTimeHandler).toBeDefined();

      // Reset emit calls and call handler
      mockSocket.emit.mockClear();
      getTimeHandler!();

      expect(mockSocket.emit).toHaveBeenCalledWith('time-update', {
        type: 'time_update',
        timezone: 'UTC',
        current_time: '2023-01-01T12:00:00.000Z',
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });

    it('should handle change-timezone event', () => {
      timezoneWebSocket.onConnect(mockClient);

      // Find and call the change-timezone handler
      const changeTimezoneHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'change-timezone'
      )?.[1];
      expect(changeTimezoneHandler).toBeDefined();

      // Reset emit calls and call handler
      mockSocket.emit.mockClear();
      changeTimezoneHandler!({ timezone: 'America/New_York' });

      expect(mockClient.timezone).toBe('America/New_York');
      expect(mockSocket.emit).toHaveBeenCalledWith('time-update', {
        type: 'time_update',
        timezone: 'America/New_York',
        current_time: '2023-01-01T12:00:00.000Z',
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });
  });

  describe('sendTimeUpdate', () => {
    beforeEach(() => {
      timezoneWebSocket.onConnect(mockClient);
    });

    it('should send successful time update', () => {
      mockSocket.emit.mockClear();

      // Trigger periodic update
      jest.advanceTimersByTime(1000);

      expect(mockSocket.emit).toHaveBeenCalledWith('time-update', {
        type: 'time_update',
        timezone: 'UTC',
        current_time: '2023-01-01T12:00:00.000Z',
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });

    it('should send error for invalid timezone', () => {
      mockTimezoneService.getValidatedTimeInTimezone.mockReturnValue({
        success: false,
        error: 'Invalid timezone',
      });

      mockSocket.emit.mockClear();

      // Trigger periodic update
      jest.advanceTimersByTime(1000);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: 'error',
        timezone: 'UTC',
        error: 'Invalid timezone',
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });

    it('should handle service errors gracefully', () => {
      mockTimezoneService.getValidatedTimeInTimezone.mockImplementation(() => {
        throw new Error('Service error');
      });

      mockSocket.emit.mockClear();

      // Should not throw
      expect(() => jest.advanceTimersByTime(1000)).not.toThrow();

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: 'error',
        timezone: 'UTC',
        error: 'Failed to get time update',
        timestamp: '2023-01-01T12:00:00.000Z',
      });
    });
  });

  describe('onDisconnect', () => {
    it('should remove client from set and clear interval', () => {
      timezoneWebSocket.onConnect(mockClient);
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(1);

      // Get the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      expect(disconnectHandler).toBeDefined();

      // Call disconnect handler
      disconnectHandler!();

      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(0);
      expect(global.clearInterval).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clear all intervals and disconnect all clients', () => {
      // Add multiple clients
      const mockClient2: SocketIOClient = {
        socket: {
          emit: jest.fn(),
          on: jest.fn(),
          disconnect: jest.fn(),
        } as any,
        timezone: 'Europe/London',
      };

      timezoneWebSocket.onConnect(mockClient);
      timezoneWebSocket.onConnect(mockClient2);

      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(2);

      // Cleanup
      timezoneWebSocket.cleanup();

      expect(global.clearInterval).toHaveBeenCalledTimes(2);
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockClient2.socket.disconnect).toHaveBeenCalledWith(true);
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(0);
    });

    it('should handle cleanup when no clients connected', () => {
      expect(() => timezoneWebSocket.cleanup()).not.toThrow();
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(0);
    });
  });

  describe('getConnectedClientsCount', () => {
    it('should return correct number of connected clients', () => {
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(0);

      timezoneWebSocket.onConnect(mockClient);
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(1);

      const mockClient2: SocketIOClient = {
        socket: {
          emit: jest.fn(),
          on: jest.fn(),
          disconnect: jest.fn(),
        } as any,
        timezone: 'Europe/London',
      };

      timezoneWebSocket.onConnect(mockClient2);
      expect(timezoneWebSocket.getConnectedClientsCount()).toBe(2);
    });
  });

  describe('periodic updates', () => {
    it('should send updates every second', () => {
      timezoneWebSocket.onConnect(mockClient);
      mockSocket.emit.mockClear();

      // Advance time by 3 seconds
      jest.advanceTimersByTime(3000);

      // Should have been called 3 times (once per second)
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
    });

    it('should stop updates when client disconnects', () => {
      timezoneWebSocket.onConnect(mockClient);

      // Get disconnect handler and call it
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler!();

      mockSocket.emit.mockClear();

      // Advance time - no updates should be sent
      jest.advanceTimersByTime(5000);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should handle multiple clients with different timezones', () => {
      const mockClient2: SocketIOClient = {
        socket: {
          emit: jest.fn(),
          on: jest.fn(),
          disconnect: jest.fn(),
        } as any,
        timezone: 'Europe/London',
      };

      timezoneWebSocket.onConnect(mockClient);
      timezoneWebSocket.onConnect(mockClient2);

      // Both clients should receive updates
      mockSocket.emit.mockClear();
      (mockClient2.socket.emit as jest.Mock).mockClear();

      jest.advanceTimersByTime(1000);

      expect(mockSocket.emit).toHaveBeenCalled();
      expect(mockClient2.socket.emit).toHaveBeenCalled();
    });

    it('should handle timezone service returning undefined', () => {
      mockTimezoneService.getValidatedTimeInTimezone.mockReturnValue(undefined as any);

      timezoneWebSocket.onConnect(mockClient);
      mockSocket.emit.mockClear();

      // Should not throw
      expect(() => jest.advanceTimersByTime(1000)).not.toThrow();
    });
  });
});
