export const API_VERSION = 'v1';
export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
} as const;

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  OCTET_STREAM: 'application/octet-stream'
} as const;

export const AUTH_HEADERS = {
  AUTHORIZATION: 'Authorization',
  API_KEY: 'X-API-Key',
  CLIENT_ID: 'X-Client-Id',
  CLIENT_SECRET: 'X-Client-Secret'
} as const;

export const GRANT_TYPES = {
  PASSWORD: 'password',
  CLIENT_CREDENTIALS: 'client_credentials',
  REFRESH_TOKEN: 'refresh_token',
  AUTHORIZATION_CODE: 'authorization_code',
  IMPERSONATE_SPECIFIED: 'Impersonate.Specified'
} as const;

export const TOKEN_TYPES = {
  BEARER: 'Bearer',
  BASIC: 'Basic',
  API_KEY: 'ApiKey'
} as const;

export const DEFAULT_HEADERS = {
  'User-Agent': '@sharedo/core',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
} as const;

export const ENVIRONMENTS = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEVELOPMENT: 'development',
  TEST: 'test',
  LOCAL: 'local'
} as const;

export const FILE_TYPES = {
  CSS: 'css',
  HTML: 'html',
  JAVASCRIPT: 'js',
  JSON: 'json',
  TEXT: 'text',
  XML: 'xml',
  WORKFLOW_ACTION_MANIFEST: 'wfActionManifest',
  WIDGET_MANIFEST: 'widgetManifest',
  WORKFLOW_DEFINITION: 'workflowDefinition'
} as const;

export const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DEPRECATED: 'deprecated'
} as const;

export const EXECUTION_STATUSES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
} as const;

export const ERROR_CODES = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    TOKEN: '/connect/token',
    REFRESH: '/connect/refresh',
    LOGOUT: '/connect/logout',
    USER_INFO: '/connect/userinfo'
  },
  WORKFLOWS: {
    BASE: '/api/workflows',
    EXECUTE: '/api/workflows/{id}/execute',
    HISTORY: '/api/workflows/{id}/history',
    VERSIONS: '/api/workflows/{id}/versions'
  },
  FILES: {
    BASE: '/api/files',
    UPLOAD: '/api/files/upload',
    DOWNLOAD: '/api/files/{id}/download',
    CONTENT: '/api/files/{id}/content'
  },
  IDE: {
    BASE: '/api/ide',
    TEMPLATES: '/api/ide/templates',
    FOLDERS: '/api/ide/folders'
  },
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    PREFERENCES: '/api/users/preferences'
  }
} as const;