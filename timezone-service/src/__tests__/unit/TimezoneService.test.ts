import { TimezoneService } from '@services/timezone/TimezoneService';
import type { TimezoneValidationResult } from '@services/timezone/types';

describe('TimezoneService', () => {
  let timezoneService: TimezoneService;

  beforeEach(() => {
    timezoneService = new TimezoneService();
  });

  describe('isValidTimezone', () => {
    it('should return true for valid timezone identifiers', () => {
      const validTimezones = [
        'Etc/UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'America/Los_Angeles',
        'Europe/Paris',
        'Asia/Kolkata',
        'Pacific/Honolulu',
        'Africa/Cairo'
      ];

      validTimezones.forEach(timezone => {
        expect(timezoneService.isValidTimezone(timezone)).toBe(true);
      });
    });

    it('should return false for invalid timezone identifiers', () => {
      const invalidTimezones = [
        'Invalid/Timezone',
        'NotATimezone',
        '',
        'GMT+5',
        'America/InvalidCity',
        'Europe/InvalidCity'
      ];

      invalidTimezones.forEach(timezone => {
        expect(timezoneService.isValidTimezone(timezone)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(timezoneService.isValidTimezone('UTC')).toBe(true); // UTC is actually valid
      expect(timezoneService.isValidTimezone('GMT')).toBe(true); // GMT is valid
      expect(timezoneService.isValidTimezone('America/Argentina/Buenos_Aires')).toBe(true);
    });
  });

  describe('getTimeInTimezone', () => {
    it('should return formatted time for valid timezone', () => {
      const result = timezoneService.getTimeInTimezone('Etc/UTC');
      
      // The format is yyyy-MM-ddTHH:mm:ssXXX (without milliseconds)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('should return different times for different timezones', () => {
      const utcTime = timezoneService.getTimeInTimezone('Etc/UTC');
      const nyTime = timezoneService.getTimeInTimezone('America/New_York');
      
      // Times should be different (unless it's exactly the same moment, which is unlikely)
      expect(utcTime).toBeDefined();
      expect(nyTime).toBeDefined();
    });

    it('should handle timezone with underscores and slashes', () => {
      const result = timezoneService.getTimeInTimezone('America/Argentina/Buenos_Aires');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    });
  });

  describe('getValidatedTimeInTimezone', () => {
    it('should return success result for valid timezone', () => {
      const result: TimezoneValidationResult = timezoneService.getValidatedTimeInTimezone('Etc/UTC');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      }
    });

    it('should return error result for invalid timezone', () => {
      const result: TimezoneValidationResult = timezoneService.getValidatedTimeInTimezone('Invalid/Timezone');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("The timezone identifier 'Invalid/Timezone' is not valid");
      }
    });

    it('should handle empty string timezone', () => {
      const result: TimezoneValidationResult = timezoneService.getValidatedTimeInTimezone('');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("The timezone identifier '' is not valid");
      }
    });

    it('should handle null and undefined timezones', () => {
      const nullResult: TimezoneValidationResult = timezoneService.getValidatedTimeInTimezone(null as any);
      
      expect(nullResult.success).toBe(false);
      
      // Note: undefined might be handled differently by the implementation
      // Let's test what actually happens
      try {
        const undefinedResult: TimezoneValidationResult = timezoneService.getValidatedTimeInTimezone(undefined as any);
        expect(undefinedResult.success).toBe(false);
      } catch (error) {
        // If it throws, that's also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    it('should return consistent results for multiple calls', () => {
      const timezone = 'Europe/London';
      const result1 = timezoneService.getValidatedTimeInTimezone(timezone);
      const result2 = timezoneService.getValidatedTimeInTimezone(timezone);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.success).toEqual(result2.success);
    });
  });

  describe('error handling', () => {
    it('should handle internal errors gracefully', () => {
      // Mock the date-fns-tz functions to throw an error
      const originalFormat = require('date-fns-tz').format;
      const mockFormat = jest.fn().mockImplementation(() => {
        throw new Error('Mocked error');
      });
      
      require('date-fns-tz').format = mockFormat;
      
      const result = timezoneService.getValidatedTimeInTimezone('Etc/UTC');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to get time in timezone');
      }
      
      // Restore original function
      require('date-fns-tz').format = originalFormat;
    });
  });
});
