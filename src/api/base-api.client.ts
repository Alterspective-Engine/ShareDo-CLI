import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as https from 'https';
import { AuthenticationService } from '../auth/authentication.service';
import { IApiClientOptions, IApiError, IApiResponse, IRequestOptions } from './interfaces';
import { RetryStrategy } from '../utils/retry-strategy';
import { validateUrl, validateApiResponse, sanitizeErrorMessage } from '../utils/input-validator';

export class BaseApiClient {
  protected axiosInstance: AxiosInstance;
  protected authService?: AuthenticationService;
  protected baseURL: string;
  private retryStrategy: RetryStrategy;
  private activeRequests = new Set<string>();

  constructor(options: IApiClientOptions) {
    this.baseURL = validateUrl(options.baseURL);
    this.authService = options.authService;
    this.retryStrategy = new RetryStrategy({
      baseDelay: 1000,
      maxDelay: 30000,
      maxRetries: options.maxRetries || 3
    });
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.defaultHeaders
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: options.rejectUnauthorized ?? true
      })
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (this.authService) {
          const token = await this.authService.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && this.authService) {
          originalRequest._retry = true;
          
          try {
            await this.authService.refreshToken();
            const token = await this.authService.getAccessToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.authService.clearAuthentication();
            return Promise.reject(refreshError);
          }
        }

        if (error.response?.status === 429) {
          if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
          }
          
          if (this.retryStrategy.shouldRetry(originalRequest._retryCount + 1, error)) {
            originalRequest._retryCount++;
            const delay = this.retryStrategy.getDelay(originalRequest._retryCount);
            
            // Honor Retry-After header if present
            const retryAfter = error.response.headers['retry-after'];
            const serverDelay = retryAfter ? parseInt(retryAfter) * 1000 : 0;
            const actualDelay = Math.max(delay, serverDelay);
            
            await this.delay(actualDelay);
            return this.axiosInstance(originalRequest);
          }
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  protected async get<T>(
    path: string,
    options?: IRequestOptions
  ): Promise<IApiResponse<T>> {
    const response = await this.axiosInstance.get<T>(path, this.buildConfig(options));
    return this.transformResponse(response);
  }

  protected async post<T>(
    path: string,
    data?: any,
    options?: IRequestOptions
  ): Promise<IApiResponse<T>> {
    const response = await this.axiosInstance.post<T>(path, data, this.buildConfig(options));
    return this.transformResponse(response);
  }

  protected async put<T>(
    path: string,
    data?: any,
    options?: IRequestOptions
  ): Promise<IApiResponse<T>> {
    const response = await this.axiosInstance.put<T>(path, data, this.buildConfig(options));
    return this.transformResponse(response);
  }

  protected async patch<T>(
    path: string,
    data?: any,
    options?: IRequestOptions
  ): Promise<IApiResponse<T>> {
    const response = await this.axiosInstance.patch<T>(path, data, this.buildConfig(options));
    return this.transformResponse(response);
  }

  protected async delete<T>(
    path: string,
    options?: IRequestOptions
  ): Promise<IApiResponse<T>> {
    const response = await this.axiosInstance.delete<T>(path, this.buildConfig(options));
    return this.transformResponse(response);
  }

  private buildConfig(options?: IRequestOptions): AxiosRequestConfig {
    const config: AxiosRequestConfig = {};
    
    if (options?.headers) {
      config.headers = options.headers;
    }
    
    if (options?.params) {
      config.params = options.params;
    }
    
    if (options?.timeout) {
      config.timeout = options.timeout;
    }
    
    return config;
  }

  private transformResponse<T>(response: AxiosResponse<T>): IApiResponse<T> {
    // Validate response data
    validateApiResponse(response.data);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }

  private transformError(error: AxiosError): IApiError {
    return {
      message: sanitizeErrorMessage(error.message),
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setAuthenticationService(authService: AuthenticationService): void {
    this.authService = authService;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  setDefaultHeader(key: string, value: string): void {
    this.axiosInstance.defaults.headers.common[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.axiosInstance.defaults.headers.common[key];
  }
}