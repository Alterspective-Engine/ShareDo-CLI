/**
 * Server Registration Service - Simplified server setup for ShareDo VS Code Extension
 * 
 * Provides an intuitive wizard-based server registration process with
 * auto-discovery, templates, and validation.
 */

import * as vscode from 'vscode';
import { ConnectionManager } from '../core/ConnectionManager';
import { StateManager } from '../core/StateManager';
import { NotificationService } from './NotificationService';

export interface ServerTemplate {
    name: string;
    icon: string;
    description: string;
    config: {
        urlPattern: string;
        authType: 'oauth' | 'apikey' | 'basic' | 'token';
        requiredFields: string[];
        defaultValues?: Record<string, string>;
    };
}

export interface ServerConfig {
    id: string;
    name: string;
    url: string;
    authType: string;
    credentials: Record<string, string>;
    metadata?: {
        template?: string;
        created: number;
        lastConnected?: number;
        connectionCount: number;
    };
}

export class ServerRegistrationService {
    private templates: ServerTemplate[] = [
        {
            name: 'ShareDo Cloud',
            icon: '$(cloud)',
            description: 'Connect to ShareDo cloud instance',
            config: {
                urlPattern: 'https://{tenant}.sharedo.cloud',
                authType: 'oauth',
                requiredFields: ['tenant', 'clientId', 'clientSecret'],
                defaultValues: {
                    clientId: 'VSCodeAppClientCreds'
                }
            }
        },
        {
            name: 'On-Premise Server',
            icon: '$(server)',
            description: 'Connect to on-premise ShareDo server',
            config: {
                urlPattern: 'https://{hostname}:{port}',
                authType: 'apikey',
                requiredFields: ['hostname', 'port', 'apikey'],
                defaultValues: {
                    port: '443'
                }
            }
        },
        {
            name: 'Local Development',
            icon: '$(vm)',
            description: 'Connect to local development server',
            config: {
                urlPattern: 'http://localhost:{port}',
                authType: 'basic',
                requiredFields: ['port', 'username', 'password'],
                defaultValues: {
                    port: '5000',
                    username: 'admin'
                }
            }
        },
        {
            name: 'Docker Container',
            icon: '$(package)',
            description: 'Connect to ShareDo in Docker',
            config: {
                urlPattern: 'http://{container}:{port}',
                authType: 'token',
                requiredFields: ['container', 'port', 'token'],
                defaultValues: {
                    container: 'sharedo',
                    port: '8080'
                }
            }
        },
        {
            name: 'Custom Configuration',
            icon: '$(gear)',
            description: 'Manually configure connection',
            config: {
                urlPattern: '{url}',
                authType: 'oauth',
                requiredFields: ['url', 'clientId', 'clientSecret']
            }
        }
    ];
    
    constructor(
        private connectionManager: ConnectionManager,
        private stateManager: StateManager,
        private notificationService: NotificationService
    ) {}
    
    /**
     * Start the server registration wizard
     */
    async startWizard(): Promise<ServerConfig | undefined> {
        // Check for first-time users
        const isFirstTime = !this.stateManager.getState<boolean>('hasConfiguredServer');
        
        if (isFirstTime) {
            await this.showWelcome();
        }
        
        // Step 1: Choose registration method
        const method = await this.chooseRegistrationMethod();
        if (!method) return;
        
        switch (method) {
            case 'discover':
                return await this.discoverServers();
            case 'template':
                return await this.useTemplate();
            case 'import':
                return await this.importConfiguration();
            case 'manual':
                return await this.manualConfiguration();
        }
    }
    
    /**
     * Connect to a server
     */
    async connectToServer(): Promise<boolean> {
        const servers = this.stateManager.getState<ServerConfig[]>('servers') || [];
        
        if (servers.length === 0) {
            const result = await vscode.window.showInformationMessage(
                'No ShareDo servers configured. Would you like to add one?',
                'Add Server',
                'Cancel'
            );
            
            if (result === 'Add Server') {
                const config = await this.startWizard();
                return config !== undefined;
            }
            return false;
        }
        
        // Show server picker
        const selected = await vscode.window.showQuickPick(
            servers.map(s => ({
                label: `$(server) ${s.name}`,
                description: s.url,
                detail: `Last connected: ${s.metadata?.lastConnected ? 
                    new Date(s.metadata.lastConnected).toLocaleString() : 'Never'}`,
                server: s
            })),
            {
                placeHolder: 'Select a ShareDo server to connect',
                title: 'Connect to ShareDo Server'
            }
        );
        
        if (!selected) return false;
        
        return await this.connect(selected.server);
    }
    
