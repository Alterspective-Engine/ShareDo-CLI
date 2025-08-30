/**
 * Cache Management Service for ShareDo
 * 
 * Handles cache header management to ensure deployed changes are immediately reflected
 * by resetting the cache after publishing files or workflows
 */

import * as vscode from 'vscode';
import { SharedoClient } from '../sharedoClient';
import { Inform } from '../Utilities/inform';
import { Debouncer } from '../Utilities/Debouncer';
import { CacheFunMessages } from './CacheFunMessages';

export interface ICacheConfiguration {
    public: boolean;
    mustRevalidate: boolean;
    excludeMasks: string[];
    maxAgeSeconds: number;
    cacheKey: string;
}

export interface ICacheConfigurationResponse {
    configurationWidgetTitle: string;
    configurationWidgetId: string;
    configurationJson: string;
    enabled: boolean;
    isValid: boolean;
}

export class CacheManagementService {
    private static instance: CacheManagementService;
    private debouncers: Map<string, Debouncer<boolean>> = new Map();
    private statusBarItem: vscode.StatusBarItem;
    private pendingOperations: Map<string, number> = new Map();
    private readonly DEBOUNCE_DELAY = 3000; // 3 seconds delay

    private constructor() {
        // Create status bar item for cache status
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'sharedo.cache.status';
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): CacheManagementService {
        if (!CacheManagementService.instance) {
            CacheManagementService.instance = new CacheManagementService();
        }
        return CacheManagementService.instance;
    }

    /**
     * Get the last cache key that was set
     */
    private lastCacheKey: string | null = null;
    public getLastCacheKey(): string | null {
        return this.lastCacheKey;
    }

    /**
     * Reset cache headers with debouncing
     * This will batch multiple requests and only execute once after a delay
     */
    public async resetCacheHeadersDebounced(server: SharedoClient, immediate: boolean = false): Promise<boolean> {
        const serverKey = server.url;
        
        // If immediate is requested, bypass debouncing
        if (immediate) {
            return this.resetCacheHeaders(server);
        }
        
        // Get or create debouncer for this server
        if (!this.debouncers.has(serverKey)) {
            const debouncer = new Debouncer<boolean>(
                this.DEBOUNCE_DELAY,
                async (count: number, data: any[]) => {
                    // Show fun batch message if multiple operations
                    if (count > 1) {
                        const batchMessage = CacheFunMessages.getBatchMessage(count);
                        this.showStatusMessage(batchMessage, 3000);
                    }
                    
                    // Perform the actual cache reset
                    return this.resetCacheHeaders(server);
                },
                () => {
                    // On debounce start - show waiting message
                    const currentCount = (this.pendingOperations.get(serverKey) || 0) + 1;
                    this.pendingOperations.set(serverKey, currentCount);
                    this.updateStatusBar(serverKey, currentCount);
                },
                (result: boolean, count: number) => {
                    // On debounce end - show result
                    this.pendingOperations.delete(serverKey);
                    this.hideStatusBar();
                    
                    if (result) {
                        const successMessage = count > 1 
                            ? CacheFunMessages.getBatchMessage(count)
                            : CacheFunMessages.getSuccessMessage();
                        this.showStatusMessage(successMessage, 5000, '$(check)');
                    }
                }
            );
            
            this.debouncers.set(serverKey, debouncer);
        }
        
        return this.debouncers.get(serverKey)!.trigger();
    }

    /**
     * Update status bar with countdown
     */
    private updateStatusBar(serverUrl: string, operationCount: number): void {
        let countdown = Math.ceil(this.DEBOUNCE_DELAY / 1000);
        
        const updateCountdown = () => {
            if (countdown > 0 && this.pendingOperations.has(serverUrl)) {
                const message = CacheFunMessages.getCountdownSequence(countdown);
                this.statusBarItem.text = `$(sync~spin) ${message}`;
                this.statusBarItem.tooltip = `Pending operations: ${operationCount}\nServer: ${serverUrl}`;
                this.statusBarItem.show();
                
                countdown--;
                setTimeout(updateCountdown, 1000);
            } else {
                this.statusBarItem.hide();
            }
        };
        
        updateCountdown();
    }

