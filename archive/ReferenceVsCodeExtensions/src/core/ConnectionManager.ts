/**
 * Connection Manager for ShareDo VS Code Extension
 *
 * This module provides centralized connection management functionality for ShareDo servers,
 * including authentication, server validation, and connection lifecycle management.
 *
 * @responsibilities
 * - Handle ShareDo server authentication workflows
 * - Manage connection configuration and validation
 * - Provide connection status monitoring and reporting
 * - Handle connection errors and recovery scenarios
 *
 * @architecture
 * - Encapsulates all connection-related business logic
 * - Provides async/await patterns for connection operations
 * - Implements proper error handling and user feedback
 * - Maintains connection state and metadata
 *
 * @author ShareDo Team
 * @version 0.8.1
 */

import * as vscode from 'vscode';
import { SharedoClient } from '../sharedoClient';
import { SharedoEnvironments } from '../environments';
import { Settings } from '../settings';
import { Inform } from '../Utilities/inform';
import { StateManager } from './StateManager';
import { EventBus } from './EventBus';

/**
 * Interface for ShareDo connection configuration
 */
export interface IConnectionConfig {
    url: string;
    clientId: string;
    clientSecret: string;
    impersonateUser?: string;
    impersonateProvider?: string;
    tokenEndpoint?: string;
}

/**
 * Interface for connection validation results
 */
export interface IConnectionValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    performanceMetrics?: {
        authenticationTime: number;
        totalTime: number;
    };
}

/**
 * Central manager for ShareDo server connections
 */
export class ConnectionManager {
    private settings?: Settings;
    private environments?: SharedoEnvironments;
    private activeConnections = new Map<string, SharedoClient>();
    
    constructor(
        private stateManager: StateManager,
        private eventBus: EventBus
    ) {
        this.initialize();
    }

    /**
     * Initialize the connection manager
     */
    async initialize(): Promise<void> {
        // Load saved connections from state
        const savedConnections = this.stateManager.getState<any[]>('connections') || [];
        
        // Subscribe to connection events
        this.eventBus.on('connection.requested', (config) => this.handleConnectionRequest(config));
        this.eventBus.on('connection.closed', (serverId) => this.handleConnectionClosed(serverId));
    }
    
    /**
     * Set legacy dependencies (for backward compatibility)
     */
    public setLegacyDependencies(settings: Settings, environments: SharedoEnvironments): void {
        this.settings = settings;
        this.environments = environments;
    }

    /**
     * Establishes a new connection to a ShareDo server with guided setup
     * 
     * @param context - VS Code extension context for UI operations
     * @returns Promise resolving to connection success status
     */
    public async connectToServer(context: vscode.ExtensionContext): Promise<boolean> {
        try {
            const startTime = Date.now();
            
            // Collect connection configuration from user
            const config = await this.collectConnectionConfig();
            if (!config) {
                return false; // User cancelled
            }

            // Create and configure ShareDo client
            const client = this.createClientFromConfig(config);
            
            // Authenticate and validate connection
            const validationResult = await this.validateConnection(client);
            if (!validationResult.isValid) {
                this.showValidationErrors(validationResult);
                return false;
            }

            // Add or update server in environments
            await this.addOrUpdateServer(client);
            
            // Report success with performance metrics
            const totalTime = Date.now() - startTime;
            this.reportConnectionSuccess(client, totalTime, validationResult.performanceMetrics);
            
            return true;
        } catch (error) {
            this.handleConnectionError(error);
            return false;
        }
    }

    /**
     * Validates an existing connection configuration
     * 
     * @param client - ShareDo client to validate
     * @returns Promise resolving to validation results
     */
    public async validateConnection(client: SharedoClient): Promise<IConnectionValidationResult> {
        const result: IConnectionValidationResult = {
            isValid: false,
            errors: [],
            warnings: []
        };

        try {
            // Test basic connectivity
            if (!this.isValidUrl(client.url)) {
                result.errors.push('Invalid server URL format');
                return result;
            }

            // Test authentication
            Inform.writeInfo(`Testing authentication to ${client.url}`);
            const authStart = Date.now();
            
            await client.getBearer();
            
            const authTime = Date.now() - authStart;
            result.performanceMetrics = {
                authenticationTime: authTime,
                totalTime: authTime
            };

            result.isValid = true;
            Inform.writeInfo(`Connection validated successfully in ${authTime}ms`);
            
        } catch (error: any) {
            const detailedError = this.parseConnectionError(error, client);
            result.errors.push(detailedError);
            Inform.writeError(`Connection validation failed: ${error}`);
        }

        return result;
    }

