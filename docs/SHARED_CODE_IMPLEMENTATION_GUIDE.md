# Shared Code Implementation Guide

## Overview

This guide provides detailed implementation instructions for creating a unified codebase that serves both the ShareDo CLI and VS Code extension, eliminating duplication and ensuring consistency.

## Repository Structure

```
sharedo-platform/
├── packages/
│   ├── core/                    # Core utilities and interfaces
│   │   ├── src/
│   │   │   ├── auth/            # Authentication logic
│   │   │   ├── api/             # API client implementations
│   │   │   ├── models/          # Data models and interfaces
│   │   │   ├── utils/           # Shared utilities
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── business/                 # Business logic layer
│   │   ├── src/
│   │   │   ├── workflow/        # Workflow management
│   │   │   ├── export/          # Export services
│   │   │   ├── execution/       # Execution engine
│   │   │   ├── forms/           # Form builder
│   │   │   ├── hld/             # HLD generation
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── platform-adapter/        # Platform abstraction layer
│   │   ├── src/
│   │   │   ├── interfaces/      # Platform interfaces
│   │   │   ├── base/            # Base implementations
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                     # CLI application
│   │   ├── src/
│   │   │   ├── commands/        # CLI commands
│   │   │   ├── adapters/        # CLI platform adapter
│   │   │   ├── utils/           # CLI utilities
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── vscode/                  # VS Code extension
│   │   ├── src/
│   │   │   ├── commands/        # VS Code commands
│   │   │   ├── adapters/        # VS Code platform adapter
│   │   │   ├── views/           # Tree views and UI
│   │   │   └── extension.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mcp/                     # MCP server
│       ├── src/
│       │   ├── server/          # MCP server implementation
│       │   ├── tools/           # MCP tools
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/                      # Build and deployment scripts
├── docs/                        # Documentation
├── examples/                    # Usage examples
├── tests/                       # Integration tests
├── .github/                     # GitHub Actions workflows
├── lerna.json                   # Monorepo configuration
├── package.json                 # Root package.json
├── tsconfig.base.json          # Base TypeScript config
└── README.md
```

## Core Package Implementation

### 1. Authentication Module (`@sharedo/core/auth`)

```typescript
// packages/core/src/auth/interfaces.ts
export interface IAuthConfig {
    tokenEndpoint: string;
    clientId: string;
    clientSecret?: string;
    scope?: string;
    impersonateUser?: string;
    impersonateProvider?: string;
}

export interface ITokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
}

export interface IAuthenticationService {
    authenticate(config: IAuthConfig): Promise<ITokenResponse>;
    refreshToken(refreshToken: string): Promise<ITokenResponse>;
    validateToken(token: string): Promise<boolean>;
    revokeToken(token: string): Promise<void>;
}

// packages/core/src/auth/authentication.service.ts
import axios from 'axios';
import { IAuthConfig, ITokenResponse, IAuthenticationService } from './interfaces';

export class AuthenticationService implements IAuthenticationService {
    private tokenCache: Map<string, ITokenResponse> = new Map();
    
    async authenticate(config: IAuthConfig): Promise<ITokenResponse> {
        const params = new URLSearchParams({
            grant_type: config.impersonateUser ? 'Impersonate.Specified' : 'client_credentials',
            scope: config.scope || 'sharedo',
            client_id: config.clientId
        });
        
        if (config.clientSecret) {
            params.append('client_secret', config.clientSecret);
        }
        
        if (config.impersonateUser) {
            params.append('impersonate_user', config.impersonateUser);
        }
        
        if (config.impersonateProvider) {
            params.append('impersonate_provider', config.impersonateProvider);
        }
        
        const response = await axios.post<ITokenResponse>(
            config.tokenEndpoint,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        // Cache the token
        const cacheKey = this.getCacheKey(config);
        this.tokenCache.set(cacheKey, response.data);
        
        return response.data;
    }
    
    async refreshToken(refreshToken: string): Promise<ITokenResponse> {
        // Implementation for token refresh
        throw new Error('Not implemented');
    }
    
    async validateToken(token: string): Promise<boolean> {
        // Simple JWT validation
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            const exp = payload.exp * 1000;
            
            return Date.now() < exp;
        } catch {
            return false;
        }
    }
    
    async revokeToken(token: string): Promise<void> {
        // Implementation for token revocation
        this.tokenCache.clear();
    }
    
    private getCacheKey(config: IAuthConfig): string {
        return `${config.clientId}:${config.impersonateUser || 'default'}`;
    }
}
```

