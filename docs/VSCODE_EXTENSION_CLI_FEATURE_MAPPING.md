# VS Code Extension to CLI Feature Mapping

## Executive Summary

This document maps VS Code extension features to CLI capabilities, identifying which features can be shared and which require platform-specific implementations.

## Feature Categories

### 1. Authentication & Security (100% Shareable)

**VS Code Extension Features:**
- OAuth2 authentication with impersonation
- Bearer token management
- Secure token storage
- Certificate handling for SSL/TLS

**CLI Mapping:**
```typescript
// Shared authentication module
interface IAuthenticationService {
    authenticate(config: IAuthConfig): Promise<ITokenResponse>;
    refreshToken(token: string): Promise<ITokenResponse>;
    validateToken(token: string): Promise<boolean>;
    storeCredentials(credentials: ICredentials): Promise<void>;
}
```

**Implementation Strategy:**
- Core authentication logic in shared package
- Platform-specific credential storage (VS Code SecretStorage vs CLI keychain)
- Unified token refresh mechanism

### 2. Workflow Management (95% Shareable)

**VS Code Extension Features:**
- Download workflows from server
- Validate workflow JSON
- Compare workflows across servers
- Batch workflow operations
- Preview workflow visually
- Export workflow documentation

**CLI Commands:**
```bash
# Direct CLI equivalents
sharedo workflow download <name> --server <url>
sharedo workflow validate <file>
sharedo workflow compare <file1> <file2>
sharedo workflow batch-download --pattern <pattern>
sharedo workflow export <file> --format markdown

# CLI-specific enhancements
sharedo workflow list --filter <query>
sharedo workflow deploy <file> --environment <env>
sharedo workflow rollback <name> --version <version>
```

**Shared Components:**
- WorkflowManager class
- WorkflowValidator
- WorkflowComparator
- WorkflowTemplates

### 3. Package Export Service (100% Shareable)

**VS Code Extension Features:**
- Create export configurations
- Download export packages
- Extract and parse package data
- Generate HLD documentation

**CLI Mapping:**
```bash
# Package operations
sharedo export create --config <file>
sharedo export download <id> --output <path>
sharedo export status <id>
sharedo export list --recent 10

# HLD generation
sharedo hld generate --package <id>
sharedo hld configure --template <template>
```

**Shared Infrastructure:**
```typescript
class PackageExportService {
    // Completely platform-agnostic
    async createExport(config: IExportConfig): Promise<string>;
    async downloadPackage(id: string): Promise<Buffer>;
    async extractPackage(buffer: Buffer): Promise<IPackageData>;
}
```

### 4. Form Builder Operations (80% Shareable)

**VS Code Extension Features:**
- List available forms
- Download form definitions
- Preview forms
- Validate form schemas

**CLI Mapping:**
```bash
# Form management
sharedo form list --work-type <type>
sharedo form download <id> --format json
sharedo form validate <file>
sharedo form preview <file> --browser

# CLI-specific batch operations
sharedo form export-all --work-type <type>
sharedo form compare <form1> <form2>
```

### 5. Execution Engine Integration (90% Shareable)

**VS Code Extension Features:**
- Query work items
- Start/stop workflows
- Monitor workflow status
- View execution history

**CLI Mapping:**
```bash
# Execution control
sharedo exec start <workflow> --params <file>
sharedo exec stop <instance-id>
sharedo exec status <instance-id>
sharedo exec history --limit 50

# Monitoring
sharedo exec watch <instance-id>
sharedo exec logs <instance-id> --follow
```

### 6. Tree Data Provider (VS Code Specific)

**VS Code Extension Features:**
- Hierarchical server/artifact display
- Context menus and actions
- Real-time refresh
- Drag-and-drop support

**CLI Alternative:**
```bash
# Interactive tree navigation
sharedo browse --interactive
sharedo tree --server <url> --depth 3

# Query-based navigation
sharedo list servers
sharedo list artifacts --server <url> --type workflow
```

**Platform Differences:**
- VS Code: Native tree view with UI interactions
- CLI: Text-based tree rendering or interactive TUI

### 7. File Watching & Publishing (70% Shareable)

**VS Code Extension Features:**
- Watch local file changes
- Auto-publish to server
- Conflict detection
- Publishing logs

**CLI Mapping:**
```bash
# File watching
sharedo watch <path> --auto-publish
sharedo watch status
sharedo watch stop

# Publishing
sharedo publish <file> --server <url>
sharedo publish batch <directory>
```

**Shared Components:**
- FileWatcher base class
- PublishingService
- ConflictResolver

**Platform-Specific:**
- VS Code: Uses workspace file system events
- CLI: Uses chokidar or native fs.watch

### 8. Diagnostic & Health Monitoring (100% Shareable)

**VS Code Extension Features:**
- Server health checks
- Connection diagnostics
- Performance monitoring
- Error reporting

**CLI Mapping:**
```bash
# Diagnostics
sharedo health check --all
sharedo health server <url>
sharedo diag connection <url>
sharedo diag performance --duration 60s

# Monitoring
sharedo monitor start --interval 30s
sharedo monitor dashboard
```

### 9. Cache Management (95% Shareable)

**VS Code Extension Features:**
- Token caching
- Export cache
- Artifact cache
- Cache statistics

**CLI Mapping:**
```bash
# Cache operations
sharedo cache clear --type tokens
sharedo cache stats
sharedo cache export <path>
sharedo cache import <path>
```

### 10. Notification Service (Platform Specific)

