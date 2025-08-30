import * as vscode from 'vscode';

/**
 * Manages progress indicators and user feedback for long-running operations
 */
export class ProgressManager {
    private static instance: ProgressManager;
    private activeOperations: Map<string, vscode.Progress<{ message?: string; increment?: number }>> = new Map();

    public static getInstance(): ProgressManager {
        if (!ProgressManager.instance) {
            ProgressManager.instance = new ProgressManager();
        }
        return ProgressManager.instance;
    }

    /**
     * Start a progress indicator for a long-running operation
     */
    public async withProgress<T>(
        title: string,
        operation: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>,
        options?: {
            cancellable?: boolean;
            location?: vscode.ProgressLocation;
        }
    ): Promise<T> {
        const progressOptions: vscode.ProgressOptions = {
            location: options?.location || vscode.ProgressLocation.Notification,
            title: title,
            cancellable: options?.cancellable || false
        };

        return vscode.window.withProgress(progressOptions, async (progress, token) => {
            try {
                const result = await operation(progress, token);
                
                // Show success notification
                vscode.window.showInformationMessage(`✅ ${title} completed successfully`);
                
                return result;
            } catch (error) {
                // Show error notification with actionable options
                const errorMessage = error instanceof Error ? error.message : String(error);
                const action = await vscode.window.showErrorMessage(
                    `❌ ${title} failed: ${errorMessage}`,
                    'Retry',
                    'Show Details'
                );

                if (action === 'Show Details') {
                    this.showErrorDetails(title, error);
                }
                
                throw error;
            }
        });
    }

    /**
     * Show detailed error information in a new document
     */
    private async showErrorDetails(operation: string, error: any): Promise<void> {
        const errorDetails = {
            operation: operation,
            timestamp: new Date().toISOString(),
            error: {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace available',
                code: error?.code || 'Unknown',
                details: error
            },
            troubleshooting: [
                '1. Check your ShareDo server connection',
                '2. Verify your authentication credentials',
                '3. Ensure the server is accessible',
                '4. Check the extension output log for more details'
            ]
        };

        const document = await vscode.workspace.openTextDocument({
            content: JSON.stringify(errorDetails, null, 2),
            language: 'json'
        });

        await vscode.window.showTextDocument(document);
    }

    /**
     * Update status bar with operation progress
     */
    public updateStatusBar(message: string, isLoading: boolean = false): vscode.Disposable {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        statusBarItem.text = isLoading ? `$(sync~spin) ${message}` : `$(check) ${message}`;
        statusBarItem.show();

        // Auto-hide after 3 seconds for non-loading messages
        if (!isLoading) {
            setTimeout(() => statusBarItem.dispose(), 3000);
        }

        return statusBarItem;
    }

    /**
     * Show a user-friendly error message with suggested actions
     */
    public async showUserFriendlyError(
        title: string, 
        error: any, 
        suggestedActions: { label: string; action: () => void }[] = []
    ): Promise<void> {
        let message = 'An unexpected error occurred.';
        
        // Convert technical errors to user-friendly messages
        if (error?.code === 'ENOTFOUND') {
            message = 'Cannot connect to ShareDo server. Please check your server URL and internet connection.';
        } else if (error?.code === 'ECONNREFUSED') {
            message = 'ShareDo server refused the connection. The server may be down or the URL may be incorrect.';
        } else if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
            message = 'Authentication failed. Please check your credentials and try reconnecting.';
        } else if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
            message = 'You don\'t have permission to perform this action. Contact your ShareDo administrator.';
        } else if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
            message = 'The requested resource was not found on the ShareDo server.';
        } else if (error?.message) {
            message = error.message;
        }

        const actions = ['Show Details', ...suggestedActions.map(a => a.label)];
        const selected = await vscode.window.showErrorMessage(`❌ ${title}: ${message}`, ...actions);

        if (selected === 'Show Details') {
            this.showErrorDetails(title, error);
        } else {
            const selectedAction = suggestedActions.find(a => a.label === selected);
            if (selectedAction) {
                selectedAction.action();
            }
        }
    }
}

/**
 * Utility functions for common progress operations
 */
export class ProgressUtils {
    private static progressManager = ProgressManager.getInstance();

    public static async withFileOperation<T>(
        operation: string,
        fileName: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
    ): Promise<T> {
        return this.progressManager.withProgress(
            `${operation}: ${fileName}`,
            async (progress) => {
                progress.report({ message: 'Starting...' });
                return task(progress);
            },
            { cancellable: true, location: vscode.ProgressLocation.Notification }
        );
    }

    public static async withServerOperation<T>(
        operation: string,
        serverUrl: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
    ): Promise<T> {
        return this.progressManager.withProgress(
            `${operation} (${serverUrl})`,
            task,
            { cancellable: false, location: vscode.ProgressLocation.Window }
        );
    }
}