### 2. API Client (`@sharedo/core/api`)

```typescript
// packages/core/src/api/base.client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IAuthenticationService } from '../auth';

export abstract class BaseApiClient {
    protected client: AxiosInstance;
    protected authService: IAuthenticationService;
    protected bearerToken?: string;
    
    constructor(
        baseURL: string,
        authService: IAuthenticationService,
        config?: AxiosRequestConfig
    ) {
        this.authService = authService;
        this.client = axios.create({
            baseURL,
            timeout: 30000,
            ...config
        });
        
        this.setupInterceptors();
    }
    
    private setupInterceptors(): void {
        // Request interceptor to add auth header
        this.client.interceptors.request.use(
            async (config) => {
                if (this.bearerToken) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${this.bearerToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        // Response interceptor for token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && this.bearerToken) {
                    // Token expired, try to refresh
                    // Implementation depends on refresh token availability
                }
                return Promise.reject(error);
            }
        );
    }
    
    public setBearerToken(token: string): void {
        this.bearerToken = token;
    }
}

// packages/core/src/api/workflow.client.ts
import { BaseApiClient } from './base.client';

export interface IWorkflow {
    systemName: string;
    name: string;
    description: string;
    steps: any[];
    variables: any[];
}

export class WorkflowApiClient extends BaseApiClient {
    async getWorkflows(): Promise<IWorkflow[]> {
        const response = await this.client.get('/api/public/workflows');
        return response.data.data || [];
    }
    
    async getWorkflow(systemName: string): Promise<IWorkflow> {
        const response = await this.client.get(`/api/public/workflows/${systemName}`);
        return response.data;
    }
    
    async createWorkflow(workflow: IWorkflow): Promise<void> {
        await this.client.post('/api/public/workflows', workflow);
    }
    
    async updateWorkflow(systemName: string, workflow: IWorkflow): Promise<void> {
        await this.client.put(`/api/public/workflows/${systemName}`, workflow);
    }
    
    async deleteWorkflow(systemName: string): Promise<void> {
        await this.client.delete(`/api/public/workflows/${systemName}`);
    }
}
```

### 3. Platform Adapter Interface (`@sharedo/platform-adapter`)

```typescript
// packages/platform-adapter/src/interfaces/platform.interface.ts
export interface IPlatform {
    // UI Operations
    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
    showProgress(title: string, cancellable?: boolean): IProgressReporter;
    prompt(message: string, options?: IPromptOptions): Promise<string | undefined>;
    selectFile(options?: IFileSelectOptions): Promise<string | undefined>;
    selectFolder(options?: IFolderSelectOptions): Promise<string | undefined>;
    
    // File Operations
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    fileExists(path: string): Promise<boolean>;
    deleteFile(path: string): Promise<void>;
    
    // Configuration
    getConfig<T>(key: string): T | undefined;
    setConfig<T>(key: string, value: T): Promise<void>;
    
    // Secrets
    getSecret(key: string): Promise<string | undefined>;
    setSecret(key: string, value: string): Promise<void>;
    deleteSecret(key: string): Promise<void>;
    
    // Process
    executeCommand(command: string, args?: string[]): Promise<ICommandResult>;
    openExternal(url: string): Promise<void>;
}

export interface IProgressReporter {
    report(progress: { message?: string; increment?: number }): void;
    complete(): void;
}

export interface IPromptOptions {
    placeholder?: string;
    password?: boolean;
    validateInput?: (value: string) => string | undefined;
}

export interface IFileSelectOptions {
    filters?: Record<string, string[]>;
    defaultPath?: string;
    multi?: boolean;
}

export interface IFolderSelectOptions {
    defaultPath?: string;
}

export interface ICommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
```

### 4. Business Logic Implementation (`@sharedo/business`)

