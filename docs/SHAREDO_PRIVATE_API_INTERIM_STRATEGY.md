# ShareDo Private API Interim Strategy
## Pragmatic Approach for CLI & MCP Implementation

### Version 1.0.0
### Date: 2025-08-28

---

## Executive Summary

This document provides a pragmatic strategy for using ShareDo private APIs in the interim period before plugin development resources are available. While acknowledging the risks, we establish best practices, monitoring strategies, and defensive coding patterns to minimize impact when private APIs change.

**Key Principles:**
- 📊 **Monitor Everything**: Comprehensive health checks and API monitoring
- 🛡️ **Defensive Coding**: Expect and handle API changes gracefully
- 📝 **Document Dependencies**: Track all private API usage
- 🔄 **Version Detection**: Detect API changes early
- ⚠️ **Risk Acceptance**: Clear documentation of accepted risks

---

## Table of Contents
1. [Private API Categories & Priority](#private-api-categories--priority)
2. [Health Monitoring APIs](#health-monitoring-apis)
3. [Defensive Implementation Patterns](#defensive-implementation-patterns)
4. [Monitoring Strategy](#monitoring-strategy)
5. [Risk Mitigation Techniques](#risk-mitigation-techniques)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Private API Categories & Priority

### Critical Private APIs (Must Use)

These private APIs have no public alternatives and are essential for ShareDo CLI/MCP functionality:

```typescript
enum CriticalPrivateAPIs {
    // Work Type Management
    WORK_TYPE_CONFIG = '/api/modeller/types',
    WORK_TYPE_ASPECTS = '/api/modeller/types/{systemName}/aspect-sections',
    WORK_TYPE_ROLES = '/api/modeller/types/{systemName}/participant-roles',
    WORK_TYPE_PERMISSIONS = '/api/modeller/types/{systemName}/create-permissions',
    
    // Export/Import (Core Functionality)
    EXPORT_PACKAGE = '/api/modeller/importexport/export/package',
    EXPORT_PROGRESS = '/api/modeller/importexport/export/package/{jobId}/progress',
    EXPORT_DOWNLOAD = '/modeller/__importexport/export/package/{jobId}/download',
    IMPORT_PACKAGE = '/api/modeller/importexport/import',
    IMPORT_VALIDATE = '/api/modeller/importexport/validate',
    
    // Workflow Execution
    WORKFLOW_LIST = '/api/workflows',
    WORKFLOW_DETAILS = '/api/workflows/{systemName}',
    WORKFLOW_EXECUTE = '/api/workflows/{systemName}/execute',
    WORKFLOW_CODE = '/api/IDE/workflow/{systemName}',
    EXECUTION_PLANS = '/api/execution/plans/executing',
    EXECUTION_START = '/api/execution/manual/start',
    
    // Change Tracking & Audit
    CHANGE_HISTORY = '/api/modeller/changeTracking/entityHistoryDescription',
    CHANGE_DIFF = '/api/modeller/changeTracking/entityHistoryDiff',
    
    // IDE & Development
    IDE_TEMPLATES = '/api/IDE/templates',
    IDE_FILES = '/api/IDE',
    IDE_FILE_OPS = '/api/IDE/file',
    
    // Configuration
    ENV_CONFIG = '/api/modeller/environmentconfiguration',
    VERSION_INFO = '/api/version-info',
    
    // Health Monitoring (Added from monitoring specs)
    STREAM_STATS = '/admin/diagnostics/eventengine/streamStats',
    INDEXER_STATUS = '/api/indexer/status',
    ELASTICSEARCH_STATUS = '/api/elasticsearch/status',
    IDENTITY_STATUS = '/api/idsrv/status',
    DIAGNOSTICS_CONFIG = '/api/admin/diagnostics/config'
}
```

### Secondary Private APIs (Use with Fallback)

These have partial public alternatives:

```typescript
enum SecondaryPrivateAPIs {
    // Forms (partial public API exists)
    FORMS_LIST = '/api/forms',
    FORMS_CRUD = '/api/forms/{formId}',
    
    // List Views (complex queries)
    LIST_VIEW = '/api/listview/{viewName}',
    LIST_VIEW_MANAGER = '/api/listviewmanager/{viewName}',
    LIST_VIEW_ACTIVE_PROCESSES = '/api/listview/core-admin-active-processes',
    
    // Option Sets (partial public API)
    OPTION_SETS = '/api/optionsets',
    
    // Comparison (no public equivalent)
    COMPARE_WORKTYPES = '/api/compare/worktypes',
    COMPARE_WORKFLOWS = '/api/compare/workflows',
    
    // Dead Letter Management (monitoring)
    DEAD_LETTERS = '/api/deadLetterManagement/search/',
    
    // Execution Engine Diagnostics
    EXECUTION_DETAIL = '/api/executionengine/plans/executing/{planId}',
    EXECUTION_STEP_LOG = '/api/executionengine/plans/executing/{planId}/steps/{stepId}/log'
}
```

---

## Health Monitoring APIs

Based on the ShareDo Monitoring API Guide, implement comprehensive health checks:

### Core Health Endpoints

```typescript
interface IHealthEndpoints {
    // Event Engine Health
    streamStats: {
        url: '/admin/diagnostics/eventengine/streamStats',
        healthCriteria: {
            backlog: 0,  // Should be 0 or minimal
            lag: 0,      // lastKnown - lastProcessed should be 0
            connections: '>= 1'  // At least one connection
        }
    },
    
    // Service Health
    indexer: {
        url: '/api/indexer/status',
        expectedStatus: 200,
        expectedBody: 'ok/ready'
    },
    
    elasticsearch: {
        url: '/api/elasticsearch/status',
        expectedStatus: 200,
        expectedBody: 'ok/green'
    },
    
    identity: {
        url: '/api/idsrv/status',
        expectedStatus: 200,
        expectedBody: 'non-error'
    },
    
    // Workflow Health
    activeProcesses: {
        url: '/api/listview/core-admin-active-processes/{pageSize}/{page}/started/desc/?view=table&withCounts=1',
        method: 'POST',
        monitorStates: ['RUNNING', 'WAITING', 'STOPPED', 'ERRORED'],
        alertThresholds: {
            ERRORED: 10,     // Alert if > 10 errored workflows
            STUCK_RUNNING: 30  // Alert if running > 30 minutes
        }
    }
}
```

### Health Check Implementation

```typescript
class ShareDoHealthMonitor {
    private readonly healthEndpoints = [
        '/admin/diagnostics/eventengine/streamStats',
        '/api/indexer/status',
        '/api/elasticsearch/status',
        '/api/idsrv/status',
        '/api/admin/diagnostics/config'
    ];
    
    async checkSystemHealth(): Promise<IHealthReport> {
        const results = await Promise.allSettled(
            this.healthEndpoints.map(endpoint => this.checkEndpoint(endpoint))
        );
        
        return {
            timestamp: new Date(),
            overall: this.calculateOverallHealth(results),
            services: this.mapServiceHealth(results),
            workflows: await this.checkWorkflowHealth(),
            deadLetters: await this.checkDeadLetters()
        };
    }
    
    private async checkWorkflowHealth(): Promise<IWorkflowHealth> {
        const states = ['RUNNING', 'WAITING', 'STOPPED', 'ERRORED'];
        const counts = {};
        
        for (const state of states) {
            const result = await this.queryWorkflowsByState(state);
            counts[state] = result.resultCount;
        }
        
        // Check for stuck workflows
        const stuck = await this.detectStuckWorkflows();
        
        return {
            stateCounts: counts,
            stuckWorkflows: stuck,
            alerts: this.generateWorkflowAlerts(counts, stuck)
        };
    }
    
    private async detectStuckWorkflows(): Promise<IStuckWorkflow[]> {
        const running = await this.getRunningWorkflows();
        const now = Date.now();
        const STUCK_THRESHOLD = 30 * 60 * 1000; // 30 minutes
        
        return running.filter(w => {
            const started = new Date(w.started).getTime();
            return (now - started) > STUCK_THRESHOLD;
        });
    }
}
```

---

## Defensive Implementation Patterns

### 1. API Version Detection

```typescript
class APIVersionDetector {
    private knownVersions = new Map<string, string>();
    
    async detectAPIVersion(endpoint: string): Promise<string> {
        try {
            // Try to get version from version-info endpoint
            const versionInfo = await this.getVersionInfo();
            
            // Check if API structure has changed
            const response = await this.testEndpoint(endpoint);
            const signature = this.generateResponseSignature(response);
            
            const lastKnownSignature = this.knownVersions.get(endpoint);
            if (lastKnownSignature && lastKnownSignature !== signature) {
                console.warn(`API structure changed for ${endpoint}`);
                this.notifyAPIChange(endpoint, lastKnownSignature, signature);
            }
            
            this.knownVersions.set(endpoint, signature);
            return signature;
        } catch (error) {
            console.error(`Failed to detect version for ${endpoint}`, error);
            return 'unknown';
        }
    }
    
    private generateResponseSignature(response: any): string {
        // Create a signature based on response structure
        const keys = Object.keys(response).sort();
        const types = keys.map(k => typeof response[k]);
        return `${keys.join(',')}_${types.join(',')}`;
    }
}
```

### 2. Graceful Degradation

```typescript
class ResilientAPIClient {
    private readonly fallbacks = new Map<string, Function>();
    
    async callPrivateAPI<T>(
        endpoint: string,
        params: any,
        options?: IAPIOptions
    ): Promise<T | null> {
        try {
            // Primary attempt
            const response = await this.makeRequest(endpoint, params);
            this.recordSuccess(endpoint);
            return response;
            
        } catch (error) {
            this.recordFailure(endpoint, error);
            
            // Try fallback if available
            if (this.fallbacks.has(endpoint)) {
                console.warn(`Using fallback for ${endpoint}`);
                return await this.fallbacks.get(endpoint)(params);
            }
            
            // Try alternative approach
            if (options?.alternative) {
                console.warn(`Trying alternative for ${endpoint}`);
                return await this.callPrivateAPI(
                    options.alternative.endpoint,
                    options.alternative.transform(params)
                );
            }
            
            // Return cached data if available
            if (options?.useCache && this.cache.has(endpoint)) {
                console.warn(`Using cached data for ${endpoint}`);
                return this.cache.get(endpoint);
            }
            
            // Graceful failure
            console.error(`API call failed with no fallback: ${endpoint}`, error);
            return null;
        }
    }
    
    registerFallback(endpoint: string, fallbackFn: Function) {
        this.fallbacks.set(endpoint, fallbackFn);
    }
}
```

### 3. Response Validation & Adaptation

```typescript
class ResponseAdapter {
    adapt<T>(response: any, schema: IResponseSchema): T {
        // Validate response structure
        const validation = this.validate(response, schema);
        
        if (!validation.valid) {
            // Try to adapt the response
            return this.attemptAdaptation(response, schema, validation.errors);
        }
        
        return response as T;
    }
    
    private attemptAdaptation(response: any, schema: IResponseSchema, errors: any[]): any {
        const adapted = { ...response };
        
        for (const error of errors) {
            if (error.type === 'missing_field') {
                // Provide default value
                adapted[error.field] = schema.defaults[error.field];
            } else if (error.type === 'renamed_field') {
                // Handle field renames
                const oldName = this.findOldFieldName(error.field, response);
                if (oldName) {
                    adapted[error.field] = response[oldName];
                    delete adapted[oldName];
                }
            } else if (error.type === 'type_mismatch') {
                // Try type coercion
                adapted[error.field] = this.coerceType(
                    response[error.field],
                    schema.fields[error.field].type
                );
            }
        }
        
        return adapted;
    }
}
```

---

## Monitoring Strategy

### Continuous Monitoring Implementation

```typescript
class APIMonitoringService {
    private metrics = {
        apiCalls: new Map<string, IAPIMetrics>(),
        failures: new Map<string, IFailureRecord[]>(),
        performance: new Map<string, IPerformanceMetrics>()
    };
    
    async monitorAPICall<T>(
        endpoint: string,
        call: () => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        const metrics = this.getMetrics(endpoint);
        
        try {
            const result = await call();
            const duration = Date.now() - startTime;
            
            // Record success
            metrics.successCount++;
            metrics.lastSuccess = new Date();
            this.updatePerformance(endpoint, duration);
            
            // Check for degradation
            if (duration > metrics.expectedDuration * 2) {
                this.alertPerformanceDegradation(endpoint, duration);
            }
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Record failure
            metrics.failureCount++;
            metrics.lastFailure = new Date();
            this.recordFailure(endpoint, error, duration);
            
            // Check failure rate
            const failureRate = metrics.failureCount / 
                (metrics.successCount + metrics.failureCount);
            
            if (failureRate > 0.1) { // > 10% failure rate
                this.alertHighFailureRate(endpoint, failureRate);
            }
            
            throw error;
        }
    }
    
    generateHealthReport(): IAPIHealthReport {
        const report = {
            timestamp: new Date(),
            totalAPIs: this.metrics.apiCalls.size,
            healthy: 0,
            degraded: 0,
            failing: 0,
            details: []
        };
        
        for (const [endpoint, metrics] of this.metrics.apiCalls) {
            const health = this.calculateHealth(metrics);
            report.details.push({
                endpoint,
                health,
                metrics,
                recentFailures: this.getRecentFailures(endpoint)
            });
            
            if (health === 'healthy') report.healthy++;
            else if (health === 'degraded') report.degraded++;
            else report.failing++;
        }
        
        return report;
    }
}
```

### Dashboard Metrics

```typescript
interface IDashboardMetrics {
    // Real-time metrics
    currentHealth: {
        eventEngine: IEventEngineHealth,
        workflows: IWorkflowMetrics,
        apis: IAPIMetrics,
        deadLetters: IDeadLetterMetrics
    },
    
    // Historical data
    history: {
        apiFailures: ITimeSeriesData,
        workflowErrors: ITimeSeriesData,
        performance: IPerformanceTimeSeries,
        availability: IAvailabilityMetrics
    },
    
    // Alerts
    activeAlerts: IAlert[],
    
    // Recommendations
    recommendations: IRecommendation[]
}
```

---

## Risk Mitigation Techniques

### 1. Circuit Breaker Pattern

```typescript
class CircuitBreaker {
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private failures = 0;
    private lastFailureTime?: Date;
    
    async execute<T>(
        endpoint: string,
        fn: () => Promise<T>
    ): Promise<T> {
        if (this.state === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error(`Circuit breaker OPEN for ${endpoint}`);
            }
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    private onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    
    private onFailure() {
        this.failures++;
        this.lastFailureTime = new Date();
        
        if (this.failures >= 5) {
            this.state = 'OPEN';
            console.error('Circuit breaker opened due to repeated failures');
        }
    }
}
```

### 2. Request Caching & Deduplication

```typescript
class RequestCache {
    private cache = new Map<string, ICachedResponse>();
    private pending = new Map<string, Promise<any>>();
    
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = 60000
    ): Promise<T> {
        // Check if request is already pending
        if (this.pending.has(key)) {
            return this.pending.get(key);
        }
        
        // Check cache
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data as T;
        }
        
        // Make request
        const promise = fetcher().finally(() => {
            this.pending.delete(key);
        });
        
        this.pending.set(key, promise);
        
        const result = await promise;
        this.cache.set(key, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    }
}
```

### 3. Batch Operations

```typescript
class BatchProcessor {
    async processBatch<T, R>(
        items: T[],
        processor: (item: T) => Promise<R>,
        options: IBatchOptions = {}
    ): Promise<IBatchResult<R>> {
        const {
            batchSize = 5,
            maxRetries = 3,
            retryDelay = 1000
        } = options;
        
        const results: IBatchResult<R> = {
            successful: [],
            failed: [],
            totalTime: 0
        };
        
        const startTime = Date.now();
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchPromises = batch.map(async (item, index) => {
                let retries = 0;
                while (retries < maxRetries) {
                    try {
                        const result = await processor(item);
                        return { success: true, result, item };
                    } catch (error) {
                        retries++;
                        if (retries < maxRetries) {
                            await this.delay(retryDelay * retries);
                        } else {
                            return { success: false, error, item };
                        }
                    }
                }
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    if (result.value.success) {
                        results.successful.push(result.value.result);
                    } else {
                        results.failed.push(result.value);
                    }
                }
            }
        }
        
        results.totalTime = Date.now() - startTime;
        return results;
    }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
```typescript
// 1. Set up monitoring infrastructure
const monitoring = new APIMonitoringService();
const health = new ShareDoHealthMonitor();

// 2. Implement circuit breakers for all private APIs
const breakers = new Map<string, CircuitBreaker>();
for (const api of Object.values(CriticalPrivateAPIs)) {
    breakers.set(api, new CircuitBreaker());
}

// 3. Create response adapters
const adapters = new ResponseAdapterRegistry();
adapters.register('/api/modeller/types', WorkTypeAdapter);
adapters.register('/api/workflows', WorkflowAdapter);

// 4. Set up health check schedule
setInterval(async () => {
    const report = await health.checkSystemHealth();
    monitoring.recordHealthReport(report);
}, 60000); // Every minute
```

### Phase 2: Implementation (Week 2-3)
```typescript
// Implement CLI commands with defensive patterns
class ShareDoCLI {
    constructor(
        private client: ResilientAPIClient,
        private monitor: APIMonitoringService,
        private cache: RequestCache
    ) {}
    
    async exportWorkType(systemName: string): Promise<IExportResult> {
        // Use monitoring wrapper
        return await this.monitor.monitorAPICall(
            '/api/modeller/importexport/export/package',
            async () => {
                // Try with cache
                return await this.cache.get(
                    `export_${systemName}`,
                    () => this.createExportJob(systemName),
                    300000 // 5 minute cache
                );
            }
        );
    }
}
```

### Phase 3: Monitoring & Alerting (Week 4)
```typescript
// Set up comprehensive monitoring
const dashboard = new MonitoringDashboard();
dashboard.addMetric('API Health', monitoring.generateHealthReport);
dashboard.addMetric('Workflow Health', health.checkWorkflowHealth);
dashboard.addAlert('High Failure Rate', () => {
    return monitoring.getFailureRate() > 0.1;
});

// Export metrics for Prometheus
app.get('/metrics', (req, res) => {
    res.type('text/plain');
    res.send(monitoring.exportPrometheusMetrics());
});
```

---

## Accepted Risks Documentation

### Risk Acknowledgment

By implementing this interim strategy, we acknowledge:

1. **API Stability Risk**: Private APIs may change without notice
2. **Support Risk**: No official ShareDo support for private API issues
3. **Security Risk**: Private APIs may have different security models
4. **Performance Risk**: Private APIs may not be optimized for external use
5. **Compliance Risk**: Usage may violate terms of service

### Mitigation Measures

1. **Comprehensive Monitoring**: All API calls monitored and logged
2. **Defensive Coding**: All implementations assume APIs can fail
3. **Graceful Degradation**: Fallback strategies for all critical paths
4. **Regular Testing**: Automated tests run against all endpoints daily
5. **Version Detection**: Early warning system for API changes
6. **Documentation**: Complete record of all private API dependencies

### Success Criteria

- **< 1% failure rate** for critical operations
- **< 5 second response time** for all API calls
- **100% monitoring coverage** of private API usage
- **< 1 hour MTTR** for API change adaptation
- **Zero data loss** from API failures

---

## Conclusion

This interim strategy provides a pragmatic approach to using ShareDo private APIs while maintaining system stability and reliability. By implementing comprehensive monitoring, defensive coding patterns, and graceful degradation strategies, we can minimize the risks associated with private API usage while delivering essential functionality.

The key to success is:
1. **Monitor everything** - Know immediately when APIs change
2. **Fail gracefully** - Never let API failures crash the system
3. **Cache aggressively** - Reduce API calls and provide fallback data
4. **Document thoroughly** - Track all dependencies and risks
5. **Plan for migration** - Be ready to move to public APIs or plugins

This approach allows us to deliver value immediately while building toward a more sustainable architecture with proper plugin support in the future.