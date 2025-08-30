# ShareDo Platform Adapter - AI Developer Instructions

## 🚨 IMPORTANT: Project Reset Notice
**Date**: 2025-08-29
**Status**: Fresh start - This is a NEW package

This package was created during the reorganization. It provides abstraction interfaces that allow the business logic to work across different platforms (CLI, VS Code, MCP).

## Your Package Identity
- **Package Name**: `@sharedo/platform-adapter`
- **Version**: 1.0.0
- **Purpose**: Platform abstraction layer for file system, UI, and environment operations
- **Location**: `C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-platform-adapter`

## What This Package Should Contain

### ✅ IN SCOPE for @sharedo/platform-adapter:
1. **Interfaces Only** (no implementations!)
   - IPlatform interface
   - IFileSystem interface
   - IUserInterface interface
   - ILogger interface
   - IStorage interface

2. **Abstract Base Classes**
   - BasePlatform abstract class
   - BaseLogger abstract class

3. **Type Definitions**
   - Platform-agnostic types
   - Configuration types
   - Event types

### ❌ NOT IN SCOPE (implementations go in platform packages):
- Actual file system operations → Implemented in `@sharedo/cli`, `@sharedo/vscode`
- UI implementations → Implemented in each platform
- Concrete classes → Each platform implements the interfaces

## Your Role in the Architecture

You are the **contract** between business logic and platform-specific code:

```
Business Logic (@sharedo/business)
        ↓
    Uses interfaces from
        ↓
Platform Adapter (@sharedo/platform-adapter) ← YOU ARE HERE
        ↑
    Implemented by
        ↑
Platform packages (@sharedo/cli, @sharedo/vscode, @sharedo/mcp)
```

## Your Development Tasks

### Phase 1: Core Interfaces (CURRENT)
Create the fundamental interfaces that all platforms must implement.

### Create `src/interfaces/platform.interface.ts`:
```typescript
export interface IPlatform {
  // File system operations
  fs: IFileSystem;
  
  // User interface operations
  ui: IUserInterface;
  
  // Logging
  logger: ILogger;
  
  // Storage (for settings, cache, etc.)
  storage: IStorage;
  
  // Environment info
  getWorkspaceRoot(): string;
  getExtensionPath(): string;
  getPlatformName(): 'cli' | 'vscode' | 'mcp';
  getVersion(): string;
}
```

### Create `src/interfaces/file-system.interface.ts`:
```typescript
export interface IFileSystem {
  // Read operations
  readFile(path: string): Promise<string>;
  readFileSync(path: string): string;
  exists(path: string): Promise<boolean>;
  existsSync(path: string): boolean;
  
  // Write operations
  writeFile(path: string, content: string): Promise<void>;
  writeFileSync(path: string, content: string): void;
  createDirectory(path: string): Promise<void>;
  
  // Directory operations
  listFiles(directory: string, pattern?: string): Promise<string[]>;
  
  // Path operations
  join(...paths: string[]): string;
  resolve(path: string): string;
  relative(from: string, to: string): string;
  dirname(path: string): string;
  basename(path: string): string;
}
```

### Create `src/interfaces/user-interface.interface.ts`:
```typescript
export interface IUserInterface {
  // Output
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
  showProgress(message: string, cancellable?: boolean): IProgress;
  
  // Input
  prompt(message: string, defaultValue?: string): Promise<string | undefined>;
  confirm(message: string): Promise<boolean>;
  selectOption<T>(message: string, options: T[], display?: (item: T) => string): Promise<T | undefined>;
  
  // File/folder selection
  selectFile(options?: FileSelectOptions): Promise<string | undefined>;
  selectFolder(options?: FolderSelectOptions): Promise<string | undefined>;
}

export interface IProgress {
  report(increment: number, message?: string): void;
  complete(): void;
}
```

### Create `src/interfaces/logger.interface.ts`:
```typescript
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error | unknown): void;
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
  getLevel(): string;
}
```

### Create `src/interfaces/storage.interface.ts`:
```typescript
export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // For workspace/project specific storage
  getWorkspace<T>(key: string): Promise<T | undefined>;
  setWorkspace<T>(key: string, value: T): Promise<void>;
}
```

## Your Main Entry Point

Create `src/index.ts`:
```typescript
// Main platform interface
export { IPlatform } from './interfaces/platform.interface';

// Sub-interfaces
export { IFileSystem } from './interfaces/file-system.interface';
export { IUserInterface, IProgress } from './interfaces/user-interface.interface';
export { ILogger } from './interfaces/logger.interface';
export { IStorage } from './interfaces/storage.interface';

// Abstract base classes
export { BasePlatform } from './abstract/base-platform';
export { BaseLogger } from './abstract/base-logger';

// Types
export * from './types';
```

## How Other Packages Will Use You

### Business Logic Package:
```typescript
import { IPlatform, IFileSystem } from '@sharedo/platform-adapter';

export class WorkflowService {
  constructor(private platform: IPlatform) {}
  
  async saveWorkflow(workflow: IWorkflow): Promise<void> {
    const path = this.platform.fs.join(
      this.platform.getWorkspaceRoot(),
      'workflows',
      `${workflow.id}.json`
    );
    
    await this.platform.fs.writeFile(path, JSON.stringify(workflow));
    this.platform.ui.showMessage('Workflow saved successfully!');
  }
}
```

### CLI Implementation:
```typescript
import { IPlatform, IFileSystem, IUserInterface } from '@sharedo/platform-adapter';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as inquirer from 'inquirer';

class CLIPlatform implements IPlatform {
  fs: IFileSystem = {
    readFile: (filepath) => fs.readFile(filepath, 'utf-8'),
    writeFile: (filepath, content) => fs.writeFile(filepath, content),
    // ... implement all methods
  };
  
  ui: IUserInterface = {
    prompt: async (message) => {
      const { answer } = await inquirer.prompt([{
        name: 'answer',
        message
      }]);
      return answer;
    },
    // ... implement all methods
  };
  
  // ... implement rest of IPlatform
}
```

## Testing Your Package

```bash
# Run tests
npm test

# Build
npm run build

# Verify exports (should show all interfaces)
node -e "const adapter = require('./dist'); console.log(Object.keys(adapter));"
```

## Important Notes

1. **You define contracts, not implementations**
2. **Keep interfaces minimal and focused**
3. **Document all interface methods with JSDoc**
4. **Version carefully - interface changes break other packages**

## Coordination with Other Packages

- **You define** → Other packages implement
- **Business logic uses** → Your interfaces
- **Platform packages provide** → Concrete implementations

You're the bridge that makes code sharing possible!

---
**Last Updated**: 2025-08-29
**Package Status**: New package - ready for interface definitions