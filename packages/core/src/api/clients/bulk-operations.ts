/**
 * Bulk operations support for API clients
 */

import { BaseApiClient } from '../base.client';

/**
 * Bulk operation request
 */
export interface IBulkRequest<T> {
  id: string;
  data?: T;
}

/**
 * Bulk operation response
 */
export interface IBulkResponse<T> {
  id: string;
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Bulk operation options
 */
export interface IBulkOptions {
  batchSize?: number;
  parallel?: boolean;
  continueOnError?: boolean;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Bulk operations helper class
 */
export class BulkOperations {
  /**
   * Execute bulk operations in batches
   */
  static async executeBatch<TInput, TOutput>(
    items: TInput[],
    executor: (batch: TInput[]) => Promise<TOutput[]>,
    options: IBulkOptions = {}
  ): Promise<TOutput[]> {
    const {
      batchSize = 10,
      onProgress
    } = options;
    
    const results: TOutput[] = [];
    let completed = 0;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, items.length));
      const batchResults = await executor(batch);
      results.push(...batchResults);
      
      completed += batch.length;
      if (onProgress) {
        onProgress(completed, items.length);
      }
    }
    
    return results;
  }
  
  /**
   * Execute bulk operations in parallel
   */
  static async executeParallel<TInput, TOutput>(
    items: TInput[],
    executor: (item: TInput) => Promise<TOutput>,
    options: IBulkOptions = {}
  ): Promise<IBulkResponse<TOutput>[]> {
    const {
      batchSize = 10,
      continueOnError = true,
      onProgress
    } = options;
    
    const results: IBulkResponse<TOutput>[] = [];
    let completed = 0;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, items.length));
      
      const batchPromises = batch.map(async (item: any, index) => {
        try {
          const data = await executor(item);
          return {
            id: item.id || `${i + index}`,
            success: true,
            data
          };
        } catch (error: any) {
          const response: IBulkResponse<TOutput> = {
            id: item.id || `${i + index}`,
            success: false,
            error: {
              message: error.message || 'Unknown error',
              code: error.code || 'BULK_ERROR'
            }
          };
          
          if (!continueOnError) {
            throw error;
          }
          
          return response;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      completed += batch.length;
      if (onProgress) {
        onProgress(completed, items.length);
      }
    }
    
    return results;
  }
  
  /**
   * Combine multiple requests into a single bulk request
   */
  static createBulkPayload<T>(items: IBulkRequest<T>[]): any {
    return {
      operations: items.map(item => ({
        id: item.id,
        ...item.data
      }))
    };
  }
  
  /**
   * Parse bulk response into individual results
   */
  static parseBulkResponse<T>(response: any): IBulkResponse<T>[] {
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response.results && Array.isArray(response.results)) {
      return response.results;
    }
    
    if (response.operations && Array.isArray(response.operations)) {
      return response.operations;
    }
    
    throw new Error('Invalid bulk response format');
  }
}