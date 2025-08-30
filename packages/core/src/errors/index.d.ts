/**
 * Error classes for ShareDo platform
 */
export declare class ShareDoError extends Error {
    readonly code: string;
    readonly statusCode?: number;
    constructor(message: string, code?: string, statusCode?: number);
}
export declare class AuthenticationError extends ShareDoError {
    constructor(message?: string, statusCode?: number);
}
export declare class AuthorizationError extends ShareDoError {
    constructor(message?: string, statusCode?: number);
}
export declare class ApiError extends ShareDoError {
    constructor(message: string, statusCode?: number);
}
export declare class NetworkError extends ShareDoError {
    constructor(message?: string);
}
export declare class ValidationError extends ShareDoError {
    readonly field?: string;
    constructor(message: string, field?: string);
}
export declare class TimeoutError extends ShareDoError {
    constructor(message?: string);
}
export declare function isShareDoError(error: any): error is ShareDoError;
export declare function createErrorFromResponse(status: number, message: string): ShareDoError;
