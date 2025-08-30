# ShareDo API Endpoint Reference
## Complete API Documentation for CLI/MCP Implementation

### Authentication Endpoints

#### Get Access Token
```http
POST {identity-url}/connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(clientId:clientSecret)}

grant_type=client_credentials&
scope=sharedo&
impersonate_user={email}&
impersonate_provider={provider}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "expires_in": 600,
  "token_type": "Bearer"
}
```

---

### Work Type Endpoints

#### List All Work Types
```http
GET /api/modeller/types
Authorization: Bearer {token}
```

#### Get Work Type Details
```http
GET /api/modeller/types/{systemName}
Authorization: Bearer {token}
```

#### Get Work Type Aspects
```http
GET /api/modeller/types/{systemName}/aspect-sections
Authorization: Bearer {token}
```

**Response Structure:**
```json
{
  "main": [
    {
      "id": "guid",
      "name": "Aspect Name",
      "data": {},
      "config": {}
    }
  ],
  "header": [],
  "actions": []
}
```

#### Get Participant Roles
```http
GET /api/modeller/types/{systemName}/participant-roles
Authorization: Bearer {token}
```

#### Get Create Permissions
```http
GET /api/modeller/types/{systemName}/create-permissions
Authorization: Bearer {token}
```

#### Update Participant Permissions
```http
POST /api/modeller/types/{systemName}/participant-roles/{roleId}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": ["read", "write", "delete"]
}
```

---

### Export Endpoints

#### Analyze Export Dependencies
```http
POST /api/modeller/importexport/export/added
Authorization: Bearer {token}
Content-Type: application/json

{
  "systemName": "sharedo-type",
  "selector": {
    "systemName": "{workTypeName}"
  }
}
```

#### Create Export Package Job
```http
POST /api/modeller/importexport/export/package
Authorization: Bearer {token}
Content-Type: application/json

{
  "exportConfigName": "temp",
  "items": [
    {
      "systemName": "sharedo-type",
      "selector": {
        "systemName": "{workTypeName}"
      }
    }
  ]
}
```

**Response:**
```json
{
  "exportJobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Monitor Export Job Progress
```http
GET /api/modeller/importexport/export/package/{jobId}/progress/?_={timestamp}
Authorization: Bearer {token}
```

**Progress Response:**
```json
{
  "state": "RUNNING|COMPLETED|FAILED",
  "percentage": 45,
  "current": [
    {
      "description": "Exporting forms..."
    }
  ],
  "queued": [],
  "complete": false,
  "packageAvailable": false
}
```

#### Download Export Package
```http
GET /modeller/__importexport/export/package/{jobId}/download
Authorization: Bearer {token}
```
Returns: ZIP file with manifest.json and component files

#### Alternative: Configuration Export (Synchronous)
```http
POST /api/configuration/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "workTypeSystemName": "{workTypeName}",
  "includeAll": true,
  "format": "json"
}
```

---

### Workflow Endpoints

#### List Workflows (Simple)
```http
GET /api/workflows
Authorization: Bearer {token}
```

#### List Workflows (Advanced with Pagination)
```http
POST /api/listview/core-admin-plan-list/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}/?view=table&withCounts=1
Authorization: Bearer {token}
Content-Type: application/json

# URL Parameters:
# - pageSize: Records per page (e.g., 20)
# - pageNumber: Page number (1-based)
# - sortColumn: Column to sort by or "noSort"
# - sortDirection: "asc" or "desc"

{
  "additionalParameters": {},
  "filters": []
}