```typescript
// packages/business/src/workflow/workflow.manager.ts
import { IPlatform } from '@sharedo/platform-adapter';
import { WorkflowApiClient, IWorkflow } from '@sharedo/core';
import * as path from 'path';

export class WorkflowManager {
    constructor(
        private platform: IPlatform,
        private apiClient: WorkflowApiClient
    ) {}
    
    async downloadWorkflow(systemName: string): Promise<void> {
        const progress = this.platform.showProgress('Downloading workflow...', true);
        
        try {
            progress.report({ message: 'Fetching from server...' });
            const workflow = await this.apiClient.getWorkflow(systemName);
            
            progress.report({ message: 'Validating workflow...', increment: 50 });
            await this.validateWorkflow(workflow);
            
            progress.report({ message: 'Saving to disk...', increment: 30 });
            const savePath = await this.platform.selectFolder({
                defaultPath: process.cwd()
            });
            
            if (!savePath) {
                throw new Error('No save location selected');
            }
            
            const filePath = path.join(savePath, `${systemName}.json`);
            await this.platform.writeFile(
                filePath,
                JSON.stringify(workflow, null, 2)
            );
            
            progress.report({ message: 'Complete!', increment: 20 });
            this.platform.showMessage(`Workflow saved to ${filePath}`, 'info');
            
        } catch (error) {
            this.platform.showMessage(
                `Failed to download workflow: ${error.message}`,
                'error'
            );
            throw error;
        } finally {
            progress.complete();
        }
    }
    
    async validateWorkflow(workflow: IWorkflow): Promise<boolean> {
        const errors: string[] = [];
        
        // Basic validation
        if (!workflow.systemName) {
            errors.push('Workflow must have a systemName');
        }
        
        if (!workflow.steps || workflow.steps.length === 0) {
            errors.push('Workflow must have at least one step');
        }
        
        // Check for start and end steps
        const hasStart = workflow.steps?.some(s => s.isStart);
        const hasEnd = workflow.steps?.some(s => s.isEnd);
        
        if (!hasStart) errors.push('Workflow must have a start step');
        if (!hasEnd) errors.push('Workflow must have an end step');
        
        if (errors.length > 0) {
            throw new Error(`Validation failed:\n${errors.join('\n')}`);
        }
        
        return true;
    }
    
    async compareWorkflows(workflow1: IWorkflow, workflow2: IWorkflow): Promise<IDiff[]> {
        // Implementation for workflow comparison
        const diffs: IDiff[] = [];
        
        // Compare basic properties
        if (workflow1.name !== workflow2.name) {
            diffs.push({
                path: 'name',
                type: 'modified',
                oldValue: workflow1.name,
                newValue: workflow2.name
            });
        }
        
        // Compare steps
        const steps1Map = new Map(workflow1.steps.map(s => [s.systemName, s]));
        const steps2Map = new Map(workflow2.steps.map(s => [s.systemName, s]));
        
        // Find added steps
        for (const [name, step] of steps2Map) {
            if (!steps1Map.has(name)) {
                diffs.push({
                    path: `steps.${name}`,
                    type: 'added',
                    newValue: step
                });
            }
        }
        
        // Find removed steps
        for (const [name, step] of steps1Map) {
            if (!steps2Map.has(name)) {
                diffs.push({
                    path: `steps.${name}`,
                    type: 'removed',
                    oldValue: step
                });
            }
        }
        
        return diffs;
    }
}

interface IDiff {
    path: string;
    type: 'added' | 'removed' | 'modified';
    oldValue?: any;
    newValue?: any;
}
```

## Platform-Specific Implementations

### VS Code Adapter

