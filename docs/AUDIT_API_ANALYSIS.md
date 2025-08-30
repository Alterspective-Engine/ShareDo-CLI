# ShareDo Audit API Analysis
## Based on Actual API Calls from Production System

### 1. Configuration Change History Extended

**Endpoint:**
```
POST /api/listview/config-change-history-extended/20/1/noSort/asc/?view=table&withCounts=1
```

**URL Parameters:**
- `20` - Page size
- `1` - Page number
- `noSort` - Sort column (can be a column name or "noSort")
- `asc` - Sort direction (asc/desc)
- `view=table` - View format
- `withCounts=1` - Include total counts

**Request Body:**
```json
{
  "additionalParameters": {},
  "filters": []
}
```

**Key Features:**
- Paginated results
- Sortable columns
- Filter support (though empty in example)
- Table view format

### 2. Entity History Description

**Endpoint:**
```
POST /api/modeller/changeTracking/entityHistoryDescription
```

**Request Body:**
```json
{
  "providerSystemName": "global-feature",
  "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
}
```

**Provider Types Observed:**
- `global-feature` - Global configuration features
- `developer-ide` - IDE components
- `sharedo-type` - Work types
- `sharedo-workflow` - Workflows

**Selector JSON Structure:**
- For global features: `{"SystemName":"FeatureName"}`
- For IDE items: `{"Id":"guid"}`
- For work types: `{"SystemName":"workTypeName"}`

### 3. Configuration Change History (Basic)

**Two Variants:**

**Variant 1 - Simple GET:**
```
GET /api/listView/config-change-history/?_=1756380426974
```
- `_` parameter is a cache buster timestamp

**Variant 2 - POST with Filters:**
```
POST /api/listview/config-change-history/20/1/noSort/asc/?view=table&withCounts=1
```

**Request Body with Provider Filter:**
```json
{
  "additionalParameters": {
    "providerSystemName": "global-feature",
    "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
  },
  "filters": []
}
```

### 4. Entity History Diff

**Endpoint:**
```
POST /api/modeller/changeTracking/entityHistoryDiff
```

**Request Body Examples:**

**For Global Feature:**
```json
{
  "id": "4c9b1956-3b1f-4659-9e3e-b34200c98999",
  "providerSystemName": "global-feature",
  "hashCode": 682034322,
  "selectorData": "CacheHeaders",
  "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
}
```

**For IDE Component:**
```json
{
  "id": "dce3aebc-0507-4396-a8b0-b34200c984fc",
  "providerSystemName": "developer-ide",
  "hashCode": 2106308571,
  "selectorData": "e9f7f5de-277c-42cf-95e4-b342002de4ca",
  "selectorJson": "{\"Id\":\"e9f7f5de-277c-42cf-95e4-b342002de4ca\"}"
}
```

**Key Fields:**
- `id` - Change record ID (GUID)
- `providerSystemName` - Type of entity
- `hashCode` - Version hash
- `selectorData` - Simple identifier
- `selectorJson` - JSON selector for the entity

### 5. Entity History Details Panel

**Endpoint:**
```
GET /api/panels/Sharedo.Core.Case.Modeller.ImportExport.EntityHistoryDetails
```

**Note:** Uses cache keys in URL (e.g., `/_ck-238/`)

### 6. Entity History Details Blade HTML

**Endpoint:**
```
GET /plugins/sharedo.core.case/modeller/importexport/entityhistorydetails/blade.html
```

**Purpose:** Returns HTML template for displaying entity history details in UI

---

## Implementation Notes for CLI

### Authentication Headers
All requests require:
```javascript
{
  "authorization": "Bearer {token}",
  "accept": "application/json, text/javascript, */*; q=0.01",
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "x-requested-with": "XMLHttpRequest"
}
```

### Provider System Names
Common provider types to support:
- `global-feature` - System-wide features
- `developer-ide` - IDE files and folders
- `sharedo-type` - Work types
- `sharedo-workflow` - Workflows
- `sharedo-form` - Forms
- `sharedo-template` - Templates
- `sharedo-optionset` - Option sets

### Selector JSON Patterns

**By System Name:**
```json
{"SystemName": "entityName"}
```

**By ID:**
```json
{"Id": "guid-here"}
```

**By Type and Name:**
```json
{"Type": "WorkType", "SystemName": "matter"}
```

