export class ShareDoError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'ShareDoError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    Object.setPrototypeOf(this, ShareDoError.prototype);
  }
}

export class AuthenticationError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT_ERROR', 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ShareDoError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: any) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NetworkError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'TIMEOUT_ERROR', 408, details);
    this.name = 'TimeoutError';
  }
}

export class ServerError extends ShareDoError {
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message, 'SERVER_ERROR', statusCode, details);
    this.name = 'ServerError';
  }
}

export class ConfigurationError extends ShareDoError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', undefined, details);
    this.name = 'ConfigurationError';
  }
}

export function isShareDoError(error: any): error is ShareDoError {
  return error instanceof ShareDoError;
}

export function handleError(error: any): ShareDoError {
  if (isShareDoError(error)) {
    return error;
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || error.message;

    switch (status) {
      case 400:
        return new ValidationError(message, data);
      case 401:
        return new AuthenticationError(message, data);
      case 403:
        return new AuthorizationError(message, data);
      case 404:
        return new NotFoundError(message, data);
      case 409:
        return new ConflictError(message, data);
      case 429: {
        const retryAfter = error.response.headers['retry-after'];
        return new RateLimitError(message, retryAfter ? parseInt(retryAfter) : undefined, data);
      }
      case 408:
        return new TimeoutError(message, data);
      default:
        if (status >= 500) {
          return new ServerError(message, status, data);
        }
        return new ShareDoError(message, 'UNKNOWN_ERROR', status, data);
    }
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new NetworkError(error.message, { code: error.code });
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return new TimeoutError(error.message, { code: error.code });
  }

  return new ShareDoError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    undefined,
    error
  );
}