# With filters:
{
  "additionalParameters": {},
  "filters": [
    {
      "field": "name",
      "operator": "contains",
      "value": "onboarding"
    },
    {
      "field": "status",
      "operator": "eq",
      "value": "active"
    }
  ]
}
```

**Response:**
```json
{
  "totalRecords": 150,
  "pageSize": 20,
  "pageNumber": 1,
  "items": [
    {
      "id": "workflow-id",
      "name": "Client Onboarding",
      "systemName": "client_onboarding",
      "description": "Onboarding workflow for new clients",
      "status": "active",
      "version": "1.0",
      "createdDate": "2025-08-01T10:00:00Z",
      "modifiedDate": "2025-08-28T09:00:00Z",
      "createdBy": "admin@sharedo.com",
      "modifiedBy": "developer@sharedo.com",
      "executionCount": 45,
      "lastExecuted": "2025-08-28T08:30:00Z",
      "averageExecutionTime": 300000,
      "successRate": 98.5
    }
  ]
}
```

#### Get Workflow Definition
```http
GET /api/workflows/{systemName}
Authorization: Bearer {token}
```

#### Download Workflow Code
```http
GET /api/IDE/workflow/{systemName}
Authorization: Bearer {token}
```

#### Execute Workflow
```http
POST /api/workflows/{systemName}/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "parameters": {},
  "dataFields": {}
}
```

#### Get Executing Plans
```http
GET /api/execution/plans/executing
Authorization: Bearer {token}
```

#### Start Manual Execution
```http
POST /api/execution/manual/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "workflowName": "{name}",
  "parameters": {}
}
```

#### Cancel Execution
```http
DELETE /api/execution/plans/{planId}
Authorization: Bearer {token}
```

---

### Form Builder Endpoints

#### List Forms
```http
GET /api/forms
Authorization: Bearer {token}
```

#### Get Form Definition
```http
GET /api/forms/{formId}
Authorization: Bearer {token}
```

#### Create Form
```http
POST /api/forms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Form Name",
  "fields": [],
  "validation": {}
}
```

#### Update Form
```http
PUT /api/forms/{formId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "fields": [],
  "validation": {}
}
```

---

### IDE/File Management Endpoints

#### List IDE Templates
```http
GET /api/IDE/templates
Authorization: Bearer {token}
```

#### Get IDE File/Folder Structure
```http
GET /api/IDE?path={path}
Authorization: Bearer {token}
```

#### Download File
```http
GET /api/IDE/file?path={filePath}
Authorization: Bearer {token}
```

#### Upload/Save File
```http
POST /api/IDE/file
Authorization: Bearer {token}
Content-Type: application/json

{
  "path": "{filePath}",
  "content": "{fileContent}",
  "encoding": "utf8"
}
```

#### Create Template
```http
POST /api/IDE/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Template Name",
  "type": "workflow",
  "content": {}
}
```

---

### Option Sets Endpoints

#### List Option Sets
```http
GET /api/optionsets
Authorization: Bearer {token}
```

#### Get Option Set Options
```http
GET /api/optionsets/{optionSetId}/options
Authorization: Bearer {token}
```

#### Find Option by ID
```http
GET /api/optionsets/option/{optionId}
Authorization: Bearer {token}
```

---

### List View Endpoints

#### Get List View
```http
POST /api/listviews/{viewName}
Authorization: Bearer {token}
Content-Type: application/json

{
  "filters": {},
  "sorting": {},
  "pagination": {
    "page": 1,
    "pageSize": 50
  }
}
```

#### Get List View Manager
```http
GET /api/listviewmanager/{viewName}
Authorization: Bearer {token}
```

---

### Document Generation Endpoints

#### Generate Document
```http
POST /api/documents/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": "{templateId}",
  "workItemId": "{workItemId}",
  "format": "docx|pdf"
}
```

#### Get Document Templates
```http
GET /api/documents/templates
Authorization: Bearer {token}
```

---

### Deployment Endpoints

#### Deploy Package
```http
POST /api/modeller/importexport/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: {package.zip}
options: {
  "overwrite": true,
  "skipValidation": false
}
```

#### Validate Package Before Deploy
```http
POST /api/modeller/importexport/validate
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: {package.zip}
```

---

### Comparison Endpoints

#### Compare Work Types
```http
POST /api/compare/worktypes
Authorization: Bearer {token}
Content-Type: application/json

