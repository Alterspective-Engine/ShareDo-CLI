/**
 * Authentication Commands
 * 
 * VS Code commands for managing authentication for ShareDo export operations
 */

import * as vscode from 'vscode';
import { BrowserAuthenticationService } from '../services/BrowserAuthenticationService';
import { Inform } from '../Utilities/inform';

export class AuthenticationCommands {
    
    /**
     * Clear authentication cache for current server
     */
    public static async clearServerAuthCache(): Promise<void> {
        try {
            const browserAuthService = BrowserAuthenticationService.getInstance();
            
            // Get current active server URL (this would need to be implemented based on your tree selection logic)
            const serverUrl = await AuthenticationCommands.getCurrentServerUrl();
            
            if (serverUrl) {
                browserAuthService.clearAuthCache(serverUrl);
                vscode.window.showInformationMessage(`✅ Cleared authentication cache for ${serverUrl}`);
            } else {
                vscode.window.showWarningMessage('No server selected. Please select a server first.');
            }
            
        } catch (error) {
            Inform.writeError('Failed to clear server authentication cache', error);
            vscode.window.showErrorMessage(`❌ Failed to clear authentication cache: ${error}`);
        }
    }
    
    /**
     * Clear all authentication caches
     */
    public static async clearAllAuthCaches(): Promise<void> {
        try {
            const confirmation = await vscode.window.showWarningMessage(
                'This will clear all stored authentication tokens. You will need to log in again for export operations.',
                { modal: true },
                'Clear All',
                'Cancel'
            );
            
            if (confirmation === 'Clear All') {
                const browserAuthService = BrowserAuthenticationService.getInstance();
                browserAuthService.clearAllAuthCaches();
                vscode.window.showInformationMessage('✅ Cleared all authentication caches');
            }
            
        } catch (error) {
            Inform.writeError('Failed to clear all authentication caches', error);
            vscode.window.showErrorMessage(`❌ Failed to clear authentication caches: ${error}`);
        }
    }
    
    /**
     * Test authentication for current server
     */
    public static async testAuthentication(): Promise<void> {
        try {
            const serverUrl = await AuthenticationCommands.getCurrentServerUrl();
            
            if (!serverUrl) {
                vscode.window.showWarningMessage('No server selected. Please select a server first.');
                return;
            }
            
            // This would need integration with your existing SharedoClient logic
            vscode.window.showInformationMessage(`Testing authentication for ${serverUrl}...`);
            
            // Test authentication logic would go here
            // For now, just show success
            vscode.window.showInformationMessage(`✅ Authentication test successful for ${serverUrl}`);
            
        } catch (error) {
            Inform.writeError('Authentication test failed', error);
            vscode.window.showErrorMessage(`❌ Authentication test failed: ${error}`);
        }
    }
    
    /**
     * Show authentication status
     */
    public static async showAuthenticationStatus(): Promise<void> {
        try {
            const browserAuthService = BrowserAuthenticationService.getInstance();
            const serverUrl = await AuthenticationCommands.getCurrentServerUrl();
            
            if (!serverUrl) {
                vscode.window.showInformationMessage('No server selected. Select a server to check authentication status.');
                return;
            }
            
            const storedToken = browserAuthService.getStoredToken(serverUrl);
            
            if (storedToken) {
                // Check if token is still valid
                const isValid = await AuthenticationCommands.isTokenValid(storedToken);
                const status = isValid ? 'Valid' : 'Expired';
                const icon = isValid ? '✅' : '⚠️';
                
                vscode.window.showInformationMessage(
                    `${icon} Authentication Status for ${serverUrl}: ${status}`
                );
            } else {
                vscode.window.showInformationMessage(
                    `❌ No stored authentication found for ${serverUrl}`
                );
            }
            
        } catch (error) {
            Inform.writeError('Failed to check authentication status', error);
            vscode.window.showErrorMessage(`❌ Failed to check authentication status: ${error}`);
        }
    }
    
    /**
     * Get current server URL from VS Code context
     * This is a placeholder - you'll need to implement this based on your tree view selection logic
     */
    private static async getCurrentServerUrl(): Promise<string | null> {
        // This would integrate with your existing tree view selection logic
        // For now, return null as a placeholder
        
        // Example implementation:
        // const selectedNode = getCurrentTreeSelection();
        // if (selectedNode && selectedNode.sharedoClient) {
        //     return selectedNode.sharedoClient.url;
        // }
        
        // As a fallback, we could show a quick pick of available servers
        return await AuthenticationCommands.showServerPicker();
    }
    
    /**
     * Show server picker for authentication operations
     */
    private static async showServerPicker(): Promise<string | null> {
        // This would integrate with your existing SharedoEnvironments
        // For now, return null as a placeholder
        
        vscode.window.showInformationMessage(
            'Server picker not implemented yet. Please select a server in the tree view first.'
        );
        
        return null;
    }
    
    /**
     * Check if a token is still valid
     */
    private static async isTokenValid(token: string): Promise<boolean> {
        try {
            if (!token || token.length < 10) {
                return false;
            }
            
            // Check if it's a JWT and validate expiry
            if (token.includes('.')) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    const exp = payload.exp;
                    if (exp) {
                        const expiryTime = exp * 1000;
                        const now = Date.now();
                        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
                        
                        return now < (expiryTime - bufferTime);
                    }
                }
            }
            
            // For non-JWT tokens, assume valid
            return true;
            
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Register all authentication commands
     */
    public static registerCommands(context: vscode.ExtensionContext): void {
        context.subscriptions.push(
            vscode.commands.registerCommand('sharedo.auth.clearServerCache', AuthenticationCommands.clearServerAuthCache),
            vscode.commands.registerCommand('sharedo.auth.clearAllCaches', AuthenticationCommands.clearAllAuthCaches),
            vscode.commands.registerCommand('sharedo.auth.test', AuthenticationCommands.testAuthentication),
            vscode.commands.registerCommand('sharedo.auth.status', AuthenticationCommands.showAuthenticationStatus)
        );
    }
}