### Filter Structure for List Views

**Time-based Filters:**
```json
{
  "filters": [
    {
      "field": "changeDate",
      "operator": ">=",
      "value": "2025-08-01T00:00:00Z"
    },
    {
      "field": "changeDate",
      "operator": "<=",
      "value": "2025-08-28T23:59:59Z"
    }
  ]
}
```

**User Filters:**
```json
{
  "filters": [
    {
      "field": "changedBy",
      "operator": "eq",
      "value": "user@example.com"
    }
  ]
}
```

**Entity Type Filters:**
```json
{
  "filters": [
    {
      "field": "providerSystemName",
      "operator": "in",
      "value": ["sharedo-type", "sharedo-workflow"]
    }
  ]
}
```

---

## CLI Command Examples Based on Real API

### Get Recent Changes
```bash
sharedo audit list --page-size 20 --page 1
```

Maps to:
```
POST /api/listview/config-change-history-extended/20/1/noSort/asc/?view=table&withCounts=1
Body: {"additionalParameters": {}, "filters": []}
```

### Get Changes for Specific Entity
```bash
sharedo audit changes --entity global-feature:CacheHeaders
```

Maps to:
```
POST /api/listview/config-change-history/20/1/noSort/asc/?view=table&withCounts=1
Body: {
  "additionalParameters": {
    "providerSystemName": "global-feature",
    "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
  },
  "filters": []
}
```

### Get Entity Diff
```bash
sharedo audit diff --id 4c9b1956-3b1f-4659-9e3e-b34200c98999 --type global-feature
```

Maps to:
```
POST /api/modeller/changeTracking/entityHistoryDiff
Body: {
  "id": "4c9b1956-3b1f-4659-9e3e-b34200c98999",
  "providerSystemName": "global-feature",
  "hashCode": 682034322,
  "selectorData": "CacheHeaders",
  "selectorJson": "{\"SystemName\":\"CacheHeaders\"}"
}
```

### Get Entity Description
```bash
sharedo audit describe --type developer-ide --id e9f7f5de-277c-42cf-95e4-b342002de4ca
```

Maps to:
```
POST /api/modeller/changeTracking/entityHistoryDescription
Body: {
  "providerSystemName": "developer-ide",
  "selectorJson": "{\"Id\":\"e9f7f5de-277c-42cf-95e4-b342002de4ca\"}"
}
```

---

## Response Data Structures (Expected)

### Change History List Response
```json
{
  "totalRecords": 150,
  "pageSize": 20,
  "pageNumber": 1,
  "items": [
    {
      "id": "change-guid",
      "providerSystemName": "sharedo-type",
      "entityName": "matter",
      "changeType": "Update",
      "changedBy": "user@example.com",
      "changeDate": "2025-08-28T10:00:00Z",
      "hashCode": 12345678,
      "description": "Modified workflow permissions",
      "selectorJson": "{\"SystemName\":\"matter\"}"
    }
  ]
}
```

### Entity History Description Response
```json
{
  "entityType": "GlobalFeature",
  "systemName": "CacheHeaders",
  "displayName": "Cache Headers Configuration",
  "description": "Controls HTTP cache headers for the application",
  "lastModified": "2025-08-28T09:00:00Z",
  "modifiedBy": "admin@sharedo.com",
  "version": 3,
  "isActive": true
}
```

### Entity History Diff Response
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

---

## Important Implementation Considerations

1. **Cache Busting**: GET requests include `_={timestamp}` parameter
2. **Hash Codes**: Used for version tracking and comparison
3. **Selector JSON**: Must be properly escaped when embedded in JSON
4. **Provider Types**: Different entity types use different provider names
5. **Pagination**: Always include pageSize and pageNumber for list endpoints
6. **Sorting**: Use "noSort" or actual column names
7. **View Format**: Usually "table" for structured data
8. **With Counts**: Set to 1 to get total record counts

---

## Error Handling

Common error responses:
- 401: Unauthorized - Token expired or invalid
- 403: Forbidden - No permission to view audit logs
- 404: Entity or change record not found
- 400: Invalid request parameters or malformed JSON

---

## Security Notes

1. Audit logs may contain sensitive information
2. User must have appropriate permissions to view audit data
3. Some environments may restrict audit log access
4. Production audit logs should be handled with extra care
5. Consider data retention policies when implementing CLI features