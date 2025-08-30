/**
 * TreeCache - Performance optimization for tree view operations
 * 
 * This module provides caching mechanisms for tree node data to improve
 * performance by reducing redundant API calls and tree generation operations.
 * 
 * @responsibilities
 * - Cache tree node data with configurable TTL
 * - Manage cache invalidation strategies
 * - Provide cache statistics and monitoring
 * - Handle memory-efficient cache cleanup
 * 
 * @author ShareDo Team
 * @version 0.8.2
 */

import { TreeNode } from '../treeprovider';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

/**
 * High-performance cache for tree node data with TTL and LRU eviction
 */
export class TreeCache {
    private cache = new Map<string, CacheEntry<any>>();
    private stats = { hits: 0, misses: 0 };
    private maxSize: number = 1000;
    private defaultTTL: number = 300000; // 5 minutes

    /**
     * Get cached data or return undefined if not found/expired
     * 
     * @param key - Cache key
     * @returns Cached data or undefined
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            return undefined;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        
        return entry.data;
    }

    /**
     * Store data in cache with optional TTL
     * 
     * @param key - Cache key
     * @param data - Data to cache
     * @param ttl - Time to live in milliseconds (optional)
     */
    set<T>(key: string, data: T, ttl?: number): void {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
            accessCount: 1,
            lastAccessed: Date.now()
        };

        this.cache.set(key, entry);
    }

    /**
     * Invalidate specific cache entry
     * 
     * @param key - Cache key to invalidate
     */
    invalidate(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Invalidate all cache entries matching a pattern
     * 
     * @param pattern - RegExp pattern to match keys
     */
    invalidatePattern(pattern: RegExp): number {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
    }

    /**
     * Get cache statistics
     * 
     * @returns Cache performance statistics
     */
    getStats(): CacheStats {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? this.stats.hits / (this.stats.hits + this.stats.misses) 
            : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }

    /**
     * Evict least recently used entries to make room
     */
    private evictLRU(): void {
        let oldestKey: string | undefined;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }
}

// Global cache instance
export const treeCache = new TreeCache();
