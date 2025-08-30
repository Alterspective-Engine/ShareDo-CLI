import { ITreeDataService, CacheStats } from '../interfaces/ITreeProvider';
import { TreeCache } from '../../Utilities/TreeCache';
// Temporary solution: inline simple performance monitoring
interface SimplePerformanceMonitor {
    recordCacheHit(key: string, duration: number): void;
    recordCacheMiss(key: string, duration: number): void;
    recordError(key: string, error: any): void;
    recordPreload(key: string): void;
    getMetrics(): any;
}

// Simple inline implementation to resolve import issue
class SimplePerformanceMonitorImpl implements SimplePerformanceMonitor {
    private metrics = new Map<string, any>();

    recordCacheHit(key: string, duration: number): void {
        this.recordMetric('cache_hit', { key, duration });
    }

    recordCacheMiss(key: string, duration: number): void {
        this.recordMetric('cache_miss', { key, duration });
    }

    recordError(key: string, error: any): void {
        this.recordMetric('error', { key, error: error.message || error.toString() });
    }

    recordPreload(key: string): void {
        this.recordMetric('preload', { key });
    }

    getMetrics(): any {
        const result: any = {};
        for (const [key, value] of this.metrics.entries()) {
            result[key] = value;
        }
        return result;
    }

    private recordMetric(type: string, data: any): void {
        const timestamp = new Date();
        const metric = { type, data, timestamp };
        this.metrics.set(`${type}_${timestamp.getTime()}`, metric);
    }
}

export class TreeDataService implements ITreeDataService {
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        size: 0,
        lastCleanup: new Date()
    };

    constructor(
        private cache: TreeCache,
        private performanceMonitor: SimplePerformanceMonitor = new SimplePerformanceMonitorImpl()
    ) {}

    async fetchData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const startTime = Date.now();
        
        // Try cache first
        let data = this.cache.get<T>(key);
        if (data) {
            this.stats.hits++;
            this.performanceMonitor.recordCacheHit(key, Date.now() - startTime);
            return data;
        }

        // Fetch and cache
        try {
            this.stats.misses++;
            data = await fetcher();
            this.cache.set(key, data);
            this.performanceMonitor.recordCacheMiss(key, Date.now() - startTime);
            return data;
        } catch (error) {
            this.performanceMonitor.recordError(key, error);
            throw error;
        }
    }

    invalidateCache(pattern: string): void {
        this.cache.invalidatePattern(new RegExp(pattern));
        this.updateCacheSize();
    }

    async preloadData(keys: string[]): Promise<void> {
        const promises = keys.map(key => this.preloadKey(key));
        await Promise.allSettled(promises);
    }

    getCacheStats(): CacheStats {
        this.updateCacheSize();
        return { ...this.stats };
    }

    private async preloadKey(key: string): Promise<void> {
        // Only preload if not already cached
        const exists = this.cache.get(key) !== undefined;
        if (!exists) {
            // This would need to be implemented based on the specific data type
            // For now, we'll just mark it as a preload attempt
            this.performanceMonitor.recordPreload(key);
        }
    }

    private updateCacheSize(): void {
        this.stats.size = this.cache.getStats().size;
    }

    cleanup(): void {
        this.cache.cleanup();
        this.stats.lastCleanup = new Date();
        this.updateCacheSize();
    }
}
