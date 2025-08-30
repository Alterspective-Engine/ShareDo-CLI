"use strict";
/**
 * Constants for ShareDo platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_ENVIRONMENTS = exports.TOKEN_CONFIG = exports.RETRY_CONFIG = exports.DEFAULT_TIMEOUT = exports.HTTP_STATUS = exports.API_ENDPOINTS = void 0;
exports.API_ENDPOINTS = {
    AUTH: '/api/authorize',
    WORKFLOWS: '/api/workflows',
    WORKTYPES: '/api/worktypes',
    TEMPLATES: '/api/templates',
    USERS: '/api/users',
    EXECUTIONS: '/api/executions'
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
exports.DEFAULT_TIMEOUT = 30000; // 30 seconds
exports.RETRY_CONFIG = {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000
};
exports.TOKEN_CONFIG = {
    REFRESH_THRESHOLD_MS: 300000,
    STORAGE_KEY: 'sharedo_token'
};
exports.SUPPORTED_ENVIRONMENTS = [
    'development',
    'staging',
    'production'
];
