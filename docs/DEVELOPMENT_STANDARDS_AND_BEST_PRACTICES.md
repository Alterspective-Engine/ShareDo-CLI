# Development Standards and Best Practices

## 1. Coding Standards

### TypeScript Guidelines
```typescript
// ✅ GOOD: Clear, self-documenting code
export class WorkflowManager {
  private readonly apiClient: WorkflowApiClient;
  private readonly platform: IPlatform;
  
  constructor(apiClient: WorkflowApiClient, platform: IPlatform) {
    this.apiClient = apiClient;
    this.platform = platform;
  }
}

// ❌ BAD: Unclear variable names, no types
export class WfMgr {
  private ac: any;
  private p: any;
  
  constructor(ac, p) {
    this.ac = ac;
    this.p = p;
  }
}
```

### Naming Conventions
- **Classes**: PascalCase (`WorkflowManager`)
- **Interfaces**: Prefix with 'I' (`IWorkflow`)
- **Methods/Functions**: camelCase (`downloadWorkflow`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Private members**: Prefix with underscore (`private _cache`)
- **Files**: kebab-case (`workflow-manager.ts`)

### Code Organization
```typescript
// Order of file contents:
// 1. Imports (external, then internal)
import axios from 'axios';
import { IWorkflow } from '@sharedo/core';

// 2. Constants
const MAX_RETRIES = 3;

// 3. Interfaces/Types
interface ILocalConfig {
  // ...
}

// 4. Main class/function
export class MainClass {
  // Order within class:
  // 1. Static members
  // 2. Private fields
  // 3. Constructor
  // 4. Public methods
  // 5. Private methods
}

// 5. Helper functions
function helperFunction() {
  // ...
}
```

## 2. Commenting Standards

### Documentation Comments
```typescript
/**
 * Downloads a workflow from the ShareDo server
 * 
 * @param workflowId - The unique identifier of the workflow
 * @param options - Optional configuration for the download
 * @returns Promise resolving to the downloaded workflow
 * @throws {NetworkError} When the server is unreachable
 * @throws {AuthenticationError} When credentials are invalid
 * 
 * @example
 * ```typescript
 * const workflow = await manager.downloadWorkflow('wf-123', {
 *   includeHistory: true,
 *   format: 'json'
 * });
 * ```
 */
export async function downloadWorkflow(
  workflowId: string,
  options?: IDownloadOptions
): Promise<IWorkflow> {
  // Implementation
}
```

### Inline Comments
```typescript
// ✅ GOOD: Explains WHY, not WHAT
// Retry with exponential backoff to avoid overwhelming the server
await retry(operation, { 
  attempts: 3,
  delay: (attempt) => Math.pow(2, attempt) * 1000
});

// ❌ BAD: States the obvious
// Set name to John
const name = 'John';
```

### TODO Comments
```typescript
// TODO: [PRIORITY-HIGH] Implement caching by 2025-02-15 (Issue #123)
// TODO: [PRIORITY-LOW] Consider adding telemetry
// FIXME: Handle edge case when server returns 429
// HACK: Temporary workaround for API bug, remove after v2.1
```

## 3. Git & GitHub Practices

### Branch Naming
```bash
# Feature branches
feature/add-workflow-validation
feature/cli-export-command

# Bug fixes
fix/authentication-timeout
fix/workflow-circular-dependency

# Hotfixes
hotfix/critical-security-patch

# Release branches
release/v1.2.0
```

### Commit Messages
```bash
# Format: <type>(<scope>): <subject>
# Types: feat, fix, docs, style, refactor, test, chore

# ✅ GOOD Examples:
feat(cli): add workflow validation command
fix(auth): handle token expiration correctly
docs(api): update authentication examples
refactor(export): simplify package extraction logic
test(workflow): add unit tests for validator

# ❌ BAD Examples:
fixed stuff
update
WIP
changes
```

### Pull Request Template
```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make atomic commits
git add -p  # Stage specific chunks
git commit -m "feat(core): add specific feature"

# 3. Keep branch updated
git fetch origin
git rebase origin/main

# 4. Push and create PR
git push origin feature/new-feature

# 5. After PR approval and merge
git checkout main
git pull origin main
git branch -d feature/new-feature
```

## 4. User Experience & Feedback

### Progress Indicators

```typescript
// CLI: Use emoji and colors for visual feedback
import chalk from 'chalk';
import ora from 'ora';

export class ProgressReporter {
  showSuccess(message: string) {
    console.log(chalk.green('✅'), chalk.bold(message));
  }

  showError(message: string) {
    console.log(chalk.red('❌'), chalk.bold(message));
  }

  showWarning(message: string) {
    console.log(chalk.yellow('⚠️'), chalk.bold(message));
  }

  showInfo(message: string) {
    console.log(chalk.blue('ℹ️'), message);
  }

  async showProgress<T>(
    message: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const spinner = ora({
      text: message,
      spinner: 'dots'
    }).start();

    try {
      const result = await operation();
      spinner.succeed(chalk.green(message + ' - Complete!'));
      return result;
    } catch (error) {
      spinner.fail(chalk.red(message + ' - Failed!'));
      throw error;
    }
  }
}
```

### Interactive Feedback
```typescript
// Provide real-time feedback with progress bars
import cliProgress from 'cli-progress';

export async function downloadWithProgress(items: any[]) {
  const progressBar = new cliProgress.SingleBar({
    format: '📦 Downloading |{bar}| {percentage}% | {value}/{total} Files | ETA: {eta}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  progressBar.start(items.length, 0);

  for (let i = 0; i < items.length; i++) {
    await downloadItem(items[i]);
    progressBar.update(i + 1);
  }

  progressBar.stop();
  console.log(chalk.green('✨ All downloads complete!'));
}
```

### Status Messages with Context
```typescript
export class StatusReporter {
  private startTime: number;

  start(operation: string) {
    this.startTime = Date.now();
    console.log(chalk.cyan('🚀 Starting:'), operation);
  }

  update(status: string, details?: string) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(
      chalk.gray(`[${elapsed}s]`),
      chalk.yellow('⏳'),
      status,
      details ? chalk.gray(`(${details})`) : ''
    );
  }

  complete(message: string) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(
      chalk.gray(`[${elapsed}s]`),
      chalk.green('✅'),
      chalk.bold(message)
    );
  }
}
```

## 5. Dangerous Operations & Confirmations

### Confirmation Prompts
```typescript
import inquirer from 'inquirer';
import chalk from 'chalk';

export class SafetyManager {
  async confirmDangerousOperation(
    operation: string,
    details: string[],
    consequences?: string[]
  ): Promise<boolean> {
    console.log(chalk.red.bold('\n⚠️  DANGEROUS OPERATION DETECTED ⚠️'));
    console.log(chalk.yellow('━'.repeat(50)));
    
    console.log(chalk.white.bold('\nYou are about to:'), chalk.red(operation));
    
    if (details.length > 0) {
      console.log(chalk.white.bold('\nThis will:'));
      details.forEach(detail => {
        console.log(chalk.yellow('  •'), detail);
      });
    }

    if (consequences && consequences.length > 0) {
      console.log(chalk.red.bold('\n⚠️  Potential consequences:'));
      consequences.forEach(consequence => {
        console.log(chalk.red('  ⚠'), consequence);
      });
    }

    console.log(chalk.yellow('━'.repeat(50)));

    // Require typing confirmation for extra dangerous operations
    if (this.isExtraDangerous(operation)) {
      const { confirmation } = await inquirer.prompt([
        {
          type: 'input',
          name: 'confirmation',
          message: chalk.red.bold(`Type "${operation}" to confirm:`),
          validate: (input) => {
            return input === operation || 'Please type the exact operation name';
          }
        }
      ]);
      return confirmation === operation;
    }

    // Standard yes/no for regular dangerous operations
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.yellow('Do you want to proceed?'),
        default: false
      }
    ]);

    return confirmed;
  }

  private isExtraDangerous(operation: string): boolean {
    const extraDangerous = [
      'delete all',
      'reset database',
      'remove credentials',
      'purge cache',
      'force deploy'
    ];
    return extraDangerous.some(op => operation.toLowerCase().includes(op));
  }

  async showDryRunResult(operation: string, changes: any[]) {
    console.log(chalk.blue.bold('\n🔍 DRY RUN RESULTS'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.white('Operation:'), operation);
    console.log(chalk.white('Changes that would be made:'));
    
    changes.forEach((change, index) => {
      console.log(chalk.gray(`  ${index + 1}.`), this.formatChange(change));
    });
    
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.green('✅ No actual changes were made (dry run mode)'));
  }

  private formatChange(change: any): string {
    if (change.type === 'create') {
      return chalk.green(`+ Create: ${change.path}`);
    } else if (change.type === 'update') {
      return chalk.yellow(`~ Update: ${change.path}`);
    } else if (change.type === 'delete') {
      return chalk.red(`- Delete: ${change.path}`);
    }
    return change.toString();
  }
}
```

### Undo/Rollback Support
```typescript
export class OperationManager {
  private undoStack: IUndoableOperation[] = [];

  async executeWithUndo<T>(
    operation: IUndoableOperation,
    autoRollbackOnError: boolean = true
  ): Promise<T> {
    console.log(chalk.cyan('📝 Recording operation for potential undo...'));
    
    try {
      const result = await operation.execute();
      this.undoStack.push(operation);
      
      console.log(
        chalk.green('✅ Operation completed.'),
        chalk.gray(`(undo available with: sharedo undo)`)
      );
      
      return result;
    } catch (error) {
      if (autoRollbackOnError) {
        console.log(chalk.yellow('⚠️  Operation failed, initiating rollback...'));
        await this.rollback(operation);
      }
      throw error;
    }
  }

  async undo(): Promise<void> {
    if (this.undoStack.length === 0) {
      console.log(chalk.gray('Nothing to undo'));
      return;
    }

    const operation = this.undoStack.pop()!;
    console.log(chalk.yellow('⏪ Undoing:'), operation.description);
    
    const spinner = ora('Rolling back changes...').start();
    try {
      await operation.undo();
      spinner.succeed('Rollback complete!');
    } catch (error) {
      spinner.fail('Rollback failed!');
      throw error;
    }
  }
}
```

## 6. Fun & Engaging UI Elements

### ASCII Art Headers
```typescript
export function showBanner() {
  console.log(chalk.cyan(figlet.textSync('ShareDo CLI', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })));
  
  console.log(chalk.gray('  Version:'), chalk.white(version));
  console.log(chalk.gray('  Ready to boost your workflow! 🚀\n'));
}
```

### Success Celebrations
```typescript
export function celebrate(achievement: string) {
  const celebrations = [
    '🎉 Awesome!',
    '🎊 Fantastic!',
    '✨ Brilliant!',
    '🌟 Outstanding!',
    '🏆 Champion!',
    '🎯 Nailed it!',
    '💪 Powerful!',
    '🔥 On fire!'
  ];
  
  const random = celebrations[Math.floor(Math.random() * celebrations.length)];
  
  console.log('\n' + chalk.rainbow('═'.repeat(50)));
  console.log(chalk.bold.green(`  ${random} ${achievement}`));
  console.log(chalk.rainbow('═'.repeat(50)) + '\n');
}
```

### Interactive Menus
```typescript
export async function showInteractiveMenu() {
  const choices = [
    { name: '🚀 Quick Start', value: 'quickstart' },
    { name: '📦 Manage Workflows', value: 'workflows' },
    { name: '📤 Export Operations', value: 'export' },
    { name: '👥 User Management', value: 'users' },
    { name: '⚙️  Settings', value: 'settings' },
    { name: '📚 Documentation', value: 'docs' },
    { name: '🚪 Exit', value: 'exit' }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
      pageSize: 10
    }
  ]);

  return action;
}
```

### Loading Animations
```typescript
const spinners = {
  dots: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  },
  earth: {
    interval: 180,
    frames: ['🌍', '🌎', '🌏']
  },
  moon: {
    interval: 80,
    frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
  },
  runner: {
    interval: 140,
    frames: ['🚶', '🏃']
  }
};

export function showCustomSpinner(message: string, type: keyof typeof spinners) {
  return ora({
    text: message,
    spinner: spinners[type]
  }).start();
}
```

## 7. Error Handling & Recovery

### User-Friendly Error Messages
```typescript
export class ErrorReporter {
  report(error: Error) {
    console.log(chalk.red.bold('\n❌ Oops! Something went wrong:\n'));
    
    // User-friendly message
    console.log(chalk.white(this.getUserFriendlyMessage(error)));
    
    // Suggestions for recovery
    const suggestions = this.getSuggestions(error);
    if (suggestions.length > 0) {
      console.log(chalk.yellow.bold('\n💡 Try these solutions:'));
      suggestions.forEach((suggestion, i) => {
        console.log(chalk.yellow(`  ${i + 1}.`), suggestion);
      });
    }
    
    // Error details for debugging
    if (process.env.DEBUG) {
      console.log(chalk.gray('\n📋 Technical details:'));
      console.log(chalk.gray(error.stack));
    } else {
      console.log(chalk.gray('\n💡 Run with DEBUG=true for more details'));
    }
    
    // Support information
    console.log(chalk.cyan('\n📧 Need help? Contact support@sharedo.com'));
  }

  private getUserFriendlyMessage(error: Error): string {
    const errorMap: Record<string, string> = {
      ECONNREFUSED: 'Cannot connect to the server. Is it running?',
      ENOTFOUND: 'Server not found. Please check the URL.',
      UNAUTHORIZED: 'Invalid credentials. Please login again.',
      ETIMEDOUT: 'Request timed out. Please check your internet connection.',
      EACCES: 'Permission denied. Try running with administrator privileges.',
    };

    return errorMap[error.name] || error.message;
  }

  private getSuggestions(error: Error): string[] {
    // Return contextual suggestions based on error type
    if (error.message.includes('ECONNREFUSED')) {
      return [
        'Check if the ShareDo server is running',
        'Verify the server URL in your configuration',
        'Check your firewall settings',
        'Try: sharedo config set server <url>'
      ];
    }
    // Add more suggestions...
    return [];
  }
}
```

## 8. Testing Standards

### Test Structure
```typescript
describe('WorkflowManager', () => {
  let manager: WorkflowManager;
  let mockPlatform: jest.Mocked<IPlatform>;
  let mockApiClient: jest.Mocked<WorkflowApiClient>;

  beforeEach(() => {
    // Setup
    mockPlatform = createMockPlatform();
    mockApiClient = createMockApiClient();
    manager = new WorkflowManager(mockPlatform, mockApiClient);
  });

  describe('downloadWorkflow', () => {
    it('should download workflow successfully', async () => {
      // Arrange
      const expectedWorkflow = { id: '123', name: 'Test' };
      mockApiClient.get.mockResolvedValue(expectedWorkflow);

      // Act
      const result = await manager.downloadWorkflow('123');

      // Assert
      expect(result).toEqual(expectedWorkflow);
      expect(mockApiClient.get).toHaveBeenCalledWith('123');
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(manager.downloadWorkflow('123'))
        .rejects
        .toThrow('Network error');
    });
  });
});
```

## 9. Performance Guidelines

### Optimization Rules
```typescript
// ✅ GOOD: Batch operations
const results = await Promise.all(
  items.map(item => processItem(item))
);

// ❌ BAD: Sequential operations
const results = [];
for (const item of items) {
  results.push(await processItem(item));
}

// ✅ GOOD: Lazy loading
import type { HeavyModule } from './heavy-module';
let heavyModule: typeof HeavyModule;

async function useHeavyFeature() {
  if (!heavyModule) {
    heavyModule = await import('./heavy-module');
  }
  return heavyModule.process();
}

// ✅ GOOD: Debouncing
const debouncedSave = debounce(saveFunction, 500);
```

## 10. Accessibility

### CLI Accessibility
```typescript
export class AccessibleCLI {
  // Support NO_COLOR environment variable
  private useColor = !process.env.NO_COLOR;

  // Provide text alternatives for emoji
  private getSymbol(type: 'success' | 'error' | 'warning') {
    if (process.env.NO_EMOJI) {
      return { success: '[OK]', error: '[ERROR]', warning: '[WARN]' }[type];
    }
    return { success: '✅', error: '❌', warning: '⚠️' }[type];
  }

  // Support screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (process.env.SCREEN_READER) {
      console.log(`[${priority.toUpperCase()}] ${message}`);
    } else {
      console.log(message);
    }
  }
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-29
**Review Schedule**: Quarterly