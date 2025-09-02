import { TimezoneService } from '@services';
import { PARAM, WebSocket } from '@shared';
import { Socket } from 'socket.io';

export interface SocketIOClient {
  socket: Socket;
  timezone: string;
  intervalId?: NodeJS.Timeout;
}

@WebSocket('/time/live/:timezone')
export class TimezoneWebSocket {
  private clients: Set<SocketIOClient> = new Set();

  constructor(
    @PARAM('timezone') private timezone: string,
    private timezoneService: TimezoneService,
  ) {}

  onConnect(client: SocketIOClient): void {
    console.log(`Socket.io client connected for timezone: ${client.timezone}`);

    this.clients.add(client);

    // Send initial time immediately
    this.sendTimeUpdate(client);

    // Set up interval to send time updates every second
    client.intervalId = setInterval(() => {
      this.sendTimeUpdate(client);
    }, 1000);

    // Handle client disconnect
    client.socket.on('disconnect', () => {
      this.onDisconnect(client);
    });

    // Handle custom events
    client.socket.on('get-time', () => {
      this.sendTimeUpdate(client);
    });

    client.socket.on('change-timezone', (data: { timezone: string }) => {
      client.timezone = data.timezone;
      this.sendTimeUpdate(client);
    });
  }

  private onDisconnect(client: SocketIOClient): void {
    console.log(
      `Socket.io client disconnected for timezone: ${client.timezone}`,
    );

    // Clear the interval
    if (client.intervalId) {
      clearInterval(client.intervalId);
    }

    // Remove client from set
    this.clients.delete(client);
  }

  private sendTimeUpdate(client: SocketIOClient): void {
    try {
      const result = this.timezoneService.getValidatedTimeInTimezone(
        client.timezone,
      );

      if (result.success) {
        const message = {
          type: 'time_update',
          timezone: client.timezone,
          current_time: result.time,
          timestamp: new Date().toISOString(),
        };

        client.socket.emit('time-update', message);
      } else {
        // Send error message
        const errorMessage = {
          type: 'error',
          timezone: client.timezone,
          error: result.error,
          timestamp: new Date().toISOString(),
        };

        client.socket.emit('error', errorMessage);
      }
    } catch (error) {
      console.error(`Error sending time update for ${client.timezone}:`, error);

      const errorMessage = {
        type: 'error',
        timezone: client.timezone,
        error: 'Failed to get time update',
        timestamp: new Date().toISOString(),
      };

      client.socket.emit('error', errorMessage);
    }
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    console.log(
      `Cleaning up WebSocket connections for timezone: ${this.timezone}`,
    );

    for (const client of this.clients) {
      if (client.intervalId) {
        clearInterval(client.intervalId);
      }

      client.socket.disconnect(true);
    }

    this.clients.clear();
  }

  // Getter for testing purposes
  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
