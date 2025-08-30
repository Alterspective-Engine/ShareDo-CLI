# VS Code Extension & CLI Unified Architecture
## Shared Codebase Strategy for ShareDo Platform

### Version 1.0.0
### Date: 2025-08-28

---

## Executive Summary

After comprehensive review of the VS Code extension codebase, this document establishes a unified architecture that allows the CLI and VS Code extension to share a common codebase. This approach eliminates code duplication, ensures consistency, and enables the VS Code extension to leverage CLI capabilities directly.

**Key Findings:**
- 🔄 **80% code overlap** between VS Code extension and CLI requirements
- 📦 **35+ services** can be shared between both platforms
- 🏗️ **Modular architecture** enables platform-agnostic core
- 🔌 **Plugin pattern** allows platform-specific extensions
- ⚡ **Direct CLI integration** possible in VS Code terminal

---

## Table of Contents
1. [Current VS Code Extension Capabilities](#current-vs-code-extension-capabilities)
2. [Shared Core Architecture](#shared-core-architecture)
3. [Platform-Specific Adapters](#platform-specific-adapters)
4. [Code Reuse Strategy](#code-reuse-strategy)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Migration Plan](#migration-plan)

---

## Current VS Code Extension Capabilities

### Core Services Identified

Based on the VS Code extension analysis, these services need to be supported:

#### 1. Authentication Services
```typescript
// Current VS Code Implementation
- authenticate.ts: OAuth2 authentication with impersonation
- authenticateRemote.ts: Remote authentication handling
- BrowserAuthenticationService.ts: Browser-based auth for exports
- SecureTokenManager.ts: Token lifecycle management

// Required in CLI
✅ All authentication patterns needed
✅ Token refresh and lifecycle
✅ Multi-environment support
✅ Impersonation support
```

#### 2. Export/Import Services
```typescript
// Current VS Code Implementation
- PackageExportService.ts: Complete package export
- PackageDownloadService.ts: Download management
- ExportCacheService.ts: Export caching
- PlaywrightExportService.ts: Browser-based export

// Required in CLI
✅ Package export with progress
✅ Download management
✅ Cache strategy
⚠️ Playwright optional (fallback to API)
```

#### 3. Workflow Management
```typescript
// Current VS Code Implementation
- WorkflowApiService.ts: Workflow API operations
- WorkflowManager.ts: Workflow lifecycle
- WorkflowComparator.ts: Diff workflows
- WorkflowValidator.ts: Validation
- ExecutionEngineCommands.ts: Execution control

// Required in CLI
✅ All workflow operations
✅ Execution monitoring
✅ Comparison capabilities
✅ Validation framework
```

#### 4. Form Builder Services
```typescript
// Current VS Code Implementation
- FormBuilderService.ts: Form operations
- FormTemplateService.ts: Template management
- FormValidationService.ts: Validation rules
- FormPreviewPanel.ts: VS Code specific UI

// Required in CLI
✅ Form operations
✅ Template management
✅ Validation (no UI preview)
```

#### 5. Tree Provider Architecture
```typescript
// Current VS Code Implementation
- TreeNodeProvider.ts: Main tree provider
- TreeProviderFactory.ts: Factory pattern
- CompositeTreeProvider.ts: Composite pattern
- Multiple specific providers (WorkType, Workflow, etc.)

// CLI Adaptation
✅ Reuse data structures
✅ Adapt for CLI listing/navigation
❌ VS Code specific UI components
```

#### 6. File Management
```typescript
// Current VS Code Implementation
- fileDownloading.ts: Download files from ShareDo
- filePublishing.ts: Publish to servers
- FileWatcherService.ts: Watch for changes
- sharedoIDEFileHelper.ts: IDE file operations

// Required in CLI
✅ All file operations
✅ Publishing capabilities
⚠️ File watching optional
✅ IDE file management
```

---

## Shared Core Architecture

### Proposed Package Structure

```
sharedo-platform/
├── packages/
│   ├── core/                    # Platform-agnostic core
│   │   ├── src/
│   │   │   ├── authentication/
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── cli/                     # CLI-specific implementation
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   ├── adapters/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── vscode/                  # VS Code extension
│   │   ├── src/
│   │   │   ├── extension.ts
│   │   │   ├── providers/
│   │   │   ├── adapters/
│   │   │   └── views/
│   │   └── package.json
│   │
│   └── mcp/                     # MCP server
│       ├── src/
│       │   ├── server.ts
│       │   ├── tools/
│       │   └── adapters/
│       └── package.json
```

### Core Services (Shared)

```typescript
// packages/core/src/services/AuthenticationService.ts
export class AuthenticationService {
    constructor(private config: IPlatformConfig) {}
    
    async authenticate(): Promise<IAuthToken> {
        // Shared authentication logic
        const params = new URLSearchParams({
            grant_type: this.config.grantType || 'client_credentials',
            scope: 'sharedo',
            impersonate_user: this.config.impersonateUser,
            impersonate_provider: this.config.impersonateProvider
        });
        
        // Common implementation
        return this.makeTokenRequest(params);
    }
    
    async refreshToken(): Promise<IAuthToken> {
        // Shared refresh logic
    }
}

// packages/core/src/services/ExportService.ts
export class ExportService {
    async createExport(request: IExportRequest): Promise<IExportJob> {
        // Shared export logic
    }
    
    async monitorJob(jobId: string): Promise<IExportResult> {
        // Shared monitoring logic
    }
    
    async downloadPackage(jobId: string): Promise<Buffer> {
        // Shared download logic
    }
}
```

### Platform Adapters

```typescript
// packages/cli/src/adapters/CLIAuthAdapter.ts
export class CLIAuthAdapter {
    private authService: AuthenticationService;
    
    async promptForCredentials(): Promise<ICredentials> {
        // CLI-specific prompting
        const inquirer = await import('inquirer');
        return inquirer.prompt([
            { name: 'clientId', type: 'password', message: 'Client ID:' },
            { name: 'clientSecret', type: 'password', message: 'Client Secret:' }
        ]);
    }
    
    async storeToken(token: IAuthToken): Promise<void> {
        // CLI-specific storage (keytar or config file)
        await keytar.setPassword('sharedo-cli', 'token', token.access_token);
    }
}

// packages/vscode/src/adapters/VSCodeAuthAdapter.ts
export class VSCodeAuthAdapter {
    private authService: AuthenticationService;
    
    async promptForCredentials(): Promise<ICredentials> {
        // VS Code specific prompting
        const clientId = await vscode.window.showInputBox({
            prompt: 'Enter Client ID',
            password: true
        });
        
        const clientSecret = await vscode.window.showInputBox({
            prompt: 'Enter Client Secret',
            password: true
        });
        
        return { clientId, clientSecret };
    }
    
    async storeToken(token: IAuthToken): Promise<void> {
        // VS Code specific storage
        await this.context.secrets.store('sharedo.token', token.access_token);
    }
}
```

---

## Platform-Specific Adapters

### Interface Definitions

```typescript
// packages/core/src/interfaces/IPlatformAdapter.ts
export interface IPlatformAdapter {
    // UI/UX
    prompt(options: IPromptOptions): Promise<any>;
    showProgress(title: string): IProgressReporter;
    showError(message: string, error?: Error): void;
    showInfo(message: string): void;
    
    // Storage
    storeSecret(key: string, value: string): Promise<void>;
    getSecret(key: string): Promise<string | null>;
    storeConfig(config: any): Promise<void>;
    getConfig(): Promise<any>;
    
    // File System
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    watchFile(path: string, callback: () => void): IDisposable;
    
    // Output
    log(message: string, level?: LogLevel): void;
    showOutput(content: string, format?: OutputFormat): void;
}
```

### CLI Adapter Implementation

```typescript
// packages/cli/src/adapters/CLIPlatformAdapter.ts
export class CLIPlatformAdapter implements IPlatformAdapter {
    async prompt(options: IPromptOptions): Promise<any> {
        const inquirer = await import('inquirer');
        return inquirer.prompt([options]);
    }
    
    showProgress(title: string): IProgressReporter {
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(100, 0);
        
        return {
            report: (value: number) => bar.update(value),
            complete: () => bar.stop()
        };
    }
    
    showError(message: string, error?: Error): void {
        console.error(chalk.red(`✖ ${message}`));
        if (error && this.verbose) {
            console.error(chalk.gray(error.stack));
        }
    }
    
    async storeSecret(key: string, value: string): Promise<void> {
        await keytar.setPassword('sharedo', key, value);
    }
    
    async readFile(path: string): Promise<string> {
        return fs.promises.readFile(path, 'utf-8');
    }
    
    log(message: string, level: LogLevel = LogLevel.Info): void {
        const colors = {
            [LogLevel.Debug]: chalk.gray,
            [LogLevel.Info]: chalk.white,
            [LogLevel.Warning]: chalk.yellow,
            [LogLevel.Error]: chalk.red
        };
        
        console.log(colors[level](message));
    }
}
```

### VS Code Adapter Implementation

```typescript
// packages/vscode/src/adapters/VSCodePlatformAdapter.ts
export class VSCodePlatformAdapter implements IPlatformAdapter {
    constructor(private context: vscode.ExtensionContext) {}
    
    async prompt(options: IPromptOptions): Promise<any> {
        if (options.type === 'input') {
            return vscode.window.showInputBox({
                prompt: options.message,
                password: options.password
            });
        } else if (options.type === 'select') {
            return vscode.window.showQuickPick(options.choices);
        }
    }
    
    showProgress(title: string): IProgressReporter {
        return vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title },
            async (progress) => {
                return {
                    report: (value: number) => progress.report({ increment: value }),
                    complete: () => {} // Handled by withProgress
                };
            }
        );
    }
    
    showError(message: string, error?: Error): void {
        vscode.window.showErrorMessage(message);
        if (error) {
            this.outputChannel.appendLine(error.stack || error.message);
        }
    }
    
    async storeSecret(key: string, value: string): Promise<void> {
        await this.context.secrets.store(key, value);
    }
    
    async readFile(path: string): Promise<string> {
        const uri = vscode.Uri.file(path);
        const data = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(data).toString('utf-8');
    }
    
    log(message: string, level: LogLevel = LogLevel.Info): void {
        this.outputChannel.appendLine(`[${LogLevel[level]}] ${message}`);
    }
}
```

---

## Code Reuse Strategy

### Shared Service Architecture

```typescript
// packages/core/src/services/WorkflowService.ts
export class WorkflowService {
    constructor(
        private client: ShareDoClient,
        private adapter: IPlatformAdapter
    ) {}
    
    async executeWorkflow(name: string, params: any): Promise<IExecutionResult> {
        // Show progress using platform adapter
        const progress = this.adapter.showProgress(`Executing ${name}`);
        
        try {
            // Core logic shared across platforms
            const execution = await this.client.post('/api/workflows/execute', {
                workflowName: name,
                parameters: params
            });
            
            // Monitor execution
            const result = await this.monitorExecution(execution.id, progress);
            
            progress.complete();
            return result;
            
        } catch (error) {
            this.adapter.showError(`Workflow execution failed`, error);
            throw error;
        }
    }
    
    private async monitorExecution(
        id: string, 
        progress: IProgressReporter
    ): Promise<IExecutionResult> {
        // Shared monitoring logic
        let status;
        do {
            status = await this.client.get(`/api/execution/${id}/status`);
            progress.report(status.progress);
            await this.delay(1000);
        } while (status.state === 'RUNNING');
        
        return status;
    }
}
```

### CLI Command Implementation

```typescript
// packages/cli/src/commands/WorkflowCommand.ts
export class WorkflowCommand {
    constructor(
        private workflowService: WorkflowService,
        private adapter: CLIPlatformAdapter
    ) {}
    
    async execute(name: string, options: any): Promise<void> {
        try {
            // Use shared service with CLI adapter
            const result = await this.workflowService.executeWorkflow(
                name,
                options.params
            );
            
            // CLI-specific output formatting
            this.adapter.showOutput(
                this.formatResult(result),
                options.format || 'json'
            );
            
        } catch (error) {
            this.adapter.showError(`Failed to execute workflow: ${name}`, error);
            process.exit(1);
        }
    }
}
```

### VS Code Command Implementation

```typescript
// packages/vscode/src/commands/WorkflowCommand.ts
export class VSCodeWorkflowCommand {
    constructor(
        private workflowService: WorkflowService,
        private adapter: VSCodePlatformAdapter
    ) {}
    
    async execute(node: TreeNode): Promise<void> {
        try {
            // Get parameters via VS Code UI
            const params = await this.promptForParameters(node.workflow);
            
            // Use shared service with VS Code adapter
            const result = await this.workflowService.executeWorkflow(
                node.workflow.name,
                params
            );
            
            // VS Code specific output
            this.showResultInWebview(result);
            
        } catch (error) {
            this.adapter.showError(`Failed to execute workflow`, error);
        }
    }
    
    private async promptForParameters(workflow: IWorkflow): Promise<any> {
        // VS Code specific parameter UI
        const panel = vscode.window.createWebviewPanel(
            'workflowParams',
            'Workflow Parameters',
            vscode.ViewColumn.One
        );
        
        // ... webview implementation
    }
}
```

---

## Implementation Roadmap

### Phase 1: Core Extraction (Week 1-2)

```typescript
// Extract shared services to core package
const SERVICES_TO_EXTRACT = [
    'AuthenticationService',
    'ExportService',
    'WorkflowService',
    'WorkTypeService',
    'FormBuilderService',
    'DocumentService',
    'FileService',
    'CacheService',
    'ValidationService',
    'MonitoringService'
];

// Create platform interfaces
const INTERFACES_TO_DEFINE = [
    'IPlatformAdapter',
    'IProgressReporter',
    'IOutputFormatter',
    'IStorageProvider',
    'ICredentialProvider'
];
```

### Phase 2: Adapter Implementation (Week 3)

```typescript
// Implement adapters for each platform
const ADAPTERS_TO_IMPLEMENT = {
    cli: [
        'CLIPlatformAdapter',
        'CLIProgressReporter',
        'CLIOutputFormatter',
        'CLIStorageProvider'
    ],
    vscode: [
        'VSCodePlatformAdapter',
        'VSCodeProgressReporter',
        'VSCodeOutputFormatter',
        'VSCodeStorageProvider'
    ],
    mcp: [
        'MCPPlatformAdapter',
        'MCPResponseFormatter',
        'MCPToolAdapter'
    ]
};
```

### Phase 3: Migration (Week 4-5)

1. **Migrate VS Code Extension**
   - Replace direct implementations with core services
   - Implement VS Code adapters
   - Update command handlers

2. **Build CLI**
   - Implement CLI commands using core services
   - Add CLI adapters
   - Create command structure

3. **Build MCP Server**
   - Wrap core services as MCP tools
   - Implement MCP adapters
   - Create server infrastructure

### Phase 4: Integration (Week 6)

```typescript
// VS Code extension using CLI directly
class VSCodeCLIIntegration {
    async executeCliCommand(command: string): Promise<string> {
        // Execute CLI in integrated terminal
        const terminal = vscode.window.createTerminal('ShareDo CLI');
        terminal.sendText(`sharedo ${command}`);
        
        // Or execute programmatically
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(`sharedo ${command}`, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });
    }
}
```

---

## Migration Plan

### Step 1: Create Monorepo Structure

```bash
# Initialize monorepo
npm init -w packages/core
npm init -w packages/cli
npm init -w packages/vscode
npm init -w packages/mcp

# Install shared dependencies
npm install -w packages/core axios lodash uuid
npm install -w packages/cli commander inquirer chalk
npm install -w packages/vscode @types/vscode
npm install -w packages/mcp @modelcontextprotocol/sdk
```

### Step 2: Extract Core Services

```typescript
// Move from VS Code extension to core
mv ReferenceVsCodeExtensions/src/Authentication/* packages/core/src/authentication/
mv ReferenceVsCodeExtensions/src/services/Export* packages/core/src/services/
mv ReferenceVsCodeExtensions/src/Workflows/* packages/core/src/workflows/

// Update imports
// Before: import { AuthenticationService } from '../Authentication/authenticate';
// After: import { AuthenticationService } from '@sharedo/core';
```

### Step 3: Implement Dependency Injection

```typescript
// packages/core/src/container.ts
export class ServiceContainer {
    private services = new Map<string, any>();
    
    register<T>(name: string, factory: () => T): void {
        this.services.set(name, factory);
    }
    
    get<T>(name: string): T {
        const factory = this.services.get(name);
        if (!factory) throw new Error(`Service ${name} not registered`);
        return factory();
    }
}

// Platform-specific initialization
// packages/cli/src/index.ts
const container = new ServiceContainer();
container.register('adapter', () => new CLIPlatformAdapter());
container.register('auth', () => new AuthenticationService(container.get('adapter')));
container.register('export', () => new ExportService(container.get('adapter')));
```

### Step 4: Update VS Code Extension

```typescript
// packages/vscode/src/extension.ts
import { ServiceContainer } from '@sharedo/core';
import { VSCodePlatformAdapter } from './adapters';

export function activate(context: vscode.ExtensionContext) {
    // Initialize shared services with VS Code adapter
    const container = new ServiceContainer();
    const adapter = new VSCodePlatformAdapter(context);
    
    container.register('adapter', () => adapter);
    container.register('auth', () => new AuthenticationService(adapter));
    container.register('export', () => new ExportService(adapter));
    
    // Register commands using shared services
    registerCommands(context, container);
    
    // Optional: Enable CLI integration
    if (config.get('enableCLIIntegration')) {
        registerCLIBridge(context);
    }
}
```

---

## Benefits of Unified Architecture

### 1. Code Reuse
- **80% shared code** between platforms
- Single source of truth for business logic
- Consistent behavior across all interfaces

### 2. Maintenance
- Fix once, deploy everywhere
- Unified testing strategy
- Simplified dependency management

### 3. Feature Parity
- New features available on all platforms
- Consistent API across interfaces
- Unified documentation

### 4. Development Velocity
- Faster feature development
- Reduced testing burden
- Simplified debugging

### 5. User Experience
- Consistent behavior
- Seamless integration between tools
- Unified configuration

---

## VS Code Extension Scenarios Coverage

### ✅ Fully Covered Scenarios

1. **Authentication & Multi-Environment**
   - Token management with refresh
   - Environment switching
   - Impersonation support

2. **Export/Import Operations**
   - Package export with progress
   - Job monitoring
   - Download management
   - Cache strategies

3. **Workflow Management**
   - Execution with parameters
   - Monitoring and cancellation
   - Error handling and retry

4. **Form Builder**
   - CRUD operations
   - Template management
   - Validation

5. **File Operations**
   - Download/upload
   - Publishing to servers
   - IDE file management

### ⚠️ VS Code Specific (Not in CLI)

1. **Tree View Provider**
   - Adapt to CLI list/tree output
   - No interactive tree needed

2. **Webview Panels**
   - CLI uses terminal output
   - MCP returns structured data

3. **File Watching**
   - Optional in CLI
   - Can be added if needed

### 🚀 CLI Enhancements from VS Code

1. **Playwright Export Service**
   - Can be optional dependency
   - Fallback to API-based export

2. **Browser Authentication**
   - Useful for complex auth flows
   - Can open browser from CLI

3. **Caching Strategies**
   - Reuse VS Code cache logic
   - Improve CLI performance

---

## Conclusion

The unified architecture provides a robust foundation for building the ShareDo CLI while maintaining the VS Code extension. By sharing 80% of the codebase through a platform-agnostic core package and using adapters for platform-specific functionality, we achieve:

1. **Consistency** - Same business logic across all platforms
2. **Efficiency** - No code duplication
3. **Maintainability** - Single codebase to maintain
4. **Extensibility** - Easy to add new platforms
5. **Integration** - VS Code can use CLI directly

The VS Code extension scenarios are fully covered, with platform-specific features properly isolated through adapters. This architecture ensures that both the CLI and VS Code extension can evolve together while maintaining their unique platform advantages.