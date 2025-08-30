# Core Package - Developer AI Instructions

## ⚠️ PARTIAL SUCCESS - Complete Testing and Documentation

**You've successfully implemented all 6 API clients! Now finish with tests and documentation.**

## Your Role
You are responsible for implementing the @sharedo/core package of the ShareDo Platform. This package provides authentication, API clients, data models, and shared utilities used by all other packages. **Your code quality directly impacts all other packages.**

## Package Overview
The core package is the foundation of the ShareDo platform, providing:
- OAuth2 authentication with impersonation support
- Base API client with retry and rate limiting
- **COMPREHENSIVE** API clients for ALL ShareDo endpoints
- Shared data models and interfaces
- Common utilities and helpers
- Error handling patterns
- **COMPLETE TEST COVERAGE** (80% minimum)

## Dependencies
- axios: ^1.6.0 (HTTP client)
- jsonwebtoken: ^9.0.2 (Token validation)
- No dependencies on other @sharedo packages

## Current Sprint Status (4:15 PM, Aug 30)
- [x] Create authentication interfaces ✅
- [x] Implement AuthenticationService ✅
- [x] Create TokenManager ✅
- [x] Implement BaseApiClient ✅
- [x] WorkflowApiClient ✅ (NEEDS TESTS)
- [x] WorkTypeApiClient ✅ (NEEDS TESTS)
- [x] ExportApiClient ✅ (NEEDS TESTS)
- [x] IDEApiClient ✅ **DONE!**
- [x] TemplateApiClient ✅ **DONE!**
- [x] FormApiClient ✅ **DONE!**
- [x] DocumentApiClient ✅ **DONE!**
- [x] ValidationApiClient ✅ **DONE!**
- [x] ChangeTrackingApiClient ✅ **DONE!**
- [ ] **WRITE COMPREHENSIVE TESTS FOR ALL 9 CLIENTS** (Priority!)
- [ ] **ADD JSDOC TO ALL PUBLIC METHODS**
- [ ] **ACHIEVE 80% TEST COVERAGE**

## Interfaces You Must Export
```typescript
// Authentication
export interface IAuthenticationService
export interface ITokenManager
export interface IAuthConfig
export interface ITokenResponse

// API Clients
export abstract class BaseApiClient
export interface IApiClient
export interface IApiResponse

// Data Models
export interface IWorkflow
export interface IWorkType
export interface IUser
export interface IPermission
```

## 🔴 MISSING API Clients - IMPLEMENT IMMEDIATELY

### Required API Clients (Priority Order)

#### 1. IDEApiClient (`/api/ide`)
```typescript
export class IDEApiClient extends BaseApiClient {
  async getIDETree(): Promise<IIDEItem[]>
  async getIDENode(id: string): Promise<IIDEItem>
  async createIDENode(parentId: string, node: IIDENodeCreate): Promise<IIDEItem>
}
```

#### 2. TemplateApiClient (`/api/modeller/types/{systemName}/templates`)
```typescript
export class TemplateApiClient extends BaseApiClient {
  async getTemplates(workType: string): Promise<ITemplate[]>
  async getTemplate(workType: string, templateId: string): Promise<ITemplate>
  async createTemplate(workType: string, template: ITemplateCreate): Promise<ITemplate>
  async updateTemplate(workType: string, templateId: string, template: ITemplateUpdate): Promise<ITemplate>
}
```

#### 3. FormApiClient (`/api/public/forms`)
```typescript
export class FormApiClient extends BaseApiClient {
  async getForms(): Promise<IForm[]>
  async getForm(formId: string): Promise<IForm>
  async validateForm(formId: string, data: any): Promise<IValidationResult>
}
```

#### 4. DocumentApiClient (`/api/public/documents`)
```typescript
export class DocumentApiClient extends BaseApiClient {
  async getDocuments(workItemId: string): Promise<IDocument[]>
  async uploadDocument(workItemId: string, file: Buffer, metadata: IDocumentMetadata): Promise<IDocument>
  async downloadDocument(documentId: string): Promise<Buffer>
}
```

