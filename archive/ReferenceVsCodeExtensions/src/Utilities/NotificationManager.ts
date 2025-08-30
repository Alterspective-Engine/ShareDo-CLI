import * as vscode from 'vscode';

/**
 * Enhanced user notifications with better UX patterns
 */
export class NotificationManager {
    private static instance: NotificationManager;

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Show a success notification with optional actions
     */
    public async showSuccess(
        message: string, 
        actions: { label: string; action: () => void }[] = []
    ): Promise<void> {
        const actionLabels = actions.map(a => a.label);
        const selected = await vscode.window.showInformationMessage(`✅ ${message}`, ...actionLabels);
        
        const selectedAction = actions.find(a => a.label === selected);
        if (selectedAction) {
            selectedAction.action();
        }
    }

    /**
     * Show a warning notification with better context
     */
    public async showWarning(
        message: string,
        details?: string,
        actions: { label: string; action: () => void }[] = []
    ): Promise<void> {
        const fullMessage = details ? `${message}\n${details}` : message;
        const actionLabels = ['Dismiss', ...actions.map(a => a.label)];
        
        const selected = await vscode.window.showWarningMessage(`⚠️ ${fullMessage}`, ...actionLabels);
        
        const selectedAction = actions.find(a => a.label === selected);
        if (selectedAction) {
            selectedAction.action();
        }
    }

    /**
     * Show connection status in status bar
     */
    public showConnectionStatus(serverUrl: string, isConnected: boolean): vscode.Disposable {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 200);
        
        if (isConnected) {
            statusBarItem.text = `$(check) ShareDo: Connected`;
            statusBarItem.tooltip = `Connected to ${serverUrl}`;
            statusBarItem.backgroundColor = undefined;
        } else {
            statusBarItem.text = `$(x) ShareDo: Disconnected`;
            statusBarItem.tooltip = `Disconnected from ${serverUrl}. Click to retry connection.`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            statusBarItem.command = 'sharedo.connect';
        }
        
        statusBarItem.show();
        return statusBarItem;
    }

    /**
     * Show file operation results with statistics
     */
    public async showFileOperationResult(
        operation: string,
        results: {
            successful: string[];
            failed: { file: string; error: string }[];
            skipped?: string[];
        }
    ): Promise<void> {
        const total = results.successful.length + results.failed.length + (results.skipped?.length || 0);
        
        if (results.failed.length === 0) {
            // All successful
            await this.showSuccess(
                `${operation} completed: ${results.successful.length}/${total} files processed`,
                total > 1 ? [{ 
                    label: 'Show Details', 
                    action: () => this.showFileOperationDetails(operation, results) 
                }] : []
            );
        } else if (results.successful.length === 0) {
            // All failed
            await vscode.window.showErrorMessage(
                `❌ ${operation} failed: ${results.failed.length} files could not be processed`,
                'Show Details'
            ).then(selected => {
                if (selected === 'Show Details') {
                    this.showFileOperationDetails(operation, results);
                }
            });
        } else {
            // Mixed results
            await this.showWarning(
                `${operation} partially completed: ${results.successful.length}/${total} files processed successfully`,
                `${results.failed.length} files failed`,
                [{ 
                    label: 'Show Details', 
                    action: () => this.showFileOperationDetails(operation, results) 
                }]
            );
        }
    }

    /**
     * Show detailed file operation results in a new document
     */
    private async showFileOperationDetails(
        operation: string,
        results: {
            successful: string[];
            failed: { file: string; error: string }[];
            skipped?: string[];
        }
    ): Promise<void> {
        const content = [
            `# ${operation} Results`,
            ``,
            `**Summary:**`,
            `- ✅ Successful: ${results.successful.length}`,
            `- ❌ Failed: ${results.failed.length}`,
            `- ⏭️ Skipped: ${results.skipped?.length || 0}`,
            ``,
            `## Successful Files`,
            ...results.successful.map(file => `- ✅ ${file}`),
            ``
        ];

        if (results.failed.length > 0) {
            content.push(
                `## Failed Files`,
                ...results.failed.map(item => `- ❌ ${item.file}: ${item.error}`),
                ``
            );
        }

        if (results.skipped && results.skipped.length > 0) {
            content.push(
                `## Skipped Files`,
                ...results.skipped.map(file => `- ⏭️ ${file}`),
                ``
            );
        }

        content.push(
            `---`,
            `*Generated at: ${new Date().toLocaleString()}*`
        );

        const document = await vscode.workspace.openTextDocument({
            content: content.join('\n'),
            language: 'markdown'
        });

        await vscode.window.showTextDocument(document);
    }

    /**
     * Show a quick pick for server selection with enhanced UI
     */
    public async showServerPicker(servers: { url: string; name?: string; isConnected: boolean }[]): Promise<string | undefined> {
        const items = servers.map(server => ({
            label: server.name || server.url,
            description: server.url,
            detail: server.isConnected ? '$(check) Connected' : '$(x) Disconnected',
            url: server.url
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a ShareDo server',
            matchOnDescription: true,
            matchOnDetail: false
        });

        return selected?.url;
    }

    /**
     * Show input box with validation for connection settings
     */
    public async showConnectionInput(
        title: string,
        placeholder: string,
        validator?: (value: string) => string | undefined
    ): Promise<string | undefined> {
        return vscode.window.showInputBox({
            title: title,
            placeHolder: placeholder,
            validateInput: validator,
            ignoreFocusOut: true
        });
    }
}

/**
 * Common validation functions for user inputs
 */
export class InputValidators {
    public static validateUrl(value: string): string | undefined {
        if (!value) {
            return 'URL is required';
        }
        
        try {
            new URL(value);
            return undefined;
        } catch {
            return 'Please enter a valid URL (e.g., https://your-server.com)';
        }
    }

    public static validateRequired(value: string): string | undefined {
        return value?.trim() ? undefined : 'This field is required';
    }

    public static validateEmail(value: string): string | undefined {
        if (!value) {
            return 'Email is required';
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? undefined : 'Please enter a valid email address';
    }
}
