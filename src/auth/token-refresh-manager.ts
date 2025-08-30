/**
 * TokenRefreshManager prevents race conditions during token refresh
 * Ensures only one refresh operation happens at a time
 */
export class TokenRefreshManager {
  private refreshPromise: Promise<any> | null = null;
  private refreshLock = false;
  private lastRefreshTime = 0;
  private minRefreshInterval = 5000; // Minimum 5 seconds between refresh attempts

  /**
   * Executes a refresh operation with race condition protection
   * @param refreshFn The function that performs the actual token refresh
   */
  async executeRefresh<T>(refreshFn: () => Promise<T>): Promise<T> {
    // Check if we're refreshing too frequently
    const now = Date.now();
    if (now - this.lastRefreshTime < this.minRefreshInterval) {
      throw new Error('Token refresh attempted too frequently');
    }

    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start a new refresh operation
    this.refreshPromise = this.performRefresh(refreshFn);
    
    try {
      const result = await this.refreshPromise;
      this.lastRefreshTime = Date.now();
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh<T>(refreshFn: () => Promise<T>): Promise<T> {
    if (this.refreshLock) {
      throw new Error('Token refresh already in progress');
    }

    this.refreshLock = true;
    try {
      return await refreshFn();
    } finally {
      this.refreshLock = false;
    }
  }

  /**
   * Checks if a refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.refreshLock || this.refreshPromise !== null;
  }

  /**
   * Resets the refresh manager state
   */
  reset(): void {
    this.refreshPromise = null;
    this.refreshLock = false;
    this.lastRefreshTime = 0;
  }
}