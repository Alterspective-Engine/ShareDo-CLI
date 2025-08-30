# ShareDo Public API Catalog
## Complete API Documentation for CLI & MCP Integration

### Version 1.0.0
### Date: 2025-08-28

---

## Executive Summary

This document catalogs all ShareDo public APIs discovered through analysis of the codebase and network traffic. The APIs are organized by functional category with detailed use cases for CLI and MCP (Model Context Protocol) integration.

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Core Work Management APIs](#core-work-management-apis)
3. [Financial APIs](#financial-apis)
4. [Document Management APIs](#document-management-apis)
5. [User & Organization APIs](#user--organization-apis)
6. [Workflow & Execution APIs](#workflow--execution-apis)
7. [Configuration & Export APIs](#configuration--export-apis)
8. [Audit & Tracking APIs](#audit--tracking-apis)
9. [Communication APIs](#communication-apis)
10. [Swagger Documentation APIs](#swagger-documentation-apis)

---

## Authentication APIs

### OAuth2 Token Endpoint
```http
POST /connect/token
```
**Purpose**: Obtain access token for API authentication
**CLI Use Case**: Initial authentication for all CLI commands
**MCP Use Case**: Establish authenticated session for all MCP tools

**Request Body**:
```
grant_type=client_credentials
scope=sharedo
impersonate_user={email}
impersonate_provider={provider}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "expires_in": 600,
  "token_type": "Bearer"
}
```

---

## Core Work Management APIs

### Work Types API
```http
GET /api/modeller/types
GET /api/modeller/types/{systemName}
GET /api/modeller/types/{systemName}/aspect-sections
GET /api/modeller/types/{systemName}/participant-roles
GET /api/modeller/types/{systemName}/create-permissions
POST /api/modeller/types/{systemName}/participant-roles/{roleId}/permissions
```

**CLI Use Cases**:
- `sharedo list-worktypes` - List all work types
- `sharedo worktype matter --details` - Get specific work type details
- `sharedo worktype matter --aspects` - View work type aspects
- `sharedo worktype matter --roles` - View participant roles
- `sharedo worktype matter --permissions` - View/update permissions

**MCP Use Cases**:
- Resource: `sharedo://worktypes` - List available work types
- Tool: `sharedo_worktype_details` - Get comprehensive work type information
- Tool: `sharedo_update_permissions` - Modify participant permissions

### Public Types API
```http
GET /api/public/types/versions
GET /api/public/v2/types/swagger.json
```

**Purpose**: Access public work type information and API documentation
**CLI Use Case**: `sharedo api-docs types` - View types API documentation
**MCP Use Case**: Dynamic API discovery for work type operations

### Work Item API
```http
GET /api/public/workItem/versions
GET /api/public/v1/workItem/swagger.json
```

**Purpose**: Manage individual work items
**CLI Use Cases**:
- `sharedo workitem list` - List work items
- `sharedo workitem get {id}` - Get work item details
- `sharedo workitem create --type matter` - Create new work item

**MCP Use Cases**:
- Tool: `sharedo_workitem_create` - Create work items programmatically
- Tool: `sharedo_workitem_query` - Query work items with filters

---

## Financial APIs

### Invoices API
```http
GET /api/public/Invoices/versions
GET /api/public/v1/Invoices/swagger.json
```

**Purpose**: Invoice management and processing
**CLI Use Cases**:
- `sharedo invoice list` - List all invoices
- `sharedo invoice get {id}` - Get invoice details
- `sharedo invoice export --format pdf` - Export invoices

**MCP Use Cases**:
- Tool: `sharedo_invoice_generate` - Generate invoices from work items
- Resource: `sharedo://invoices/pending` - Get pending invoices

### Invoice Payments API
```http
GET /api/public/Invoice%20Payments/versions
GET /api/public/v1/Invoice%20Payments/swagger.json
```

**Purpose**: Track and manage invoice payments
**CLI Use Cases**:
- `sharedo payment list --invoice {id}` - List payments for invoice
- `sharedo payment record --invoice {id} --amount 1000` - Record payment

### Budgets API
```http
GET /api/public/Budgets/versions
GET /api/public/v1/Budgets/swagger.json
```

**Purpose**: Budget management and tracking
**CLI Use Cases**:
- `sharedo budget list --worktype matter` - List budgets
- `sharedo budget status {id}` - Check budget utilization

### Chart of Accounts API
```http
GET /api/public/ChartOfAccounts/versions
GET /api/public/v1/ChartOfAccounts/swagger.json
```

**Purpose**: Manage financial account structure
**CLI Use Cases**:
- `sharedo accounts list` - List chart of accounts
- `sharedo accounts map --worktype matter` - Map accounts to work types

### Account Adjustments API
```http
GET /api/public/accountAdjustments/versions
GET /api/public/v1/accountAdjustments/swagger.json
```

**Purpose**: Handle financial adjustments and corrections
**CLI Use Cases**:
- `sharedo adjustment create --account {id} --amount 500` - Create adjustment
- `sharedo adjustment list --from 2025-01-01` - List adjustments

### Payment Requests API
```http
GET /api/public/PaymentRequests/versions
GET /api/public/v1/PaymentRequests/swagger.json
```

**Purpose**: Manage payment request workflow
**CLI Use Cases**:
- `sharedo payment-request create --workitem {id}` - Create payment request
- `sharedo payment-request approve {id}` - Approve payment request

---

## Document Management APIs

### Documents API
```http
GET /api/public/documents/versions
GET /api/public/v1/documents/swagger.json
POST /api/documents/generate
GET /api/documents/templates
```

**Purpose**: Document generation and management
**CLI Use Cases**:
- `sharedo document generate --template hld --worktype matter` - Generate document
- `sharedo document list --workitem {id}` - List work item documents
- `sharedo document template list` - List available templates

**MCP Use Cases**:
- Tool: `sharedo_document_generate` - Generate documents with templates
- Tool: `sharedo_hld_create` - Create HLD documentation
- Resource: `sharedo://templates/documents` - Available document templates

### DMS (Document Management System) API
```http
GET /api/public/dms/versions
GET /api/public/v1/dms/swagger.json
```

**Purpose**: Advanced document management operations
**CLI Use Cases**:
- `sharedo dms upload --file report.pdf --workitem {id}` - Upload document
- `sharedo dms search --text "contract"` - Search documents
- `sharedo dms version --document {id}` - Manage document versions

### IDE File Management API
```http
GET /api/IDE/templates
GET /api/IDE?path={path}
GET /api/IDE/file?path={filePath}
POST /api/IDE/file
GET /api/IDE/workflow/{systemName}
```

**Purpose**: Manage IDE files and workflows
**CLI Use Cases**:
- `sharedo ide list --path /workflows` - List IDE files
- `sharedo ide download --file workflow.js` - Download IDE file
- `sharedo ide upload --file custom.js --path /scripts` - Upload file

**MCP Use Cases**:
- Tool: `sharedo_ide_sync` - Synchronize IDE files
- Resource: `sharedo://ide/workflows` - Browse workflow files

---

## User & Organization APIs

### Users API
```http
GET /api/public/users/versions
GET /api/public/v2/users/swagger.json
```

**Purpose**: User management and administration
**CLI Use Cases**:
- `sharedo user list` - List all users
- `sharedo user create --email user@example.com` - Create user
- `sharedo user permissions {id}` - View user permissions

### Organization API
```http
GET /api/public/organisation/versions
GET /api/public/v1/organisation/swagger.json
GET /api/public/v2/organisation/swagger.json
```

**Purpose**: Organization structure and settings
**CLI Use Cases**:
- `sharedo org info` - Display organization details
- `sharedo org settings` - View/update organization settings

### People API
```http
GET /api/public/people/versions
GET /api/public/v1/people/swagger.json
GET /api/public/v2/people/swagger.json
```

**Purpose**: Manage people (contacts, clients)
**CLI Use Cases**:
- `sharedo person create --name "John Doe"` - Create person record
- `sharedo person search --email john@example.com` - Search people

### Participants API
```http
GET /api/public/participants/versions
GET /api/public/v1/participants/swagger.json
GET /api/public/v2/participants/swagger.json
```

**Purpose**: Manage work item participants
**CLI Use Cases**:
- `sharedo participant add --workitem {id} --person {personId}` - Add participant
- `sharedo participant list --workitem {id}` - List participants

### My (Current User) API
```http
GET /api/public/my/versions
GET /api/public/v1/my/swagger.json
GET /api/public/v2/my/swagger.json
```

**Purpose**: Current user operations and preferences
**CLI Use Cases**:
- `sharedo my profile` - View current user profile
- `sharedo my workitems` - List user's work items
- `sharedo my notifications` - View user notifications

---

## Workflow & Execution APIs

### Workflows API
```http
GET /api/workflows
GET /api/workflows/{systemName}
POST /api/workflows/{systemName}/execute
GET /api/execution/plans/executing
POST /api/execution/manual/start
DELETE /api/execution/plans/{planId}
```

**Purpose**: Workflow management and execution
**CLI Use Cases**:
- `sharedo workflow list` - List all workflows
- `sharedo workflow run onboarding` - Execute workflow
- `sharedo workflow status` - View executing workflows
- `sharedo workflow cancel {planId}` - Cancel execution

**MCP Use Cases**:
- Tool: `sharedo_workflow_execute` - Execute workflows with parameters
- Tool: `sharedo_workflow_monitor` - Monitor workflow execution
- Resource: `sharedo://workflows/executing` - Currently executing workflows

### Advanced Workflow List API
```http
POST /api/listview/core-admin-plan-list/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}
```

**Purpose**: Advanced workflow listing with pagination and filtering
**CLI Use Cases**:
- `sharedo workflow list --page 1 --size 20 --sort name` - Paginated list
- `sharedo workflow search --filter "status:active"` - Filtered search

---

## Configuration & Export APIs

### Package Export API
```http
POST /api/modeller/importexport/export/added
POST /api/modeller/importexport/export/package
GET /api/modeller/importexport/export/package/{jobId}/progress
GET /modeller/__importexport/export/package/{jobId}/download
```

**Purpose**: Export configurations as packages
**CLI Use Cases**:
- `sharedo export worktype matter --output matter.zip` - Export work type
- `sharedo export status {jobId}` - Check export progress
- `sharedo export download {jobId}` - Download export package

**MCP Use Cases**:
- Tool: `sharedo_export_package` - Create export packages
- Tool: `sharedo_export_monitor` - Monitor export jobs

### Configuration Export API
```http
POST /api/configuration/export
```

**Purpose**: Synchronous configuration export
**CLI Use Cases**:
- `sharedo config export --worktype matter --format json` - Export configuration

### Import/Deploy API
```http
POST /api/modeller/importexport/import
POST /api/modeller/importexport/validate
```

**Purpose**: Import and deploy configuration packages
**CLI Use Cases**:
- `sharedo deploy package.zip --env uat` - Deploy package
- `sharedo validate package.zip` - Validate package before deployment

### Generic Export API
```http
GET /api/public/genericExport/versions
GET /api/public/v1/genericExport/swagger.json
```

**Purpose**: Generic data export capabilities
**CLI Use Cases**:
- `sharedo export data --type workitems --format csv` - Export data
- `sharedo export template list` - List export templates

### Environment Configuration API
```http
GET /api/modeller/environmentconfiguration
```

**Purpose**: Get environment-specific configuration
**CLI Use Cases**:
- `sharedo env config` - Display environment configuration
- `sharedo env features` - List enabled features

### Version Info API
```http
GET /api/version-info
```

**Purpose**: Get server version information
**CLI Use Cases**:
- `sharedo version` - Display server version
- `sharedo health` - Check server health

---

## Audit & Tracking APIs

### Audit/Change History API
```http
POST /api/listview/config-change-history-extended/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}
POST /api/listview/config-change-history/{pageSize}/{pageNumber}/{sortColumn}/{sortDirection}
POST /api/modeller/changeTracking/entityHistoryDescription
POST /api/modeller/changeTracking/entityHistoryDiff
```

**Purpose**: Track configuration changes and audit trail
**CLI Use Cases**:
- `sharedo audit list --from 2025-01-01` - List audit entries
- `sharedo audit diff {changeId}` - View change details
- `sharedo audit entity --type worktype --name matter` - Entity history

**MCP Use Cases**:
- Tool: `sharedo_audit_query` - Query audit logs
- Resource: `sharedo://audit/recent` - Recent configuration changes

### Work Item Audit API
```http
GET /api/public/workitem-audit/versions
GET /api/public/v1/workitem-audit/swagger.json
```

**Purpose**: Work item specific audit tracking
**CLI Use Cases**:
- `sharedo workitem audit {id}` - View work item audit trail
- `sharedo workitem changes {id} --from 2025-01-01` - List changes

### Chronology API
```http
GET /api/public/chronology/versions
GET /api/public/v1/chronology/swagger.json
```

**Purpose**: Timeline and event tracking
**CLI Use Cases**:
- `sharedo chronology --workitem {id}` - View work item timeline
- `sharedo events list --from 2025-01-01` - List events

---

## Communication APIs

### Emails API
```http
GET /api/public/emails/versions
GET /api/public/v1/emails/swagger.json
GET /api/public/v2/emails/swagger.json
```

**Purpose**: Email integration and management
**CLI Use Cases**:
- `sharedo email send --workitem {id} --template welcome` - Send email
- `sharedo email history --workitem {id}` - View email history

### Notifications API
```http
GET /api/public/notifications/versions
GET /api/public/v1/notifications/swagger.json
```

**Purpose**: In-app notifications
**CLI Use Cases**:
- `sharedo notification list` - List notifications
- `sharedo notification mark-read {id}` - Mark as read
- `sharedo notification settings` - Configure notifications

### Comments API
```http
GET /api/public/comments/versions
GET /api/public/v1/comments/swagger.json
```

**Purpose**: Comments and discussions
**CLI Use Cases**:
- `sharedo comment add --workitem {id} --text "Status update"` - Add comment
- `sharedo comment list --workitem {id}` - List comments

### Wikis API
```http
GET /api/public/wikis/versions
GET /api/public/v1/wikis/swagger.json
```

**Purpose**: Knowledge base and documentation
**CLI Use Cases**:
- `sharedo wiki create --title "Process Guide"` - Create wiki page
- `sharedo wiki search --text "onboarding"` - Search wikis

---

## Additional APIs

### Forms API
```http
GET /api/forms
GET /api/forms/{formId}
POST /api/forms
PUT /api/forms/{formId}
```

**Purpose**: Form builder and management
**CLI Use Cases**:
- `sharedo form list` - List forms
- `sharedo form create --template basic` - Create form
- `sharedo form export {id}` - Export form definition

### Option Sets API
```http
GET /api/optionsets
GET /api/optionsets/{optionSetId}/options
GET /api/optionsets/option/{optionId}
GET /api/public/optionSets/versions
GET /api/public/v1/optionSets/swagger.json
```

**Purpose**: Manage dropdown options and lookups
**CLI Use Cases**:
- `sharedo optionset list` - List option sets
- `sharedo optionset add --set countries --option "Australia"` - Add option

### Attributes API
```http
GET /api/public/attributes/versions
GET /api/public/v1/attributes/swagger.json
```

**Purpose**: Custom attributes and metadata
**CLI Use Cases**:
- `sharedo attribute list --worktype matter` - List attributes
- `sharedo attribute create --name "Priority" --type select` - Create attribute

### Smart Variables API
```http
GET /api/public/smartVariables/versions
GET /api/public/v1/smartVariables/swagger.json
```

**Purpose**: Dynamic variables and calculations
**CLI Use Cases**:
- `sharedo variable list` - List smart variables
- `sharedo variable evaluate --name totalCost --workitem {id}` - Evaluate variable

### Locations API
```http
GET /api/public/locations/versions
GET /api/public/v2/locations/swagger.json
```

**Purpose**: Geographic locations and offices
**CLI Use Cases**:
- `sharedo location list` - List locations
- `sharedo location create --name "Sydney Office"` - Create location

### Time API
```http
GET /api/public/time/versions
GET /api/public/v2/time/swagger.json
```

**Purpose**: Time tracking and billing
**CLI Use Cases**:
- `sharedo time record --workitem {id} --hours 2.5` - Record time
- `sharedo time report --from 2025-01-01` - Time reports

### Timezones API
```http
GET /api/public/timezones/versions
GET /api/public/v1/timezones/swagger.json
```

**Purpose**: Timezone management
**CLI Use Cases**:
- `sharedo timezone list` - List supported timezones
- `sharedo timezone set --user {id} --zone "Australia/Sydney"` - Set timezone

### Settings API
```http
GET /api/public/settings/versions
GET /api/public/v1/settings/swagger.json
GET /api/public/v2/settings/swagger.json
```

**Purpose**: Application settings and configuration
**CLI Use Cases**:
- `sharedo settings list` - List all settings
- `sharedo settings set --key theme --value dark` - Update setting

### Features API
```http
GET /api/public/features/versions
GET /api/public/v2/features/swagger.json
```

**Purpose**: Feature flags and capabilities
**CLI Use Cases**:
- `sharedo feature list` - List enabled features
- `sharedo feature toggle --name workflow-v2` - Toggle feature

### Phase API
```http
GET /api/public/phase/versions
GET /api/public/v1/phase/swagger.json
```

**Purpose**: Work item phases and stages
**CLI Use Cases**:
- `sharedo phase list --worktype matter` - List phases
- `sharedo phase transition --workitem {id} --to "In Progress"` - Change phase

### Offers API
```http
GET /api/public/Offers/versions
GET /api/public/v1/Offers/swagger.json
```

**Purpose**: Proposal and offer management
**CLI Use Cases**:
- `sharedo offer create --worktype matter --client {id}` - Create offer
- `sharedo offer accept {id}` - Accept offer

### Query API
```http
GET /api/public/findByQuery/versions
GET /api/public/v1/findByQuery/swagger.json
```

**Purpose**: Advanced search and query capabilities
**CLI Use Cases**:
- `sharedo query --type workitem --filter "status:active"` - Execute query
- `sharedo search --text "contract" --in documents` - Full-text search

---

## Swagger Documentation APIs

All major API groups provide Swagger/OpenAPI documentation:

```http
GET /api/public/v1/{module}/swagger.json
GET /api/public/v2/{module}/swagger.json
```

**Purpose**: API discovery and documentation
**CLI Use Cases**:
- `sharedo api docs --module workItem` - View API documentation
- `sharedo api validate --spec swagger.json` - Validate API spec

**MCP Use Cases**:
- Dynamic API discovery
- Schema validation
- Code generation

---

## Implementation Priority for CLI/MCP

### Phase 1: Core Operations (Week 1)
1. Authentication (`/connect/token`)
2. Work Types (`/api/modeller/types`)
3. Export/Import (`/api/modeller/importexport`)
4. Workflows (`/api/workflows`)

### Phase 2: Data Management (Week 2)
1. Work Items (`/api/public/workItem`)
2. Documents (`/api/documents`)
3. Forms (`/api/forms`)
4. Option Sets (`/api/optionsets`)

### Phase 3: Advanced Features (Week 3)
1. Audit/History (`/api/modeller/changeTracking`)
2. Financial APIs (Invoices, Budgets)
3. Communication APIs (Email, Notifications)
4. User Management (`/api/public/users`)

### Phase 4: Complete Integration (Week 4)
1. All remaining APIs
2. Swagger documentation integration
3. Dynamic API discovery
4. Error handling and retry logic

---

## CLI Command Examples

```bash
# Authentication
sharedo auth login --env demo-aus

# Work Type Operations
sharedo worktype list
sharedo worktype export matter --output matter.zip
sharedo worktype compare matter --env1 prod --env2 uat

# Workflow Operations
sharedo workflow list --active
sharedo workflow execute onboarding --params params.json
sharedo workflow monitor {executionId}

# Export/Import
sharedo export create --worktype matter --include-dependencies
sharedo export status {jobId}
sharedo export download {jobId} --output package.zip
sharedo import validate package.zip
sharedo import deploy package.zip --env uat

# Document Generation
sharedo hld generate --worktype matter --template business-analyst

# Audit
sharedo audit list --from "2025-01-01" --entity-type WorkType
sharedo audit diff {changeId}
```

---

## MCP Tool Examples

```typescript
// Export Tool
{
  name: 'sharedo_export',
  description: 'Export ShareDo configurations',
  inputSchema: {
    type: 'object',
    properties: {
      type: { enum: ['worktype', 'workflow', 'form'] },
      name: { type: 'string' },
      environment: { type: 'string' },
      includeDependencies: { type: 'boolean' }
    }
  }
}

// Workflow Execution Tool
{
  name: 'sharedo_workflow_execute',
  description: 'Execute ShareDo workflow',
  inputSchema: {
    type: 'object',
    properties: {
      workflow: { type: 'string' },
      parameters: { type: 'object' },
      environment: { type: 'string' }
    }
  }
}

// HLD Generation Tool
{
  name: 'sharedo_hld_generate',
  description: 'Generate HLD documentation',
  inputSchema: {
    type: 'object',
    properties: {
      workType: { type: 'string' },
      template: { enum: ['business-analyst', 'system-admin', 'trainer'] },
      format: { enum: ['docx', 'pdf', 'markdown'] }
    }
  }
}
```

---

## Error Handling

All APIs follow standard HTTP status codes:
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **429** - Rate Limited
- **500** - Internal Server Error

Error Response Format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## Rate Limiting

- Production: 100 requests/minute per client
- Non-Production: 500 requests/minute per client
- Export Jobs: 10 concurrent jobs
- Bulk Operations: 5 concurrent operations

---

## Security Considerations

1. **Authentication**: All APIs require Bearer token authentication
2. **Token Refresh**: Tokens expire after 600 seconds
3. **Impersonation**: Requires explicit configuration
4. **Audit Logging**: All modifications are logged
5. **Rate Limiting**: Prevents API abuse
6. **CORS**: Configured for web-based access

---

## Conclusion

This comprehensive API catalog provides the foundation for implementing robust CLI and MCP integration with ShareDo. The APIs cover all major functionality areas including work management, document generation, workflow execution, financial tracking, and system administration.

The phased implementation approach ensures core functionality is available quickly while building toward complete platform integration.