    /**
     * Parses connection errors and provides user-friendly error messages
     * 
     * @param error - The error object from the connection attempt
     * @param client - The ShareDo client being used
     * @returns User-friendly error message
     */
    private parseConnectionError(error: any, client: SharedoClient): string {
        // Handle Axios errors specifically
        if (error.response) {
            const status = error.response.status;
            const statusText = error.response.statusText;
            
            switch (status) {
                case 400:
                    // Get the current token endpoint being used
                    const tokenEndpoint = client.tokenEndpoint || this.calculateIdentityUrl(client.url);
                    
                    // Check for common issues
                    let specificGuidance = '';
                    
                    // Check for double slash issue
                    if (tokenEndpoint.includes('//connect/token')) {
                        specificGuidance += '\n🔍 DETECTED ISSUE: Double slash in token endpoint URL\n';
                    }
                    
                    // Check for non-standard client ID
                    if (client.clientId && client.clientId !== 'VSCodeAppClientCreds' && !client.clientId.includes('VSCode')) {
                        specificGuidance += `\n🔍 DETECTED ISSUE: Unusual client ID "${client.clientId}"\n` +
                            `Expected format is usually "VSCodeAppClientCreds" or similar.\n`;
                    }

                    return `Bad Request (400): The server rejected the connection request.${specificGuidance}

📋 CURRENT CONFIGURATION:
• Server URL: "${client.url}"
• Client ID: "${client.clientId}"
• Token Endpoint: "${tokenEndpoint}"
• Client Secret: ${client.clientSecret ? '[PROVIDED]' : '[MISSING]'}

🔧 TROUBLESHOOTING STEPS:

1. VERIFY CLIENT CONFIGURATION:
   • Ensure client ID "${client.clientId}" exists in ShareDo server
   • Common client IDs: "VSCodeAppClientCreds", "VSCode Extension", "IDE Client"
   • Check ShareDo admin panel > Security > OAuth Clients

2. CHECK CLIENT SECRET:
   • Verify the client secret is correct and not expired
   • Client secret should not be empty
   • Copy secret directly from ShareDo admin panel

3. VERIFY TOKEN ENDPOINT:
   Current: "${tokenEndpoint}"
   Expected format: "https://[server-name]-identity.sharedo.tech/connect/token"
   
   If URL looks wrong, try manually setting the token endpoint.

4. COMMON SOLUTIONS:
   • Use client ID "VSCodeAppClientCreds" (most common)
   • Ensure ShareDo server has OAuth client configured
   • Check server URL doesn't have trailing slashes
   • Verify you're connecting to the correct environment (test/prod)

5. CONTACT ADMIN IF NEEDED:
   • Ask ShareDo administrator to verify OAuth client "${client.clientId}"
   • Request client secret if expired
   • Confirm correct server URL and identity server configuration`;

                case 401:
                    return `Unauthorized (401): Authentication failed. Please check:
• Client Secret is correct and not expired
• Client ID "${client.clientId}" has proper permissions
• Your ShareDo server configuration allows this client`;

                case 403:
                    return `Forbidden (403): Access denied. The client "${client.clientId}" may not have permission to access this ShareDo server.`;

                case 404:
                    return `Not Found (404): The authentication endpoint was not found at:
"${client.tokenEndpoint || this.calculateIdentityUrl(client.url)}"

Please verify:
• The server URL "${client.url}" is correct
• The ShareDo server is running and accessible
• The identity server is configured properly`;

                case 500:
                    return `Server Error (500): The ShareDo server encountered an internal error. Please:
• Check the ShareDo server logs
• Verify the server is running properly
• Contact your ShareDo administrator`;

                case 502:
                case 503:
                case 504:
                    return `Service Unavailable (${status}): The ShareDo server is temporarily unavailable. Please:
• Check if the server is running
• Verify network connectivity
• Try again in a few moments`;

                default:
                    return `HTTP Error ${status} (${statusText}): ${error.message || 'Unknown error occurred'}`;
            }
        }

        // Handle network errors
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return `Network Error: Cannot connect to "${client.url}". Please check:
• The server URL is correct and reachable
• Your network connection
• Firewall settings
• The ShareDo server is running`;
        }

        if (error.code === 'ETIMEDOUT') {
            return `Timeout Error: Connection to "${client.url}" timed out. Please check:
• Your network connection
• The server is responding
• Firewall or proxy settings`;
        }

