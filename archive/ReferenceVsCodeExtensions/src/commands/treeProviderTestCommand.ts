/**
 * Development command to test TreeProvider architecture switching
 */

import * as vscode from 'vscode';
import { TreeProviderFactory } from '../TreeProviders/TreeProviderFactory';

export function registerTreeProviderTestCommand(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('sharedo.testTreeProviderArchitecture', async () => {
        const config = vscode.workspace.getConfiguration('sharedo');
        const currentSetting = config.get('useNewTreeProvider', false);
        
        const choice = await vscode.window.showQuickPick([
            {
                label: '🔄 Toggle Architecture',
                description: `Currently using: ${currentSetting ? 'New' : 'Legacy'} provider`,
                detail: 'Switch between new and legacy TreeProvider architectures'
            },
            {
                label: '📊 Show Provider Stats',
                description: 'Display performance and provider statistics',
                detail: 'View cache performance and registered providers'
            },
            {
                label: '🧪 Performance Test',
                description: 'Test tree loading performance',
                detail: 'Compare performance between architectures'
            }
        ]);

        switch (choice?.label) {
            case '🔄 Toggle Architecture':
                await toggleArchitecture(config, currentSetting);
                break;
            case '📊 Show Provider Stats':
                await showProviderStats();
                break;
            case '🧪 Performance Test':
                await performanceTest();
                break;
        }
    });

    context.subscriptions.push(command);
}

async function toggleArchitecture(config: vscode.WorkspaceConfiguration, currentSetting: boolean) {
    const newSetting = !currentSetting;
    
    try {
        await config.update('useNewTreeProvider', newSetting, vscode.ConfigurationTarget.Workspace);
        
        vscode.window.showInformationMessage(
            `TreeProvider architecture switched to: ${newSetting ? 'New' : 'Legacy'}. ` +
            'Please reload the window to apply changes.',
            'Reload Window'
        ).then(choice => {
            if (choice === 'Reload Window') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to toggle architecture: ${error}`);
    }
}

async function showProviderStats() {
    try {
        const provider = TreeProviderFactory.createTreeProvider(true);
        
        if (provider.getProviderStats) {
            const stats = provider.getProviderStats();
            
            const statsMessage = `
**TreeProvider Statistics:**
• Registered Providers: ${stats.registeredProviders}
• Cache Hits: ${stats.cacheStats.hits}
• Cache Misses: ${stats.cacheStats.misses}
• Cache Size: ${stats.cacheStats.size}
• Registered Types: ${stats.registeredTypes.length}
            `.trim();
            
            vscode.window.showInformationMessage(statsMessage);
        } else {
            vscode.window.showInformationMessage('Provider statistics not available');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to get provider stats: ${error}`);
    }
}

async function performanceTest() {
    const startTime = Date.now();
    
    try {
        // Create both providers and test basic operations
        const newProvider = TreeProviderFactory.createTreeProvider(true);
        const legacyProvider = TreeProviderFactory.createTreeProvider(false);
        
        const newTime = Date.now();
        
        // Test creation time
        const creationTime = newTime - startTime;
        
        vscode.window.showInformationMessage(
            `Performance Test Results:\n` +
            `• Provider creation: ${creationTime}ms\n` +
            `• New provider available: ${!!newProvider}\n` +
            `• Legacy provider available: ${!!legacyProvider}`
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Performance test failed: ${error}`);
    }
}
