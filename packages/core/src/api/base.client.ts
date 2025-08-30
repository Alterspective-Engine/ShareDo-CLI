/**
 * Base API client implementation with retry logic and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { IAuthenticationService } from '../auth/interfaces';
import { ShareDoError } from '../errors';

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

export abstract class BaseApiClient {
  protected axiosInstance: AxiosInstance;
  protected authService: IAuthenticationService;
  protected config: IApiClientConfig;
  private retryCount: Map<string, number> = new Map();

  constructor(config: IApiClientConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    
    this.authService = config.authService;
    
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (!config.headers['Authorization'] && !config.headers['skipAuth']) {
          try {
            const token = await this.getAccessToken();
            config.headers['Authorization'] = `Bearer ${token}`;
          } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
          }
        }
        delete config.headers['skipAuth'];
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and retry
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        const requestKey = `${originalRequest.method}:${originalRequest.url}`;
        const retryCount = this.retryCount.get(requestKey) || 0;

        // Handle 401 - Token might be expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const token = await this.refreshToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        // Handle 429 - Rate limiting
        if (error.response?.status === 429 && retryCount < this.config.maxRetries!) {
          const retryAfter = this.getRetryAfter(error.response);
          this.retryCount.set(requestKey, retryCount + 1);
          
          await this.delay(retryAfter);
          return this.axiosInstance(originalRequest);
        }

        // Handle 5xx - Server errors with retry
        if (error.response && error.response.status >= 500 && retryCount < this.config.maxRetries!) {
          this.retryCount.set(requestKey, retryCount + 1);
          const delay = this.config.retryDelay! * Math.pow(2, retryCount); // Exponential backoff
          
          await this.delay(delay);
          return this.axiosInstance(originalRequest);
        }

        // Clear retry count on final failure
        this.retryCount.delete(requestKey);
        
        return Promise.reject(this.transformError(error));
      }
    );
  }

  protected async getAccessToken(): Promise<string> {
    const tokenResponse = await this.authService.authenticate({
      tokenEndpoint: `${this.config.baseUrl}/api/authorize`,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      scope: 'sharedo'
    });
    return tokenResponse.access_token;
  }

  protected async refreshToken(): Promise<string> {
    const tokenResponse = await this.authService.refreshToken({
      tokenEndpoint: `${this.config.baseUrl}/api/authorize`,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret
    });
    return tokenResponse.access_token;
  }

  private getRetryAfter(response: AxiosResponse): number {
    const retryAfter = response.headers['retry-after'];
    if (retryAfter) {
      const retryAfterSeconds = parseInt(retryAfter, 10);
      if (!isNaN(retryAfterSeconds)) {
        return retryAfterSeconds * 1000;
      }
    }
    return this.config.retryDelay! * 2;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformError(error: AxiosError): ShareDoError {
    if (error.response) {
      const data = error.response.data as any;
      return new ShareDoError(
        data?.message || error.message,
        data?.code || 'API_ERROR',
        error.response.status
      );
    } else if (error.request) {
      return new ShareDoError(
        'No response from server',
        'NETWORK_ERROR'
      );
    } else {
      return new ShareDoError(
        error.message,
        'REQUEST_ERROR'
      );
    }
  }

  // Public API methods
  async get<T>(endpoint: string, options?: IRequestOptions): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, {
      headers: {
        ...options?.headers,
        skipAuth: options?.skipAuth ? 'true' : undefined
      } as any,
      params: options?.params,
      timeout: options?.timeout
    });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any, options?: IRequestOptions): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, {
      headers: {
        ...options?.headers,
        skipAuth: options?.skipAuth ? 'true' : undefined
      } as any,
      params: options?.params,
      timeout: options?.timeout
    });
    return response.data;
  }

  async put<T>(endpoint: string, data?: any, options?: IRequestOptions): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data, {
      headers: {
        ...options?.headers,
        skipAuth: options?.skipAuth ? 'true' : undefined
      } as any,
      params: options?.params,
      timeout: options?.timeout
    });
    return response.data;
  }

  async delete<T>(endpoint: string, options?: IRequestOptions): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, {
      headers: {
        ...options?.headers,
        skipAuth: options?.skipAuth ? 'true' : undefined
      } as any,
      params: options?.params,
      timeout: options?.timeout
    });
    return response.data;
  }

  async patch<T>(endpoint: string, data?: any, options?: IRequestOptions): Promise<T> {
    const response = await this.axiosInstance.patch<T>(endpoint, data, {
      headers: {
        ...options?.headers,
        skipAuth: options?.skipAuth ? 'true' : undefined
      } as any,
      params: options?.params,
      timeout: options?.timeout
    });
    return response.data;
  }
}