{
  "source": {
    "environment": "prod",
    "systemName": "matter"
  },
  "target": {
    "environment": "uat",
    "systemName": "matter"
  }
}
```

#### Compare Workflows
```http
POST /api/compare/workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "source": {
    "environment": "prod",
    "systemName": "onboarding"
  },
  "target": {
    "environment": "uat",
    "systemName": "onboarding"
  }
}
```

---

### Batch Operations

#### Batch Export
```http
POST /api/modeller/importexport/export/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "systemName": "sharedo-type",
      "selector": { "systemName": "matter" }
    },
    {
      "systemName": "sharedo-workflow",
      "selector": { "systemName": "onboarding" }
    }
  ]
}
```

#### Batch Deploy
```http
POST /api/modeller/importexport/import/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "packages": [
    { "packageId": "id1", "environment": "uat" },
    { "packageId": "id2", "environment": "vnext" }
  ]
}
```

---

### Health & Status Endpoints

#### Server Health
```http
GET /api/health
Authorization: Bearer {token}
```

#### Server Version Info
```http
GET /api/version-info?_={timestamp}
Authorization: Bearer {token}

# Note: The _={timestamp} parameter is a cache buster
```

#### Environment Configuration
```http
GET /api/modeller/environmentconfiguration?_={timestamp}
Authorization: Bearer {token}

# Returns the current environment's configuration settings
```

**Response:**
```json
{
  "environment": {
    "name": "demo-aus",
    "type": "demo",
    "url": "https://demo-aus.sharedo.tech",
    "identityUrl": "https://demo-aus-identity.sharedo.tech"
  },
  "features": {
    "workflowEngine": {
      "enabled": true,
      "version": "3.1",
      "maxConcurrentExecutions": 50
    },
    "formBuilder": {
      "enabled": true,
      "version": "2.5",
      "allowCustomFields": true
    },
    "exportApi": {
      "enabled": true,
      "version": "1.8",
      "maxJobSize": "100MB",
      "jobTimeout": 300000
    },
    "auditTracking": {
      "enabled": true,
      "retentionDays": 365,
      "trackDetailedChanges": true
    }
  },
  "settings": {
    "maxFileUploadSize": "50MB",
    "sessionTimeout": 1800,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true
    },
    "apiRateLimits": {
      "requestsPerMinute": 500,
      "burstLimit": 1000
    }
  },
  "modules": [
    {
      "name": "Core",
      "enabled": true,
      "configuration": {}
    },
    {
      "name": "Workflow",
      "enabled": true,
      "configuration": {
        "enableParallelExecution": true,
        "maxRetries": 3
      }
    },
    {
      "name": "FormBuilder",
      "enabled": true,
      "configuration": {
        "enableDynamicFields": true,
        "enableValidation": true
      }
    }
  ],
  "integrations": {
    "email": {
      "provider": "SendGrid",
      "enabled": true
    },
    "storage": {
      "provider": "AzureBlobStorage",
      "enabled": true
    },
    "authentication": {
      "providers": ["ShareDo", "AzureAD", "SAML"]
    }
  },
  "customizations": {
    "branding": {
      "logoUrl": "/assets/logo.png",
      "primaryColor": "#2E74B5",
      "applicationTitle": "ShareDo Demo AUS"
    },
    "locale": {
      "default": "en-AU",
      "supported": ["en-AU", "en-US", "en-GB"]
    }
  }
}
```

**Version Info Response:**
```json
{
  "version": "4.2.0.0",
  "buildNumber": "4.2.0.12345",
  "buildDate": "2025-08-28T10:00:00Z",
  "environment": "demo-aus",
  "serverName": "demo-aus.sharedo.tech",
  "features": {
    "workflowEngine": "v3.1",
    "formBuilder": "v2.5",
    "exportApi": "v1.8"
  },
  "modules": [
    {
      "name": "Core",
      "version": "4.2.0",
      "status": "Active"
    },
    {
      "name": "Workflow",
      "version": "3.1.0",
      "status": "Active"
    },
    {
      "name": "FormBuilder",
      "version": "2.5.0",
      "status": "Active"
    }
  ],
  "database": {
    "version": "4.2.0",
    "lastMigration": "2025-08-27T09:00:00Z"
  }
}
```

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "Additional context"
    }
  },
  "statusCode": 400,
  "timestamp": "2025-08-28T10:00:00Z"
}
```

