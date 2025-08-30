# ShareDo CLI & MCP Specification
## Complete Implementation Guide for Three-Agent Development

### Version 1.0.0
### Date: 2025-08-28

---

## Executive Summary

This specification defines the complete implementation plan for the ShareDo CLI and MCP (Model Context Protocol) integration. The system enables AI-powered interactions with the ShareDo platform, supporting multi-environment management, automated deployments, export job handling, and HLD document generation.

The specification is designed for parallel development by three Claude AI agents using git worktree:
- **Agent 1**: Core Infrastructure & Authentication
- **Agent 2**: API Integration & Export Services  
- **Agent 3**: CLI Commands & MCP Implementation

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Multi-Environment Management](#multi-environment-management)
3. [Core Components](#core-components)
4. [Agent 1: Core Infrastructure](#agent-1-core-infrastructure)
5. [Agent 2: API Integration](#agent-2-api-integration)
6. [Agent 3: CLI & MCP](#agent-3-cli--mcp)
7. [Security & Safety](#security--safety)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Timeline](#implementation-timeline)

---

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    ShareDo CLI/MCP                       │
├─────────────────────────────────────────────────────────┤
│                     CLI Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Commands   │  │   Prompts    │  │   Output     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Core Services Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Environment   │  │Authentication│  │   Safety     │  │
│  │  Manager     │  │   Service    │  │   Manager    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  API Integration Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Export     │  │   Workflow   │  │     HLD      │  │
│  │   Service    │  │   Service    │  │  Generator   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    ShareDo Servers                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Production   │  │    UAT       │  │   vNext      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20.x LTS
- **CLI Framework**: Commander.js
- **MCP Framework**: @modelcontextprotocol/sdk
- **Authentication**: OAuth2 with client credentials + impersonation
- **HTTP Client**: Axios with interceptors
- **Document Generation**: docx library
- **Configuration**: JSON with schema validation
- **Testing**: Jest + Playwright for E2E

---

## Multi-Client Multi-Environment Management

### Overview
The system supports connecting to multiple clients' ShareDo environments simultaneously, enabling cross-client comparisons and multi-tenant operations. Each client can have multiple environments (production, UAT, SIT, vNext), allowing for complex comparison scenarios.

### Client-Environment Hierarchy

```
ShareDo CLI
├── Client A
│   ├── Production (app.clienta.sharedo.com)
│   ├── UAT (uat.clienta.sharedo.com)
│   ├── SIT (sit.clienta.sharedo.com)
│   └── vNext (vnext.clienta.sharedo.com)
├── Client B
│   ├── Production (app.clientb.sharedo.com)
│   ├── UAT (uat.clientb.sharedo.com)
│   └── vNext (vnext.clientb.sharedo.com)
└── Client C
    ├── Production (app.clientc.sharedo.com)
    └── UAT (uat.clientc.sharedo.com)
```

### Environment Types

#### Production Environments
- **Identification**: URLs without vnext/uat/sit
- **Safety Features**:
  - Confirmation required for ALL operations
  - Cannot run in dangerous mode
  - Audit logging enabled
  - Rollback capability required
  - Two-factor confirmation for destructive operations

#### Non-Production Environments
- **Identification**: URLs containing vnext, uat, sit
- **Safety Features**:
  - Optional confirmation (configurable)
  - Can run in dangerous mode
  - Standard logging
  - Batch operations allowed

### Environment Configuration Schema
```typescript
interface IEnvironmentConfig {
  // Unique identifier: clientName-environmentType
  id: string;                       // e.g., "clientA-vnext", "clientB-uat"
  clientName: string;                // Client identifier
  environmentName: string;           // User-friendly name
  url: string;                      // Server URL
  type: 'production' | 'uat' | 'sit' | 'vnext' | 'development';
  auth: {
    clientId: string;
    clientSecret: string;           // Encrypted
    tokenEndpoint: string;
    impersonateUser: string;
    impersonateProvider: string;
  };
  safety: {
    requireConfirmation: boolean;   // Default: true for production
    allowDangerousMode: boolean;    // Default: false for production
    auditLogging: boolean;          // Default: true for production
    maxConcurrentOps: number;       // Default: 1 for production, 5 for others
  };
  features: {
    exportEnabled: boolean;
    deployEnabled: boolean;
    hldGenerationEnabled: boolean;
    workflowExecutionEnabled: boolean;
  };
  metadata: {
    addedDate: Date;
    lastUsed: Date;
    tags: string[];                // e.g., ["primary", "testing", "legacy"]
  };
}
```

### Environment Manager Capabilities
1. **Multi-Client Multi-Environment Sessions**
   - Simultaneous connections to multiple clients' servers
   - Client isolation and management
   - Per-client-environment token management
   - Connection pooling per client

2. **Cross-Client Comparison Operations**
   - Compare configurations between different clients
   - Compare same component across client environments
   - Identify configuration drift between clients
   - Generate comparison reports for consulting

3. **Cross-Environment Operations (Same Client)**
   - Compare configurations between environments
   - Promote configurations through environment chain
   - Environment sync validation
   - Deployment pipeline support

4. **Cross-Client Cross-Environment Operations**
   - Compare ClientA vNext with ClientB vNext
   - Compare ClientA Production with ClientB UAT
   - Identify best practices across clients
   - Generate cross-client analytics

5. **Environment Safety**
   - Production detection algorithm
   - Client-aware confirmation workflows
   - Operation rollback tracking per client
   - Audit trail generation with client context

---

## Core Components

### 1. Authentication Service
```typescript
interface IAuthenticationService {
  // Multi-environment authentication
  authenticate(environment: string): Promise<IAuthToken>;
  refreshToken(environment: string): Promise<IAuthToken>;
  validateToken(token: IAuthToken): boolean;
  
  // Token management
  storeToken(environment: string, token: IAuthToken): void;
  getToken(environment: string): IAuthToken | null;
  clearTokens(environment?: string): void;
  
  // Impersonation
  impersonate(user: string, provider: string): Promise<IAuthToken>;
}
```

### 2. Safety Manager
```typescript
interface ISafetyManager {
  // Confirmation handling
  requireConfirmation(operation: IOperation, environment: string): Promise<boolean>;
  validateOperation(operation: IOperation, environment: string): IValidationResult;
  
  // Dangerous mode
  enableDangerousMode(environment: string): void;
  isDangerousModeAllowed(environment: string): boolean;
  
  // Audit
  logOperation(operation: IOperation, result: IOperationResult): void;
  getAuditTrail(filter?: IAuditFilter): IAuditEntry[];
}
```

### 3. Export Service
```typescript
interface IExportService {
  // Job creation
  createExportJob(params: IExportParams): Promise<IExportJob>;
  
  // Job monitoring
  monitorJob(jobId: string, callbacks?: IJobCallbacks): Promise<IExportResult>;
  getJobStatus(jobId: string): Promise<IJobStatus>;
  
  // Download handling
  downloadPackage(jobId: string, destination: string): Promise<void>;
  extractPackage(packagePath: string): Promise<IExtractedData>;
  
  // Batch operations
  batchExport(workTypes: string[], params?: IExportParams): Promise<IBatchResult>;
  
  // Caching
  getCachedExport(key: string): IExportedData | null;
  cacheExport(key: string, data: IExportedData): void;
}
```

### 4. HLD Generator
```typescript
interface IHLDGenerator {
  // Document generation
  generateHLD(workType: IWorkType, template?: IHLDTemplate): Promise<IHLDDocument>;
  
  // Template types
  generateBusinessAnalystHLD(workType: IWorkType): Promise<IHLDDocument>;
  generateSystemAdminHLD(workType: IWorkType): Promise<IHLDDocument>;
  generateSupportConsultantHLD(workType: IWorkType): Promise<IHLDDocument>;
  generateTrainerHLD(workType: IWorkType): Promise<IHLDDocument>;
  
  // Cheat sheets
  generateCheatSheet(role: string, workType: IWorkType): Promise<ICheatSheet>;
  
  // Batch operations
  generateFullDocumentationSuite(workType: IWorkType): Promise<IDocumentationSuite>;
  
  // Output formats
  exportAsWord(document: IHLDDocument): Promise<Buffer>;
  exportAsPDF(document: IHLDDocument): Promise<Buffer>;
  exportAsMarkdown(document: IHLDDocument): Promise<string>;
}
```

---

## Agent 1: Core Infrastructure

### Responsibilities
- Environment configuration management
- Authentication service implementation
- Safety manager and confirmation workflows
- Token management and refresh
- Connection pooling
- Error handling framework
- Logging infrastructure
- Configuration schema and validation

### Implementation Files
```
src/
├── core/
│   ├── EnvironmentManager.ts
│   ├── AuthenticationService.ts
│   ├── SafetyManager.ts
│   ├── TokenManager.ts
│   └── ConnectionPool.ts
├── config/
│   ├── ConfigurationSchema.ts
│   ├── ConfigValidator.ts
│   └── EnvironmentDetector.ts
├── security/
│   ├── EncryptionService.ts
│   ├── AuditLogger.ts
│   └── ConfirmationManager.ts
└── utils/
    ├── ErrorHandler.ts
    ├── Logger.ts
    └── Retry.ts
```

### Key Features to Implement

#### 1. Environment Detection
```typescript
class EnvironmentDetector {
  static detectType(url: string): EnvironmentType {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('vnext')) return 'vnext';
    if (lowerUrl.includes('uat')) return 'uat';
    if (lowerUrl.includes('sit')) return 'sit';
    if (lowerUrl.includes('dev') || lowerUrl.includes('development')) return 'development';
    return 'production';
  }
  
  static requiresConfirmation(type: EnvironmentType): boolean {
    return type === 'production';
  }
}
```

#### 2. Confirmation Manager
```typescript
class ConfirmationManager {
  async requireConfirmation(operation: IOperation): Promise<boolean> {
    const env = this.environmentManager.getCurrentEnvironment();
    
    if (!this.shouldRequireConfirmation(env, operation)) {
      return true;
    }
    
    // Production double confirmation
    if (env.type === 'production' && operation.isDestructive) {
      const first = await this.promptConfirmation(operation);
      if (!first) return false;
      
      console.log(chalk.red('⚠️  PRODUCTION ENVIRONMENT - CONFIRMING AGAIN'));
      return await this.promptConfirmation(operation, true);
    }
    
    return await this.promptConfirmation(operation);
  }
}
```

#### 3. Token Management with Refresh
```typescript
class TokenManager {
  private tokens: Map<string, ITokenData> = new Map();
  
  async getValidToken(environment: string): Promise<string> {
    const tokenData = this.tokens.get(environment);
    
    if (!tokenData || this.isExpired(tokenData)) {
      return await this.refreshToken(environment);
    }
    
    return tokenData.accessToken;
  }
  
  private isExpired(tokenData: ITokenData): boolean {
    const buffer = 30000; // 30 seconds buffer
    return Date.now() >= (tokenData.expiresAt - buffer);
  }
}
```

---

## Agent 2: API Integration

### Responsibilities
- ShareDo API client implementation
- Export service with job monitoring
- Workflow service implementation
- Work type service
- Form builder integration
- Document and file management
- Cache management
- API response transformation

### Implementation Files
```
src/
├── api/
│   ├── ShareDoClient.ts
│   ├── ApiInterceptors.ts
│   └── ResponseTransformers.ts
├── services/
│   ├── ExportService.ts
│   ├── WorkflowService.ts
│   ├── WorkTypeService.ts
│   ├── FormBuilderService.ts
│   ├── DocumentService.ts
│   └── ExecutionEngineService.ts
├── export/
│   ├── ExportJobManager.ts
│   ├── PackageDownloader.ts
│   ├── PackageExtractor.ts
│   └── ExportCache.ts
└── monitoring/
    ├── JobMonitor.ts
    ├── ProgressTracker.ts
    └── StatusPoller.ts
```

### Key Features to Implement

#### 1. Export Job Management
```typescript
class ExportJobManager {
  async createAndMonitor(params: IExportParams): Promise<IExportResult> {
    // Create job
    const job = await this.createJob(params);
    
    // Monitor with progress
    return await this.monitorJob(job.id, {
      onProgress: (percent, message) => {
        this.progressBar.update(percent, message);
      },
      onComplete: () => {
        this.progressBar.complete();
      },
      onError: (error) => {
        this.progressBar.fail(error.message);
      }
    });
  }
  
  private async monitorJob(jobId: string, callbacks?: IJobCallbacks): Promise<IExportResult> {
    const maxAttempts = 120; // 2 minutes with 1 second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getJobStatus(jobId);
      
      callbacks?.onProgress(status.percentage, status.currentStep);
      
      if (status.state === 'COMPLETED') {
        callbacks?.onComplete();
        return await this.downloadResults(jobId);
      }
      
      if (status.state === 'FAILED') {
        throw new ExportError(status.error);
      }
      
      await this.delay(1000);
      attempts++;
    }
    
    throw new TimeoutError('Export job timed out');
  }
}
```

#### 2. Workflow Service
```typescript
class WorkflowService {
  async downloadWorkflow(name: string, environment: string): Promise<IWorkflow> {
    const workflow = await this.client.get(`/api/workflows/${name}`);
    return this.transformWorkflow(workflow);
  }
  
  async compareWorkflows(name: string, env1: string, env2: string): Promise<IDifference[]> {
    const [workflow1, workflow2] = await Promise.all([
      this.downloadWorkflow(name, env1),
      this.downloadWorkflow(name, env2)
    ]);
    
    return this.computeDifferences(workflow1, workflow2);
  }
  
  async deployWorkflow(workflow: IWorkflow, environments: string[]): Promise<IDeployResult> {
    const results = await Promise.all(
      environments.map(env => this.deploySingle(workflow, env))
    );
    
    return this.aggregateResults(results);
  }
}
```

#### 3. Work Type Service with Caching
```typescript
class WorkTypeService {
  private cache: LRUCache<string, IWorkType>;
  
  async getWorkType(systemName: string, useCache = true): Promise<IWorkType> {
    const cacheKey = `${this.environment}:${systemName}`;
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }
    
    const workType = await this.fetchWorkType(systemName);
    
    // Enrich with additional data
    const enriched = await this.enrichWorkType(workType);
    
    this.cache.set(cacheKey, enriched);
    return enriched;
  }
  
  private async enrichWorkType(workType: IWorkType): Promise<IWorkType> {
    const [aspects, roles, permissions] = await Promise.all([
      this.getAspects(workType.systemName),
      this.getParticipantRoles(workType.systemName),
      this.getCreatePermissions(workType.systemName)
    ]);
    
    return {
      ...workType,
      aspects,
      participantRoles: roles,
      createPermissions: permissions
    };
  }
}
```

---

## Agent 3: CLI & MCP

### Responsibilities
- CLI command implementation
- Interactive prompts and wizards
- MCP server implementation
- Output formatting and display
- Progress indicators and spinners
- Command validation and help
- Batch operation orchestration

### Implementation Files
```
src/
├── cli/
│   ├── commands/
│   │   ├── connect.ts
│   │   ├── deploy.ts
│   │   ├── export.ts
│   │   ├── workflow.ts
│   │   ├── hld.ts
│   │   └── compare.ts
│   ├── prompts/
│   │   ├── EnvironmentSelector.ts
│   │   ├── ConfirmationPrompt.ts
│   │   └── MultiSelect.ts
│   └── formatters/
│       ├── TableFormatter.ts
│       ├── DiffFormatter.ts
│       └── ProgressBar.ts
├── mcp/
│   ├── ShareDoMCPServer.ts
│   ├── tools/
│   │   ├── ExportTool.ts
│   │   ├── DeployTool.ts
│   │   ├── WorkflowTool.ts
│   │   └── HLDTool.ts
│   └── resources/
│       ├── WorkTypeResource.ts
│       └── EnvironmentResource.ts
└── orchestration/
    ├── BatchProcessor.ts
    ├── ComparisonEngine.ts
    └── DeploymentOrchestrator.ts
```

### CLI Commands Structure

#### Root Commands
```bash
sharedo [options] <command>

Options:
  -v, --version              Display version
  -h, --help                Display help
  --config <path>           Config file path
  --env <name>              Set active environment

Commands:
  connect                   Manage server connections
  export                    Export configurations
  deploy                    Deploy to environments
  workflow                  Workflow operations
  hld                      Generate HLD documents
  compare                   Compare configurations
  exec                     Execute operations
```

#### Connect Commands
```bash
sharedo connect <subcommand>

Subcommands:
  add                      Add new server connection
  list                     List all connections
  remove <alias>           Remove connection
  test <alias>             Test connection
  set-default <alias>      Set default connection
  version <alias>          Get server version info
  compare-versions         Compare versions across environments
```

#### Export Commands
```bash
sharedo export <type> [options]

Types:
  worktype <name>          Export work type
  workflow <name>          Export workflow
  form <name>              Export form
  all                      Export all configurations

Options:
  --env <name>             Environment (required)
  --output <path>          Output directory
  --format <type>          json|zip (default: zip)
  --include-deps           Include dependencies
  --async                  Async job monitoring
```

#### Deploy Commands
```bash
sharedo deploy <source> <targets...> [options]

Examples:
  sharedo deploy ./package.zip uat vnext
  sharedo deploy prod:matter uat:matter vnext:matter

Options:
  --confirm                Always confirm
  --no-confirm            Skip confirmation (non-prod only)
  --dry-run               Preview changes
  --rollback-on-error     Rollback on any error
  --parallel              Deploy in parallel
```

#### HLD Commands
```bash
sharedo hld generate <worktype> [options]

Options:
  --env <name>            Environment
  --template <type>       Template type
  --output <path>         Output path
  --format <type>         docx|pdf|md
  --all-templates         Generate all templates

Template Types:
  business-analyst
  system-admin
  support-consultant
  trainer
  cheat-sheet-<role>
```

#### Compare Commands
```bash
sharedo compare <type> <source> <target> [options]

Examples:
  # Same client, different environments
  sharedo compare worktype clientA-prod:matter clientA-uat:matter
  
  # Different clients, same environment type
  sharedo compare worktype clientA-vnext:matter clientB-vnext:matter
  
  # Cross-client, cross-environment
  sharedo compare workflow clientA-prod:onboarding clientB-uat:onboarding
  
  # Compare entire environments
  sharedo compare env clientA-prod clientA-uat --filter workflows
  
  # Compare full systems across clients
  sharedo compare system clientA-vnext clientB-vnext --components all
  
  # Compare specific IDE components
  sharedo compare ide clientA-uat:workflows/payment clientB-sit:workflows/payment

Options:
  --output <path>         Save comparison report
  --format <type>         json|html|md|excel
  --show-identical       Show identical items
  --filter <types>        Filter comparison (workflows|forms|worktypes|ide)
  --depth <level>         Comparison depth (shallow|deep|full)
  --ignore-fields <list>  Fields to ignore in comparison
```

### MCP Implementation

#### MCP Server
```typescript
class ShareDoMCPServer {
  constructor() {
    this.server = new Server({
      name: 'sharedo-mcp',
      version: '1.0.0'
    });
    
    this.registerTools();
    this.registerResources();
  }
  
  private registerTools() {
    // Export tool
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'sharedo_export',
          description: 'Export ShareDo configurations',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['worktype', 'workflow', 'form'] },
              name: { type: 'string' },
              environment: { type: 'string' },
              includeDependencies: { type: 'boolean' }
            },
            required: ['type', 'name', 'environment']
          }
        },
        {
          name: 'sharedo_deploy',
          description: 'Deploy configurations to ShareDo environments',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              targets: { type: 'array', items: { type: 'string' } },
              dryRun: { type: 'boolean' }
            },
            required: ['source', 'targets']
          }
        },
        {
          name: 'sharedo_hld',
          description: 'Generate HLD documentation',
          inputSchema: {
            type: 'object',
            properties: {
              workType: { type: 'string' },
              environment: { type: 'string' },
              template: { type: 'string' },
              format: { type: 'string', enum: ['docx', 'pdf', 'md'] }
            },
            required: ['workType', 'environment']
          }
        }
      ]
    }));
  }
  
  private registerResources() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'sharedo://environments',
          name: 'ShareDo Environments',
          mimeType: 'application/json'
        },
        {
          uri: 'sharedo://worktypes/{env}',
          name: 'Work Types by Environment',
          mimeType: 'application/json'
        }
      ]
    }));
  }
}
```

### Output Formatters

#### Table Formatter
```typescript
class TableFormatter {
  static formatWorkTypes(workTypes: IWorkType[]): string {
    const table = new Table({
      head: ['Name', 'System Name', 'Derived From', 'Created', 'Modified'],
      colWidths: [30, 30, 20, 15, 15]
    });
    
    workTypes.forEach(wt => {
      table.push([
        wt.name,
        wt.systemName,
        wt.derivedFrom || '-',
        this.formatDate(wt.created),
        this.formatDate(wt.modified)
      ]);
    });
    
    return table.toString();
  }
}
```

#### Diff Formatter
```typescript
class DiffFormatter {
  static formatComparison(diff: IDifference[]): string {
    const output: string[] = [];
    
    diff.forEach(d => {
      if (d.type === 'added') {
        output.push(chalk.green(`+ ${d.path}: ${d.value}`));
      } else if (d.type === 'removed') {
        output.push(chalk.red(`- ${d.path}: ${d.value}`));
      } else if (d.type === 'modified') {
        output.push(chalk.yellow(`~ ${d.path}:`));
        output.push(chalk.red(`  - ${d.oldValue}`));
        output.push(chalk.green(`  + ${d.newValue}`));
      }
    });
    
    return output.join('\n');
  }
}
```

---

## Security & Safety

### Production Safety Rules
1. **No Dangerous Mode in Production**
   - Hard-coded prevention
   - Cannot be overridden via config
   - Logged attempts trigger alerts

2. **Double Confirmation for Destructive Operations**
   - DELETE operations
   - Mass updates
   - Permission changes
   - Workflow deployments

3. **Audit Trail Requirements**
   - All operations logged
   - User, timestamp, operation, result
   - Immutable audit log
   - Export capability for compliance

### Authentication Security
1. **Token Storage**
   - Encrypted at rest
   - OS keychain integration where available
   - Memory-only option for high security

2. **Client Secret Management**
   - Never logged or displayed
   - Encrypted in config
   - Environment variable support
   - Rotation reminders

3. **Impersonation Controls**
   - Explicit user consent required
   - Logged with actual and impersonated user
   - Time-limited sessions

### Operation Safety
1. **Rollback Capability**
   - Snapshot before changes
   - Automatic rollback on error
   - Manual rollback command

2. **Dry Run Mode**
   - Preview all changes
   - No actual modifications
   - Detailed change report

3. **Rate Limiting**
   - Prevent API flooding
   - Configurable per environment
   - Automatic backoff

---

## Testing Strategy

### Unit Testing (Jest)
```typescript
// Example test structure
describe('EnvironmentManager', () => {
  describe('detectType', () => {
    it('should detect production environment', () => {
      const type = EnvironmentDetector.detectType('https://app.sharedo.com');
      expect(type).toBe('production');
    });
    
    it('should detect UAT environment', () => {
      const type = EnvironmentDetector.detectType('https://uat-app.sharedo.com');
      expect(type).toBe('uat');
    });
  });
  
  describe('requiresConfirmation', () => {
    it('should require confirmation for production', () => {
      const env = { type: 'production' } as IEnvironment;
      const result = manager.requiresConfirmation(env, operation);
      expect(result).toBe(true);
    });
  });
});
```

### Integration Testing
```typescript
describe('ExportService Integration', () => {
  it('should complete full export cycle', async () => {
    const service = new ExportService(testClient);
    
    const result = await service.exportWorkType('matter', {
      includeDependencies: true,
      format: 'zip'
    });
    
    expect(result).toHaveProperty('packagePath');
    expect(result).toHaveProperty('manifest');
    expect(result.manifest.components).toContain('workflows');
  });
});
```

### E2E Testing (Playwright)
```typescript
test('CLI export command', async () => {
  const result = await exec('sharedo export worktype matter --env uat');
  
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Export completed');
  expect(fs.existsSync('./exports/matter.zip')).toBe(true);
});
```

### Test Coverage Requirements
- Unit Tests: 80% minimum
- Integration Tests: Core workflows
- E2E Tests: Critical user journeys
- Performance Tests: Export/import operations

---

## Implementation Timeline

### Week 1: Foundation (All Agents)
**Agent 1: Core Infrastructure**
- Day 1-2: Environment management and detection
- Day 3-4: Authentication service with multi-environment support
- Day 5: Safety manager and confirmation workflows

**Agent 2: API Integration**
- Day 1-2: ShareDo client with interceptors
- Day 3-4: Basic API services (WorkType, Workflow)
- Day 5: Response transformers and error handling

**Agent 3: CLI Foundation**
- Day 1-2: CLI structure with Commander.js
- Day 3-4: Connect and environment commands
- Day 5: Output formatters and progress indicators

### Week 2: Core Features
**Agent 1: Advanced Infrastructure**
- Day 1-2: Token management with refresh
- Day 3: Audit logging system
- Day 4-5: Configuration validation and encryption

**Agent 2: Export & Services**
- Day 1-3: Complete export service with job monitoring
- Day 4-5: Workflow and Form services

**Agent 3: Core Commands**
- Day 1-2: Export commands
- Day 3-4: Deploy commands
- Day 5: Compare commands

### Week 3: Advanced Features
**Agent 1: Performance & Reliability**
- Day 1-2: Connection pooling
- Day 3: Retry logic and circuit breakers
- Day 4-5: Performance monitoring

**Agent 2: HLD & Documentation**
- Day 1-3: HLD generator with templates
- Day 4-5: Document services and batch operations

**Agent 3: MCP & Advanced CLI**
- Day 1-3: MCP server implementation
- Day 4: Batch command orchestration
- Day 5: Interactive wizards

### Week 4: Polish & Testing
**All Agents**
- Day 1-2: Integration testing
- Day 3: Bug fixes and optimization
- Day 4: Documentation
- Day 5: Final testing and release preparation

---

## Git Workflow for Three Agents

### Initial Setup
```bash
# Main branch
git clone https://github.com/your-org/sharedo-cli.git
cd sharedo-cli

# Agent 1 worktree
git worktree add ../sharedo-cli-core agent1-core-infrastructure

# Agent 2 worktree  
git worktree add ../sharedo-cli-api agent2-api-integration

# Agent 3 worktree
git worktree add ../sharedo-cli-commands agent3-cli-mcp
```

### Development Workflow
1. Each agent works in their worktree
2. Regular commits to feature branches
3. Daily integration to development branch
4. PR reviews between agents
5. Main merge after milestone completion

### Branch Strategy
```
main
├── development
│   ├── agent1-core-infrastructure
│   ├── agent2-api-integration
│   └── agent3-cli-mcp
└── release/v1.0.0
```

---

## Configuration Files

### sharedo.config.json
```json
{
  "version": "1.0.0",
  "defaultEnvironment": "uat",
  "environments": [
    {
      "alias": "production",
      "url": "https://app.sharedo.com",
      "type": "production",
      "auth": {
        "clientId": "${SHAREDO_PROD_CLIENT_ID}",
        "clientSecret": "${SHAREDO_PROD_CLIENT_SECRET}",
        "tokenEndpoint": "https://identity.sharedo.com/connect/token",
        "impersonateUser": "system@sharedo.com",
        "impersonateProvider": "ShareDo"
      },
      "safety": {
        "requireConfirmation": true,
        "allowDangerousMode": false,
        "auditLogging": true,
        "maxConcurrentOps": 1
      }
    },
    {
      "alias": "uat",
      "url": "https://uat-app.sharedo.com",
      "type": "uat",
      "auth": {
        "clientId": "sharedo-cli",
        "clientSecret": "${SHAREDO_UAT_SECRET}",
        "tokenEndpoint": "https://uat-identity.sharedo.com/connect/token",
        "impersonateUser": "cli@sharedo.com",
        "impersonateProvider": "ShareDo"
      },
      "safety": {
        "requireConfirmation": false,
        "allowDangerousMode": true,
        "auditLogging": false,
        "maxConcurrentOps": 5
      }
    }
  ],
  "export": {
    "defaultFormat": "zip",
    "cacheEnabled": true,
    "cacheDirectory": "~/.sharedo/cache",
    "jobTimeout": 120000
  },
  "hld": {
    "defaultFormat": "docx",
    "templatesDirectory": "~/.sharedo/templates",
    "outputDirectory": "./hld-output"
  },
  "logging": {
    "level": "info",
    "file": "~/.sharedo/logs/sharedo-cli.log",
    "maxFiles": 10,
    "maxSize": "10m"
  }
}
```

### Package Structure
```
sharedo-cli/
├── src/
│   ├── core/           # Agent 1 domain
│   ├── api/            # Agent 2 domain
│   ├── services/       # Agent 2 domain
│   ├── cli/            # Agent 3 domain
│   ├── mcp/            # Agent 3 domain
│   └── shared/         # Shared utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── API.md
│   ├── CLI.md
│   └── MCP.md
├── config/
│   └── default.json
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Success Criteria

### Functional Requirements
- ✅ Multi-environment management working
- ✅ Production safety controls enforced
- ✅ Export jobs completing successfully
- ✅ HLD generation for all templates
- ✅ Comparison between environments
- ✅ Batch deployments working
- ✅ MCP server responding to requests

### Non-Functional Requirements
- ✅ Export completes < 2 minutes
- ✅ HLD generation < 30 seconds
- ✅ CLI response time < 200ms
- ✅ Memory usage < 512MB
- ✅ 80% test coverage
- ✅ No security vulnerabilities

### Documentation Requirements
- ✅ Complete API documentation
- ✅ CLI command reference
- ✅ MCP integration guide
- ✅ Security best practices
- ✅ Deployment guide

---

## Appendix A: API Endpoints

### Core Endpoints
```
Authentication:
POST /connect/token

Work Types:
GET  /api/modeller/types
GET  /api/modeller/types/{systemName}
GET  /api/modeller/types/{systemName}/aspects
GET  /api/modeller/types/{systemName}/permissions
GET  /api/modeller/types/{systemName}/roles

Workflows:
GET  /api/workflows
GET  /api/workflows/{systemName}
POST /api/workflows/{systemName}/execute
GET  /api/workflows/{systemName}/instances

Export:
POST /api/modeller/importexport/export/package
GET  /api/modeller/importexport/export/package/{jobId}/progress
GET  /modeller/__importexport/export/package/{jobId}/download

Forms:
GET  /api/forms
GET  /api/forms/{id}
POST /api/forms
```

---

## Appendix B: Error Codes

### CLI Error Codes
```
0   - Success
1   - General error
2   - Authentication failed
3   - Network error
4   - Invalid configuration
5   - Operation cancelled
10  - Production safety violation
11  - Confirmation declined
20  - Export failed
21  - Export timeout
30  - Deploy failed
31  - Deploy rollback
```

### API Error Handling
```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
  
  static isRetryable(error: ApiError): boolean {
    return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
  }
}
```

---

## Appendix C: MCP Protocol

### Tool Execution Flow
```
Client -> MCP Server: Execute tool 'sharedo_export'
MCP Server -> CLI: Transform to CLI command
CLI -> ShareDo API: Execute export
ShareDo API -> CLI: Return results
CLI -> MCP Server: Format response
MCP Server -> Client: Return tool result
```

### Resource Access Flow
```
Client -> MCP Server: Get resource 'sharedo://worktypes/uat'
MCP Server -> EnvironmentManager: Get UAT connection
EnvironmentManager -> ShareDo API: Fetch work types
ShareDo API -> EnvironmentManager: Return data
EnvironmentManager -> MCP Server: Format as resource
MCP Server -> Client: Return resource content
```

---

## Conclusion

This specification provides a complete blueprint for implementing the ShareDo CLI and MCP integration. The three-agent approach allows for parallel development while maintaining clear boundaries and interfaces between components.

Key success factors:
1. Clear separation of concerns between agents
2. Well-defined interfaces and contracts
3. Comprehensive safety measures for production
4. Robust error handling and recovery
5. Extensive testing coverage
6. User-friendly CLI interface
7. Seamless MCP integration

The implementation should prioritize safety, reliability, and user experience while delivering powerful automation capabilities for the ShareDo platform.