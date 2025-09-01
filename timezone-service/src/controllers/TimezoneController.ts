import { TimezoneService } from '@services';
import { GET, PARAM, RoutingRegistry } from '@shared';

interface TimezoneResponse {
  timezone: string;
  current_time: string;
  timestamp: string;
}

export class TimezoneController {
  constructor() {
    // Manually register service parameters for dependency injection
    const registry = RoutingRegistry.getInstance();
    registry.registerServiceParameter(
      TimezoneController,
      'getTimeByTimezone',
      1, // TimezoneService is at index 1
      TimezoneService,
    );
  }

  @GET('/time/:timezone')
  getTimeByTimezone(
    @PARAM('timezone') timezone: string,
    timezoneService: TimezoneService,
  ): TimezoneResponse {
    console.log(`Request for timezone: ${timezone}`);

    const result = timezoneService.getValidatedTimeInTimezone(timezone);

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      timezone,
      current_time: result.time,
      timestamp: new Date().toISOString(),
    };
  }
}