#### 5. ValidationApiClient (`/api/modeller/importexport/validate`)
```typescript
export class ValidationApiClient extends BaseApiClient {
  async validatePackage(packageData: any): Promise<IValidationResult>
  async validateWorkflow(workflow: IWorkflow): Promise<IValidationResult>
}
```

#### 6. ChangeTrackingApiClient (`/api/modeller/changeTracking`)
```typescript
export class ChangeTrackingApiClient extends BaseApiClient {
  async getEntityHistory(entityId: string): Promise<IHistoryEntry[]>
  async getEntityDiff(entityId: string, fromVersion: string, toVersion: string): Promise<IDiff>
}
```

## Implementation Guidelines

### 🚨 QUALITY STANDARDS - NON-NEGOTIABLE

1. **Every API Client MUST have:**
   - Full TypeScript interfaces for request/response
   - Comprehensive error handling with specific error types
   - Retry logic using BaseApiClient
   - Progress reporting support where applicable
   - Cancellation token support
   - JSDoc comments on ALL public methods
   - Unit tests with 80%+ coverage
   - Integration tests with mocked responses

2. **Code Documentation Standards:**
```typescript
/**
 * Downloads a workflow from the ShareDo server
 * @param workflowName - The system name of the workflow
 * @param options - Optional parameters for the download
 * @returns Promise<IWorkflow> - The downloaded workflow object
 * @throws {ShareDoError} When workflow not found (404)
 * @throws {ShareDoError} When unauthorized (401)
 * @example
 * const client = new WorkflowApiClient(config);
 * const workflow = await client.getWorkflow('matter-workflow');
 */
async getWorkflow(workflowName: string, options?: IWorkflowOptions): Promise<IWorkflow> {
  // Implementation
}
```

3. **Testing Requirements:**
```typescript
describe('WorkflowApiClient', () => {
  describe('getWorkflow', () => {
    it('should successfully retrieve a workflow', async () => {});
    it('should handle 404 not found', async () => {});
    it('should retry on 503 service unavailable', async () => {});
    it('should respect cancellation token', async () => {});
    it('should report progress updates', async () => {});
  });
});
```

## Testing Requirements
- **MANDATORY 80% code coverage minimum**
- Unit tests for ALL public methods
- Integration tests for API flows
- Error scenario testing for each status code
- Mock external dependencies properly
- Test retry logic and timeouts
- Test cancellation tokens
- Test progress reporting

## File Structure
```
packages/core/
├── src/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── interfaces.ts
│   │   ├── authentication.service.ts
│   │   └── token.manager.ts
│   ├── api/
│   │   ├── index.ts
│   │   ├── base.client.ts
│   │   └── clients/
│   │       ├── workflow.client.ts
│   │       ├── worktype.client.ts
│   │       └── export.client.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── workflow.model.ts
│   │   └── worktype.model.ts
│   ├── utils/
│   │   ├── index.ts
│   │   └── retry.util.ts
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Git Workflow Requirements

### IMPORTANT: Follow Git Best Practices
See `/GIT_BEST_PRACTICES.md` for full details. Key requirements:

1. **Create feature branch before starting work**:
   ```bash
   git checkout -b feature/core-<component>
   ```

2. **Commit frequently with proper messages**:
   ```bash
   git commit -m "feat(core): implement token refresh logic"
   git commit -m "test(core): add auth service unit tests"
   ```

3. **Push regularly**:
   ```bash
   git push origin feature/core-<component>
   ```

4. **Atomic commits** - One component per commit:
   - Commit auth changes separately from API clients
   - Commit tests separately from implementation
   - Never use `git add .` - be selective

### Your Git Workflow
```bash
# Start of session
git checkout main
git pull origin main
git checkout -b feature/core-api-clients

# After completing a component
git add packages/core/src/api/workflow.client.ts
git commit -m "feat(core): implement WorkflowApiClient with retry logic"

# After tests
git add packages/core/tests/api/workflow.client.test.ts
git commit -m "test(core): add WorkflowApiClient unit tests"