## Common Status Codes

- **200** - Success
- **201** - Created
- **204** - No Content (successful delete)
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **429** - Too Many Requests
- **500** - Internal Server Error
- **502** - Bad Gateway
- **503** - Service Unavailable

## Rate Limiting

- Production: 100 requests/minute
- Non-Production: 500 requests/minute
- Export Jobs: 10 concurrent jobs
- Batch Operations: 5 concurrent operations

## Headers Required

```http
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}  # Optional but recommended for tracking
```

## Audit & Change Tracking Endpoints

### Configuration Change History

#### Get Change History (Extended)
```http
POST /api/listview/config-change-history-extended/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}/?view=table&withCounts=1
Authorization: Bearer {token}
Content-Type: application/json

# URL Parameters:
# - pageSize: Number of records per page (e.g., 20)
# - pageNumber: Current page number (1-based)
# - sortColumn: Column name or "noSort" for no sorting
# - sortDirection: "asc" or "desc"

{
  "additionalParameters": {},
  "filters": []
}

# With filters example:
{
  "additionalParameters": {},
  "filters": [
    {
      "field": "changeDate",
      "operator": ">=",
      "value": "2025-08-01T00:00:00Z"
    },
    {
      "field": "providerSystemName",
      "operator": "in",
      "value": ["sharedo-type", "sharedo-workflow"]
    }
  ]
}
```

**Response:**
```json
{
  "totalRecords": 150,
  "pageSize": 20,
  "pageNumber": 1,
  "items": [
    {
      "id": "4c9b1956-3b1f-4659-9e3e-b34200c98999",
      "providerSystemName": "sharedo-type",
      "entityName": "matter",
      "changeType": "Update",
      "changedBy": "user@example.com",
      "changeDate": "2025-08-28T10:00:00Z",
      "hashCode": 682034322,
      "description": "Updated workflow permissions",
      "selectorJson": "{\"SystemName\":\"matter\"}"
    }
  ]
}
```

#### Get Change History (Basic)
```http
GET /api/listView/config-change-history/?_={timestamp}
Authorization: Bearer {token}
```

```http
POST /api/listview/config-change-history/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}/?view=table&withCounts=1
Authorization: Bearer {token}
Content-Type: application/json

{
  "additionalParameters": {
    "providerSystemName": "global-feature",
    "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
  },
  "filters": []
}
```

### Entity History Tracking

#### Get Entity History Description
```http
POST /api/modeller/changeTracking/entityHistoryDescription
Authorization: Bearer {token}
Content-Type: application/json

# Provider types:
# - global-feature: System-wide features
# - developer-ide: IDE files/folders
# - sharedo-type: Work types
# - sharedo-workflow: Workflows
# - sharedo-form: Forms

{
  "providerSystemName": "global-feature",
  "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
}

# For IDE components:
{
  "providerSystemName": "developer-ide", 
  "selectorJson": "{\"Id\":\"e9f7f5de-277c-42cf-95e4-b342002de4ca\"}"
}

# For work types:
{
  "providerSystemName": "sharedo-type",
  "selectorJson": "{\"SystemName\":\"matter\"}"
}
```

**Response:**
```json
{
  "entityType": "GlobalFeature",
  "systemName": "CacheHeaders",
  "displayName": "Cache Headers Configuration",
  "description": "Controls HTTP cache headers",
  "lastModified": "2025-08-28T09:00:00Z",
  "modifiedBy": "admin@sharedo.com",
  "version": 3,
  "isActive": true
}
```

#### Get Entity History Diff
```http
POST /api/modeller/changeTracking/entityHistoryDiff
Authorization: Bearer {token}
Content-Type: application/json

# Required fields:
# - id: Change record ID from change history list
# - providerSystemName: Entity provider type
# - hashCode: Version hash from change record
# - selectorData: Simple identifier
# - selectorJson: JSON selector (must match provider type)

# Example for global feature:
{
  "id": "4c9b1956-3b1f-4659-9e3e-b34200c98999",
  "providerSystemName": "global-feature",
  "hashCode": 682034322,
  "selectorData": "CacheHeaders",
  "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
}

# Example for IDE component:
{
  "id": "dce3aebc-0507-4396-a8b0-b34200c984fc",
  "providerSystemName": "developer-ide",
  "hashCode": 2106308571,
  "selectorData": "e9f7f5de-277c-42cf-95e4-b342002de4ca",
  "selectorJson": "{\"Id\":\"e9f7f5de-277c-42cf-95e4-b342002de4ca\"}"
}
```

