/**
 * Input validation utilities for security
 */

/**
 * Validates and sanitizes URLs
 */
export function validateUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: must be a non-empty string');
  }

  // Remove any leading/trailing whitespace
  const trimmedUrl = url.trim();

  // Check for empty string after trimming
  if (!trimmedUrl) {
    throw new Error('Invalid URL: cannot be empty');
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`Invalid URL protocol: ${parsedUrl.protocol}`);
    }

    // Prevent localhost in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        throw new Error('Localhost URLs are not allowed in production');
      }
    }

    // Return the validated URL string
    return parsedUrl.toString();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      throw new Error(`Invalid URL format: ${trimmedUrl}`);
    }
    throw error;
  }
}

/**
 * Validates client ID format
 */
export function validateClientId(clientId: string): string {
  if (!clientId || typeof clientId !== 'string') {
    throw new Error('Invalid client ID: must be a non-empty string');
  }

  const trimmed = clientId.trim();
  
  // Client ID should only contain alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    throw new Error('Invalid client ID: contains invalid characters');
  }

  // Reasonable length limits
  if (trimmed.length < 5 || trimmed.length > 128) {
    throw new Error('Invalid client ID: length must be between 5 and 128 characters');
  }

  return trimmed;
}

/**
 * Validates and sanitizes username
 */
export function validateUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    throw new Error('Invalid username: must be a non-empty string');
  }

  const trimmed = username.trim();
  
  // Username validation (alphanumeric, dots, underscores, hyphens)
  if (!/^[a-zA-Z0-9._\-@]+$/.test(trimmed)) {
    throw new Error('Invalid username: contains invalid characters');
  }

  // Length limits
  if (trimmed.length < 3 || trimmed.length > 64) {
    throw new Error('Invalid username: length must be between 3 and 64 characters');
  }

  return trimmed;
}

/**
 * Sanitizes error messages to prevent information leakage
 */
export function sanitizeErrorMessage(message: string, isProduction = process.env.NODE_ENV === 'production'): string {
  if (!isProduction) {
    return message; // Full messages in development
  }

  // Remove sensitive patterns
  const patterns = [
    /Bearer [A-Za-z0-9\-._~+\/]+=*/gi, // Bearer tokens
    /Basic [A-Za-z0-9+\/=]+/gi, // Basic auth
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, // UUIDs
    /password["\s]*[:=]["\s]*[^"\s,}]+/gi, // Passwords in JSON
    /secret["\s]*[:=]["\s]*[^"\s,}]+/gi, // Secrets
    /token["\s]*[:=]["\s]*[^"\s,}]+/gi, // Tokens
    /\/\/[^:]+:[^@]+@/g, // Credentials in URLs
  ];

  let sanitized = message;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Limit message length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + '...';
  }

  return sanitized;
}

/**
 * Validates API response data structure
 */
export function validateApiResponse(data: any): void {
  if (data === null || data === undefined) {
    return; // Null/undefined responses are valid
  }

  // Check for suspicious patterns that might indicate an attack
  const jsonString = JSON.stringify(data);
  
  // Check for extremely large responses
  if (jsonString.length > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Response too large');
  }

  // Check for deeply nested objects (potential DoS)
  if (getObjectDepth(data) > 20) {
    throw new Error('Response object too deeply nested');
  }
}

/**
 * Calculate object nesting depth
 */
function getObjectDepth(obj: any): number {
  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }

  let maxDepth = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const depth = getObjectDepth(obj[key]);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth + 1;
}

/**
 * Validates environment configuration
 */
export function validateEnvironment(env: string): string {
  const validEnvironments = ['development', 'staging', 'production', 'test'];
  const normalized = env.toLowerCase().trim();
  
  if (!validEnvironments.includes(normalized)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${validEnvironments.join(', ')}`);
  }
  
  return normalized;
}