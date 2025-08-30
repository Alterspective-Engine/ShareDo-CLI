/**
 * Performance monitoring utility for the VS Code extension
 * Tracks cache hits, misses, errors, and other performance metrics
 */
export class PerformanceMonitor {
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

    private recordMetric(type: string, data: any): void {
        const timestamp = Date.now();
        const metric = {
            type,
            timestamp,
            data
        };

        if (!this.metrics.has(type)) {
            this.metrics.set(type, []);
        }

        this.metrics.get(type).push(metric);

        // Keep only recent metrics to prevent memory leaks
        this.pruneOldMetrics(type);
    }

    private pruneOldMetrics(type: string): void {
        const metrics = this.metrics.get(type);
        if (metrics && metrics.length > 1000) {
            // Keep only the last 1000 metrics
            this.metrics.set(type, metrics.slice(-1000));
        }
    }

    getMetrics(type?: string): any {
        if (type) {
            return this.metrics.get(type) || [];
        }
        return Object.fromEntries(this.metrics);
    }

    clearMetrics(): void {
        this.metrics.clear();
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
