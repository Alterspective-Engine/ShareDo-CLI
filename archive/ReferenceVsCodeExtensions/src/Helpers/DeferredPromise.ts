/**
 * DeferredPromise Utility Class
 *
 * Provides a wrapper for creating a promise that can be resolved or rejected externally.
 * Useful for asynchronous operations where the completion is controlled outside the promise constructor.
 */
export class DeferredPromise<T> {
    promise: Promise<T>;
    resolve!: (value?: T | PromiseLike<T>) => void;
    reject!: (reason?: any) => void;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            // Type assertions here to satisfy TypeScript's strict checks.
            this.resolve = resolve as any;
            this.reject = reject;
        });
    }
}
