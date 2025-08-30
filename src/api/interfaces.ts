import { AuthenticationService } from '../auth/authentication.service';

export interface IApiClientOptions {
  baseURL: string;
  authService?: AuthenticationService;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  rejectUnauthorized?: boolean;
  maxRetries?: number;
}

export interface IRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface IApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, any>;
}

export interface IApiError {
  message: string;
  code?: string;
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, any>;
}

export interface IPaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface IQueryParams {
  filter?: string;
  search?: string;
  fields?: string[];
  expand?: string[];
}