import * as http from 'http';

/**
 * Sends JSON response with proper formatting
 * @param res - HTTP Response object
 * @param statusCode - HTTP status code
 * @param data - Data to send
 */
export function sendJsonResponse(res: http.ServerResponse, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data, null, statusCode === 200 ? 0 : 2));
}

/**
 * Sends error response with standard format
 * @param res - HTTP Response object
 * @param statusCode - HTTP error status code
 * @param error - Error name
 * @param message - Error description
 * @param additionalData - Additional data (optional)
 */
export function sendErrorResponse(
  res: http.ServerResponse, 
  statusCode: number, 
  error: string, 
  message: string, 
  additionalData?: Record<string, any>
): void {
  const errorResponse = {
    error,
    message,
    ...additionalData
  };
  sendJsonResponse(res, statusCode, errorResponse);
}

/**
 * Sends successful response
 * @param res - HTTP Response object
 * @param data - Data to send
 */
export function sendSuccessResponse(res: http.ServerResponse, data: any): void {
  sendJsonResponse(res, 200, data);
}
