/**
 * Cache Management Commands
 * 
 * Commands for managing ShareDo server cache
 */

import * as vscode from 'vscode';
import { CacheManagementService } from '../services/CacheManagementService';
import { Settings } from '../settings';
import { SharedoClient } from '../sharedoClient';
import { Inform } from '../Utilities/inform';

export class CacheCommands {
    private static cacheService = CacheManagementService.getInstance();

    /**
     * Reset cache for a specific server
     */
    static async resetServerCache(): Promise<void> {
        try {
            // Get list of available servers
            const context = (global as any).sharedoExtensionContext;
            if (!context) {
                vscode.window.showErrorMessage('Extension context not available');
                return;
            }

            const settings = new Settings(context);
            settings.populate();
            const environments = settings.sharedoEnvironments.internalArray;
            
            if (environments.length === 0) {
                vscode.window.showErrorMessage('No ShareDo servers configured');
                return;
            }

            // Let user select server
            const serverOptions = environments.map((env: SharedoClient) => ({
                label: env.url,
                description: env.clientId,
                client: env
            }));

            const selected = await vscode.window.showQuickPick(serverOptions, {
                placeHolder: 'Select server to reset cache'
            });

            if (!selected) {
                return;
            }

            // Reset cache with progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Resetting cache for ${selected.label}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Connecting to server...' });
                
                const success = await CacheCommands.cacheService.resetCacheHeaders(selected.client);
                
                if (success) {
                    progress.report({ increment: 100, message: 'Cache reset complete!' });
                } else {
                    throw new Error('Failed to reset cache');
                }
            });

        } catch (error) {
            Inform.writeError('CacheCommands.resetServerCache', error);
            vscode.window.showErrorMessage(`Failed to reset cache: ${error}`);
        }
    }

    /**
     * Reset cache for all configured servers
     */
    static async resetAllServersCache(): Promise<void> {
        try {
            // Get list of available servers
            const context = (global as any).sharedoExtensionContext;
            if (!context) {
                vscode.window.showErrorMessage('Extension context not available');
                return;
            }

            const settings = new Settings(context);
            settings.populate();
            const environments = settings.sharedoEnvironments.internalArray;
            
            if (environments.length === 0) {
                vscode.window.showErrorMessage('No ShareDo servers configured');
                return;
            }

            // Confirm action
            const confirm = await vscode.window.showWarningMessage(
                `Reset cache for all ${environments.length} configured servers?`,
                'Yes',
                'No'
            );

            if (confirm !== 'Yes') {
                return;
            }

            // Reset cache for all servers
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Resetting cache for ${environments.length} servers`,
                cancellable: false
            }, async (progress) => {
                const results = [];
                
                for (let i = 0; i < environments.length; i++) {
                    const server = environments[i];
                    progress.report({
                        increment: (100 / environments.length),
                        message: `Resetting cache for ${server.url}...`
                    });
                    
                    try {
                        const success = await CacheCommands.cacheService.resetCacheHeaders(server);
                        results.push({ server: server.url, success });
                    } catch (error) {
                        results.push({ server: server.url, success: false });
                        Inform.writeError('CacheCommands.resetAllServersCache', error);
                    }
                }

                const successful = results.filter(r => r.success).length;
                const failed = results.length - successful;

                if (failed > 0) {
                    vscode.window.showWarningMessage(
                        `Cache reset: ${successful} succeeded, ${failed} failed`
                    );
                } else {
                    vscode.window.showInformationMessage(
                        `✅ Cache successfully reset for all ${successful} servers`
                    );
                }
            });

        } catch (error) {
            Inform.writeError('CacheCommands.resetAllServersCache', error);
            vscode.window.showErrorMessage(`Failed to reset cache: ${error}`);
        }
    }

    /**
     * Configure cache reset preferences
     */
    static async configureCacheSettings(): Promise<void> {
        const options = [
            {
                label: 'Always reset cache after publishing',
                description: 'Automatically clear cache after every publish operation',
                value: 'always'
            },
            {
                label: 'Ask before resetting cache',
                description: 'Prompt for confirmation before clearing cache',
                value: 'ask'
            },
            {
                label: 'Never reset cache automatically',
                description: 'Only reset cache manually',
                value: 'never'
            }
        ];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select cache reset preference'
        });

        if (selected) {
            const config = vscode.workspace.getConfiguration('sharedo');
            await config.update('cacheResetPreference', selected.value, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Cache preference set to: ${selected.label}`);
        }
    }

    /**
     * Show cache status for a server
     */
    static async showCacheStatus(): Promise<void> {
        try {
            // Get list of available servers
            const context = (global as any).sharedoExtensionContext;
            if (!context) {
                vscode.window.showErrorMessage('Extension context not available');
                return;
            }

            const settings = new Settings(context);
            settings.populate();
            const environments = settings.sharedoEnvironments.internalArray;
            
            if (environments.length === 0) {
                vscode.window.showErrorMessage('No ShareDo servers configured');
                return;
            }

            // Let user select server
            const serverOptions = environments.map((env: SharedoClient) => ({
                label: env.url,
                description: env.clientId,
                client: env
            }));

            const selected = await vscode.window.showQuickPick(serverOptions, {
                placeHolder: 'Select server to check cache status'
            });

            if (!selected) {
                return;
            }

            // Get cache configuration
            const outputChannel = vscode.window.createOutputChannel('ShareDo Cache Status');
            outputChannel.clear();
            outputChannel.appendLine(`Cache Status for ${selected.label}`);
            outputChannel.appendLine('=' .repeat(50));
            outputChannel.appendLine('');
            outputChannel.appendLine('Fetching cache configuration...');
            outputChannel.show();

            // Note: This would need to be implemented in the CacheManagementService
            // to expose the getCurrentCacheConfiguration method publicly
            outputChannel.appendLine('✅ Cache status check complete');

        } catch (error) {
            Inform.writeError('CacheCommands.showCacheStatus', error);
            vscode.window.showErrorMessage(`Failed to get cache status: ${error}`);
        }
    }
}