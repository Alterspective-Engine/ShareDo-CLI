# Business Package AI - Implementation Checklist

## 🎯 Priority Order

### Phase 1: Core Services (Days 1-2)
- [ ] WorkflowManager
  - [ ] downloadWorkflow(name) 
  - [ ] uploadWorkflow(workflow, options)
  - [ ] validateWorkflow(workflow)
  - [ ] compareWorkflows(w1, w2)
  - [ ] Tests with mocked IPlatform

- [ ] ExportManager  
  - [ ] createExport(config)
  - [ ] monitorExport(jobId) with polling
  - [ ] downloadPackage(packageId)
  - [ ] extractPackage(path)
  - [ ] Tests with progress tracking

### Phase 2: HLD Generation (Day 3)
- [ ] HLDGenerator
  - [ ] generateFromPackage(packagePath)
  - [ ] generateWithTemplate(packagePath, templateId)
  - [ ] createDiagrams(workflow)
  - [ ] Tests with sample packages

### Phase 3: Additional Services (Days 4-5)
- [ ] FormManager
  - [ ] CRUD operations for forms
  - [ ] Form validation

- [ ] TemplateManager
  - [ ] Template operations
  - [ ] Variable substitution

## 🔍 Key Requirements

### All Managers Must:
1. Accept `IPlatform` in constructor
2. Use API clients from `@sharedo/core`
3. Show progress via `platform.ui.showProgress()`
4. Handle errors with proper error types
5. Support cancellation tokens where applicable

### Example Pattern:
```typescript
export class WorkflowManager {
  constructor(
    private platform: IPlatform,
    private apiClient: WorkflowApiClient
  ) {}

  async downloadWorkflow(name: string): Promise<void> {
    const progress = this.platform.ui.showProgress('Downloading workflow...');
    try {
      progress.report({ message: 'Fetching from server...', percentage: 20 });
      const workflow = await this.apiClient.getWorkflow(name);
      
      progress.report({ message: 'Selecting save location...', percentage: 60 });
      const savePath = await this.platform.ui.selectFolder();
      if (!savePath) {
        progress.cancel();
        return;
      }
      
      progress.report({ message: 'Saving file...', percentage: 80 });
      const filePath = this.platform.fs.join(savePath, `${name}.json`);
      await this.platform.fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
      
      progress.complete();
      await this.platform.ui.showInfo(`Workflow saved to ${filePath}`);
    } catch (error) {
      progress.error(error as Error);
      throw error;
    }
  }
}
```

## 📋 Git Commits Expected

```bash
# After each manager
git commit -m "feat(business): implement WorkflowManager with download/upload"
git commit -m "test(business): add WorkflowManager unit tests"

git commit -m "feat(business): implement ExportManager with polling"  
git commit -m "test(business): add ExportManager integration tests"

git commit -m "feat(business): implement HLDGenerator"
git commit -m "test(business): add HLD generation tests"
```

## ⚠️ Common Pitfalls to Avoid

1. **Don't use console.log** - Use platform.ui.showOutput()
2. **Don't use fs directly** - Use platform.fs methods
3. **Don't hardcode paths** - Use platform.fs.join()
4. **Don't forget progress updates** - Users need feedback
5. **Don't skip error handling** - Wrap all async operations

## 🧪 Testing Requirements

Each manager needs:
- Unit tests with mocked platform and API clients
- Error scenario tests
- Cancellation tests
- Progress reporting tests

Example test:
```typescript
describe('WorkflowManager', () => {
  let manager: WorkflowManager;
  let mockPlatform: jest.Mocked<IPlatform>;
  let mockApiClient: jest.Mocked<WorkflowApiClient>;

  beforeEach(() => {
    mockPlatform = createMockPlatform();
    mockApiClient = createMockApiClient();
    manager = new WorkflowManager(mockPlatform, mockApiClient);
  });

  test('downloads workflow with progress', async () => {
    const mockProgress = createMockProgress();
    mockPlatform.ui.showProgress.mockReturnValue(mockProgress);
    mockApiClient.getWorkflow.mockResolvedValue(mockWorkflow);
    
    await manager.downloadWorkflow('test-workflow');
    
    expect(mockProgress.report).toHaveBeenCalledWith(
      expect.objectContaining({ percentage: 20 })
    );
    expect(mockProgress.complete).toHaveBeenCalled();
  });
});
```

## 📊 Success Metrics

- [ ] All managers implemented
- [ ] 80% test coverage
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Proper Git history with atomic commits
- [ ] Documentation comments on all public methods

---

**Monitor with**: `npm run build && npm test`
**Check coverage**: `npm run test:coverage`