**Response:**
```json
{
  "hasChanges": true,
  "differences": [
    {
      "path": "settings.cacheControl.maxAge",
      "propertyName": "Max Age",
      "oldValue": "3600",
      "newValue": "7200",
      "changeType": "Modified"
    },
    {
      "path": "settings.headers.etag",
      "propertyName": "ETag Header",
      "oldValue": null,
      "newValue": "true",
      "changeType": "Added"
    }
  ],
  "previousVersion": {
    "version": 2,
    "hashCode": 682034321,
    "modifiedDate": "2025-08-27T15:00:00Z",
    "modifiedBy": "developer@sharedo.com"
  },
  "currentVersion": {
    "version": 3,
    "hashCode": 682034322,
    "modifiedDate": "2025-08-28T09:00:00Z",
    "modifiedBy": "admin@sharedo.com"
  }
}
```

#### Get Entity History Details Panel
```http
GET /api/panels/Sharedo.Core.Case.Modeller.ImportExport.EntityHistoryDetails
Authorization: Bearer {token}
```

#### Get Entity History Details Blade
```http
GET /plugins/sharedo.core.case/modeller/importexport/entityhistorydetails/blade.html
Authorization: Bearer {token}
```

### IDE Change Tracking

#### Get IDE Entity History Diff
```http
POST /api/modeller/changeTracking/entityHistoryDiff
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "dce3aebc-0507-4396-a8b0-b34200c984fc",
  "providerSystemName": "developer-ide",
  "hashCode": 2106308571,
  "selectorData": "e9f7f5de-277c-42cf-95e4-b342002de4ca",
  "selectorJson": "{\"Id\":\"e9f7f5de-277c-42cf-95e4-b342002de4ca\"}"
}
```

### Audit Log Queries

#### Search Audit Logs
```http
POST /api/audit/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "startDate": "2025-08-01T00:00:00Z",
  "endDate": "2025-08-28T23:59:59Z",
  "entityTypes": ["WorkType", "Workflow", "Form"],
  "changeTypes": ["Create", "Update", "Delete"],
  "users": ["user1@example.com", "user2@example.com"],
  "pageSize": 50,
  "pageNumber": 1
}
```

#### Get Audit Trail for Entity
```http
GET /api/audit/entity/{entityType}/{entityId}/history
Authorization: Bearer {token}
```

**Response:**
```json
{
  "entity": {
    "type": "WorkType",
    "id": "matter-id",
    "name": "matter"
  },
  "history": [
    {
      "version": 5,
      "date": "2025-08-28T10:00:00Z",
      "user": "admin@sharedo.com",
      "action": "Update",
      "changes": ["Added new workflow", "Modified permissions"],
      "snapshot": {}
    },
    {
      "version": 4,
      "date": "2025-08-27T14:00:00Z",
      "user": "developer@sharedo.com",
      "action": "Update",
      "changes": ["Updated form layout"],
      "snapshot": {}
    }
  ]
}
```

#### Compare Entity Versions
```http
POST /api/audit/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "entityType": "WorkType",
  "entityId": "matter-id",
  "fromVersion": 3,
  "toVersion": 5
}
```

---

## Environment URL Patterns

- **Production**: `https://api.sharedo.com`
- **UAT**: `https://uat-api.sharedo.com`
- **SIT**: `https://sit-api.sharedo.com`
- **vNext**: `https://vnext-api.sharedo.com`

- **Identity Server**:
  - Production: `https://identity.sharedo.com`
  - UAT: `https://uat-identity.sharedo.com`
  - SIT: `https://sit-identity.sharedo.com`
  - vNext: `https://vnext-identity.sharedo.com`