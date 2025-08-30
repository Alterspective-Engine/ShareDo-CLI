/**
 * Constants for ShareDo platform
 */
export declare const API_ENDPOINTS: {
    readonly AUTH: "/api/authorize";
    readonly WORKFLOWS: "/api/workflows";
    readonly WORKTYPES: "/api/worktypes";
    readonly TEMPLATES: "/api/templates";
    readonly USERS: "/api/users";
    readonly EXECUTIONS: "/api/executions";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const DEFAULT_TIMEOUT = 30000;
export declare const RETRY_CONFIG: {
    readonly MAX_ATTEMPTS: 3;
    readonly BASE_DELAY: 1000;
    readonly MAX_DELAY: 10000;
};
export declare const TOKEN_CONFIG: {
    readonly REFRESH_THRESHOLD_MS: 300000;
    readonly STORAGE_KEY: "sharedo_token";
};
export declare const SUPPORTED_ENVIRONMENTS: readonly ["development", "staging", "production"];
export type Environment = typeof SUPPORTED_ENVIRONMENTS[number];
