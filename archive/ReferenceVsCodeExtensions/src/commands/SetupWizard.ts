import * as vscode from 'vscode';
import { NotificationManager, InputValidators } from '../Utilities/NotificationManager';

/**
 * Setup wizard for first-time users to configure ShareDo connection
 */
export class SetupWizard {
    private notificationManager = NotificationManager.getInstance();

    /**
     * Launch the setup wizard
     */
    public async launch(): Promise<boolean> {
        const welcome = await vscode.window.showInformationMessage(
            '👋 Welcome to ShareDo VS Code Extension!',
            'Let\'s set up your first connection to get started.',
            'Start Setup',
            'Cancel'
        );

        if (welcome !== 'Start Setup') {
            return false;
        }

        try {
            const config = await this.collectConnectionDetails();
            if (!config) {
                return false;
            }

            const success = await this.testAndSaveConnection(config);
            
            if (success) {
                await this.showSuccessMessage();
                return true;
            } else {
                await this.showRetryOption(config);
                return false;
            }
        } catch (error) {
            await vscode.window.showErrorMessage(
                'Setup failed. You can retry setup later using the "Connect to ShareDo Server" command.',
                'OK'
            );
            return false;
        }
    }

    /**
     * Collect connection details from user
     */
    private async collectConnectionDetails(): Promise<ConnectionConfig | undefined> {
        const config: Partial<ConnectionConfig> = {};

        // Step 1: Server URL
        config.url = await this.notificationManager.showConnectionInput(
            'Step 1/4: ShareDo Server URL',
            'https://your-sharedo-server.com',
            InputValidators.validateUrl
        );

        if (!config.url) {
            return undefined;
        }

        // Step 2: Client ID
        config.clientId = await this.notificationManager.showConnectionInput(
            'Step 2/4: Client ID',
            'Enter your ShareDo client ID',
            InputValidators.validateRequired
        );

        if (!config.clientId) {
            return undefined;
        }

        // Step 3: Client Secret
        config.clientSecret = await vscode.window.showInputBox({
            title: 'Step 3/4: Client Secret',
            placeHolder: 'Enter your ShareDo client secret',
            password: true,
            validateInput: InputValidators.validateRequired,
            ignoreFocusOut: true
        });

        if (!config.clientSecret) {
            return undefined;
        }

        // Step 4: Display Name (Optional)
        config.displayName = await vscode.window.showInputBox({
            title: 'Step 4/4: Connection Name (Optional)',
            placeHolder: 'My ShareDo Server',
            value: this.generateDisplayName(config.url),
            ignoreFocusOut: true
        });

        return config as ConnectionConfig;
    }

    /**
     * Test the connection and save if successful
     */
    private async testAndSaveConnection(config: ConnectionConfig): Promise<boolean> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Testing ShareDo connection...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Connecting to server...' });
                
                try {
                    // TODO: Implement actual connection test
                    // const testResult = await this.testConnection(config);
                    
                    // Simulate connection test
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    progress.report({ message: 'Saving configuration...' });
                    
                    // TODO: Save connection configuration
                    // await this.saveConfiguration(config);
                    
                    return true;
                } catch (error) {
                    console.error('Connection test failed:', error);
                    return false;
                }
            }
        );
    }

    /**
     * Show success message with next steps
     */
    private async showSuccessMessage(): Promise<void> {
        const action = await vscode.window.showInformationMessage(
            '🎉 ShareDo connection configured successfully!',
            'Your extension is now ready to use. You can find ShareDo resources in the Explorer panel.',
            'Open ShareDo Explorer',
            'View Documentation'
        );

        switch (action) {
            case 'Open ShareDo Explorer':
                await vscode.commands.executeCommand('workbench.view.explorer');
                break;
            case 'View Documentation':
                await vscode.env.openExternal(vscode.Uri.parse('https://github.com/Alter-Igor/sharedo-vscode-extension/blob/main/README.md'));
                break;
        }
    }

    /**
     * Show retry options when connection fails
     */
    private async showRetryOption(config: ConnectionConfig): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            '❌ Connection test failed',
            'Please check your server URL and credentials.',
            'Retry Setup',
            'Manual Configuration',
            'Get Help'
        );

        switch (action) {
            case 'Retry Setup':
                await this.launch();
                break;
            case 'Manual Configuration':
                await vscode.commands.executeCommand('sharedo.generateSettingsJson');
                break;
            case 'Get Help':
                await this.showTroubleshootingGuide();
                break;
        }
    }

    /**
     * Show troubleshooting guide
     */
    private async showTroubleshootingGuide(): Promise<void> {
        const troubleshootingContent = `# ShareDo Connection Troubleshooting

## Common Issues:

### 1. Invalid Server URL
- Ensure the URL includes the protocol (https://)
- Check that the server is accessible from your network
- Verify the URL doesn't have a trailing slash

### 2. Authentication Issues
- Verify your Client ID and Client Secret are correct
- Check with your ShareDo administrator for proper credentials
- Ensure your account has the necessary permissions

### 3. Network Issues
- Check your firewall settings
- Verify proxy settings if behind corporate firewall
- Test the URL in a web browser

### 4. SSL Certificate Issues
- Ensure the ShareDo server has a valid SSL certificate
- Check if your organization uses custom certificates

## Getting Help:
- Contact your ShareDo administrator
- Report issues: https://github.com/Alter-Igor/sharedo-vscode-extension/issues
- Documentation: https://github.com/Alter-Igor/sharedo-vscode-extension/blob/main/README.md

---
*Generated by ShareDo VS Code Extension*`;

        const document = await vscode.workspace.openTextDocument({
            content: troubleshootingContent,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(document);
    }

    /**
     * Generate a display name from URL
     */
    private generateDisplayName(url: string): string {
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname;
            
            // Remove common prefixes and create a friendly name
            const cleanHostname = hostname
                .replace(/^(www\.|api\.|app\.)/, '')
                .replace(/\.(com|org|net|io)$/, '');
                
            return cleanHostname
                .split('.')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ') + ' Server';
        } catch {
            return 'ShareDo Server';
        }
    }
}

interface ConnectionConfig {
    url: string;
    clientId: string;
    clientSecret: string;
    displayName?: string;
}

/**
 * Command to launch the setup wizard
 */
export function registerSetupWizardCommand(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand('sharedo.setupWizard', async () => {
        const wizard = new SetupWizard();
        await wizard.launch();
    });

    context.subscriptions.push(disposable);
}