```typescript
// packages/vscode/src/adapters/vscode-platform.adapter.ts
import * as vscode from 'vscode';
import { IPlatform, IProgressReporter, IPromptOptions } from '@sharedo/platform-adapter';

export class VSCodePlatformAdapter implements IPlatform {
    constructor(private context: vscode.ExtensionContext) {}
    
    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void {
        switch (type) {
            case 'error':
                vscode.window.showErrorMessage(message);
                break;
            case 'warning':
                vscode.window.showWarningMessage(message);
                break;
            default:
                vscode.window.showInformationMessage(message);
        }
    }
    
    showProgress(title: string, cancellable?: boolean): IProgressReporter {
        let progressResolve: () => void;
        const progressPromise = new Promise<void>(resolve => {
            progressResolve = resolve;
        });
        
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
                cancellable: cancellable || false
            },
            async (progress) => {
                const reporter: IProgressReporter = {
                    report: (update) => {
                        progress.report({
                            message: update.message,
                            increment: update.increment
                        });
                    },
                    complete: () => {
                        progressResolve();
                    }
                };
                
                // Store reporter for external access
                (globalThis as any).__currentProgress = reporter;
                
                await progressPromise;
            }
        );
        
        return (globalThis as any).__currentProgress;
    }
    
    async prompt(message: string, options?: IPromptOptions): Promise<string | undefined> {
        if (options?.password) {
            return vscode.window.showInputBox({
                prompt: message,
                placeholder: options.placeholder,
                password: true,
                validateInput: options.validateInput
            });
        }
        
        return vscode.window.showInputBox({
            prompt: message,
            placeholder: options?.placeholder,
            validateInput: options?.validateInput
        });
    }
    
    async selectFile(options?: any): Promise<string | undefined> {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: options?.multi || false,
            filters: options?.filters
        });
        
        return result?.[0]?.fsPath;
    }
    
    async selectFolder(options?: any): Promise<string | undefined> {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false
        });
        
        return result?.[0]?.fsPath;
    }
    
    async readFile(path: string): Promise<string> {
        const uri = vscode.Uri.file(path);
        const data = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(data).toString('utf8');
    }
    
    async writeFile(path: string, content: string): Promise<void> {
        const uri = vscode.Uri.file(path);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
    }
    
    async fileExists(path: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.file(path);
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }
    
    async deleteFile(path: string): Promise<void> {
        const uri = vscode.Uri.file(path);
        await vscode.workspace.fs.delete(uri);
    }
    
    getConfig<T>(key: string): T | undefined {
        return vscode.workspace.getConfiguration('sharedo').get<T>(key);
    }
    
    async setConfig<T>(key: string, value: T): Promise<void> {
        await vscode.workspace.getConfiguration('sharedo').update(
            key,
            value,
            vscode.ConfigurationTarget.Global
        );
    }
    
    async getSecret(key: string): Promise<string | undefined> {
        return this.context.secrets.get(key);
    }
    
    async setSecret(key: string, value: string): Promise<void> {
        await this.context.secrets.store(key, value);
    }
    
    async deleteSecret(key: string): Promise<void> {
        await this.context.secrets.delete(key);
    }
    
    async executeCommand(command: string, args?: string[]): Promise<any> {
        // Use VS Code's terminal API or child_process
        throw new Error('Not implemented');
    }
    
    async openExternal(url: string): Promise<void> {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
}
```

### CLI Adapter