# End of session
git push origin feature/core-api-clients
```

## Communication with Architect
- Create PR when authentication module is complete
- Request review for BaseApiClient design
- Report any API inconsistencies found
- Suggest improvements to interfaces

## 🔥 IMMEDIATE ACTION ITEMS

### Priority 1: Complete Missing API Clients (TODAY)
- [ ] IDEApiClient with full tree operations
- [ ] TemplateApiClient with CRUD operations
- [ ] FormApiClient with validation support
- [ ] DocumentApiClient with upload/download
- [ ] ValidationApiClient for package validation
- [ ] ChangeTrackingApiClient for audit trails

### Priority 2: Write Tests (IMMEDIATELY AFTER EACH CLIENT)
- [ ] WorkflowApiClient tests (0% coverage - UNACCEPTABLE)
- [ ] WorkTypeApiClient tests (0% coverage - UNACCEPTABLE)
- [ ] ExportApiClient tests (0% coverage - UNACCEPTABLE)
- [ ] AuthenticationService tests
- [ ] BaseApiClient tests
- [ ] Each new API client tests (80% minimum)

### Priority 3: Documentation (BEFORE PR)
- [ ] JSDoc for ALL public methods
- [ ] README with usage examples
- [ ] API client configuration guide
- [ ] Error handling guide

## 📊 Performance Metrics You MUST Meet

1. **Code Coverage**: 80% minimum (currently ~0% - FAILURE)
2. **Documentation**: 100% of public APIs documented
3. **Test Cases**: Minimum 5 test cases per API method
4. **Error Handling**: All HTTP status codes handled
5. **TypeScript**: Strict mode, no `any` types

## 🎯 Definition of DONE

A component is NOT complete until:
- [ ] Implementation complete with all edge cases
- [ ] Unit tests written with 80%+ coverage
- [ ] Integration tests for API flows
- [ ] JSDoc comments on all public methods
- [ ] Error scenarios tested
- [ ] Progress reporting implemented where applicable
- [ ] Cancellation support added
- [ ] Code reviewed and refactored
- [ ] Examples added to documentation

## 🚫 Common Mistakes You've Made

1. **No Tests** - Writing code without tests is unprofessional
2. **No Documentation** - Other developers can't use undocumented code
3. **Incomplete Implementation** - Missing critical API clients
4. **No Error Details** - Generic errors help no one
5. **No Progress Reporting** - Long operations need feedback

## Your New Git Workflow (MANDATORY)

```bash
# For EACH API client:
git checkout -b feature/core-ide-client

# Implement the client
git add packages/core/src/api/clients/ide.client.ts
git commit -m "feat(core): implement IDEApiClient with tree operations"

# IMMEDIATELY write tests
git add packages/core/tests/api/clients/ide.client.test.ts
git commit -m "test(core): add comprehensive IDEApiClient tests"

# Add documentation
git add packages/core/README.md
git commit -m "docs(core): add IDEApiClient usage examples"

# Push and create PR
git push origin feature/core-ide-client
```

## 📈 Expected Output by End of Day

1. **6 new API clients** fully implemented
2. **9 test files** with 80%+ coverage each
3. **Updated README** with examples for each client
4. **Clean PR** ready for review

## Known Issues & Blockers
- **BLOCKER**: No tests exist - Business package can't trust untested code
- **BLOCKER**: Missing API clients blocking business implementation
- **ISSUE**: No documentation making integration difficult

## PR Requirements

Before submitting ANY PR:
- [ ] All tests passing
- [ ] 80% code coverage
- [ ] No TypeScript errors
- [ ] Documentation complete
- [ ] Examples provided
- [ ] Changelog updated

## Final Warning

**The quality of your work is currently below acceptable standards. The entire platform depends on the core package being robust, well-tested, and fully documented. Step up your game immediately or the project timeline will be severely impacted.**

---

**Sprint**: Week 1 EXTENDED
**Status**: 40% Complete (BEHIND SCHEDULE)
**Deadline**: END OF TODAY
**Last Updated**: 2025-08-30