/**
 * Constants for ShareDo platform
 */

export const API_ENDPOINTS = {
  AUTH: '/api/authorize',
  WORKFLOWS: '/api/workflows',
  WORKTYPES: '/api/worktypes',
  TEMPLATES: '/api/templates',
  USERS: '/api/users',
  EXECUTIONS: '/api/executions'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000
} as const;

export const TOKEN_CONFIG = {
  REFRESH_THRESHOLD_MS: 300000, // 5 minutes
  STORAGE_KEY: 'sharedo_token'
} as const;

export const SUPPORTED_ENVIRONMENTS = [
  'development',
  'staging', 
  'production'
] as const;

export type Environment = typeof SUPPORTED_ENVIRONMENTS[number];