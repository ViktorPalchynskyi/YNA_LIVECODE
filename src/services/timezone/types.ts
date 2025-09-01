export interface TimezoneResult {
  success: true;
  time: string;
}

export interface TimezoneError {
  success: false;
  error: string;
}

export type TimezoneValidationResult = TimezoneResult | TimezoneError;
