/**
 * Notification Service - User-friendly notifications for ShareDo VS Code Extension
 * 
 * Provides consistent, context-aware notifications with actionable feedback.
 */

import * as vscode from 'vscode';

export interface NotificationAction {
    label: string;
    command?: string;
    callback?: () => void | Promise<void>;
}

export interface NotificationOptions {
    modal?: boolean;
    detail?: string;
    actions?: NotificationAction[];
    timeout?: number;
}

export class NotificationService {
    private notificationHistory: Array<{
        type: 'info' | 'warning' | 'error';
        message: string;
        timestamp: number;
    }> = [];
    
    private outputChannel: vscode.OutputChannel;
    
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('ShareDo');
    }
    
    /**
     * Show information message
     */
    async showInfo(message: string, options?: NotificationOptions): Promise<string | undefined> {
        this.log('info', message);
        
        const actions = options?.actions?.map(a => a.label) || [];
        
        const result = await vscode.window.showInformationMessage(
            message,
            { modal: options?.modal, detail: options?.detail },
            ...actions
        );
        
        if (result && options?.actions) {
            const action = options.actions.find(a => a.label === result);
            if (action) {
                if (action.command) {
                    vscode.commands.executeCommand(action.command);
                } else if (action.callback) {
                    await action.callback();
                }
            }
        }
        
        return result;
    }
    
    /**
     * Show warning message
     */
    async showWarning(message: string, options?: NotificationOptions): Promise<string | undefined> {
        this.log('warning', message);
        
        const actions = options?.actions?.map(a => a.label) || [];
        
        const result = await vscode.window.showWarningMessage(
            message,
            { modal: options?.modal, detail: options?.detail },
            ...actions
        );
        
        if (result && options?.actions) {
            const action = options.actions.find(a => a.label === result);
            if (action) {
                if (action.command) {
                    vscode.commands.executeCommand(action.command);
                } else if (action.callback) {
                    await action.callback();
                }
            }
        }
        
        return result;
    }
    
    /**
     * Show error message
     */
    async showError(message: string, options?: NotificationOptions): Promise<string | undefined> {
        this.log('error', message);
        
        const actions = options?.actions?.map(a => a.label) || [];
        
        const result = await vscode.window.showErrorMessage(
            message,
            { modal: options?.modal, detail: options?.detail },
            ...actions
        );
        
        if (result && options?.actions) {
            const action = options.actions.find(a => a.label === result);
            if (action) {
                if (action.command) {
                    vscode.commands.executeCommand(action.command);
                } else if (action.callback) {
                    await action.callback();
                }
            }
        }
        
        return result;
    }
    
    /**
     * Show progress notification
     */
    async withProgress<T>(
        title: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>,
        cancellable: boolean = false
    ): Promise<T> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable
        }, task);
    }
    
    /**
     * Show status bar message
     */
    showStatusMessage(message: string, timeout?: number): vscode.Disposable {
        if (timeout !== undefined) {
            return vscode.window.setStatusBarMessage(message, timeout);
        } else {
            return vscode.window.setStatusBarMessage(message);
        }
    }
    
    /**
     * Show quick pick
     */
    async showQuickPick<T extends vscode.QuickPickItem>(
        items: T[],
        options?: vscode.QuickPickOptions
    ): Promise<T | undefined> {
        return vscode.window.showQuickPick(items, options);
    }
    
    /**
     * Show input box
     */
    async showInputBox(options?: vscode.InputBoxOptions): Promise<string | undefined> {
        return vscode.window.showInputBox(options);
    }
    
    /**
     * Write to output channel
     */
    log(level: 'info' | 'warning' | 'error', message: string): void {
        const timestamp = new Date().toISOString();
        const prefix = level.toUpperCase().padEnd(7);
        
        this.outputChannel.appendLine(`[${timestamp}] ${prefix} ${message}`);
        
        this.notificationHistory.push({
            type: level,
            message,
            timestamp: Date.now()
        });
        
        // Keep only last 100 notifications
        if (this.notificationHistory.length > 100) {
            this.notificationHistory.shift();
        }
    }
    
    /**
     * Show output channel
     */
    showOutput(): void {
        this.outputChannel.show();
    }
    
    /**
     * Clear output channel
     */
    clearOutput(): void {
        this.outputChannel.clear();
    }
    
    /**
     * Get notification history
     */
    getHistory(): typeof this.notificationHistory {
        return [...this.notificationHistory];
    }
    
    /**
     * Dispose resources
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}