    /**
     * Hide status bar
     */
    private hideStatusBar(): void {
        this.statusBarItem.hide();
    }

    /**
     * Show fun status message
     */
    private showStatusMessage(message: string, duration: number, icon: string = '$(sparkle)'): void {
        // Add time-based or seasonal flavor occasionally
        if (Math.random() < 0.3) {
            const extraMessage = Math.random() < 0.5 
                ? CacheFunMessages.getTimeBasedMessage()
                : CacheFunMessages.getSeasonalMessage();
            message = `${message} ${extraMessage}`;
        }
        
        vscode.window.setStatusBarMessage(`${icon} ${message}`, duration);
    }

    /**
     * Reset cache headers for a ShareDo server (immediate execution)
     * This forces the server to clear its cache and serve fresh content
     * Returns the new cache key if successful, null otherwise
     */
    public async resetCacheHeaders(server: SharedoClient): Promise<boolean> {
        try {
            // Show fun start message
            const startMessage = CacheFunMessages.getStartMessage();
            const serverMessage = CacheFunMessages.getServerMessage(server.url);
            this.showStatusMessage(`${startMessage} ${serverMessage}`, 2000, '$(loading~spin)');
            
            Inform.writeInfo(`Resetting cache headers for ${server.url}`);

            // First, get the current cache configuration
            const currentConfig = await this.getCurrentCacheConfiguration(server);
            if (!currentConfig) {
                const failMessage = CacheFunMessages.getFailureMessage();
                this.showStatusMessage(failMessage, 3000, '$(warning)');
                Inform.writeInfo('CacheManagementService.resetCacheHeaders', 'Unable to get current cache configuration');
                return false;
            }

            // Parse the configuration
            const config: ICacheConfiguration = JSON.parse(currentConfig.configurationJson);
            
            // Increment the cache key to force a cache reset
            const currentCacheKey = config.cacheKey || '_ck-1';
            const keyMatch = currentCacheKey.match(/_ck-(\d+)/);
            const currentVersion = keyMatch ? parseInt(keyMatch[1]) : 1;
            const newVersion = currentVersion + 1;
            config.cacheKey = `_ck-${newVersion}`;
            this.lastCacheKey = config.cacheKey;

            // Update the cache configuration
            const success = await this.updateCacheConfiguration(server, config);
            
            if (success) {
                Inform.writeInfo(`✅ Cache headers reset successfully. New cache key: ${config.cacheKey}`);
                
                // Log cache reset to PublishingLogger
                const logger = require('./PublishingLogger').PublishingLogger.getInstance();
                logger.logCacheReset(server.url, config.cacheKey, true);
                
                // Show fun success message
                const successMessage = CacheFunMessages.getSuccessMessage();
                vscode.window.showInformationMessage(`${successMessage} (${server.url})`);
            } else {
                const failMessage = CacheFunMessages.getFailureMessage();
                this.showStatusMessage(failMessage, 3000, '$(error)');
                Inform.writeInfo('CacheManagementService.resetCacheHeaders', 'Failed to update cache configuration');
                
                // Log cache reset failure to PublishingLogger
                const logger = require('./PublishingLogger').PublishingLogger.getInstance();
                logger.logCacheReset(server.url, '', false, 'Failed to update cache configuration');
            }

            return success;

        } catch (error) {
            Inform.writeError('CacheManagementService.resetCacheHeaders', error);
            return false;
        }
    }

