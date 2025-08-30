/**
 * Debouncer Utility
 * 
 * Provides debouncing functionality to batch operations and prevent rapid repeated executions
 */

export class Debouncer<T = void> {
    private timeout: NodeJS.Timeout | null = null;
    private pendingPromise: Promise<T> | null = null;
    private resolvePromise: ((value: T) => void) | null = null;
    private rejectPromise: ((reason?: any) => void) | null = null;
    private operationCount: number = 0;
    private accumulatedData: any[] = [];

    constructor(
        private readonly delayMs: number,
        private readonly operation: (count: number, data: any[]) => Promise<T>,
        private readonly onDebounceStart?: () => void,
        private readonly onDebounceEnd?: (result: T, count: number) => void
    ) {}

    /**
     * Trigger the debounced operation
     * @param data Optional data to accumulate for the operation
     */
    public trigger(data?: any): Promise<T> {
        this.operationCount++;
        
        if (data !== undefined) {
            this.accumulatedData.push(data);
        }

        // Call start callback on first trigger
        if (this.operationCount === 1 && this.onDebounceStart) {
            this.onDebounceStart();
        }

        // Clear existing timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Create a new promise if we don't have one
        if (!this.pendingPromise) {
            this.pendingPromise = new Promise<T>((resolve, reject) => {
                this.resolvePromise = resolve;
                this.rejectPromise = reject;
            });
        }

        // Set new timeout
        this.timeout = setTimeout(async () => {
            try {
                const count = this.operationCount;
                const data = [...this.accumulatedData];
                
                // Execute the operation
                const result = await this.operation(count, data);
                
                // Call end callback
                if (this.onDebounceEnd) {
                    this.onDebounceEnd(result, count);
                }
                
                // Resolve the promise
                if (this.resolvePromise) {
                    this.resolvePromise(result);
                }
            } catch (error) {
                // Reject the promise
                if (this.rejectPromise) {
                    this.rejectPromise(error);
                }
            } finally {
                // Reset state
                this.reset();
            }
        }, this.delayMs);

        return this.pendingPromise;
    }

    /**
     * Cancel any pending operation
     */
    public cancel(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        
        if (this.rejectPromise) {
            this.rejectPromise(new Error('Operation cancelled'));
        }
        
        this.reset();
    }

    /**
     * Reset the debouncer state
     */
    private reset(): void {
        this.timeout = null;
        this.pendingPromise = null;
        this.resolvePromise = null;
        this.rejectPromise = null;
        this.operationCount = 0;
        this.accumulatedData = [];
    }

    /**
     * Get the current operation count
     */
    public getOperationCount(): number {
        return this.operationCount;
    }

    /**
     * Check if there's a pending operation
     */
    public isPending(): boolean {
        return this.timeout !== null;
    }
}

/**
 * Create a simple debounced function
 */
export function createDebouncer<T = void>(
    fn: (...args: any[]) => Promise<T>,
    delayMs: number
): (...args: any[]) => Promise<T> {
    let timeout: NodeJS.Timeout | null = null;
    let resolvePromise: ((value: T) => void) | null = null;
    let rejectPromise: ((reason?: any) => void) | null = null;
    let pendingPromise: Promise<T> | null = null;

    return (...args: any[]): Promise<T> => {
        // Clear existing timeout
        if (timeout) {
            clearTimeout(timeout);
        }

        // Create a new promise if we don't have one
        if (!pendingPromise) {
            pendingPromise = new Promise<T>((resolve, reject) => {
                resolvePromise = resolve;
                rejectPromise = reject;
            });
        }

        // Set new timeout
        timeout = setTimeout(async () => {
            try {
                const result = await fn(...args);
                if (resolvePromise) {
                    resolvePromise(result);
                }
            } catch (error) {
                if (rejectPromise) {
                    rejectPromise(error);
                }
            } finally {
                timeout = null;
                pendingPromise = null;
                resolvePromise = null;
                rejectPromise = null;
            }
        }, delayMs);

        return pendingPromise;
    };
}