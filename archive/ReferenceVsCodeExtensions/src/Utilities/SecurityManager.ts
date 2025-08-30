import * as vscode from 'vscode';
import { Inform } from './Inform';

/**
 * Manages secure storage and retrieval of sensitive information like API keys
 * Uses VS Code's SecretStorage API for secure credential management
 */
export class SecurityManager {
    private static instance: SecurityManager;
    private secretStorage: vscode.SecretStorage;

    private constructor(secretStorage: vscode.SecretStorage) {
        this.secretStorage = secretStorage;
    }

    /**
     * Initialize the SecurityManager singleton
     */
    public static initialize(secretStorage: vscode.SecretStorage): void {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager(secretStorage);
        }
    }

    /**
     * Get the SecurityManager instance
     */
    public static getInstance(): SecurityManager {
        if (!SecurityManager.instance) {
            throw new Error('SecurityManager not initialized. Call initialize() first.');
        }
        return SecurityManager.instance;
    }

    /**
     * Store an API key securely for a specific server
     * @param serverUrl - The server URL to associate with the API key
     * @param apiKey - The API key to store
     */
    public async storeApiKey(serverUrl: string, apiKey: string): Promise<void> {
        try {
            const key = this.getApiKeyStorageKey(serverUrl);
            await this.secretStorage.store(key, apiKey);
            Inform.writeInfo('SecurityManager::storeApiKey', `API key stored securely for server: ${serverUrl}`);
        } catch (error) {
            Inform.writeError('SecurityManager::storeApiKey', `Failed to store API key for ${serverUrl}`, error);
            throw error;
        }
    }

    /**
     * Retrieve an API key for a specific server
     * @param serverUrl - The server URL to get the API key for
     * @returns The API key or undefined if not found
     */
    public async getApiKey(serverUrl: string): Promise<string | undefined> {
        try {
            const key = this.getApiKeyStorageKey(serverUrl);
            const apiKey = await this.secretStorage.get(key);
            
            if (apiKey) {
                Inform.writeDebug('SecurityManager::getApiKey', `API key retrieved for server: ${serverUrl}`);
            } else {
                Inform.writeDebug('SecurityManager::getApiKey', `No API key found for server: ${serverUrl}`);
            }
            
            return apiKey;
        } catch (error) {
            Inform.writeError('SecurityManager::getApiKey', `Failed to retrieve API key for ${serverUrl}`, error);
            return undefined;
        }
    }

    /**
     * Remove an API key for a specific server
     * @param serverUrl - The server URL to remove the API key for
     */
    public async removeApiKey(serverUrl: string): Promise<void> {
        try {
            const key = this.getApiKeyStorageKey(serverUrl);
            await this.secretStorage.delete(key);
            Inform.writeInfo('SecurityManager::removeApiKey', `API key removed for server: ${serverUrl}`);
        } catch (error) {
            Inform.writeError('SecurityManager::removeApiKey', `Failed to remove API key for ${serverUrl}`, error);
            throw error;
        }
    }

    /**
     * Check if an API key exists for a specific server
     * @param serverUrl - The server URL to check for
     * @returns True if an API key exists, false otherwise
     */
    public async hasApiKey(serverUrl: string): Promise<boolean> {
        try {
            const apiKey = await this.getApiKey(serverUrl);
            return !!apiKey;
        } catch (error) {
            Inform.writeError('SecurityManager::hasApiKey', `Failed to check API key existence for ${serverUrl}`, error);
            return false;
        }
    }

    /**
     * Prompt user for API key and store it securely
     * @param serverUrl - The server URL to associate with the API key
     * @returns The entered API key or undefined if cancelled
     */
    public async promptAndStoreApiKey(serverUrl: string): Promise<string | undefined> {
        try {
            const apiKey = await vscode.window.showInputBox({
                prompt: `Enter API key for ShareDo server: ${serverUrl}`,
                password: true,
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'API key cannot be empty';
                    }
                    if (value.length < 10) {
                        return 'API key seems too short. Please verify it\'s correct.';
                    }
                    return null;
                }
            });

            if (apiKey && apiKey.trim().length > 0) {
                await this.storeApiKey(serverUrl, apiKey.trim());
                vscode.window.showInformationMessage(`API key stored securely for ${serverUrl}`);
                return apiKey.trim();
            }

            return undefined;
        } catch (error) {
            Inform.writeError('SecurityManager::promptAndStoreApiKey', `Failed to prompt for API key`, error);
            vscode.window.showErrorMessage(`Failed to store API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return undefined;
        }
    }

    /**
     * Get or prompt for API key for a server
     * @param serverUrl - The server URL to get/prompt for API key
     * @returns The API key or undefined if not available/cancelled
     */
    public async getOrPromptApiKey(serverUrl: string): Promise<string | undefined> {
        try {
            // First try to get existing API key
            let apiKey = await this.getApiKey(serverUrl);
            
            if (!apiKey) {
                // No existing key, prompt user
                const shouldPrompt = await vscode.window.showQuickPick(
                    ['Yes', 'No'],
                    {
                        placeHolder: `No API key found for ${serverUrl}. Would you like to enter one now?`,
                        ignoreFocusOut: true
                    }
                );

                if (shouldPrompt === 'Yes') {
                    apiKey = await this.promptAndStoreApiKey(serverUrl);
                }
            }

            return apiKey;
        } catch (error) {
            Inform.writeError('SecurityManager::getOrPromptApiKey', `Failed to get or prompt for API key`, error);
            return undefined;
        }
    }

    /**
     * List all servers that have stored API keys
     * @returns Array of server URLs that have API keys stored
     */
    public async getServersWithApiKeys(): Promise<string[]> {
        try {
            // This is a limitation of VS Code's SecretStorage - we can't enumerate keys
            // So we'll need to maintain a separate list or use a different approach
            // For now, we'll return an empty array and rely on other methods
            Inform.writeDebug('SecurityManager::getServersWithApiKeys', 'Cannot enumerate secret storage keys directly');
            return [];
        } catch (error) {
            Inform.writeError('SecurityManager::getServersWithApiKeys', `Failed to get servers with API keys`, error);
            return [];
        }
    }

    /**
     * Generate the storage key for a server's API key
     * @param serverUrl - The server URL
     * @returns The storage key
     */
    private getApiKeyStorageKey(serverUrl: string): string {
        // Normalize the URL to ensure consistent key generation
        const normalizedUrl = serverUrl.toLowerCase().replace(/\/+$/, ''); // Remove trailing slashes
        return `sharedo.apiKey.${normalizedUrl}`;
    }

    /**
     * Clear all stored API keys (useful for debugging or reset scenarios)
     */
    public async clearAllApiKeys(): Promise<void> {
        try {
            // Since we can't enumerate secret storage keys, we'll need to track this differently
            // For now, this is a placeholder for future implementation
            Inform.writeInfo('SecurityManager::clearAllApiKeys', 'Clear all API keys requested');
            vscode.window.showInformationMessage('API key clearing is not fully implemented due to VS Code SecretStorage limitations');
        } catch (error) {
            Inform.writeError('SecurityManager::clearAllApiKeys', `Failed to clear API keys`, error);
            throw error;
        }
    }
}

/**
 * Helper function to validate API key format
 * @param apiKey - The API key to validate
 * @returns True if the API key appears to be valid format
 */
export function validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }

    const trimmed = apiKey.trim();
    
    // Basic validation - adjust these rules based on your API key format
    if (trimmed.length < 10) {
        return false;
    }

    // Check for common JWT token pattern (if your API keys are JWTs)
    if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        if (parts.length === 3) {
            // Looks like a JWT
            return parts.every(part => part.length > 0);
        }
    }

    // Check for common API key patterns
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return true;
    }

    // Allow other formats as needed
    return true;
}
