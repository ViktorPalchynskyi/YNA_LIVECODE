import { format, utcToZonedTime } from 'date-fns-tz';

import type { TimezoneValidationResult } from './types';

export class TimezoneService {
  /**
   * Validates if a timezone identifier is valid
   * @param timezone - Timezone identifier to validate
   * @returns true if timezone is valid, false otherwise
   */
  isValidTimezone(timezone: string): boolean {
    try {
      // Try to format a date with the timezone
      // If it throws, the timezone is invalid
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets current time in specified timezone as ISO string
   * @param timezone - Valid timezone identifier
   * @returns ISO string with timezone offset
   * @throws Error if timezone processing fails
   */
  getTimeInTimezone(timezone: string): string {
    try {
      const now = new Date();

      // Convert current UTC time to the specified timezone
      const zonedTime = utcToZonedTime(now, timezone);

      // Format the time as ISO string with timezone offset
      return format(zonedTime, "yyyy-MM-dd'T'HH:mm:ssXXX", {
        timeZone: timezone,
      });
    } catch {
      throw new Error('Failed to get time in timezone');
    }
  }

  /**
   * Gets current time in specified timezone with validation
   * @param timezone - Timezone identifier to validate and use
   * @returns Object with success status and either time or error message
   */
  getValidatedTimeInTimezone(timezone: string): TimezoneValidationResult {
    if (!this.isValidTimezone(timezone)) {
      return {
        success: false,
        error: `The timezone identifier '${timezone}' is not valid`,
      };
    }

    try {
      const time = this.getTimeInTimezone(timezone);
      return {
        success: true,
        time,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to get time in timezone',
      };
    }
  }
}
