# Platform Adapter - Developer AI Instructions

## Your Role
You are responsible for implementing the @sharedo/platform-adapter package of the ShareDo Platform. This package defines the abstraction layer that allows business logic to work across CLI, VS Code, and MCP server environments.

## Package Overview
The platform adapter provides interfaces that abstract platform-specific operations:
- User interface operations (prompts, messages, selections)
- File system operations
- Configuration management
- Secret storage
- Process execution
- Progress reporting

## Dependencies
- No external dependencies
- No dependencies on other @sharedo packages
- Pure TypeScript interfaces and types

## Current Sprint Goals (Week 1)
- [ ] Define IPlatform interface
- [ ] Create UI operation interfaces
- [ ] Define file system interfaces
- [ ] Create configuration interfaces
- [ ] Define secret storage interfaces

## Interfaces You Must Define
```typescript
// Main platform interface
export interface IPlatform {
  ui: IUserInterface;
  fs: IFileSystem;
  config: IConfiguration;
  secrets: ISecretStorage;
  process: IProcessManager;
}

// UI Operations
export interface IUserInterface {
  showMessage(message: string, type?: MessageType): void;
  showProgress(title: string): IProgressReporter;
  prompt(message: string, options?: IPromptOptions): Promise<string | undefined>;
  selectFile(options?: IFileSelectOptions): Promise<string | undefined>;
  selectFolder(options?: IFolderSelectOptions): Promise<string | undefined>;
  showQuickPick<T>(items: T[], options?: IQuickPickOptions): Promise<T | undefined>;
}

// File System
export interface IFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  list(path: string): Promise<IFileInfo[]>;
}

// Configuration
export interface IConfiguration {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): Promise<void>;
  has(key: string): boolean;
  delete(key: string): Promise<void>;
}

// Secret Storage
export interface ISecretStorage {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}
```

## Design Principles

### 1. Platform Agnostic
- No platform-specific types in interfaces
- Use generic types where possible
- Avoid assumptions about implementation

### 2. Async by Default
- All I/O operations return Promises
- Support cancellation tokens where appropriate
- Handle errors consistently

### 3. Extensibility
- Use optional parameters for future additions
- Design interfaces to be composable
- Allow for platform-specific extensions

## File Structure
```
packages/platform-adapter/
├── src/
│   ├── interfaces/
│   │   ├── platform.interface.ts
│   │   ├── ui.interface.ts
│   │   ├── filesystem.interface.ts
│   │   ├── configuration.interface.ts
│   │   ├── secrets.interface.ts
│   │   └── process.interface.ts
│   ├── types/
│   │   ├── ui.types.ts
│   │   └── filesystem.types.ts
│   ├── errors/
│   │   └── platform.errors.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Testing Requirements
- Since this package only contains interfaces, focus on:
  - TypeScript compilation tests
  - Interface documentation
  - Usage examples

## Git Workflow Requirements

### IMPORTANT: Follow Git Best Practices
See `/GIT_BEST_PRACTICES.md` for full details. Key requirements:

1. **Create feature branch for interface groups**:
   ```bash
   git checkout -b feature/platform-adapter-interfaces
   ```

2. **Commit interface groups separately**:
   ```bash
   git commit -m "feat(platform-adapter): define IFileSystem interface"
   git commit -m "feat(platform-adapter): add IUserInterface with UI operations"
   ```

3. **Document breaking changes**:
   ```bash
   git commit -m "refactor(platform-adapter): simplify IConfiguration interface
   
   BREAKING CHANGE: Removed async from get() method as config
   should be cached locally for performance"
   ```

### Your Git Workflow
```bash
# Start of session
git checkout main
git pull origin main
git checkout -b feature/platform-adapter-enhanced-interfaces

# After defining interfaces
git add packages/platform-adapter/src/interfaces/filesystem.interface.ts
git commit -m "feat(platform-adapter): add file watching to IFileSystem"

# End of session
git push origin feature/platform-adapter-enhanced-interfaces
```

## Communication with Architect
- Request review for interface design
- Coordinate with other packages on interface needs
- Document any platform limitations discovered

## Current Tasks
- [ ] IPlatform main interface
- [ ] IUserInterface with all UI operations
- [ ] IFileSystem with file operations
- [ ] IConfiguration for settings
- [ ] ISecretStorage for credentials
- [ ] IProcessManager for external commands
- [ ] Type definitions for all options
- [ ] Error type definitions
- [ ] Documentation and examples

## Design Decisions

### Progress Reporting
```typescript
export interface IProgressReporter {
  report(progress: { message?: string; increment?: number }): void;
  complete(): void;
  error(error: Error): void;
}
```

### Cancellation Support
```typescript
export interface ICancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: (listener: () => void) => void;
}
```

## Known Limitations
- File watching may not be available on all platforms
- Secret storage implementation varies significantly
- Some UI operations may degrade on certain platforms

## PR Status
- No PRs pending

## Notes for Implementation Packages
- CLI will use inquirer for prompts, keytar for secrets
- VS Code will use native APIs for all operations
- MCP will have limited UI capabilities

---

**Sprint**: Week 1
**Status**: 20% Complete
**Last Updated**: 2025-01-29