```typescript
// packages/cli/src/adapters/cli-platform.adapter.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IPlatform, IProgressReporter } from '@sharedo/platform-adapter';
import * as keytar from 'keytar';

const execAsync = promisify(exec);

export class CLIPlatformAdapter implements IPlatform {
    private serviceName = 'sharedo-cli';
    private configPath = path.join(process.env.HOME || '', '.sharedo', 'config.json');
    
    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void {
        switch (type) {
            case 'error':
                console.error(chalk.red('✖'), message);
                break;
            case 'warning':
                console.warn(chalk.yellow('⚠'), message);
                break;
            default:
                console.log(chalk.green('✓'), message);
        }
    }
    
    showProgress(title: string, cancellable?: boolean): IProgressReporter {
        const spinner = ora(title).start();
        
        return {
            report: (update) => {
                if (update.message) {
                    spinner.text = `${title}: ${update.message}`;
                }
            },
            complete: () => {
                spinner.succeed();
            }
        };
    }
    
    async prompt(message: string, options?: any): Promise<string | undefined> {
        const answers = await inquirer.prompt([{
            type: options?.password ? 'password' : 'input',
            name: 'value',
            message,
            default: options?.placeholder,
            validate: options?.validateInput
        }]);
        
        return answers.value;
    }
    
    async selectFile(options?: any): Promise<string | undefined> {
        const answers = await inquirer.prompt([{
            type: 'input',
            name: 'path',
            message: 'Enter file path:',
            default: options?.defaultPath || process.cwd(),
            validate: async (input) => {
                try {
                    const stats = await fs.stat(input);
                    if (!stats.isFile()) {
                        return 'Path must be a file';
                    }
                    return true;
                } catch {
                    return 'File does not exist';
                }
            }
        }]);
        
        return answers.path;
    }
    
    async selectFolder(options?: any): Promise<string | undefined> {
        const answers = await inquirer.prompt([{
            type: 'input',
            name: 'path',
            message: 'Enter folder path:',
            default: options?.defaultPath || process.cwd(),
            validate: async (input) => {
                try {
                    const stats = await fs.stat(input);
                    if (!stats.isDirectory()) {
                        return 'Path must be a directory';
                    }
                    return true;
                } catch {
                    return 'Directory does not exist';
                }
            }
        }]);
        
        return answers.path;
    }
    
    async readFile(path: string): Promise<string> {
        return fs.readFile(path, 'utf8');
    }
    
    async writeFile(path: string, content: string): Promise<void> {
        await fs.mkdir(path.dirname(path), { recursive: true });
        await fs.writeFile(path, content, 'utf8');
    }
    
    async fileExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
    
    async deleteFile(path: string): Promise<void> {
        await fs.unlink(path);
    }
    
    getConfig<T>(key: string): T | undefined {
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            return this.getNestedProperty(config, key);
        } catch {
            return undefined;
        }
    }
    
    async setConfig<T>(key: string, value: T): Promise<void> {
        let config = {};
        
        try {
            config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
        } catch {
            // Config doesn't exist yet
        }
        
        this.setNestedProperty(config, key, value);
        
        await fs.mkdir(path.dirname(this.configPath), { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    async getSecret(key: string): Promise<string | undefined> {
        return keytar.getPassword(this.serviceName, key) || undefined;
    }
    
    async setSecret(key: string, value: string): Promise<void> {
        await keytar.setPassword(this.serviceName, key, value);
    }
    
    async deleteSecret(key: string): Promise<void> {
        await keytar.deletePassword(this.serviceName, key);
    }
    
    async executeCommand(command: string, args?: string[]): Promise<any> {
        const fullCommand = args ? `${command} ${args.join(' ')}` : command;
        const result = await execAsync(fullCommand);
        
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: 0
        };
    }
    
    async openExternal(url: string): Promise<void> {
        const openCommand = process.platform === 'darwin' ? 'open' :
                          process.platform === 'win32' ? 'start' : 'xdg-open';
        
        await execAsync(`${openCommand} ${url}`);
    }
    
    private getNestedProperty(obj: any, key: string): any {
        return key.split('.').reduce((acc, part) => acc?.[part], obj);
    }
    
    private setNestedProperty(obj: any, key: string, value: any): void {
        const parts = key.split('.');
        const last = parts.pop()!;
        
        const target = parts.reduce((acc, part) => {
            if (!acc[part]) acc[part] = {};
            return acc[part];
        }, obj);
        
        target[last] = value;
    }
}
```

## Integration Examples

### VS Code Extension Command

```typescript
// packages/vscode/src/commands/workflow.commands.ts
import * as vscode from 'vscode';
import { WorkflowManager } from '@sharedo/business';
import { WorkflowApiClient, AuthenticationService } from '@sharedo/core';
import { VSCodePlatformAdapter } from '../adapters/vscode-platform.adapter';

export function registerWorkflowCommands(context: vscode.ExtensionContext) {
    const platform = new VSCodePlatformAdapter(context);
    const authService = new AuthenticationService();
    const apiClient = new WorkflowApiClient('https://api.sharedo.com', authService);
    const workflowManager = new WorkflowManager(platform, apiClient);
    
    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.downloadWorkflow', async () => {
            const name = await platform.prompt('Enter workflow name:');
            if (name) {
                await workflowManager.downloadWorkflow(name);
            }
        })
    );
}
```

### CLI Command

