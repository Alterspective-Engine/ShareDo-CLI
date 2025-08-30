/**
 * Request deduplication utility to prevent duplicate in-flight requests
 */

export interface IRequestKey {
  method: string;
  url: string;
  params?: any;
  data?: any;
}

export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  /**
   * Generate a unique key for a request
   */
  private generateKey(key: IRequestKey): string {
    const { method, url, params, data } = key;
    const paramStr = params ? JSON.stringify(params) : '';
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${paramStr}:${dataStr}`;
  }
  
  /**
   * Check if a request is already pending
   */
  has(key: IRequestKey): boolean {
    return this.pendingRequests.has(this.generateKey(key));
  }
  
  /**
   * Get a pending request promise
   */
  get<T>(key: IRequestKey): Promise<T> | undefined {
    return this.pendingRequests.get(this.generateKey(key));
  }
  
  /**
   * Add a pending request
   */
  add<T>(key: IRequestKey, promise: Promise<T>): void {
    const requestKey = this.generateKey(key);
    this.pendingRequests.set(requestKey, promise);
    
    // Clean up after completion
    promise
      .finally(() => {
        this.pendingRequests.delete(requestKey);
      })
      .catch(() => {
        // Ignore errors, just cleanup
      });
  }
  
  /**
   * Execute a request with deduplication
   */
  async deduplicate<T>(
    key: IRequestKey,
    executor: () => Promise<T>
  ): Promise<T> {
    const requestKey = this.generateKey(key);
    
    // Check if request is already pending
    const pending = this.pendingRequests.get(requestKey);
    if (pending) {
      return pending as Promise<T>;
    }
    
    // Create new request
    const promise = executor();
    this.add(key, promise);
    
    return promise;
  }
  
  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }
  
  /**
   * Get the number of pending requests
   */
  get size(): number {
    return this.pendingRequests.size;
  }
}