/**
 * Base API client implementation with retry logic and error handling
 */
import { AxiosInstance } from 'axios';
import { IAuthenticationService } from '../auth/interfaces';
export interface IApiClientConfig {
    baseUrl: string;
    authService: IAuthenticationService;
    clientId: string;
    clientSecret?: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}
export interface IRequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, any>;
    timeout?: number;
    skipAuth?: boolean;
}
export declare abstract class BaseApiClient {
    protected axiosInstance: AxiosInstance;
    protected authService: IAuthenticationService;
    protected config: IApiClientConfig;
    private retryCount;
    constructor(config: IApiClientConfig);
    private setupInterceptors;
    protected getAccessToken(): Promise<string>;
    protected refreshToken(): Promise<string>;
    private getRetryAfter;
    private delay;
    private transformError;
    get<T>(endpoint: string, options?: IRequestOptions): Promise<T>;
    post<T>(endpoint: string, data?: any, options?: IRequestOptions): Promise<T>;
    put<T>(endpoint: string, data?: any, options?: IRequestOptions): Promise<T>;
    delete<T>(endpoint: string, options?: IRequestOptions): Promise<T>;
    patch<T>(endpoint: string, data?: any, options?: IRequestOptions): Promise<T>;
}
