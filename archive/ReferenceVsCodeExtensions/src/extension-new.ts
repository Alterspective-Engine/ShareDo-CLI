/**
 * ShareDo VS Code Extension - Refactored Entry Point
 * 
 * Clean, minimal entry point that delegates all functionality
 * to the core architecture components.
 * 
 * @version 2.0.0
 */

import * as vscode from 'vscode';
import { ExtensionCore } from './core/ExtensionCore';
import { DependencyContainer } from './core/DependencyContainer';

/**
 * Extension activation - Clean and minimal
 */
export async function activate(context: vscode.ExtensionContext): Promise<any> {
    console.log('ShareDo Extension: Activating...');
    
    try {
        // Create dependency container with extension context
        const container = new DependencyContainer(context);
        
        // Create and activate extension core
        const core = new ExtensionCore(container);
        const exports = await core.activate();
        
        console.log('ShareDo Extension: Activated successfully');
        
        // Return public API
        return exports;
        
    } catch (error) {
        console.error('ShareDo Extension: Activation failed', error);
        
        // Show user-friendly error
        vscode.window.showErrorMessage(
            `Failed to activate ShareDo extension: ${error}`,
            'Report Issue'
        ).then(selection => {
            if (selection === 'Report Issue') {
                vscode.env.openExternal(
                    vscode.Uri.parse('https://github.com/Alter-Igor/sharedo-vscode-extension/issues')
                );
            }
        });
        
        throw error;
    }
}

/**
 * Extension deactivation - Proper cleanup
 */
export async function deactivate(): Promise<void> {
    console.log('ShareDo Extension: Deactivating...');
    
    try {
        await ExtensionCore.deactivate();
        console.log('ShareDo Extension: Deactivated successfully');
    } catch (error) {
        console.error('ShareDo Extension: Deactivation error', error);
    }
}