        // Handle SSL/TLS errors
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
            return `SSL Certificate Error: There's an issue with the server's SSL certificate. Please:
• Verify the server URL uses HTTPS correctly
• Check if the SSL certificate is valid
• Contact your ShareDo administrator`;
        }

        // Generic error fallback
        return `Connection failed: ${error.message || error.toString()}
        
Server: "${client.url}"
Client ID: "${client.clientId}"
Token Endpoint: "${client.tokenEndpoint || this.calculateIdentityUrl(client.url)}"

Please verify your connection settings and try again.`;
    }

    /**
     * Calculates the identity URL for token endpoint based on ShareDo server URL
     * 
     * @param url - Base ShareDo server URL
     * @returns Calculated identity URL for authentication
     */
    public calculateIdentityUrl(url: string): string {
        // Normalize URL first to ensure no trailing slash
        const normalizedUrl = this.normalizeUrl(url);
        const dotIndex = normalizedUrl.indexOf('.');
        
        if (dotIndex === -1) {
            // Fallback for URLs without dots (local development, etc.)
            return `${normalizedUrl}/connect/token`;
        }
        
        return `${normalizedUrl.slice(0, dotIndex)}-identity${normalizedUrl.slice(dotIndex)}/connect/token`;
    }

    /**
     * Private helper methods
     */

    private async collectConnectionConfig(): Promise<IConnectionConfig | null> {
        try {
            // First, try to read settings from the active editor
            const activeEditorConfig = this.tryParseActiveEditorConfig();
            if (activeEditorConfig) {
                const useActiveEditor = await vscode.window.showQuickPick(
                    ['Yes, use settings from current document', 'No, enter settings manually'],
                    {
                        placeHolder: 'Found connection settings in the current document. Use these settings?'
                    }
                );

                if (useActiveEditor === 'Yes, use settings from current document') {
                    // Validate and potentially prompt for missing required fields
                    return await this.validateAndCompleteConfig(activeEditorConfig);
                }
            }

            // Get server URL
            const serverUrl = await vscode.window.showInputBox({
                prompt: "Enter your ShareDo Server URL",
                value: "https://demo-aus.sharedo.tech",
                validateInput: (value) => {
                    if (!value) {
                        return "Server URL is required";
                    }
                    if (!this.isValidUrl(value)) {
                        return "Please enter a valid URL";
                    }
                    return null;
                }
            });

            if (!serverUrl) {
                return null;
            }

            // Try to parse as JSON configuration first
            const jsonConfig = this.tryParseJsonConfig(serverUrl);
            if (jsonConfig) {
                return jsonConfig;
            }

            // Collect individual configuration values
            const normalizedUrl = this.normalizeUrl(serverUrl);
            
            const clientId = await vscode.window.showInputBox({
                prompt: "Client ID",
                value: "VSCodeAppClientCreds",
                validateInput: (value) => value ? null : "Client ID is required"
            });
            if (!clientId) {
                return null;
            }

            const clientSecret = await vscode.window.showInputBox({
                prompt: "Client Secret",
                password: true,
                validateInput: (value) => value ? null : "Client Secret is required"
            });
            if (!clientSecret) {
                return null;
            }

            const impersonateUser = await vscode.window.showInputBox({
                prompt: "Impersonate User (optional)",
                placeHolder: "Leave blank for none"
            });

            const impersonateProvider = await vscode.window.showInputBox({
                prompt: "Impersonate Provider (optional)",
                value: "idsrv",
                placeHolder: "Leave blank for none"
            });

            const tokenEndpoint = await vscode.window.showInputBox({
                prompt: "Token Endpoint",
                value: this.calculateIdentityUrl(normalizedUrl),
                validateInput: (value) => {
                    if (!value) {
                        return "Token Endpoint is required";
                    }
                    if (!this.isValidUrl(value)) {
                        return "Please enter a valid URL";
                    }
                    return null;
                }
            });
            if (!tokenEndpoint) {
                return null;
            }

            return {
                url: normalizedUrl,
                clientId,
                clientSecret,
                impersonateUser: impersonateUser || undefined,
                impersonateProvider: impersonateProvider || undefined,
                tokenEndpoint
            };
        } catch (error) {
            vscode.window.showErrorMessage(`Configuration collection failed: ${error}`);
            return null;
        }
    }

    /**
     * Attempts to parse connection configuration from the active text editor
     * @returns Connection configuration if valid JSON found, null otherwise
     */
    private tryParseActiveEditorConfig(): IConnectionConfig | null {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                return null;
            }

            const document = activeEditor.document;
            const text = document.getText().trim();
            
            if (!text) {
                return null;
            }

            // Try to parse as JSON
            const json = JSON.parse(text);
            
            // Check if it looks like a connection configuration
            if (json && typeof json === 'object' && (json.url || json.serverUrl)) {
                return {
                    url: this.normalizeUrl(json.url || json.serverUrl),
                    clientId: json.clientId || json.client_id || 'VSCodeAppClientCreds',
                    clientSecret: json.clientSecret || json.client_secret || '',
                    impersonateUser: json.impersonateUser || json.impersonate_user,
                    impersonateProvider: json.impersonateProvider || json.impersonate_provider,
                    tokenEndpoint: json.tokenEndpoint || json.token_endpoint || this.calculateIdentityUrl(json.url || json.serverUrl)
                };
            }
        } catch (error) {
            // Not valid JSON or doesn't contain connection settings
            return null;
        }
        
        return null;
    }

    /**
     * Validates a configuration and prompts for missing required fields
     * @param config - Partial configuration to validate and complete
     * @returns Complete configuration or null if cancelled
     */
    private async validateAndCompleteConfig(config: IConnectionConfig): Promise<IConnectionConfig | null> {
        try {
            let finalConfig = { ...config };
            
            // Validate required fields and prompt for missing ones
            if (!finalConfig.url) {
                const url = await vscode.window.showInputBox({
                    prompt: "Server URL is required",
                    validateInput: (value) => {
                        if (!value) {
                            return "Server URL is required";
                        }
                        if (!this.isValidUrl(value)) {
                            return "Please enter a valid URL";
                        }
                        return null;
                    }
                });
                if (!url) {
                    return null;
                }
                finalConfig.url = this.normalizeUrl(url);
            }

            if (!finalConfig.clientId) {
                const clientId = await vscode.window.showInputBox({
                    prompt: "Client ID is required",
                    value: "VSCodeAppClientCreds",
                    validateInput: (value) => value ? null : "Client ID is required"
                });
                if (!clientId) {
                    return null;
                }
                finalConfig.clientId = clientId;
            }

            if (!finalConfig.clientSecret) {
                const clientSecret = await vscode.window.showInputBox({
                    prompt: "Client Secret is required",
                    password: true,
                    validateInput: (value) => value ? null : "Client Secret is required"
                });
                if (!clientSecret) {
                    return null;
                }
                finalConfig.clientSecret = clientSecret;
            }

            // Ensure token endpoint is set
            if (!finalConfig.tokenEndpoint) {
                finalConfig.tokenEndpoint = this.calculateIdentityUrl(finalConfig.url);
            }

            return finalConfig;
        } catch (error) {
            vscode.window.showErrorMessage(`Configuration validation failed: ${error}`);
            return null;
        }
    }

    private tryParseJsonConfig(input: string): IConnectionConfig | null {
        try {
            const json = JSON.parse(input);
            if (json.url && json.clientId && json.clientSecret) {
                return {
                    url: this.normalizeUrl(json.url),
                    clientId: json.clientId,
                    clientSecret: json.clientSecret,
                    impersonateUser: json.impersonateUser,
                    impersonateProvider: json.impersonateProvider,
                    tokenEndpoint: json.tokenEndpoint || this.calculateIdentityUrl(json.url)
                };
            }
        } catch {
            // Not JSON, continue with normal input
        }
        return null;
    }

    private createClientFromConfig(config: IConnectionConfig): SharedoClient {
        const client = new SharedoClient(undefined, this.environments);
        client.url = config.url;
        client.clientId = config.clientId;
        client.clientSecret = config.clientSecret;
        client.impersonateUser = config.impersonateUser;
        client.impersonateProvider = config.impersonateProvider;
        client.tokenEndpoint = config.tokenEndpoint || this.calculateIdentityUrl(config.url);
        return client;
    }

    private async addOrUpdateServer(client: SharedoClient): Promise<void> {
        if (!this.environments) {
            throw new Error('Environments not initialized. Call setLegacyDependencies first.');
        }
        if (!this.settings) {
            throw new Error('Settings not initialized. Call setLegacyDependencies first.');
        }

        const existingServer = this.environments.find(client);
        
        if (existingServer) {
            // Update existing server configuration
            Object.assign(existingServer, client);
            vscode.window.showInformationMessage('ShareDo Server Updated');
        } else {
            // Add new server
            this.environments.addServer(client);
            vscode.window.showInformationMessage('ShareDo Server Added');
        }

        this.settings.save();
    }

    private showValidationErrors(result: IConnectionValidationResult): void {
        if (result.errors.length > 0) {
            // For detailed errors, show them in a more prominent way
            const errorMessage = result.errors[0]; // Take the first (most detailed) error
            
            // Show the error message
            vscode.window.showErrorMessage('ShareDo Connection Failed', 'Show Details', 'Retry').then(selection => {
                if (selection === 'Show Details') {
                    // Show detailed error in a new document for easy reading
                    this.showDetailedError(errorMessage);
                } else if (selection === 'Retry') {
                    // Could implement retry logic here if needed
                    vscode.commands.executeCommand('sharedo.connect');
                }
            });
        }
        
        if (result.warnings.length > 0) {
            const warnings = result.warnings.join(', ');
            vscode.window.showWarningMessage(`Connection warnings: ${warnings}`);
        }
    }

    /**
     * Shows detailed error information in a new document
     * @param errorMessage - The detailed error message to display
     */
    private async showDetailedError(errorMessage: string): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument({
                content: `ShareDo Connection Error Details\n${'='.repeat(40)}\n\n${errorMessage}\n\n${'='.repeat(40)}\nGenerated: ${new Date().toLocaleString()}`,
                language: 'plaintext'
            });
            
            await vscode.window.showTextDocument(document);
        } catch (error) {
            console.error('Failed to show detailed error:', error);
            // Fallback to console output
            console.error('ShareDo Connection Error:', errorMessage);
        }
    }

    private reportConnectionSuccess(client: SharedoClient, totalTime: number, metrics?: { authenticationTime: number }): void {
        vscode.window.showInformationMessage('ShareDo Server Connected');
        
        if (metrics) {
            Inform.writeInfo(`Connection established successfully:`);
            Inform.writeInfo(`- Authentication: ${metrics.authenticationTime}ms`);
            Inform.writeInfo(`- Total time: ${totalTime}ms`);
            Inform.writeInfo(`- Server: ${client.url}`);
        }
    }

    private handleConnectionError(error: any): void {
        const errorMessage = `Connection failed: ${error}`;
        vscode.window.showErrorMessage(errorMessage);
        Inform.writeError(errorMessage);
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private normalizeUrl(url: string): string {
        return url.endsWith('/') ? url.slice(0, -1) : url;
    }
    
    /**
     * Handle connection request event
     */
    private async handleConnectionRequest(config: IConnectionConfig): Promise<void> {
        try {
            const client = this.createClientFromConfig(config);
            const validation = await this.validateConnection(client);
            
            if (validation.isValid) {
                this.activeConnections.set(config.url, client);
                this.eventBus.emit('connection.established', { url: config.url, client });
                
                // Save to state
                const connections = this.stateManager.getState<any[]>('connections') || [];
                connections.push(config);
                this.stateManager.setState('connections', connections, true);
            } else {
                this.eventBus.emit('connection.failed', { url: config.url, errors: validation.errors });
            }
        } catch (error) {
            this.eventBus.emit('connection.error', { url: config.url, error });
        }
    }
    
    /**
     * Handle connection closed event
     */
    private handleConnectionClosed(serverId: string): void {
        this.activeConnections.delete(serverId);
        this.eventBus.emit('connection.removed', { serverId });
        
        // Update state
        const connections = this.stateManager.getState<any[]>('connections') || [];
        const updated = connections.filter(c => c.url !== serverId);
        this.stateManager.setState('connections', updated, true);
    }
    
    /**
     * Disconnect from a server
     */
    public async disconnect(serverId?: string): Promise<void> {
        if (serverId) {
            const client = this.activeConnections.get(serverId);
            if (client) {
                // Perform any cleanup
                this.activeConnections.delete(serverId);
                this.eventBus.emit('connection.closed', serverId);
            }
        } else {
            // Disconnect all
            for (const [id] of this.activeConnections) {
                await this.disconnect(id);
            }
        }
    }
    
    /**
     * Get active connection
     */
    public getConnection(serverId: string): SharedoClient | undefined {
        return this.activeConnections.get(serverId);
    }
    
    /**
     * Get all active connections
     */
    public getAllConnections(): Map<string, SharedoClient> {
        return new Map(this.activeConnections);
    }
}
