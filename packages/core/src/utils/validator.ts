/**
 * Configuration and input validation utilities
 */

import { ValidationError } from '../errors';
import { IApiClientConfig } from '../api/base.client';

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate API client configuration
 * @throws {ValidationError} if configuration is invalid
 */
export function validateApiConfig(config: IApiClientConfig): void {
  const errors: string[] = [];

  if (!config) {
    throw new ValidationError('Configuration is required');
  }

  if (!isNonEmptyString(config.baseUrl)) {
    errors.push('baseUrl is required and must be a non-empty string');
  } else if (!isValidUrl(config.baseUrl)) {
    errors.push('baseUrl must be a valid URL');
  }

  if (!isNonEmptyString(config.clientId)) {
    errors.push('clientId is required and must be a non-empty string');
  }

  if (!config.authService) {
    errors.push('authService is required');
  }

  if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
    errors.push('timeout must be a positive number');
  }

  if (config.maxRetries !== undefined && (typeof config.maxRetries !== 'number' || config.maxRetries < 0)) {
    errors.push('maxRetries must be a non-negative number');
  }

  if (config.retryDelay !== undefined && (typeof config.retryDelay !== 'number' || config.retryDelay < 0)) {
    errors.push('retryDelay must be a non-negative number');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Invalid configuration: ${errors.join(', ')}`);
  }
}

/**
 * Validate pagination options
 */
export interface IPaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function validatePaginationOptions(options: IPaginationOptions): void {
  if (options.page !== undefined && (typeof options.page !== 'number' || options.page < 1)) {
    throw new ValidationError('page must be a positive number');
  }

  if (options.pageSize !== undefined) {
    if (typeof options.pageSize !== 'number' || options.pageSize < 1) {
      throw new ValidationError('pageSize must be a positive number');
    }
    if (options.pageSize > 1000) {
      throw new ValidationError('pageSize cannot exceed 1000');
    }
  }

  if (options.sortOrder !== undefined && !['asc', 'desc'].includes(options.sortOrder)) {
    throw new ValidationError('sortOrder must be either "asc" or "desc"');
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove potential script tags and dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) {
    throw new ValidationError('File name is required');
  }

  // Remove path traversal attempts and invalid characters
  const sanitized = fileName
    .replace(/\.\./g, '')
    .replace(/[\/\\:*?"<>|]/g, '_')
    .trim();

  if (!sanitized) {
    throw new ValidationError('Invalid file name');
  }

  return sanitized;
}

/**
 * Type guard for checking if value is an object
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep validate an object against a schema
 */
export interface IFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  properties?: Record<string, IFieldSchema>;
  items?: IFieldSchema;
}

export function validateObject(
  data: any,
  schema: Record<string, IFieldSchema>,
  path: string = ''
): string[] {
  const errors: string[] = [];

  // Check required fields
  for (const [field, fieldSchema] of Object.entries(schema)) {
    const fieldPath = path ? `${path}.${field}` : field;
    const value = data?.[field];

    if (fieldSchema.required && (value === undefined || value === null)) {
      errors.push(`${fieldPath} is required`);
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (fieldSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldPath} must be a string`);
        } else {
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push(`${fieldPath} must be at least ${fieldSchema.minLength} characters`);
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors.push(`${fieldPath} must not exceed ${fieldSchema.maxLength} characters`);
          }
          if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
            errors.push(`${fieldPath} has invalid format`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push(`${fieldPath} must be a number`);
        } else {
          if (fieldSchema.min !== undefined && value < fieldSchema.min) {
            errors.push(`${fieldPath} must be at least ${fieldSchema.min}`);
          }
          if (fieldSchema.max !== undefined && value > fieldSchema.max) {
            errors.push(`${fieldPath} must not exceed ${fieldSchema.max}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldPath} must be a boolean`);
        }
        break;

      case 'object':
        if (!isObject(value)) {
          errors.push(`${fieldPath} must be an object`);
        } else if (fieldSchema.properties) {
          errors.push(...validateObject(value, fieldSchema.properties, fieldPath));
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldPath} must be an array`);
        } else if (fieldSchema.items) {
          value.forEach((item, index) => {
            const itemPath = `${fieldPath}[${index}]`;
            const itemsSchema = fieldSchema.items!;
            if (itemsSchema.type === 'object' && itemsSchema.properties) {
              errors.push(...validateObject(item, itemsSchema.properties, itemPath));
            }
          });
        }
        break;
    }
  }

  return errors;
}