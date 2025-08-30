/**
 * Common utility functions for ShareDo platform
 */

// Export existing utilities
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isNullOrEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === '';
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
  return date.toISOString();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await fn();
        resolve(result);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(error);
          return;
        }
        await delay(delayMs * attempts);
      }
    }
  });
}

// Export new utilities
export * from './logger';
export * from './validator';