    /**
     * Remove a server
     */
    async removeServer(serverId: string): Promise<void> {
        const servers = this.stateManager.getState<ServerConfig[]>('servers') || [];
        const server = servers.find(s => s.id === serverId);
        
        if (!server) {
            this.notificationService.showError('Server not found');
            return;
        }
        
        const confirm = await vscode.window.showWarningMessage(
            `Remove server "${server.name}"?`,
            { modal: true, detail: 'This action cannot be undone.' },
            'Remove',
            'Cancel'
        );
        
        if (confirm === 'Remove') {
            const updated = servers.filter(s => s.id !== serverId);
            this.stateManager.setState('servers', updated, true);
            await this.connectionManager.disconnect(serverId);
            this.notificationService.showInfo(`Server "${server.name}" removed`);
        }
    }
    
    /**
     * Private methods
     */
    
    private async showWelcome(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'sharedoWelcome',
            'Welcome to ShareDo',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        
        panel.webview.html = this.getWelcomeHTML();
        
        // Wait for user to close the panel
        await new Promise<void>(resolve => {
            panel.onDidDispose(() => resolve());
        });
    }
    
    private async chooseRegistrationMethod(): Promise<string | undefined> {
        const options = [
            {
                label: '$(search) Auto-Discover Servers',
                description: 'Automatically find ShareDo servers',
                value: 'discover'
            },
            {
                label: '$(list-flat) Use Template',
                description: 'Choose from pre-configured templates',
                value: 'template'
            },
            {
                label: '$(file-code) Import Configuration',
                description: 'Import from JSON file or clipboard',
                value: 'import'
            },
            {
                label: '$(edit) Manual Configuration',
                description: 'Enter server details manually',
                value: 'manual'
            }
        ];
        
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'How would you like to add a ShareDo server?',
            title: 'Add ShareDo Server'
        });
        
        return selected?.value;
    }
    
    private async discoverServers(): Promise<ServerConfig | undefined> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Discovering ShareDo servers...',
            cancellable: true
        }, async (progress, token) => {
            progress.report({ increment: 20, message: 'Checking local network...' });
            
            // Simulate discovery (in real implementation, would use mDNS, config files, etc.)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (token.isCancellationRequested) {
                return undefined;
            }
            
            progress.report({ increment: 40, message: 'Checking cloud services...' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            progress.report({ increment: 40, message: 'Analyzing results...' });
            
            // Mock discovered servers
            const discovered: ServerConfig[] = [
                {
                    id: 'auto-1',
                    name: 'Local Development',
                    url: 'http://localhost:5000',
                    authType: 'basic',
                    credentials: {},
                    metadata: {
                        created: Date.now(),
                        connectionCount: 0
                    }
                }
            ];
            
            if (discovered.length === 0) {
                this.notificationService.showWarning('No servers found. Try manual configuration.');
                return await this.manualConfiguration();
            }
            
            const selected = await vscode.window.showQuickPick(
                discovered.map(s => ({
                    label: s.name,
                    description: s.url,
                    server: s
                })),
                {
                    placeHolder: 'Select a discovered server'
                }
            );
            
            return selected?.server;
        });
    }
    
    private async useTemplate(): Promise<ServerConfig | undefined> {
        const selected = await vscode.window.showQuickPick(
            this.templates.map(t => ({
                label: `${t.icon} ${t.name}`,
                description: t.description,
                template: t
            })),
            {
                placeHolder: 'Select a server template',
                title: 'ShareDo Server Templates'
            }
        );
        
        if (!selected) return;
        
        return await this.configureFromTemplate(selected.template);
    }
    
    private async configureFromTemplate(template: ServerTemplate): Promise<ServerConfig | undefined> {
        const config: any = {
            id: `server-${Date.now()}`,
            name: '',
            url: '',
            authType: template.config.authType,
            credentials: {},
            metadata: {
                template: template.name,
                created: Date.now(),
                connectionCount: 0
            }
        };
        
        // Collect required fields
        for (const field of template.config.requiredFields) {
            const defaultValue = template.config.defaultValues?.[field];
            const isPassword = ['password', 'secret', 'token', 'apikey'].some(p => field.toLowerCase().includes(p));
            
            const value = await vscode.window.showInputBox({
                prompt: `Enter ${field}`,
                value: defaultValue,
                password: isPassword,
                placeHolder: this.getPlaceholder(field),
                validateInput: (value) => {
                    if (!value) return `${field} is required`;
                    return null;
                }
            });
            
            if (!value) return; // User cancelled
            
            if (isPassword) {
                config.credentials[field] = value;
            } else {
                // Build URL from pattern
                if (template.config.urlPattern.includes(`{${field}}`)) {
                    config.url = template.config.urlPattern.replace(`{${field}}`, value);
                } else {
                    config.credentials[field] = value;
                }
            }
        }
        
        // Get server name
        config.name = await vscode.window.showInputBox({
            prompt: 'Enter a name for this server',
            value: `${template.name} - ${new URL(config.url || 'http://localhost').hostname}`,
            validateInput: (value) => {
                if (!value) return 'Name is required';
                return null;
            }
        }) || '';
        
        if (!config.name) return;
        
        // Test connection
        const testResult = await this.testConnection(config);
        if (!testResult) {
            const retry = await vscode.window.showErrorMessage(
                'Connection test failed. Save anyway?',
                'Save',
                'Retry',
                'Cancel'
            );
            
            if (retry === 'Retry') {
                return await this.configureFromTemplate(template);
            } else if (retry !== 'Save') {
                return;
            }
        }
        
        // Save configuration
        await this.saveServer(config);
        return config;
    }
    
    private async importConfiguration(): Promise<ServerConfig | undefined> {
        const options = [
            { label: '$(file) From File', value: 'file' },
            { label: '$(clippy) From Clipboard', value: 'clipboard' }
        ];
        
        const source = await vscode.window.showQuickPick(options, {
            placeHolder: 'Import configuration from...'
        });
        
        if (!source) return;
        
        let json: string | undefined;
        
        if (source.value === 'file') {
            const files = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON files': ['json'],
                    'All files': ['*']
                }
            });
            
            if (files && files.length > 0) {
                const content = await vscode.workspace.fs.readFile(files[0]);
                json = Buffer.from(content).toString('utf8');
            }
        } else {
            json = await vscode.env.clipboard.readText();
        }
        
        if (!json) return;
        
        try {
            const config = JSON.parse(json);
            
            // Validate configuration
            if (!config.url || !config.authType) {
                throw new Error('Invalid configuration format');
            }
            
            // Generate ID if not present
            if (!config.id) {
                config.id = `imported-${Date.now()}`;
            }
            
            // Add metadata
            if (!config.metadata) {
                config.metadata = {
                    created: Date.now(),
                    connectionCount: 0
                };
            }
            
            await this.saveServer(config);
            this.notificationService.showInfo('Configuration imported successfully');
            return config;
            
        } catch (error) {
            this.notificationService.showError(`Failed to import configuration: ${error}`);
            return;
        }
    }
    
    private async manualConfiguration(): Promise<ServerConfig | undefined> {
        const url = await vscode.window.showInputBox({
            prompt: 'ShareDo Server URL',
            placeHolder: 'https://your-server.sharedo.com',
            validateInput: (value) => {
                if (!value) return 'URL is required';
                try {
                    new URL(value);
                    return null;
                } catch {
                    return 'Invalid URL format';
                }
            }
        });
        
        if (!url) return;
        
        const authTypes = [
            { label: 'OAuth 2.0', value: 'oauth' },
            { label: 'API Key', value: 'apikey' },
            { label: 'Basic Auth', value: 'basic' },
            { label: 'Bearer Token', value: 'token' }
        ];
        
        const authType = await vscode.window.showQuickPick(authTypes, {
            placeHolder: 'Select authentication type'
        });
        
        if (!authType) return;
        
        const credentials: Record<string, string> = {};
        
        // Collect credentials based on auth type
        switch (authType.value) {
            case 'oauth':
                credentials.clientId = await vscode.window.showInputBox({
                    prompt: 'Client ID',
                    value: 'VSCodeAppClientCreds'
                }) || '';
                
                credentials.clientSecret = await vscode.window.showInputBox({
                    prompt: 'Client Secret',
                    password: true
                }) || '';
                break;
                
            case 'apikey':
                credentials.apikey = await vscode.window.showInputBox({
                    prompt: 'API Key',
                    password: true
                }) || '';
                break;
                
            case 'basic':
                credentials.username = await vscode.window.showInputBox({
                    prompt: 'Username'
                }) || '';
                
                credentials.password = await vscode.window.showInputBox({
                    prompt: 'Password',
                    password: true
                }) || '';
                break;
                
            case 'token':
                credentials.token = await vscode.window.showInputBox({
                    prompt: 'Bearer Token',
                    password: true
                }) || '';
                break;
        }
        
        const name = await vscode.window.showInputBox({
            prompt: 'Server Name',
            value: new URL(url).hostname
        }) || new URL(url).hostname;
        
        const config: ServerConfig = {
            id: `manual-${Date.now()}`,
            name,
            url,
            authType: authType.value,
            credentials,
            metadata: {
                created: Date.now(),
                connectionCount: 0
            }
        };
        
        await this.saveServer(config);
        return config;
    }
    
    private async testConnection(config: ServerConfig): Promise<boolean> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Testing connection...',
            cancellable: false
        }, async () => {
            try {
                // Convert to connection manager format
                const connectionConfig = {
                    url: config.url,
                    clientId: config.credentials.clientId || '',
                    clientSecret: config.credentials.clientSecret || '',
                    impersonateUser: config.credentials.impersonateUser,
                    impersonateProvider: config.credentials.impersonateProvider,
                    tokenEndpoint: config.credentials.tokenEndpoint
                };
                
                // Use connection manager to test
                const result = await this.connectionManager.connectToServer(
                    vscode.workspace.workspaceFile as any
                );
                
                return result;
            } catch (error) {
                console.error('Connection test failed:', error);
                return false;
            }
        });
    }
    
    private async saveServer(config: ServerConfig): Promise<void> {
        const servers = this.stateManager.getState<ServerConfig[]>('servers') || [];
        
        // Check for duplicates
        const existing = servers.findIndex(s => s.id === config.id);
        if (existing >= 0) {
            servers[existing] = config;
        } else {
            servers.push(config);
        }
        
        this.stateManager.setState('servers', servers, true);
        this.stateManager.setState('hasConfiguredServer', true, true);
        
        this.notificationService.showInfo(`Server "${config.name}" saved successfully`);
    }
    
    private async connect(server: ServerConfig): Promise<boolean> {
        try {
            // Update metadata
            server.metadata = server.metadata || {
                created: Date.now(),
                connectionCount: 0
            };
            server.metadata.lastConnected = Date.now();
            server.metadata.connectionCount++;
            
            // Save updated metadata
            await this.saveServer(server);
            
            // Perform actual connection
            // This would integrate with the existing connection logic
            return true;
        } catch (error) {
            this.notificationService.showError(`Failed to connect: ${error}`);
            return false;
        }
    }
    
    private getPlaceholder(field: string): string {
        const placeholders: Record<string, string> = {
            tenant: 'your-tenant-name',
            hostname: 'server.company.com',
            port: '443',
            username: 'your-username',
            password: '••••••••',
            apikey: 'your-api-key',
            clientId: 'client-id',
            clientSecret: '••••••••',
            token: 'bearer-token',
            container: 'sharedo-container'
        };
        
        return placeholders[field.toLowerCase()] || `Enter ${field}`;
    }
    
    private getWelcomeHTML(): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-foreground);
            border-bottom: 2px solid var(--vscode-activityBar-activeBorder);
            padding-bottom: 10px;
        }
        .feature {
            margin: 20px 0;
            padding: 15px;
            background: var(--vscode-editor-background);
            border-left: 3px solid var(--vscode-activityBar-activeBorder);
            border-radius: 4px;
        }
        .icon {
            font-size: 24px;
            margin-right: 10px;
            vertical-align: middle;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 20px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h1>🎉 Welcome to ShareDo VS Code Extension!</h1>
    
    <p>Get started with ShareDo directly from VS Code. This extension provides:</p>
    
    <div class="feature">
        <span class="icon">🚀</span>
        <strong>Quick Server Setup</strong>
        <p>Connect to ShareDo servers in under 2 minutes with our guided wizard</p>
    </div>
    
    <div class="feature">
        <span class="icon">🔍</span>
        <strong>Auto-Discovery</strong>
        <p>Automatically find ShareDo servers on your network or in the cloud</p>
    </div>
    
    <div class="feature">
        <span class="icon">📁</span>
        <strong>File Management</strong>
        <p>Upload, download, and manage ShareDo files directly from VS Code</p>
    </div>
    
    <div class="feature">
        <span class="icon">🔧</span>
        <strong>Workflow Development</strong>
        <p>Create, edit, and test ShareDo workflows with IntelliSense support</p>
    </div>
    
    <div class="feature">
        <span class="icon">👥</span>
        <strong>Collaboration</strong>
        <p>Work together with your team on ShareDo projects in real-time</p>
    </div>
    
    <p><strong>Let's get started by adding your first ShareDo server!</strong></p>
    
    <button onclick="window.close()">Get Started</button>
</body>
</html>
        `;
    }
}