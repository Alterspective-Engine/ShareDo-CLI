# Business Logic - Developer AI Instructions

## Your Role
You are responsible for implementing the @sharedo/business package of the ShareDo Platform. This package contains all business logic that is shared between CLI, VS Code extension, and MCP server.

## Package Overview
The business package implements platform-agnostic business operations:
- Workflow management (download, upload, validate, compare)
- Export service (create, monitor, download packages)
- HLD generation from export packages
- Form builder operations
- Execution engine management
- Work type operations

## Dependencies
- @sharedo/core: ^1.0.0 (authentication, API clients, models)
- @sharedo/platform-adapter: ^1.0.0 (platform abstraction)

## Current Sprint Goals (Week 3)
- [ ] Implement WorkflowManager
- [ ] Create WorkflowValidator
- [ ] Build WorkflowComparator
- [ ] Implement ExportManager
- [ ] Create PackageExtractor

## Implementation Requirements

### All Classes Must:
1. Accept IPlatform in constructor
2. Use @sharedo/core API clients
3. Handle errors gracefully
4. Provide progress updates
5. Support cancellation

### Example Pattern:
```typescript
import { IPlatform } from '@sharedo/platform-adapter';
import { WorkflowApiClient } from '@sharedo/core';

export class WorkflowManager {
  constructor(
    private platform: IPlatform,
    private apiClient: WorkflowApiClient
  ) {}

  async downloadWorkflow(name: string): Promise<void> {
    const progress = this.platform.ui.showProgress('Downloading...');
    try {
      // Implementation using apiClient
      progress.report({ message: 'Fetching...' });
      const workflow = await this.apiClient.get(name);
      
      // Use platform for file operations
      const path = await this.platform.ui.selectFolder();
      await this.platform.fs.writeFile(path, JSON.stringify(workflow));
      
      progress.complete();
    } catch (error) {
      progress.error(error);
      throw error;
    }
  }
}
```

## File Structure
```
packages/business/
├── src/
│   ├── workflow/
│   │   ├── workflow.manager.ts
│   │   ├── workflow.validator.ts
│   │   ├── workflow.comparator.ts
│   │   └── workflow.templates.ts
│   ├── export/
│   │   ├── export.manager.ts
│   │   ├── export.monitor.ts
│   │   └── package.extractor.ts
│   ├── hld/
│   │   ├── hld.generator.ts
│   │   ├── diagram.generator.ts
│   │   └── document.builder.ts
│   ├── forms/
│   │   ├── form.manager.ts
│   │   └── form.validator.ts
│   ├── execution/
│   │   └── execution.manager.ts
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Business Logic Specifications

### Workflow Manager
- Download workflows from server
- Upload workflows with validation
- Batch operations support
- Conflict detection on upload
- Template-based creation

### Export Manager
- Create export configurations
- Monitor long-running export jobs
- Download completed packages
- Extract package contents
- Handle partial failures

### HLD Generator
- Parse export packages
- Generate Word documents
- Create diagrams
- Support multiple templates
- Configurable output formats

## Testing Requirements
- 80% code coverage minimum
- Mock IPlatform for all tests
- Mock API clients
- Test error scenarios
- Test cancellation

## Git Workflow Requirements

### IMPORTANT: Follow Git Best Practices
See `/GIT_BEST_PRACTICES.md` for full details. Key requirements:

1. **Create feature branch before starting work**:
   ```bash
   git checkout -b feature/business-<manager>
   ```

2. **Commit each manager separately**:
   ```bash
   git commit -m "feat(business): implement WorkflowManager with validation"
   git commit -m "feat(business): add ExportManager with progress tracking"
   ```

3. **Include tests with implementation**:
   ```bash
   git add src/workflow/workflow.manager.ts
   git commit -m "feat(business): implement WorkflowManager"
   git add tests/workflow/workflow.manager.test.ts
   git commit -m "test(business): add WorkflowManager unit tests"
   ```

### Your Git Workflow
```bash
# Start of session
git checkout main
git pull origin main
git checkout -b feature/business-workflow-manager

# After implementing a manager
git add packages/business/src/workflow/workflow.manager.ts
git commit -m "feat(business): implement WorkflowManager with download/upload"

# After adding tests
git add packages/business/tests/workflow/workflow.manager.test.ts
git commit -m "test(business): add WorkflowManager integration tests"

# End of session
git push origin feature/business-workflow-manager
```

## Communication with Architect
- Request new interfaces in platform-adapter
- Report API client needs to core package
- Coordinate with CLI/VS Code on requirements
- Submit PRs for review

## Current Tasks
- [ ] WorkflowManager class
- [ ] WorkflowValidator with schema validation
- [ ] WorkflowComparator with diff generation
- [ ] ExportManager with job monitoring
- [ ] PackageExtractor for ZIP files
- [ ] Unit tests for all classes
- [ ] Integration tests with mocked platform
- [ ] Documentation

## Design Patterns

### Error Handling
```typescript
export class BusinessError extends Error {
  constructor(
    message: string,
    public operation: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}
```

### Progress Reporting
```typescript
// Always provide detailed progress
progress.report({ 
  message: 'Processing step 3 of 10',
  increment: 10 
});
```

### Validation Pattern
```typescript
export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
}
```

## Known Requirements
- Workflow validation must check for circular dependencies
- Export jobs can take 5+ minutes, need polling
- HLD generation requires template management
- Form validation needs schema support

## PR Status
- No PRs pending

## Notes for Next Sprint
- Add caching layer for frequently accessed data
- Implement offline mode support
- Add bulk operations for all managers
- Consider streaming for large files

---

**Sprint**: Week 3
**Status**: Not Started
**Last Updated**: 2025-01-29