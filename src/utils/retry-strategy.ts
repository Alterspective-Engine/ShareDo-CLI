/**
 * Retry strategy with exponential backoff and jitter
 */
export class RetryStrategy {
  private baseDelay: number;
  private maxDelay: number;
  private maxRetries: number;
  private jitterRange: number;

  constructor(options?: {
    baseDelay?: number;
    maxDelay?: number;
    maxRetries?: number;
    jitterRange?: number;
  }) {
    this.baseDelay = options?.baseDelay || 1000; // 1 second
    this.maxDelay = options?.maxDelay || 30000; // 30 seconds
    this.maxRetries = options?.maxRetries || 3;
    this.jitterRange = options?.jitterRange || 0.3; // 30% jitter
  }

  /**
   * Calculate delay for a given retry attempt with exponential backoff and jitter
   */
  getDelay(attemptNumber: number): number {
    if (attemptNumber <= 0) {
      return 0;
    }

    // Exponential backoff: delay = baseDelay * 2^(attemptNumber - 1)
    const exponentialDelay = this.baseDelay * Math.pow(2, attemptNumber - 1);
    
    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, this.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = this.calculateJitter(cappedDelay);
    
    return Math.round(cappedDelay + jitter);
  }

  /**
   * Calculate jitter value
   */
  private calculateJitter(delay: number): number {
    const jitterMax = delay * this.jitterRange;
    return (Math.random() - 0.5) * 2 * jitterMax;
  }

  /**
   * Check if retry should be attempted
   */
  shouldRetry(attemptNumber: number, error?: any): boolean {
    if (attemptNumber >= this.maxRetries) {
      return false;
    }

    // Check if error is retryable
    if (error) {
      return this.isRetryableError(error);
    }

    return true;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET') {
      return true;
    }

    // HTTP status codes that are retryable
    const retryableStatusCodes = [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ];

    if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    return false;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number, error: any) => void
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(attempt, error)) {
          throw error;
        }
        
        if (attempt < this.maxRetries) {
          const delay = this.getDelay(attempt);
          
          if (onRetry) {
            onRetry(attempt, delay, error);
          }
          
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry configuration
   */
  getConfig() {
    return {
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      maxRetries: this.maxRetries,
      jitterRange: this.jitterRange
    };
  }
}