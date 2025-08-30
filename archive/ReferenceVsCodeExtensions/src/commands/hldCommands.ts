/**
 * HLD Document Generation Commands
 * 
 * Commands for generating High-Level Design documents from work-types
 */

import * as vscode from 'vscode';
import { TreeNode } from '../treeprovider';
import { ElementTypes } from '../enums';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { HLDDocumentGenerator } from '../services/HLDDocumentGenerator';
import { EnhancedHLDDocumentGenerator } from '../services/EnhancedHLDDocumentGenerator';
import { ExportCacheService } from '../services/ExportCacheService';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { BrowserAuthenticationService } from '../services/BrowserAuthenticationService';
import { PlaywrightExportService } from '../services/PlaywrightExportService';
import { Inform } from '../Utilities/inform';
import * as path from 'path';
import * as fs from 'fs';

export class HLDCommands {
    /**
     * Generate HLD document for a work-type
     */
    static async generateHLD(node: TreeNode): Promise<void> {
        try {
            // Validate node type
            if (!node || node.type !== ElementTypes.workType) {
                vscode.window.showErrorMessage('Please select a work-type to generate HLD document');
                return;
            }

            const workType = node.data as IWorkType;
            if (!workType) {
                vscode.window.showErrorMessage('Invalid work-type data');
                return;
            }

            // Ensure authentication before proceeding with HLD generation
            try {
                Inform.writeInfo('🔐 Checking authentication for HLD generation...');
                
                // Try to get current bearer token
                const currentToken = await node.sharedoClient.getBearer();
                let needsAuthentication = false;
                
                if (!currentToken) {
                    needsAuthentication = true;
                    Inform.writeInfo('No authentication token found');
                } else {
                    // Basic token check (we'll let the API calls validate the token properly)
                    Inform.writeInfo('✅ Authentication token found for HLD generation');
                }
                
                if (needsAuthentication) {
                    // Show authentication options to the user
                    const choice = await vscode.window.showInformationMessage(
                        '🔐 Authentication required for HLD generation. Please choose login method:',
                        'Browser Login',
                        'Use Stored Credentials',
                        'Cancel'
                    );
                    
                    if (choice === 'Cancel') {
                        vscode.window.showInformationMessage('HLD generation cancelled');
                        return;
                    }
                    
                    const browserAuthService = BrowserAuthenticationService.getInstance();
                    
                    if (choice === 'Browser Login') {
                        // Use browser authentication
                        const authResult = await browserAuthService.authenticateForExport(node.sharedoClient, {
                            showBrowser: true,
                            timeout: 180000 // 3 minutes
                        });
                        
                        if (!authResult.success) {
                            vscode.window.showErrorMessage(`Authentication failed: ${authResult.error}`);
                            return;
                        }
                        
                        // Update the client with the new token
                        if (authResult.token) {
                            node.sharedoClient._bearer = authResult.token;
                            Inform.writeInfo('✅ Successfully authenticated via browser for HLD generation');
                        }
                    } else if (choice === 'Use Stored Credentials') {
                        // Try to get stored token
                        const storedToken = browserAuthService.getStoredToken(node.sharedoClient.url);
                        if (storedToken) {
                            node.sharedoClient._bearer = storedToken;
                            Inform.writeInfo('✅ Successfully used stored credentials for HLD generation');
                        } else {
                            vscode.window.showErrorMessage('No stored credentials found. Please use Browser Login.');
                            return;
                        }
                    }
                }
            } catch (authError) {
                const errorMessage = authError instanceof Error ? authError.message : String(authError);
                vscode.window.showErrorMessage(`Authentication failed: ${errorMessage}`);
                Inform.writeError('HLDCommands.generateHLD authentication', authError);
                return;
            }

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Generating HLD for ${workType.name}`,
                cancellable: false
            }, async (progress) => {
                try {
                    // Update progress
                    progress.report({ increment: 0, message: 'Initializing...' });
                    
                    // Get document generator (use enhanced version)
                    const generator = EnhancedHLDDocumentGenerator.getInstance();
                    
                    // Collect data and generate document
                    progress.report({ increment: 30, message: 'Collecting work-type data...' });
                    
                    // Prompt user for save location first
                    const defaultFileName = `${workType.systemName.replace(/[^a-zA-Z0-9]/g, '_')}_HLD_${new Date().toISOString().split('T')[0]}.docx`;
                    
                    const saveUri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', defaultFileName)),
                        filters: {
                            'docx': ['docx']
                        },
                        saveLabel: 'Save HLD Document'
                    });
                    
                    if (!saveUri) {
                        vscode.window.showInformationMessage('HLD generation cancelled');
                        return;
                    }
                    
                    progress.report({ increment: 30, message: 'Generating document and diagrams...' });
                    
                    // Generate HLD with diagrams exported
                    const buffer = await generator.generateHLDWithDiagrams(workType, node.sharedoClient, saveUri.fsPath);
                    
                    progress.report({ increment: 60, message: 'Saving document and diagrams...' });
                    
                    // Save the document
                    await vscode.workspace.fs.writeFile(saveUri, new Uint8Array(buffer));
                    
                    progress.report({ increment: 100, message: 'Complete!' });
                    
                    // Show success message with option to open
                    const choice = await vscode.window.showInformationMessage(
                        `HLD document saved successfully: ${path.basename(saveUri.fsPath)}`,
                        'Open Document',
                        'Open Folder'
                    );
                    
                    if (choice === 'Open Document') {
                        // Open the document with system default application
                        await vscode.env.openExternal(saveUri);
                    } else if (choice === 'Open Folder') {
                        // Open containing folder
                        const folderUri = vscode.Uri.file(path.dirname(saveUri.fsPath));
                        await vscode.env.openExternal(folderUri);
                    }
                    
                    // Log success
                    Inform.writeInfo(`HLD document generated successfully for ${workType.name} at ${saveUri.fsPath}`);
                    
                } catch (error) {
                    throw error;
                }
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to generate HLD document: ${errorMessage}`);
            Inform.writeError('HLDCommands.generateHLD', error);
        }
    }

    /**
     * Generate HLD documents for multiple work-types (batch)
     */
    static async generateBatchHLD(nodes: TreeNode[]): Promise<void> {
        try {
            // Filter to only work-type nodes
            const workTypeNodes = nodes.filter(n => n.type === ElementTypes.workType);
            
            if (workTypeNodes.length === 0) {
                vscode.window.showErrorMessage('No work-types selected for batch HLD generation');
                return;
            }

            // Ask for output directory
            const outputUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Output Folder',
                title: 'Select folder for HLD documents'
            });

            if (!outputUri || outputUri.length === 0) {
                vscode.window.showInformationMessage('Batch HLD generation cancelled');
                return;
            }

            const outputPath = outputUri[0].fsPath;

            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Generating ${workTypeNodes.length} HLD documents`,
                cancellable: true
            }, async (progress, token) => {
                const generator = EnhancedHLDDocumentGenerator.getInstance();
                const results = { success: 0, failed: 0 };
                
                for (let i = 0; i < workTypeNodes.length; i++) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    const node = workTypeNodes[i];
                    const workType = node.data as IWorkType;
                    
                    progress.report({
                        increment: (100 / workTypeNodes.length) * i,
                        message: `Processing ${workType.name} (${i + 1}/${workTypeNodes.length})...`
                    });

                    try {
                        // Generate document
                        const buffer = await generator.generateHLD(workType, node.sharedoClient);
                        
                        // Save to file
                        const fileName = `${workType.systemName.replace(/[^a-zA-Z0-9]/g, '_')}_HLD_${new Date().toISOString().split('T')[0]}.docx`;
                        const filePath = path.join(outputPath, fileName);
                        
                        await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), new Uint8Array(buffer));
                        
                        results.success++;
                        Inform.writeInfo(`Generated HLD for ${workType.name}`);
                        
                    } catch (error) {
                        results.failed++;
                        Inform.writeError(`Failed to generate HLD for ${workType.name}`, error);
                    }
                }

                // Show results
                const message = `HLD Generation Complete: ${results.success} successful, ${results.failed} failed`;
                
                if (results.failed === 0) {
                    const choice = await vscode.window.showInformationMessage(
                        message,
                        'Open Folder'
                    );
                    
                    if (choice === 'Open Folder') {
                        await vscode.env.openExternal(vscode.Uri.file(outputPath));
                    }
                } else {
                    vscode.window.showWarningMessage(message);
                }
            });
            
        } catch (error) {
            vscode.window.showErrorMessage(`Batch HLD generation failed: ${error}`);
            Inform.writeError('HLDCommands.generateBatchHLD', error);
        }
    }

    /**
     * Generate HLD with custom template
     */
    static async generateHLDWithTemplate(node: TreeNode): Promise<void> {
        try {
            if (!node || node.type !== ElementTypes.workType) {
                vscode.window.showErrorMessage('Please select a work-type to generate HLD document');
                return;
            }

            const workType = node.data as IWorkType;

            // Ensure authentication before proceeding
            try {
                Inform.writeInfo('🔐 Checking authentication for HLD template generation...');
                
                const currentToken = await node.sharedoClient.getBearer();
                let needsAuthentication = false;
                
                if (!currentToken) {
                    needsAuthentication = true;
                    Inform.writeInfo('No authentication token found');
                } else {
                    Inform.writeInfo('✅ Authentication token found for HLD template generation');
                }
                
                if (needsAuthentication) {
                    const choice = await vscode.window.showInformationMessage(
                        '🔐 Authentication required for HLD generation. Please choose login method:',
                        'Browser Login',
                        'Use Stored Credentials',
                        'Cancel'
                    );
                    
                    if (choice === 'Cancel') {
                        vscode.window.showInformationMessage('HLD template generation cancelled');
                        return;
                    }
                    
                    const browserAuthService = BrowserAuthenticationService.getInstance();
                    
                    if (choice === 'Browser Login') {
                        const authResult = await browserAuthService.authenticateForExport(node.sharedoClient, {
                            showBrowser: true,
                            timeout: 180000
                        });
                        
                        if (!authResult.success) {
                            vscode.window.showErrorMessage(`Authentication failed: ${authResult.error}`);
                            return;
                        }
                        
                        if (authResult.token) {
                            node.sharedoClient._bearer = authResult.token;
                            Inform.writeInfo('✅ Successfully authenticated via browser for HLD template generation');
                        }
                    } else if (choice === 'Use Stored Credentials') {
                        const storedToken = browserAuthService.getStoredToken(node.sharedoClient.url);
                        if (storedToken) {
                            node.sharedoClient._bearer = storedToken;
                            Inform.writeInfo('✅ Successfully used stored credentials for HLD template generation');
                        } else {
                            vscode.window.showErrorMessage('No stored credentials found. Please use Browser Login.');
                            return;
                        }
                    }
                }
            } catch (authError) {
                const errorMessage = authError instanceof Error ? authError.message : String(authError);
                vscode.window.showErrorMessage(`Authentication failed: ${errorMessage}`);
                Inform.writeError('HLDCommands.generateHLDWithTemplate authentication', authError);
                return;
            }

            // Ask user to select template
            const templates = [
                { label: 'Standard HLD', description: 'Complete high-level design document', value: 'standard' },
                { label: 'Technical HLD', description: 'Focus on technical architecture', value: 'technical' },
                { label: 'Business HLD', description: 'Focus on business requirements', value: 'business' },
                { label: 'Security HLD', description: 'Focus on security aspects', value: 'security' }
            ];

            const selected = await vscode.window.showQuickPick(templates, {
                placeHolder: 'Select HLD template',
                matchOnDescription: true
            });

            if (!selected) {
                return;
            }

            // Generate with selected template
            // TODO: Implement template-specific generation
            vscode.window.showInformationMessage(`Generating ${selected.label} for ${workType.name}`);
            
            // For now, use standard generation
            await HLDCommands.generateHLD(node);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate HLD with template: ${error}`);
            Inform.writeError('HLDCommands.generateHLDWithTemplate', error);
        }
    }

    /**
     * Preview HLD document before saving - Uses Playwright for complete export process
     */
    static async previewHLD(node: TreeNode): Promise<void> {
        try {
            if (!node || node.type !== ElementTypes.workType) {
                vscode.window.showErrorMessage('Please select a work-type to preview HLD document');
                return;
            }

            const workType = node.data as IWorkType;

            Inform.writeInfo(`🎭 Starting Playwright-based HLD preview for ${workType.name}`);

            // Show choice for authentication method
            const authChoice = await vscode.window.showInformationMessage(
                '🔐 Choose authentication method for HLD preview:',
                {
                    detail: 'Playwright will open a browser to login and export the work-type package for HLD generation'
                },
                'Use Browser (with credentials)',
                'Use Browser (manual login)',
                'Cancel'
            );

            if (authChoice === 'Cancel') {
                vscode.window.showInformationMessage('HLD preview cancelled');
                return;
            }

            let credentials: { username: string; password: string } | undefined;

            // Get credentials if user chose automatic login
            if (authChoice === 'Use Browser (with credentials)') {
                const username = await vscode.window.showInputBox({
                    prompt: 'Enter your ShareDo username',
                    placeHolder: 'username',
                    ignoreFocusOut: true
                });

                if (!username) {
                    vscode.window.showInformationMessage('Username required for automatic login');
                    return;
                }

                const password = await vscode.window.showInputBox({
                    prompt: 'Enter your ShareDo password',
                    placeHolder: 'password',
                    password: true,
                    ignoreFocusOut: true
                });

                if (!password) {
                    vscode.window.showInformationMessage('Password required for automatic login');
                    return;
                }

                credentials = { username, password };
            }

            // Show progress while exporting
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Generating HLD Preview for ${workType.name}`,
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ increment: 10, message: 'Initializing Playwright export...' });

                    const playwrightService = PlaywrightExportService.getInstance();
                    
                    progress.report({ increment: 20, message: 'Opening browser and authenticating...' });

                    // Use Playwright to export the work-type package
                    const exportResult = await playwrightService.exportForHLD(
                        workType,
                        node.sharedoClient.url,
                        credentials
                    );

                    if (!exportResult.success) {
                        throw new Error(exportResult.error || 'Export failed');
                    }

                    progress.report({ increment: 40, message: 'Export package downloaded, generating HLD...' });

                    // Now generate the HLD document using the exported package data
                    // For now, we'll use the enhanced generator with the existing client
                    // TODO: In the future, we could parse the exported package to get more detailed data
                    const generator = EnhancedHLDDocumentGenerator.getInstance();
                    const buffer = await generator.generateHLD(workType, node.sharedoClient, true); // Skip data extraction

                    progress.report({ increment: 30, message: 'Saving preview document...' });

                    // Save to temp location
                    const tempPath = path.join(vscode.workspace.rootPath || '', '.temp', `${workType.systemName}_preview.docx`);
                    
                    // Ensure temp directory exists
                    const tempDir = path.dirname(tempPath);
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }

                    // Write temp file
                    fs.writeFileSync(tempPath, new Uint8Array(buffer));

                    progress.report({ increment: 0, message: 'Opening preview...' });

                    // Open preview
                    await vscode.env.openExternal(vscode.Uri.file(tempPath));

                    // Show success message with export details
                    const message = exportResult.filePath 
                        ? `HLD preview opened. Export package (${exportResult.fileSize}) saved to: ${path.basename(exportResult.filePath)}`
                        : 'HLD preview opened. This is a temporary file.';
                    
                    vscode.window.showInformationMessage(message);

                    Inform.writeInfo(`✅ HLD preview completed successfully`);
                    if (exportResult.filePath) {
                        Inform.writeInfo(`   Export package: ${exportResult.filePath} (${exportResult.fileSize})`);
                    }
                    Inform.writeInfo(`   Preview document: ${tempPath}`);

                } catch (progressError) {
                    const errorMessage = progressError instanceof Error ? progressError.message : String(progressError);
                    
                    // Fallback to traditional method if Playwright fails
                    progress.report({ increment: 50, message: 'Playwright export failed, using fallback method...' });
                    
                    Inform.writeInfo(`Playwright export failed: ${errorMessage}`);
                    Inform.writeInfo('Falling back to traditional HLD generation...');

                    try {
                        // Traditional authentication check
                        const currentToken = await node.sharedoClient.getBearer();
                        if (!currentToken) {
                            throw new Error('No authentication available for fallback method');
                        }

                        // Generate document using traditional method
                        const generator = EnhancedHLDDocumentGenerator.getInstance();
                        const buffer = await generator.generateHLD(workType, node.sharedoClient);

                        // Save to temp location
                        const tempPath = path.join(vscode.workspace.rootPath || '', '.temp', `${workType.systemName}_preview.docx`);
                        
                        // Ensure temp directory exists
                        const tempDir = path.dirname(tempPath);
                        if (!fs.existsSync(tempDir)) {
                            fs.mkdirSync(tempDir, { recursive: true });
                        }

                        // Write temp file
                        fs.writeFileSync(tempPath, new Uint8Array(buffer));

                        // Open preview
                        await vscode.env.openExternal(vscode.Uri.file(tempPath));

                        vscode.window.showInformationMessage('HLD preview opened (using fallback method).');
                        
                    } catch (fallbackError) {
                        throw new Error(`Both Playwright and fallback methods failed: ${errorMessage}`);
                    }
                }
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to preview HLD: ${errorMessage}`);
            Inform.writeError('HLDCommands.previewHLD', error);
        }
    }

    /**
     * Preview HLD document using complete Playwright export process
     */
    static async previewHLDWithPlaywright(node: TreeNode): Promise<void> {
        try {
            if (!node || node.type !== ElementTypes.workType) {
                vscode.window.showErrorMessage('Please select a work-type to preview HLD document');
                return;
            }

            const workType = node.data as IWorkType;

            Inform.writeInfo(`🎭 Starting complete Playwright-based HLD export for ${workType.name}`);

            // Show choice for authentication method
            const authChoice = await vscode.window.showInformationMessage(
                '🎭 Complete Playwright Export',
                {
                    detail: 'This will use Playwright to login, export the work-type package, and generate HLD from the exported data'
                },
                'Use Browser (with credentials)',
                'Use Browser (manual login)',
                'Cancel'
            );

            if (authChoice === 'Cancel') {
                vscode.window.showInformationMessage('Playwright HLD export cancelled');
                return;
            }

            let credentials: { username: string; password: string } | undefined;

            // Get credentials if user chose automatic login
            if (authChoice === 'Use Browser (with credentials)') {
                const username = await vscode.window.showInputBox({
                    prompt: 'Enter your ShareDo username',
                    placeHolder: 'username',
                    ignoreFocusOut: true
                });

                if (!username) {
                    vscode.window.showInformationMessage('Username required for automatic login');
                    return;
                }

                const password = await vscode.window.showInputBox({
                    prompt: 'Enter your ShareDo password',
                    placeHolder: 'password',
                    password: true,
                    ignoreFocusOut: true
                });

                if (!password) {
                    vscode.window.showInformationMessage('Password required for automatic login');
                    return;
                }

                credentials = { username, password };
            }

            // Show progress while exporting
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Complete Playwright Export: ${workType.name}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 10, message: 'Initializing Playwright export...' });

                const playwrightService = PlaywrightExportService.getInstance();
                
                progress.report({ increment: 20, message: 'Opening browser and authenticating...' });

                // Use Playwright to export the work-type package
                const exportResult = await playwrightService.exportForHLD(
                    workType,
                    node.sharedoClient.url,
                    credentials
                );

                if (!exportResult.success) {
                    throw new Error(exportResult.error || 'Playwright export failed');
                }

                progress.report({ increment: 60, message: 'Export package downloaded, generating HLD...' });

                // Generate HLD using the traditional generator (for now)
                // TODO: Future enhancement could parse the exported package for richer data
                const generator = EnhancedHLDDocumentGenerator.getInstance();
                const buffer = await generator.generateHLD(workType, node.sharedoClient, true); // Skip data extraction

                progress.report({ increment: 20, message: 'Saving HLD document...' });

                // Save to temp location
                const tempPath = path.join(vscode.workspace.rootPath || '', '.temp', `${workType.systemName}_playwright_preview.docx`);
                
                // Ensure temp directory exists
                const tempDir = path.dirname(tempPath);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                // Write temp file
                fs.writeFileSync(tempPath, new Uint8Array(buffer));

                // Open preview
                await vscode.env.openExternal(vscode.Uri.file(tempPath));

                // Show success message with export details
                const successMessage = [
                    `✅ Complete Playwright export successful!`,
                    `📦 Export Package: ${path.basename(exportResult.filePath || 'downloaded')} (${exportResult.fileSize})`,
                    `📄 HLD Document: ${path.basename(tempPath)}`,
                    exportResult.jobId ? `🔢 Job ID: ${exportResult.jobId}` : ''
                ].filter(Boolean).join('\n');

                vscode.window.showInformationMessage(
                    'Playwright HLD Export Complete',
                    { detail: successMessage }
                );

                Inform.writeInfo(`✅ Complete Playwright HLD export completed successfully`);
                Inform.writeInfo(`   Export package: ${exportResult.filePath} (${exportResult.fileSize})`);
                Inform.writeInfo(`   HLD document: ${tempPath}`);
                if (exportResult.jobId) {
                    Inform.writeInfo(`   Job ID: ${exportResult.jobId}`);
                }
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Playwright HLD export failed: ${errorMessage}`);
            Inform.writeError('HLDCommands.previewHLDWithPlaywright', error);
        }
    }

    /**
     * Clear the HLD cache
     */
    static async clearCache(): Promise<void> {
        try {
            const choice = await vscode.window.showWarningMessage(
                'Are you sure you want to clear the HLD cache? This will remove all cached export data.',
                'Clear Cache',
                'Cancel'
            );

            if (choice !== 'Clear Cache') {
                return;
            }

            const cache = ExportCacheService.getInstance();
            await cache.clearCache();
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear cache: ${error}`);
            Inform.writeError('HLDCommands.clearCache', error);
        }
    }

    /**
     * Show HLD cache status
     */
    static async showCacheStatus(): Promise<void> {
        try {
            const cache = ExportCacheService.getInstance();
            const stats = cache.getCacheStats();
            
            // Show in output channel
            cache.showCacheStatus();
            
            // Also show quick summary
            const message = [
                `HLD Cache Status:`,
                `• Entries: ${stats.totalEntries}`,
                `• Size: ${Math.round(stats.totalSize / 1024)}KB`,
                `• Hit Rate: ${stats.hitRate}%`
            ];
            
            if (stats.mostAccessed.length > 0) {
                message.push(`• Most Used: ${stats.mostAccessed[0]}`);
            }
            
            const choice = await vscode.window.showInformationMessage(
                message.join('\n'),
                'Clear Cache',
                'Close'
            );
            
            if (choice === 'Clear Cache') {
                await HLDCommands.clearCache();
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show cache status: ${error}`);
            Inform.writeError('HLDCommands.showCacheStatus', error);
        }
    }

    /**
     * Show performance report
     */
    static async showPerformanceReport(): Promise<void> {
        try {
            const perfMonitor = PerformanceMonitor.getInstance();
            perfMonitor.showReport();
            
            const choice = await vscode.window.showInformationMessage(
                'Performance report shown in output channel',
                'Export Metrics',
                'Clear Metrics',
                'Close'
            );
            
            if (choice === 'Export Metrics') {
                const metrics = perfMonitor.exportMetrics();
                const defaultFileName = `hld-performance-${new Date().toISOString().split('T')[0]}.json`;
                
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', defaultFileName)),
                    filters: {
                        'json': ['json']
                    },
                    saveLabel: 'Export Performance Metrics'
                });
                
                if (saveUri) {
                    await vscode.workspace.fs.writeFile(saveUri, new Uint8Array(Buffer.from(metrics)));
                    vscode.window.showInformationMessage('Performance metrics exported successfully');
                }
            } else if (choice === 'Clear Metrics') {
                await HLDCommands.clearPerformanceMetrics();
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show performance report: ${error}`);
            Inform.writeError('HLDCommands.showPerformanceReport', error);
        }
    }

    /**
     * Clear performance metrics
     */
    static async clearPerformanceMetrics(): Promise<void> {
        try {
            const choice = await vscode.window.showWarningMessage(
                'Are you sure you want to clear all performance metrics?',
                'Clear Metrics',
                'Cancel'
            );

            if (choice !== 'Clear Metrics') {
                return;
            }

            const perfMonitor = PerformanceMonitor.getInstance();
            perfMonitor.clearMetrics();
            
            vscode.window.showInformationMessage('Performance metrics cleared');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear performance metrics: ${error}`);
            Inform.writeError('HLDCommands.clearPerformanceMetrics', error);
        }
    }
}