```typescript
// packages/cli/src/commands/workflow.command.ts
import { Command } from 'commander';
import { WorkflowManager } from '@sharedo/business';
import { WorkflowApiClient, AuthenticationService } from '@sharedo/core';
import { CLIPlatformAdapter } from '../adapters/cli-platform.adapter';

export function createWorkflowCommand(): Command {
    const command = new Command('workflow');
    const platform = new CLIPlatformAdapter();
    const authService = new AuthenticationService();
    const apiClient = new WorkflowApiClient('https://api.sharedo.com', authService);
    const workflowManager = new WorkflowManager(platform, apiClient);
    
    command
        .command('download <name>')
        .description('Download a workflow from the server')
        .action(async (name: string) => {
            await workflowManager.downloadWorkflow(name);
        });
    
    command
        .command('validate <file>')
        .description('Validate a workflow file')
        .action(async (file: string) => {
            const content = await platform.readFile(file);
            const workflow = JSON.parse(content);
            await workflowManager.validateWorkflow(workflow);
        });
    
    return command;
}
```

## Testing Strategy

### Unit Tests for Core Logic

```typescript
// packages/business/src/workflow/__tests__/workflow.manager.test.ts
import { WorkflowManager } from '../workflow.manager';
import { MockPlatform, MockApiClient } from '@sharedo/testing';

describe('WorkflowManager', () => {
    let platform: MockPlatform;
    let apiClient: MockApiClient;
    let manager: WorkflowManager;
    
    beforeEach(() => {
        platform = new MockPlatform();
        apiClient = new MockApiClient();
        manager = new WorkflowManager(platform, apiClient);
    });
    
    describe('downloadWorkflow', () => {
        it('should download and save workflow', async () => {
            const mockWorkflow = {
                systemName: 'test-workflow',
                name: 'Test Workflow',
                steps: [
                    { systemName: 'start', isStart: true },
                    { systemName: 'end', isEnd: true }
                ]
            };
            
            apiClient.setMockResponse('getWorkflow', mockWorkflow);
            platform.setMockResponse('selectFolder', '/test/path');
            
            await manager.downloadWorkflow('test-workflow');
            
            expect(platform.writeFile).toHaveBeenCalledWith(
                '/test/path/test-workflow.json',
                JSON.stringify(mockWorkflow, null, 2)
            );
        });
    });
});
```

## Migration Plan

### Phase 1: Setup (Week 1)
1. Create monorepo structure
2. Configure Lerna/Yarn workspaces
3. Setup base TypeScript configs
4. Configure build pipelines

### Phase 2: Core Extraction (Week 2-3)
1. Extract authentication logic
2. Extract API clients
3. Extract data models
4. Create platform adapter interfaces

### Phase 3: Business Logic (Week 4-5)
1. Extract workflow management
2. Extract export services
3. Extract HLD generation
4. Extract form builder logic

### Phase 4: Platform Implementation (Week 6-7)
1. Implement VS Code adapter
2. Implement CLI adapter
3. Create platform-specific commands
4. Update existing code to use shared packages

### Phase 5: Testing & Documentation (Week 8)
1. Write comprehensive tests
2. Update documentation
3. Create migration guide
4. Performance optimization

## Benefits Summary

### Development Efficiency
- **50% reduction** in code duplication
- **Single source of truth** for business logic
- **Faster feature development** - implement once, deploy everywhere
- **Easier maintenance** - fix bugs in one place

### Quality Improvements
- **Better test coverage** - shared test suites
- **Consistent behavior** across platforms
- **Reduced regression risk** - changes tested everywhere
- **Improved type safety** - shared TypeScript definitions

### User Experience
- **Consistent interfaces** between CLI and VS Code
- **Seamless workflow** transitions
- **Unified documentation** and help
- **Better performance** through shared optimizations

## Conclusion

This implementation guide provides a clear path to unifying the ShareDo CLI and VS Code extension codebases. By following this architecture:

1. **80% of code is shared** between platforms
2. **Platform-specific code is isolated** in adapters
3. **Business logic remains platform-agnostic**
4. **Testing is simplified** through shared test suites
5. **Future platforms** (web, mobile) can be easily added

The investment in this unified architecture will pay dividends in reduced maintenance, faster development, and improved user experience across all ShareDo tools.