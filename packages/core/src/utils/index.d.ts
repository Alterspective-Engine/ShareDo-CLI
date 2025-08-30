/**
 * Common utility functions for ShareDo platform
 */
export declare function delay(ms: number): Promise<void>;
export declare function isNullOrEmpty(value: string | null | undefined): boolean;
export declare function formatDate(date: Date): string;
export declare function formatDateTime(date: Date): string;
export declare function generateId(): string;
export declare function deepClone<T>(obj: T): T;
export declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
