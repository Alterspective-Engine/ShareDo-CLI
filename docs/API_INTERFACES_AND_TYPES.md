# ShareDo API Interfaces & Type Definitions
## Complete Request/Response Specifications for CLI Implementation

### Version 1.0.0
### Date: 2025-08-28

---

## Executive Summary

This document provides comprehensive TypeScript interface definitions for all ShareDo API endpoints, including complete request/response structures, error handling, and implementation examples. This serves as the definitive reference for CLI and MCP development.

---

## Table of Contents
1. [Authentication Interfaces](#authentication-interfaces)
2. [Work Type Interfaces](#work-type-interfaces)
3. [Export/Import Interfaces](#exportimport-interfaces)
4. [Workflow Interfaces](#workflow-interfaces)
5. [Document Interfaces](#document-interfaces)
6. [Health Monitoring Interfaces](#health-monitoring-interfaces)
7. [List View Interfaces](#list-view-interfaces)
8. [Error Response Interfaces](#error-response-interfaces)
9. [Common Types](#common-types)

---

## Authentication Interfaces

### Token Request/Response

```typescript
// Request: POST /connect/token
interface ITokenRequest {
    grant_type: 'client_credentials' | 'refresh_token' | 'authorization_code';
    scope: string;  // "sharedo" or "openid profile sharedo"
    client_id: string;
    client_secret?: string;  // Required for client_credentials
    impersonate_user?: string;  // Email address
    impersonate_provider?: string;  // e.g., "ShareDo", "AzureAD"
    refresh_token?: string;  // For refresh_token grant
    code?: string;  // For authorization_code grant
    redirect_uri?: string;  // For authorization_code grant
    code_verifier?: string;  // For PKCE
}

interface ITokenResponse {
    access_token: string;
    expires_in: number;  // Seconds (typically 600)
    token_type: 'Bearer';
    refresh_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
}

// Implementation example
class AuthenticationService {
    async getToken(config: IEnvironmentConfig): Promise<ITokenResponse> {
        const request: ITokenRequest = {
            grant_type: 'client_credentials',
            scope: 'sharedo',
            client_id: config.auth.clientId,
            client_secret: config.auth.clientSecret,
            impersonate_user: config.auth.impersonateUser,
            impersonate_provider: config.auth.impersonateProvider
        };
        
        const formData = new URLSearchParams(request as any);
        
        const response = await fetch(config.auth.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${request.client_id}:${request.client_secret}`).toString('base64')}`
            },
            body: formData.toString()
        });
        
        return response.json();
    }
}
```

---

## Work Type Interfaces

### List Work Types

```typescript
// Request: GET /api/modeller/types
interface IListWorkTypesRequest {
    // Query parameters (optional)
    includeDeleted?: boolean;
    includeSystemTypes?: boolean;
}

// Response
interface IWorkTypeListResponse {
    workTypes: IWorkTypeSummary[];
    totalCount: number;
}

interface IWorkTypeSummary {
    id: string;  // GUID
    name: string;
    systemName: string;
    derivedFrom?: string;
    description?: string;
    created: string;  // ISO 8601
    modified: string;  // ISO 8601
    createdBy: string;
    modifiedBy: string;
    isActive: boolean;
    isSystem: boolean;
}
```

### Get Work Type Details

```typescript
// Request: GET /api/modeller/types/{systemName}
interface IGetWorkTypeRequest {
    systemName: string;  // Path parameter
    includeAspects?: boolean;  // Query parameter
    includeRoles?: boolean;
    includePermissions?: boolean;
}

// Response
interface IWorkTypeDetailResponse {
    id: string;
    name: string;
    systemName: string;
    derivedFrom?: string;
    description?: string;
    configuration: IWorkTypeConfiguration;
    aspects?: IAspectSection[];
    participantRoles?: IParticipantRole[];
    createPermissions?: ICreatePermission[];
    metadata: IWorkTypeMetadata;
}

interface IWorkTypeConfiguration {
    fields: IFieldDefinition[];
    workflows: string[];  // Workflow system names
    forms: string[];  // Form IDs
    documents: string[];  // Document template IDs
    phases: IPhaseDefinition[];
    settings: Record<string, any>;
}

interface IFieldDefinition {
    name: string;
    systemName: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'lookup' | 'multivalue';
    required: boolean;
    defaultValue?: any;
    validation?: IFieldValidation;
    metadata?: Record<string, any>;
}

interface IAspectSection {
    id: string;
    name: string;
    type: 'main' | 'header' | 'action';
    aspects: IAspect[];
}

interface IAspect {
    id: string;
    name: string;
    systemName: string;
    type: string;  // e.g., "form", "grid", "timeline"
    configuration: Record<string, any>;
    permissions?: IPermission[];
}

interface IParticipantRole {
    id: string;
    name: string;
    systemName: string;
    description?: string;
    permissions: IPermission[];
    isSystem: boolean;
}

interface IPermission {
    action: string;  // e.g., "read", "write", "delete"
    resource: string;  // e.g., "workitem", "document", "comment"
    conditions?: IPermissionCondition[];
}
```

---

## Export/Import Interfaces

### Create Export Job

```typescript
// Request: POST /api/modeller/importexport/export/package
interface ICreateExportRequest {
    exportConfigName: string;  // e.g., "temp", "VeryBasic"
    items: IExportItem[];
    options?: IExportOptions;
}

interface IExportItem {
    systemName: string;  // e.g., "sharedo-type", "sharedo-workflow"
    selector: IExportSelector;
}

interface IExportSelector {
    systemName?: string;  // For single item export
    systemNames?: string[];  // For multiple items
    filter?: IExportFilter;  // For complex filtering
}

interface IExportFilter {
    field: string;
    operator: 'eq' | 'in' | 'contains' | 'startsWith';
    value: any;
}

interface IExportOptions {
    includeDependencies?: boolean;
    includeData?: boolean;
    format?: 'zip' | 'json';
    compression?: boolean;
}

// Response
interface ICreateExportResponse {
    exportJobId: string;  // GUID
    estimatedSize?: number;  // Bytes
    estimatedTime?: number;  // Seconds
}
```

### Monitor Export Job

```typescript
// Request: GET /api/modeller/importexport/export/package/{jobId}/progress
interface IExportProgressRequest {
    jobId: string;  // Path parameter
    _?: number;  // Cache buster timestamp (query parameter)
}

// Response
interface IExportProgressResponse {
    state: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    percentage: number;  // 0-100
    current: IProgressStep[];
    queued: IProgressStep[];
    complete: boolean;
    packageAvailable: boolean;
    error?: string;
    downloadUrl?: string;  // When complete
}

interface IProgressStep {
    description: string;
    type?: string;
    startTime?: string;
    endTime?: string;
    status?: 'pending' | 'running' | 'completed' | 'failed';
}
```

### Download Export Package

```typescript
// Request: GET /modeller/__importexport/export/package/{jobId}/download
interface IDownloadExportRequest {
    jobId: string;  // Path parameter
}

// Response: Binary ZIP file
// Headers:
interface IDownloadExportHeaders {
    'Content-Type': 'application/zip';
    'Content-Disposition': string;  // e.g., "attachment; filename=export_2025-08-28.zip"
    'Content-Length': string;  // File size in bytes
}
```

### Import Package

```typescript
// Request: POST /api/modeller/importexport/import
interface IImportPackageRequest {
    // Multipart form data
    file: File;  // The ZIP package
    options: IImportOptions;
}

interface IImportOptions {
    overwrite?: boolean;
    skipValidation?: boolean;
    dryRun?: boolean;
    mappings?: IImportMapping[];
}

interface IImportMapping {
    sourceSystemName: string;
    targetSystemName: string;
    type: 'rename' | 'merge' | 'skip';
}

// Response
interface IImportPackageResponse {
    importJobId: string;
    status: 'validating' | 'importing' | 'completed' | 'failed';
    items: IImportItem[];
    warnings?: string[];
    errors?: string[];
}

interface IImportItem {
    systemName: string;
    type: string;
    action: 'create' | 'update' | 'skip';
    status: 'pending' | 'completed' | 'failed';
    message?: string;
}
```

---

## Workflow Interfaces

### List Workflows

```typescript
// Request: GET /api/workflows
interface IListWorkflowsRequest {
    includeInactive?: boolean;
    workTypeSystemName?: string;  // Filter by work type
}

// Response
interface IWorkflowListResponse {
    workflows: IWorkflowSummary[];
    totalCount: number;
}

interface IWorkflowSummary {
    id: string;
    name: string;
    systemName: string;
    description?: string;
    workTypes: string[];  // Associated work type system names
    isActive: boolean;
    version: string;
    created: string;
    modified: string;
    executionCount?: number;
    lastExecuted?: string;
    averageExecutionTime?: number;  // Milliseconds
    successRate?: number;  // Percentage
}
```

### Advanced Workflow List (List View)

```typescript
// Request: POST /api/listview/core-admin-plan-list/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}
interface IWorkflowListViewRequest {
    // Path parameters
    pageSize: number;  // e.g., 20
    pageNumber: number;  // 1-based
    sortColumn: string;  // e.g., "name", "created", "noSort"
    sortDirection: 'asc' | 'desc';
    
    // Query parameters
    view?: 'table' | 'grid';
    withCounts?: boolean;
    
    // Body
    additionalParameters: Record<string, any>;
    filters: IListViewFilter[];
}

interface IListViewFilter {
    field: string;  // e.g., "name", "status"
    operator: 'eq' | 'ne' | 'contains' | 'in' | 'gt' | 'lt';
    value: any;
}

// Response
interface IWorkflowListViewResponse {
    totalRecords: number;
    pageSize: number;
    pageNumber: number;
    items: IWorkflowListItem[];
    aggregations?: Record<string, any>;
}

interface IWorkflowListItem {
    id: string;
    name: string;
    systemName: string;
    description?: string;
    status: 'active' | 'inactive' | 'draft';
    version: string;
    createdDate: string;
    modifiedDate: string;
    createdBy: string;
    modifiedBy: string;
    executionCount: number;
    lastExecuted?: string;
    averageExecutionTime?: number;
    successRate?: number;
    [key: string]: any;  // Additional fields based on view
}
```

### Execute Workflow

```typescript
// Request: POST /api/workflows/{systemName}/execute
interface IExecuteWorkflowRequest {
    systemName: string;  // Path parameter
    
    // Body
    parameters: Record<string, any>;
    dataFields: Record<string, any>;
    options?: IExecutionOptions;
}

interface IExecutionOptions {
    async?: boolean;  // Default: true
    timeout?: number;  // Milliseconds
    priority?: 'low' | 'normal' | 'high';
    notifyOnComplete?: boolean;
    notifyOnError?: boolean;
}

// Response
interface IExecuteWorkflowResponse {
    executionId: string;  // Plan execution ID
    status: 'queued' | 'running' | 'completed' | 'failed';
    startTime: string;
    endTime?: string;
    result?: any;  // Workflow-specific result
    error?: string;
    logs?: IExecutionLog[];
}

interface IExecutionLog {
    timestamp: string;
    level: 'debug' | 'info' | 'warning' | 'error';
    message: string;
    details?: any;
}
```

### Get Executing Plans

```typescript
// Request: GET /api/execution/plans/executing
interface IGetExecutingPlansRequest {
    workflowSystemName?: string;  // Filter by workflow
    state?: 'RUNNING' | 'WAITING' | 'STOPPED' | 'ERRORED';
}

// Response
interface IExecutingPlansResponse {
    plans: IExecutingPlan[];
    totalCount: number;
}

interface IExecutingPlan {
    id: string;  // Plan execution ID
    planSystemName: string;
    displayName: string;
    state: 'RUNNING' | 'WAITING' | 'STOPPED' | 'ERRORED';
    startTime: string;
    endTime?: string;
    currentStep?: string;
    progress?: number;  // 0-100
    workItemId?: string;
    userId: string;
    error?: string;
}
```

---

## Document Interfaces

### Generate Document

```typescript
// Request: POST /api/documents/generate
interface IGenerateDocumentRequest {
    templateId: string;
    workItemId?: string;
    data?: Record<string, any>;  // Template data
    format: 'docx' | 'pdf' | 'html';
    options?: IDocumentOptions;
}

interface IDocumentOptions {
    includeAttachments?: boolean;
    includeComments?: boolean;
    watermark?: string;
    password?: string;  // For PDF
    metadata?: Record<string, string>;
}

// Response
interface IGenerateDocumentResponse {
    documentId: string;
    url: string;  // Download URL
    format: string;
    size: number;  // Bytes
    generated: string;  // ISO 8601
    expiresAt: string;  // Download URL expiry
}
```

### List Document Templates

```typescript
// Request: GET /api/documents/templates
interface IListTemplatesRequest {
    workTypeSystemName?: string;
    category?: string;
}

// Response
interface ITemplateListResponse {
    templates: IDocumentTemplate[];
    totalCount: number;
}

interface IDocumentTemplate {
    id: string;
    name: string;
    description?: string;
    category: string;
    workTypes: string[];  // Compatible work types
    fields: ITemplateField[];
    format: 'docx' | 'xlsx' | 'pptx';
    version: string;
    created: string;
    modified: string;
}

interface ITemplateField {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    source?: string;  // Data source path
}
```

---

## Health Monitoring Interfaces

### Event Engine Stream Stats

```typescript
// Request: GET /admin/diagnostics/eventengine/streamStats
interface IStreamStatsRequest {
    // No parameters - requires admin authentication
}

// Response
interface IStreamStatsResponse {
    streams: IStreamStat[];
    summary: IStreamSummary;
}

interface IStreamStat {
    streamName: string;
    connectionCount: number;
    backlog: number;
    lastKnownEventNumber: number;
    lastProcessedEventNumber: number;
    lag: number;  // lastKnown - lastProcessed
    status: 'healthy' | 'degraded' | 'unhealthy';
}

interface IStreamSummary {
    totalStreams: number;
    healthyStreams: number;
    degradedStreams: number;
    unhealthyStreams: number;
    totalBacklog: number;
    totalLag: number;
    zeroConnectionStreams: string[];
}
```

### Service Status Endpoints

```typescript
// Common status response interface
interface IServiceStatusResponse {
    status: 'ok' | 'degraded' | 'error';
    message?: string;
    details?: Record<string, any>;
    timestamp: string;
}

// Specific service status endpoints
interface IIndexerStatusResponse extends IServiceStatusResponse {
    indexCount?: number;
    lastIndexTime?: string;
    queueSize?: number;
}

interface IElasticsearchStatusResponse extends IServiceStatusResponse {
    clusterHealth: 'green' | 'yellow' | 'red';
    nodeCount?: number;
    indexCount?: number;
    documentCount?: number;
}

interface IIdentityStatusResponse extends IServiceStatusResponse {
    provider: string;
    activeUsers?: number;
    tokenIssuanceRate?: number;
}
```

### Active Processes (Workflow Health)

```typescript
// Request: POST /api/listview/core-admin-active-processes/{pageSize}/{page}/started/desc
interface IActiveProcessesRequest {
    // Path parameters
    pageSize: number;
    page: number;
    sortColumn: string;  // "started", "state", etc.
    sortDirection: 'asc' | 'desc';
    
    // Query parameters
    view: 'table';
    withCounts: boolean;
    
    // Body
    additionalParameters: Record<string, any>;
    filters: IProcessFilter[];
    viewId?: string;
}

interface IProcessFilter {
    fieldId: string;  // "state"
    filterId: string;  // "clv-filter-lov"
    config: string;  // JSON string
    parameters: string;  // JSON string with selectedValues
}

// Response
interface IActiveProcessesResponse {
    resultCount: number;
    data: IProcessData[];
    columns: IColumnDefinition[];
}

interface IProcessData {
    id: string;  // Plan execution ID
    started: string;
    errored?: string;
    state: 'RUNNING' | 'WAITING' | 'STOPPED' | 'ERRORED';
    tooltip?: string;
    titles?: string[];
    references?: string[];
    commands?: IProcessCommand[];
    [key: string]: any;
}

interface IProcessCommand {
    name: string;
    action: string;
    enabled: boolean;
}
```

### Dead Letter Management

```typescript
// Request: POST /api/deadLetterManagement/search/
interface IDeadLetterSearchRequest {
    page: number;
    pageSize: number;
    filters?: IDeadLetterFilter[];
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

interface IDeadLetterFilter {
    field: 'reason' | 'timestamp' | 'source';
    operator: 'eq' | 'contains' | 'gt' | 'lt';
    value: any;
}

// Response
interface IDeadLetterSearchResponse {
    total: number;
    page: number;
    pageSize: number;
    items: IDeadLetter[];
}

interface IDeadLetter {
    id: string;
    timestamp: string;
    source: string;
    reason: string;
    payload: any;
    retryCount: number;
    lastRetry?: string;
    status: 'pending' | 'retrying' | 'failed';
}
```

---

## List View Interfaces

### Generic List View Request

```typescript
// Request: POST /api/listview/{viewName}
interface IListViewRequest {
    viewName: string;  // Path parameter
    
    // Body
    filters: IListViewFilter[];
    sorting: IListViewSort;
    pagination: IListViewPagination;
    additionalParameters?: Record<string, any>;
}

interface IListViewSort {
    column: string;
    direction: 'asc' | 'desc';
}

interface IListViewPagination {
    page: number;  // 1-based
    pageSize: number;
}

// Response
interface IListViewResponse<T = any> {
    data: T[];
    totalRecords: number;
    page: number;
    pageSize: number;
    columns: IColumnDefinition[];
    aggregations?: Record<string, any>;
}

interface IColumnDefinition {
    id: string;
    name: string;
    type: string;
    sortable: boolean;
    filterable: boolean;
    visible: boolean;
    width?: number;
}
```

### List View Manager

```typescript
// Request: GET /api/listviewmanager/{viewName}
interface IListViewManagerRequest {
    viewName: string;  // Path parameter
}

// Response
interface IListViewManagerResponse {
    viewName: string;
    displayName: string;
    description?: string;
    columns: IColumnDefinition[];
    filters: IFilterDefinition[];
    defaultSort?: IListViewSort;
    defaultPageSize?: number;
    permissions?: string[];
}

interface IFilterDefinition {
    id: string;
    name: string;
    field: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
    operators: string[];
    values?: any[];  // For select/multiselect
}
```

---

## Error Response Interfaces

### Standard Error Response

```typescript
interface IErrorResponse {
    error: {
        code: string;  // Error code
        message: string;  // Human-readable message
        details?: Record<string, any>;  // Additional error details
        validationErrors?: IValidationError[];  // For validation failures
        innerError?: IInnerError;  // Nested error information
    };
    statusCode: number;  // HTTP status code
    timestamp: string;  // ISO 8601
    traceId?: string;  // Request trace ID for debugging
}

interface IValidationError {
    field: string;
    message: string;
    code?: string;
    attemptedValue?: any;
}

interface IInnerError {
    code: string;
    message: string;
    stackTrace?: string;  // Only in development
}

// Error handling example
class APIClient {
    async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error: IErrorResponse = await response.json();
            
            switch (response.status) {
                case 400:
                    throw new ValidationError(error);
                case 401:
                    throw new AuthenticationError(error);
                case 403:
                    throw new AuthorizationError(error);
                case 404:
                    throw new NotFoundError(error);
                case 429:
                    throw new RateLimitError(error);
                case 500:
                case 502:
                case 503:
                    throw new ServerError(error);
                default:
                    throw new APIError(error);
            }
        }
        
        return response.json();
    }
}
```

---

## Common Types

### Base Types

```typescript
// Common field types
type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'lookup' | 
                 'multivalue' | 'json' | 'binary';

// Common operators
type Operator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 
                'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';

// Common states
type WorkflowState = 'RUNNING' | 'WAITING' | 'STOPPED' | 'ERRORED' | 'COMPLETED';
type JobState = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Date/Time
type ISODateTime = string;  // ISO 8601 format: "2025-08-28T10:30:00Z"
type Duration = number;  // Milliseconds

// Identifiers
type GUID = string;  // "550e8400-e29b-41d4-a716-446655440000"
type SystemName = string;  // "matter", "client_onboarding"
```

### Pagination

```typescript
interface IPaginatedRequest {
    page: number;  // Usually 1-based
    pageSize: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

interface IPaginatedResponse<T> {
    data: T[];
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
```

### Metadata

```typescript
interface IMetadata {
    created: ISODateTime;
    createdBy: string;
    modified: ISODateTime;
    modifiedBy: string;
    version?: string;
    tags?: string[];
    customProperties?: Record<string, any>;
}
```

### Audit Information

```typescript
interface IAuditInfo {
    userId: string;
    userName: string;
    timestamp: ISODateTime;
    action: string;
    resourceType: string;
    resourceId: string;
    changes?: IChangeRecord[];
    ipAddress?: string;
    userAgent?: string;
}

interface IChangeRecord {
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'add' | 'update' | 'delete';
}
```

---

## Implementation Examples

### Complete API Client

```typescript
class ShareDoAPIClient {
    private baseUrl: string;
    private token: string;
    private tokenExpiry: Date;
    
    constructor(private config: IEnvironmentConfig) {
        this.baseUrl = config.url;
    }
    
    // Authentication
    async authenticate(): Promise<void> {
        const tokenResponse = await this.getToken();
        this.token = tokenResponse.access_token;
        this.tokenExpiry = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    }
    
    // Ensure valid token
    private async ensureAuthenticated(): Promise<void> {
        if (!this.token || new Date() >= this.tokenExpiry) {
            await this.authenticate();
        }
    }
    
    // Generic request method
    private async request<T>(
        method: string,
        path: string,
        body?: any,
        queryParams?: Record<string, any>
    ): Promise<T> {
        await this.ensureAuthenticated();
        
        const url = new URL(path, this.baseUrl);
        
        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        
        const response = await fetch(url.toString(), {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        
        return this.handleResponse<T>(response);
    }
    
    // Work Type operations
    async listWorkTypes(): Promise<IWorkTypeListResponse> {
        return this.request<IWorkTypeListResponse>('GET', '/api/modeller/types');
    }
    
    async getWorkType(systemName: string): Promise<IWorkTypeDetailResponse> {
        return this.request<IWorkTypeDetailResponse>(
            'GET', 
            `/api/modeller/types/${systemName}`,
            undefined,
            { includeAspects: true, includeRoles: true }
        );
    }
    
    // Export operations
    async createExport(request: ICreateExportRequest): Promise<ICreateExportResponse> {
        return this.request<ICreateExportResponse>(
            'POST',
            '/api/modeller/importexport/export/package',
            request
        );
    }
    
    async getExportProgress(jobId: string): Promise<IExportProgressResponse> {
        return this.request<IExportProgressResponse>(
            'GET',
            `/api/modeller/importexport/export/package/${jobId}/progress`,
            undefined,
            { _: Date.now() }  // Cache buster
        );
    }
    
    async downloadExport(jobId: string): Promise<Blob> {
        await this.ensureAuthenticated();
        
        const response = await fetch(
            `${this.baseUrl}/modeller/__importexport/export/package/${jobId}/download`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }
        
        return response.blob();
    }
    
    // Workflow operations
    async executeWorkflow(
        systemName: string, 
        request: IExecuteWorkflowRequest
    ): Promise<IExecuteWorkflowResponse> {
        return this.request<IExecuteWorkflowResponse>(
            'POST',
            `/api/workflows/${systemName}/execute`,
            request
        );
    }
    
    // Health monitoring
    async getStreamStats(): Promise<IStreamStatsResponse> {
        return this.request<IStreamStatsResponse>(
            'GET',
            '/admin/diagnostics/eventengine/streamStats'
        );
    }
}
```

---

## Testing Utilities

### Mock Response Generator

```typescript
class MockResponseGenerator {
    static tokenResponse(): ITokenResponse {
        return {
            access_token: 'mock_token_' + Date.now(),
            expires_in: 600,
            token_type: 'Bearer',
            refresh_token: 'mock_refresh_' + Date.now()
        };
    }
    
    static workTypeResponse(): IWorkTypeDetailResponse {
        return {
            id: this.guid(),
            name: 'Matter',
            systemName: 'matter',
            description: 'Legal matter work type',
            configuration: {
                fields: [
                    {
                        name: 'Matter Number',
                        systemName: 'matterNumber',
                        type: 'text',
                        required: true
                    }
                ],
                workflows: ['client_onboarding', 'matter_closure'],
                forms: [],
                documents: [],
                phases: [],
                settings: {}
            },
            metadata: {
                created: new Date().toISOString(),
                createdBy: 'system',
                modified: new Date().toISOString(),
                modifiedBy: 'system'
            }
        } as IWorkTypeDetailResponse;
    }
    
    private static guid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
```

---

## Validation Schemas

### Request Validation

```typescript
import * as Joi from 'joi';

class RequestValidators {
    static exportRequest = Joi.object<ICreateExportRequest>({
        exportConfigName: Joi.string().required(),
        items: Joi.array().items(
            Joi.object({
                systemName: Joi.string().required(),
                selector: Joi.object({
                    systemName: Joi.string(),
                    systemNames: Joi.array().items(Joi.string()),
                    filter: Joi.object()
                }).or('systemName', 'systemNames', 'filter')
            })
        ).min(1).required(),
        options: Joi.object({
            includeDependencies: Joi.boolean(),
            includeData: Joi.boolean(),
            format: Joi.string().valid('zip', 'json'),
            compression: Joi.boolean()
        })
    });
    
    static validate<T>(schema: Joi.Schema, data: any): T {
        const { error, value } = schema.validate(data);
        if (error) {
            throw new ValidationError(error.details);
        }
        return value;
    }
}
```

---

## Conclusion

This comprehensive interface specification provides:

1. **Complete Type Safety**: Full TypeScript interfaces for all API operations
2. **Request/Response Clarity**: Clear documentation of expected inputs and outputs
3. **Error Handling**: Comprehensive error response structures
4. **Implementation Examples**: Ready-to-use code samples
5. **Testing Support**: Mock generators and validators

With these interfaces, developers can:
- Build type-safe API clients
- Implement proper error handling
- Create comprehensive tests
- Generate API documentation
- Build CLI commands with confidence

The specification covers all critical APIs needed for the ShareDo CLI and MCP implementation, with clear patterns for handling both public and private APIs.