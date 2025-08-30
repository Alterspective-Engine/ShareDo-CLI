# Private API Registry

## Overview

This document tracks all private ShareDo API usage in the platform. Each entry includes justification, risk assessment, and migration plan to public APIs or plugin architecture.

**IMPORTANT**: Private APIs are not officially supported and may change without notice. Always prefer public APIs when available.

## Registry Format

Each private API entry must include:
- Endpoint path and HTTP method
- Business justification
- Risk assessment
- Migration strategy
- Timeline for migration

---

## Active Private API Usage

### Private API: Workflow Execution Details

**Endpoint**: `GET /api/workflows/{id}/execution-details`
**Module**: WorkflowModule
**Date Added**: 2025-08-28
**Added By**: Platform Team

#### Justification
The public workflow API doesn't provide execution history and detailed step status needed for debugging and monitoring workflow runs. This information is critical for the VS Code extension's execution viewer.

#### Risk Assessment
- **Stability**: Medium - API structure has been stable for 2+ years
- **Breaking Change Risk**: Medium - Internal implementation may change
- **Security Implications**: Read-only access to execution data

#### Plugin Migration Plan
```typescript
interface IWorkflowExecutionPlugin {
  getExecutionHistory(workflowId: string): Promise<IExecutionHistory[]>;
  getStepDetails(executionId: string, stepId: string): Promise<IStepDetail>;
  subscribeToExecutionEvents(workflowId: string): Observable<IExecutionEvent>;
}

// Plugin will expose through public API wrapper
POST /api/public/plugins/workflow-execution/query
```

#### Timeline
- Phase 1: 2025-09 - Continue using private API with error handling
- Phase 2: 2025-11 - Develop plugin specification
- Phase 3: 2026-01 - Deploy plugin and migrate

---

### Private API: Bulk User Permissions

**Endpoint**: `POST /api/users/bulk-permissions`
**Module**: SecurityModule  
**Date Added**: 2025-08-28
**Added By**: Platform Team

#### Justification
Managing permissions for multiple users requires numerous API calls with the public API. The private bulk endpoint reduces this from N calls to 1, significantly improving performance for admin operations.

#### Risk Assessment
- **Stability**: High - Core security module, unlikely to change
- **Breaking Change Risk**: Low - Well-established endpoint
- **Security Implications**: Requires admin privileges, audit logging essential

#### Plugin Migration Plan
```typescript
interface IBulkPermissionsPlugin {
  updateBulkPermissions(updates: IPermissionUpdate[]): Promise<IBulkResult>;
  validatePermissions(updates: IPermissionUpdate[]): Promise<IValidationResult>;
}

// Will be exposed as public API enhancement
POST /api/public/users/permissions/bulk
```

#### Timeline
- Phase 1: 2025-09 - Document current usage patterns
- Phase 2: 2025-10 - Propose public API enhancement
- Phase 3: 2025-12 - Migrate to public endpoint

---

### Private API: Advanced Search

**Endpoint**: `POST /api/search/advanced`
**Module**: SearchModule
**Date Added**: 2025-08-28
**Added By**: Platform Team

#### Justification
Complex search queries with multiple filters, sorting, and aggregations are not supported by the public search API. Required for the CLI's advanced query features.

#### Risk Assessment
- **Stability**: Low - Search implementation frequently updated
- **Breaking Change Risk**: High - Query syntax may change
- **Security Implications**: Potential data exposure through complex queries

#### Plugin Migration Plan
```typescript
interface IAdvancedSearchPlugin {
  search(query: ISearchQuery): Promise<ISearchResults>;
  aggregate(pipeline: IAggregationPipeline): Promise<IAggregateResults>;
  suggest(prefix: string, context: ISearchContext): Promise<string[]>;
}

// GraphQL endpoint for complex queries
POST /api/public/graphql
```

#### Timeline
- Phase 1: 2025-09 - Abstract search logic into service
- Phase 2: 2025-12 - Implement GraphQL endpoint
- Phase 3: 2026-02 - Full migration to GraphQL

---

## Deprecated Private APIs

### ~~Private API: Direct Database Query~~ (REMOVED)

**Endpoint**: `POST /api/admin/query`
**Removed Date**: 2025-07-15
**Replacement**: Use specific public APIs for data access

---

## Migration Tracking

| API Endpoint | Status | Migration Target | Target Date |
|-------------|---------|-----------------|-------------|
| `/api/workflows/{id}/execution-details` | Active | Plugin API | 2026-01 |
| `/api/users/bulk-permissions` | Active | Public API | 2025-12 |
| `/api/search/advanced` | Active | GraphQL | 2026-02 |
| `/api/admin/query` | Removed | N/A | Completed |

## Guidelines for Adding New Private APIs

1. **Exhaust Public Options**: Verify no public API can meet the requirement
2. **Document Thoroughly**: Complete all sections of the registry entry
3. **Implement Safely**: 
   - Add timeout handling
   - Implement retry logic with exponential backoff
   - Handle API changes gracefully
   - Log all usage for monitoring
4. **Plan Migration**: Set realistic timeline with milestones
5. **Review Quarterly**: Assess if migration can be accelerated

## Risk Mitigation Strategies

### For All Private APIs
```typescript
class PrivateApiClient {
  async callPrivateApi(endpoint: string, data: any): Promise<any> {
    try {
      // Log usage for monitoring
      logger.warn(`Private API call: ${endpoint}`, { 
        timestamp: new Date(),
        caller: this.getCallerContext() 
      });
      
      // Call with timeout
      const response = await this.httpClient.post(endpoint, data, {
        timeout: 5000,
        retries: 3,
        retryDelay: (attempt) => Math.pow(2, attempt) * 1000
      });
      
      // Validate response structure
      this.validateResponse(response, endpoint);
      
      return response;
    } catch (error) {
      // Fallback to public API if available
      const fallback = this.getFallback(endpoint);
      if (fallback) {
        return fallback(data);
      }
      
      // Log and re-throw
      logger.error(`Private API failed: ${endpoint}`, error);
      throw new PrivateApiError(endpoint, error);
    }
  }
}
```

## Monitoring and Alerts

Set up monitoring for:
- Private API usage frequency
- Error rates for each endpoint
- Response time degradation
- Breaking changes detection

Alert when:
- Error rate > 5% for any endpoint
- Response time > 2x baseline
- New private API added without registry entry
- Migration deadline approaching

---

**Document Version**: 1.0.0
**Last Review**: 2025-08-28
**Next Review**: 2025-09-28
**Owner**: Platform Architecture Team