**VS Code Extension Features:**
- Toast notifications
- Status bar updates
- Progress indicators
- Output channel logging

**CLI Alternative:**
```bash
# CLI notifications
sharedo notify --webhook <url>
sharedo notify --email <address>
sharedo notify --desktop  # OS native notifications
```

**Implementation Strategy:**
- Abstract notification interface
- Platform-specific implementations
- Unified event system

## Platform-Specific Features

### VS Code Only
1. **UI Components**
   - Tree views
   - Webview panels
   - Quick pick menus
   - Status bar items

2. **Editor Integration**
   - IntelliSense for ShareDo artifacts
   - Code lens for workflows
   - Hover providers
   - Snippet completion

3. **Workspace Features**
   - Multi-root workspace support
   - Workspace settings
   - Task integration
   - Debug configurations

### CLI Only
1. **Batch Processing**
   - Scriptable operations
   - Pipeline integration
   - Parallel execution
   - Output formatting (JSON, CSV, Table)

2. **Advanced Querying**
   - JMESPath queries
   - Complex filters
   - Aggregations
   - Export to various formats

3. **Automation Features**
   - Scheduled tasks
   - Webhook triggers
   - CI/CD integration
   - Template generation

## Code Sharing Matrix

| Component | Shareable | VS Code Specific | CLI Specific |
|-----------|-----------|------------------|--------------|
| Authentication | ✅ 100% | Secret storage adapter | Keychain adapter |
| API Clients | ✅ 100% | - | - |
| Data Models | ✅ 100% | - | - |
| Business Logic | ✅ 95% | UI event handlers | CLI parsers |
| Validation | ✅ 100% | - | - |
| Export Services | ✅ 100% | - | - |
| File Operations | ✅ 80% | Workspace FS | Node FS |
| Notifications | ❌ 20% | VS Code API | Console/Desktop |
| UI Components | ❌ 0% | All UI | TUI/Prompts |
| Configuration | ✅ 90% | Workspace settings | Config files |

## Migration Path

### Phase 1: Core Extraction (Week 1-2)
```typescript
// Extract to @sharedo/core
- Authentication services
- API clients  
- Data models and interfaces
- Validation utilities
- Export/Import services
```

### Phase 2: Business Logic (Week 3-4)
```typescript
// Extract to @sharedo/business
- WorkflowManager
- PackageExportService
- ExecutionEngine
- FormBuilder services
- HLD generators
```

### Phase 3: Platform Adapters (Week 5-6)
```typescript
// @sharedo/vscode-adapter
class VSCodePlatformAdapter implements IPlatform {
    notify(message: string): void {
        vscode.window.showInformationMessage(message);
    }
    
    async selectFile(): Promise<string> {
        const uri = await vscode.window.showOpenDialog({});
        return uri?.[0].fsPath;
    }
}

// @sharedo/cli-adapter  
class CLIPlatformAdapter implements IPlatform {
    notify(message: string): void {
        console.log(chalk.green(message));
    }
    
    async selectFile(): Promise<string> {
        const { filePath } = await inquirer.prompt([{
            type: 'input',
            name: 'filePath',
            message: 'Enter file path:'
        }]);
        return filePath;
    }
}
```

### Phase 4: Integration (Week 7-8)
- Update VS Code extension to use shared packages
- Implement CLI using shared packages
- Add platform-specific features
- Comprehensive testing

## Benefits of Unified Architecture

### For Development
- **Single source of truth** for business logic
- **Reduced maintenance** - fix once, deploy everywhere
- **Consistent behavior** across platforms
- **Faster feature development** - implement once

### For Users
- **Consistent experience** between CLI and VS Code
- **Seamless workflow** - start in CLI, continue in VS Code
- **Unified documentation** - same concepts everywhere
- **Better reliability** - shared, well-tested code

### For Testing
- **Shared test suites** for core logic
- **Platform-specific tests** only for adapters
- **Better coverage** - more eyes on same code
- **Regression prevention** - changes tested across platforms

## Example: Unified Workflow Download

```typescript
// Shared core implementation
class WorkflowService {
    constructor(private platform: IPlatform) {}
    
    async downloadWorkflow(name: string, server: IServer): Promise<void> {
        try {
            // Show progress (platform-specific)
            this.platform.showProgress('Downloading workflow...');
            
            // Core logic (shared)
            const workflow = await this.apiClient.getWorkflow(name);
            const validated = await this.validator.validate(workflow);
            
            // Save file (platform-adapted)
            const path = await this.platform.saveFile(
                `${name}.json`,
                JSON.stringify(validated, null, 2)
            );
            
            // Notify completion (platform-specific)
            this.platform.notify(`Workflow saved to ${path}`);
            
        } catch (error) {
            // Error handling (platform-specific display)
            this.platform.showError(`Failed to download: ${error.message}`);
        }
    }
}

// VS Code usage
const service = new WorkflowService(new VSCodePlatformAdapter());
await service.downloadWorkflow('my-workflow', server);

// CLI usage  
const service = new WorkflowService(new CLIPlatformAdapter());
await service.downloadWorkflow('my-workflow', server);
```

## Conclusion

The VS Code extension and CLI share approximately **80% of their codebase**, with platform-specific implementations only needed for:
- User interface components
- Notification mechanisms  
- File system interactions
- Configuration management

By adopting a unified architecture with platform adapters, we can:
- Eliminate code duplication
- Ensure consistent behavior
- Accelerate development
- Improve maintainability
- Provide better user experience

The proposed monorepo structure with shared packages enables maximum code reuse while maintaining platform-specific optimizations where needed.