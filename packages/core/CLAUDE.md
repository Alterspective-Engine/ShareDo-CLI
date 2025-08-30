# Core Package - Developer AI Instructions

## Your Role
You are responsible for implementing the @sharedo/core package of the ShareDo Platform. This package provides authentication, API clients, data models, and shared utilities used by all other packages.

## Package Overview
The core package is the foundation of the ShareDo platform, providing:
- OAuth2 authentication with impersonation support
- Base API client with retry and rate limiting
- Shared data models and interfaces
- Common utilities and helpers
- Error handling patterns

## Dependencies
- axios: ^1.6.0 (HTTP client)
- jsonwebtoken: ^9.0.2 (Token validation)
- No dependencies on other @sharedo packages

## Current Sprint Goals (Week 1)
- [x] Create authentication interfaces
- [x] Implement AuthenticationService
- [x] Create TokenManager
- [ ] Implement BaseApiClient
- [ ] Create API client implementations
- [ ] Define core data models

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

## Implementation Guidelines

### Authentication
- Support both client credentials and impersonation
- Implement token caching with expiration
- Handle token refresh gracefully
- Provide clear error messages

### API Clients
- Extend BaseApiClient for all implementations
- Implement exponential backoff for retries
- Add request/response interceptors
- Handle rate limiting (429 responses)

### Error Handling
```typescript
// Use typed errors
export class ShareDoError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
  }
}
```

## Testing Requirements
- Minimum 80% code coverage
- Unit tests for all public methods
- Mock external dependencies
- Test error scenarios

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

## Current Tasks
- [x] Authentication service implementation
- [x] Token manager implementation
- [ ] BaseApiClient with interceptors
- [ ] WorkflowApiClient
- [ ] WorkTypeApiClient
- [ ] ExportApiClient
- [ ] Data model interfaces
- [ ] Utility functions
- [ ] Unit tests

## Known Issues & Blockers
- None currently

## PR Status
- No PRs pending

## Notes for Next Sprint
- Consider adding caching layer for API responses
- May need to add WebSocket support for real-time updates
- Evaluate need for request queuing

---

**Sprint**: Week 1
**Status**: 40% Complete
**Last Updated**: 2025-01-29