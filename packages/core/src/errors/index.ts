/**
 * Error classes for ShareDo platform
 */

export class ShareDoError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  
  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode?: number) {
    super(message);
    this.name = 'ShareDoError';
    this.code = code;
    this.statusCode = statusCode;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ShareDoError);
    }
  }
}

export class AuthenticationError extends ShareDoError {
  constructor(message: string = 'Authentication failed', statusCode?: number) {
    super(message, 'AUTHENTICATION_ERROR', statusCode || 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ShareDoError {
  constructor(message: string = 'Access denied', statusCode?: number) {
    super(message, 'AUTHORIZATION_ERROR', statusCode || 403);
    this.name = 'AuthorizationError';
  }
}

export class ApiError extends ShareDoError {
  constructor(message: string, statusCode?: number) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ShareDoError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ShareDoError {
  public readonly field?: string;
  
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class TimeoutError extends ShareDoError {
  constructor(message: string = 'Operation timed out') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export function isShareDoError(error: any): error is ShareDoError {
  return error instanceof ShareDoError;
}

export function createErrorFromResponse(status: number, message: string): ShareDoError {
  switch (status) {
    case 401:
      return new AuthenticationError(message, status);
    case 403:
      return new AuthorizationError(message, status);
    case 400:
      return new ValidationError(message);
    default:
      return new ApiError(message, status);
  }
}