    /**
     * Get current cache configuration from server
     */
    private async getCurrentCacheConfiguration(server: SharedoClient): Promise<ICacheConfigurationResponse | null> {
        try {
            // Get bearer token
            const token = await server.getBearer();
            if (!token) {
                Inform.writeError('CacheManagementService.getCurrentCacheConfiguration', 'Failed to get bearer token');
                return null;
            }

            // Add timestamp to prevent caching of this request
            const timestamp = Date.now();
            const apiUrl = `${server.url}/api/featureFramework/CacheHeaders/configuration/edit?_=${timestamp}`;

            Inform.writeInfo(`Getting cache configuration from: ${apiUrl}`);

            const https = require('https');
            const url = require('url');
            const parsedUrl = url.parse(apiUrl);

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port || 443,
                    path: parsedUrl.path,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'Authorization': `Bearer ${token}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };

                const req = https.request(options, (res: any) => {
                    let responseData = '';

                    res.on('data', (chunk: any) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            try {
                                const config = JSON.parse(responseData);
                                resolve(config);
                            } catch (parseError) {
                                Inform.writeError('CacheManagementService.getCurrentCacheConfiguration', parseError);
                                resolve(null);
                            }
                        } else {
                            Inform.writeError('CacheManagementService.getCurrentCacheConfiguration', 
                                `Server returned ${res.statusCode}: ${responseData}`);
                            resolve(null);
                        }
                    });
                });

                req.on('error', (error: any) => {
                    Inform.writeError('CacheManagementService.getCurrentCacheConfiguration', error);
                    resolve(null);
                });

                req.end();
            });

        } catch (error) {
            Inform.writeError('CacheManagementService.getCurrentCacheConfiguration', error);
            return null;
        }
    }

    /**
     * Update cache configuration on server
     */
    private async updateCacheConfiguration(server: SharedoClient, config: ICacheConfiguration): Promise<boolean> {
        try {
            // Get bearer token
            const token = await server.getBearer();
            if (!token) {
                Inform.writeError('CacheManagementService.updateCacheConfiguration', 'Failed to get bearer token');
                return false;
            }

            const apiUrl = `${server.url}/api/featureFramework/CacheHeaders/configuration`;
            
            // Prepare the payload
            const payload = {
                configurationJson: JSON.stringify(config)
            };
            const postData = JSON.stringify(payload);

            Inform.writeInfo(`Updating cache configuration at: ${apiUrl}`);
            Inform.writeInfo(`New cache key: ${config.cacheKey}`);

            const https = require('https');
            const url = require('url');
            const parsedUrl = url.parse(apiUrl);

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port || 443,
                    path: parsedUrl.path,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Content-Length': Buffer.byteLength(postData),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };

                const req = https.request(options, (res: any) => {
                    let responseData = '';

                    res.on('data', (chunk: any) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            Inform.writeInfo('Cache configuration updated successfully');
                            resolve(true);
                        } else {
                            Inform.writeError('CacheManagementService.updateCacheConfiguration', 
                                `Server returned ${res.statusCode}: ${responseData}`);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error: any) => {
                    Inform.writeError('CacheManagementService.updateCacheConfiguration', error);
                    resolve(false);
                });

                // Write data to request body
                req.write(postData);
                req.end();
            });

        } catch (error) {
            Inform.writeError('CacheManagementService.updateCacheConfiguration', error);
            return false;
        }
    }

    /**
     * Reset cache with user confirmation
     */
    public async resetCacheWithConfirmation(server: SharedoClient, context: string): Promise<boolean> {
        const choice = await vscode.window.showInformationMessage(
            `Clear cache for ${server.url} after ${context}?`,
            'Yes',
            'No'
        );

        if (choice === 'Yes') {
            return await this.resetCacheHeaders(server);
        }

        return false;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.statusBarItem.dispose();
        // Cancel any pending debouncers
        this.debouncers.forEach(debouncer => debouncer.cancel());
        this.debouncers.clear();
        this.pendingOperations.clear();
    }

    /**
     * Batch reset cache for multiple servers
     */
    public async batchResetCache(servers: SharedoClient[]): Promise<void> {
        const results = await Promise.allSettled(
            servers.map(server => this.resetCacheHeaders(server))
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - successful;

        if (failed > 0) {
            vscode.window.showWarningMessage(
                `Cache reset: ${successful} succeeded, ${failed} failed`
            );
        } else {
            vscode.window.showInformationMessage(
                `Cache successfully reset for ${successful} server(s)`
            );
        }
    }
}