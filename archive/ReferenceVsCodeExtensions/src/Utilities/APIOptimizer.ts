/**
 * API Request Optimization Module
 * 
 * This module provides advanced request batching, deduplication, and optimization
 * strategies to improve the performance of ShareDo API interactions.
 * 
 * @responsibilities
 * - Batch multiple API requests for efficiency
 * - Deduplicate concurrent identical requests
 * - Implement retry logic with exponential backoff
 * - Provide request queuing and prioritization
 * - Monitor API performance metrics
 * 
 * @author ShareDo Team
 * @version 0.8.2
 */

interface BatchRequest {
    id: string;
    method: string;
    url: string;
    data?: any;
    priority: number;
    timestamp: number;
    resolve: (data: any) => void;
    reject: (error: any) => void;
}

interface RequestMetrics {
    totalRequests: number;
    batchedRequests: number;
    deduplicatedRequests: number;
    avgResponseTime: number;
    errorRate: number;
}

/**
 * Advanced request optimization manager
 */
export class APIOptimizer {
    private requestQueue: BatchRequest[] = [];
    private pendingRequests = new Map<string, BatchRequest[]>();
    private batchTimeout: NodeJS.Timeout | null = null;
    private batchSize = 10;
    private batchWaitTime = 100; // milliseconds
    private metrics: RequestMetrics = {
        totalRequests: 0,
        batchedRequests: 0,
        deduplicatedRequests: 0,
        avgResponseTime: 0,
        errorRate: 0
    };

    /**
     * Add a request to the optimization queue
     * 
     * @param method - HTTP method
     * @param url - Request URL
     * @param data - Request data (optional)
     * @param priority - Request priority (higher = more important)
     * @returns Promise resolving to response data
     */
    async request<T>(
        method: string, 
        url: string, 
        data?: any, 
        priority: number = 1
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestKey = this.generateRequestKey(method, url, data);
            const request: BatchRequest = {
                id: this.generateRequestId(),
                method,
                url,
                data,
                priority,
                timestamp: Date.now(),
                resolve,
                reject
            };

            // Check for duplicate pending requests
            const existing = this.pendingRequests.get(requestKey);
            if (existing) {
                existing.push(request);
                this.metrics.deduplicatedRequests++;
                return;
            }

            // Start new request group
            this.pendingRequests.set(requestKey, [request]);
            this.requestQueue.push(request);
            this.metrics.totalRequests++;

            // Schedule batch processing
            this.scheduleBatch();
        });
    }

    /**
     * Schedule batch processing with debouncing
     */
    private scheduleBatch(): void {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        // Process immediately if batch is full
        if (this.requestQueue.length >= this.batchSize) {
            this.processBatch();
            return;
        }

        // Otherwise wait for more requests
        this.batchTimeout = setTimeout(() => {
            this.processBatch();
        }, this.batchWaitTime);
    }

    /**
     * Process a batch of requests
     */
    private async processBatch(): Promise<void> {
        if (this.requestQueue.length === 0) { 
            return; 
        }

        // Sort by priority (highest first)
        const batch = this.requestQueue
            .splice(0, this.batchSize)
            .sort((a, b) => b.priority - a.priority);

        this.metrics.batchedRequests += batch.length;

        // Group requests by endpoint for potential batching
        const groupedRequests = this.groupRequestsByEndpoint(batch);

        // Process each group
        for (const group of groupedRequests) {
            await this.processRequestGroup(group);
        }

        // Continue processing if more requests are queued
        if (this.requestQueue.length > 0) {
            this.scheduleBatch();
        }
    }

    /**
     * Group requests by endpoint for potential batch processing
     */
    private groupRequestsByEndpoint(requests: BatchRequest[]): BatchRequest[][] {
        const groups = new Map<string, BatchRequest[]>();

        for (const request of requests) {
            const endpoint = this.extractEndpoint(request.url);
            const group = groups.get(endpoint) || [];
            group.push(request);
            groups.set(endpoint, group);
        }

        return Array.from(groups.values());
    }

    /**
     * Process a group of requests to the same endpoint
     */
    private async processRequestGroup(requests: BatchRequest[]): Promise<void> {
        const startTime = Date.now();

        try {
            // For now, process individually (could be enhanced for batch APIs)
            const promises = requests.map(request => this.executeRequest(request));
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error processing request group:', error);
        } finally {
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateMetrics(responseTime, requests.length);

            // Clean up pending requests
            for (const request of requests) {
                const key = this.generateRequestKey(request.method, request.url, request.data);
                this.pendingRequests.delete(key);
            }
        }
    }

    /**
     * Execute a single request with retry logic
     */
    private async executeRequest(request: BatchRequest): Promise<void> {
        const maxRetries = 3;
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Simulate API call (replace with actual API client)
                const response = await this.makeAPICall(request);
                
                // Resolve all duplicate requests
                const duplicates = this.pendingRequests.get(
                    this.generateRequestKey(request.method, request.url, request.data)
                ) || [request];

                duplicates.forEach(req => req.resolve(response));
                return;

            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await this.delay(delay);
                }
            }
        }

        // All retries failed
        const duplicates = this.pendingRequests.get(
            this.generateRequestKey(request.method, request.url, request.data)
        ) || [request];

        duplicates.forEach(req => req.reject(lastError));
    }

    /**
     * Make the actual API call (to be implemented with real API client)
     */
    private async makeAPICall(request: BatchRequest): Promise<any> {
        // This would be replaced with actual ShareDo API client call
        throw new Error('API call implementation needed');
    }

    /**
     * Generate a unique key for request deduplication
     */
    private generateRequestKey(method: string, url: string, data?: any): string {
        const dataHash = data ? JSON.stringify(data) : '';
        return `${method}:${url}:${dataHash}`;
    }

    /**
     * Generate a unique request ID
     */
    private generateRequestId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Extract endpoint from URL for grouping
     */
    private extractEndpoint(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.split('/').slice(0, 3).join('/');
        } catch {
            return url;
        }
    }

    /**
     * Update performance metrics
     */
    private updateMetrics(responseTime: number, requestCount: number): void {
        const currentAvg = this.metrics.avgResponseTime;
        const currentTotal = this.metrics.totalRequests - requestCount;
        
        this.metrics.avgResponseTime = currentTotal > 0 
            ? (currentAvg * currentTotal + responseTime) / (currentTotal + requestCount)
            : responseTime;
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current performance metrics
     */
    getMetrics(): RequestMetrics {
        return { ...this.metrics };
    }

    /**
     * Reset metrics
     */
    resetMetrics(): void {
        this.metrics = {
            totalRequests: 0,
            batchedRequests: 0,
            deduplicatedRequests: 0,
            avgResponseTime: 0,
            errorRate: 0
        };
    }
}

// Global optimizer instance
export const apiOptimizer = new APIOptimizer();
