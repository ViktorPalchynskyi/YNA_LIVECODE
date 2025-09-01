export interface ErrorResponse {
    error: string;
    message: string;
    requested_timezone?: string;
    example?: string;
  }

  export type SuccessResponse = string;