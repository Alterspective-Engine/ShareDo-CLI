/**
 * Configurable HLD Commands
 * 
 * VS Code commands for generating stakeholder-specific HLD documents
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ConfigurableHLDGenerator } from '../services/ConfigurableHLDGenerator';
import { IWorkType } from '../Request/WorkTypes/IGetWorkTypesRequestResult';
import { SharedoClient } from '../sharedoClient';
import { Inform } from '../Utilities/inform';
// Simplified state management for MVP
interface ISimpleState {
    selectedWorkType?: IWorkType;
    currentConnection?: SharedoClient;
}

/**
 * Register configurable HLD commands
 */
export function registerConfigurableHLDCommands(context: vscode.ExtensionContext): void {
    const generator = ConfigurableHLDGenerator.getInstance();

    // Main command - Generate HLD with template selection
    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateConfigurableHLD', async () => {
            await generateHLDWithTemplate(generator);
        })
    );

    // Quick commands for specific templates
    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateBusinessAnalystHLD', async () => {
            await generateSpecificHLD(generator, 'business-analyst');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateSystemAdminHLD', async () => {
            await generateSpecificHLD(generator, 'system-admin');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateSupportConsultantHLD', async () => {
            await generateSpecificHLD(generator, 'support-consultant');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateTrainerHLD', async () => {
            await generateSpecificHLD(generator, 'trainer');
        })
    );

    // Cheat sheet commands
    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateAllCheatSheets', async () => {
            await generateAllCheatSheets(generator);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateLegalAdminCheatSheet', async () => {
            await generateSpecificHLD(generator, 'legal-admin-cheatsheet');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateLawyerCheatSheet', async () => {
            await generateSpecificHLD(generator, 'lawyer-cheatsheet');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateManagerCheatSheet', async () => {
            await generateSpecificHLD(generator, 'manager-cheatsheet');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateSysAdminCheatSheet', async () => {
            await generateSpecificHLD(generator, 'sysadmin-cheatsheet');
        })
    );

    // Bulk generation command
    context.subscriptions.push(
        vscode.commands.registerCommand('sharedo.generateFullDocumentationSuite', async () => {
            await generateFullDocumentationSuite(generator);
        })
    );
}

/**
 * Generate HLD with template selection
 */
async function generateHLDWithTemplate(generator: ConfigurableHLDGenerator): Promise<void> {
    try {
        // Get current work type
        const workType = await selectWorkType();
        if (!workType) {
            return;
        }

        // Get ShareDo client
        const server = await getSharedoClient();
        if (!server) {
            vscode.window.showErrorMessage('No ShareDo server connection available');
            return;
        }

        // Get available templates
        const templates = generator.getAvailableTemplates();
        
        // Show template picker
        const templateItems = templates.map(t => ({
            label: t.name,
            description: t.description,
            id: t.id
        }));

        const selected = await vscode.window.showQuickPick(templateItems, {
            placeHolder: 'Select document template',
            title: 'Generate HLD Documentation'
        });

        if (!selected) {
            return;
        }

        // Generate document with progress
        await generateDocument(generator, workType, server, selected.id, selected.label);

    } catch (error) {
        handleError(error);
    }
}

/**
 * Generate specific HLD document
 */
async function generateSpecificHLD(
    generator: ConfigurableHLDGenerator,
    templateId: string
): Promise<void> {
    try {
        // Get current work type
        const workType = await selectWorkType();
        if (!workType) {
            return;
        }

        // Get ShareDo client
        const server = await getSharedoClient();
        if (!server) {
            vscode.window.showErrorMessage('No ShareDo server connection available');
            return;
        }

        // Get template name
        const templates = generator.getAvailableTemplates();
        const template = templates.find(t => t.id === templateId);
        const templateName = template?.name || templateId;

        // Generate document
        await generateDocument(generator, workType, server, templateId, templateName);

    } catch (error) {
        handleError(error);
    }
}

/**
 * Generate all cheat sheets
 */
async function generateAllCheatSheets(generator: ConfigurableHLDGenerator): Promise<void> {
    try {
        const workType = await selectWorkType();
        if (!workType) {
            return;
        }

        const server = await getSharedoClient();
        if (!server) {
            vscode.window.showErrorMessage('No ShareDo server connection available');
            return;
        }

        const cheatSheets = [
            'legal-admin-cheatsheet',
            'lawyer-cheatsheet',
            'manager-cheatsheet',
            'sysadmin-cheatsheet'
        ];

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating all cheat sheets...',
            cancellable: false
        }, async (progress) => {
            let completed = 0;
            const total = cheatSheets.length;

            for (const templateId of cheatSheets) {
                const templates = generator.getAvailableTemplates();
                const template = templates.find(t => t.id === templateId);
                const templateName = template?.name || templateId;

                progress.report({ 
                    increment: (100 / total),
                    message: `Generating ${templateName}...` 
                });

                try {
                    const buffer = await generator.generateWithTemplate(workType, server, templateId);
                    await saveDocument(buffer, workType, templateId);
                    completed++;
                } catch (error) {
                    console.error(`Failed to generate ${templateId}:`, error);
                }
            }

            vscode.window.showInformationMessage(
                `Generated ${completed} of ${total} cheat sheets successfully`
            );
        });

    } catch (error) {
        handleError(error);
    }
}

/**
 * Generate full documentation suite
 */
async function generateFullDocumentationSuite(generator: ConfigurableHLDGenerator): Promise<void> {
    try {
        const workType = await selectWorkType();
        if (!workType) {
            return;
        }

        const server = await getSharedoClient();
        if (!server) {
            vscode.window.showErrorMessage('No ShareDo server connection available');
            return;
        }

        // Confirm with user
        const confirm = await vscode.window.showWarningMessage(
            'This will generate all documentation templates. This may take several minutes. Continue?',
            'Yes', 'No'
        );

        if (confirm !== 'Yes') {
            return;
        }

        const allTemplates = generator.getAvailableTemplates();

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating full documentation suite...',
            cancellable: true
        }, async (progress, token) => {
            let completed = 0;
            const total = allTemplates.length;
            const results: { success: string[], failed: string[] } = {
                success: [],
                failed: []
            };

            for (const template of allTemplates) {
                if (token.isCancellationRequested) {
                    break;
                }

                progress.report({ 
                    increment: (100 / total),
                    message: `Generating ${template.name}...` 
                });

                try {
                    const buffer = await generator.generateWithTemplate(workType, server, template.id);
                    const uri = await saveDocument(buffer, workType, template.id);
                    results.success.push(template.name);
                    completed++;
                } catch (error) {
                    console.error(`Failed to generate ${template.id}:`, error);
                    results.failed.push(template.name);
                }
            }

            // Show results
            if (results.success.length > 0) {
                const message = `Successfully generated ${results.success.length} documents`;
                if (results.failed.length > 0) {
                    vscode.window.showWarningMessage(
                        `${message}. Failed: ${results.failed.join(', ')}`
                    );
                } else {
                    vscode.window.showInformationMessage(message);
                }

                // Ask if user wants to open the output folder
                const openFolder = await vscode.window.showInformationMessage(
                    'Documentation suite generated. Open output folder?',
                    'Open Folder', 'Close'
                );

                if (openFolder === 'Open Folder') {
                    const outputDir = await getOutputDirectory();
                    vscode.env.openExternal(vscode.Uri.file(outputDir));
                }
            } else {
                vscode.window.showErrorMessage('Failed to generate documentation suite');
            }
        });

    } catch (error) {
        handleError(error);
    }
}

/**
 * Generate a document with progress tracking
 */
async function generateDocument(
    generator: ConfigurableHLDGenerator,
    workType: IWorkType,
    server: SharedoClient,
    templateId: string,
    templateName: string
): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Generating ${templateName}...`,
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ increment: 20, message: 'Loading template...' });
            
            progress.report({ increment: 30, message: 'Collecting data...' });
            
            progress.report({ increment: 30, message: 'Generating document...' });
            const buffer = await generator.generateWithTemplate(workType, server, templateId);
            
            progress.report({ increment: 10, message: 'Saving document...' });
            const uri = await saveDocument(buffer, workType, templateId);
            
            progress.report({ increment: 10, message: 'Complete!' });

            // Show success message with option to open
            const action = await vscode.window.showInformationMessage(
                `${templateName} generated successfully`,
                'Open Document',
                'Show in Folder',
                'Close'
            );

            if (action === 'Open Document') {
                vscode.env.openExternal(uri);
            } else if (action === 'Show in Folder') {
                vscode.commands.executeCommand('revealFileInOS', uri);
            }

        } catch (error) {
            throw error;
        }
    });
}

/**
 * Select work type from tree or quick pick
 */
async function selectWorkType(): Promise<IWorkType | undefined> {
    // Try to get from global state or context
    // For MVP, we'll use a simple approach
    const currentWorkType = (global as any).selectedWorkType as IWorkType | undefined;
    
    if (currentWorkType) {
        return currentWorkType;
    }

    // Show picker if no current selection
    const workTypes = await getAvailableWorkTypes();
    if (!workTypes || workTypes.length === 0) {
        vscode.window.showErrorMessage('No work types available');
        return undefined;
    }

    const items = workTypes.map(wt => ({
        label: wt.name,
        description: wt.systemName,
        workType: wt
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a work type',
        title: 'Generate HLD Documentation'
    });

    return selected?.workType;
}

/**
 * Get available work types
 */
async function getAvailableWorkTypes(): Promise<IWorkType[]> {
    // This would normally fetch from the server
    // For now, return mock data or empty array
    return [];
}

/**
 * Get ShareDo client instance
 */
async function getSharedoClient(): Promise<SharedoClient | undefined> {
    // Get from global state or create mock for testing
    const client = (global as any).sharedoClient as SharedoClient | undefined;
    
    if (!client) {
        // For MVP/testing, return a mock client
        vscode.window.showWarningMessage('No ShareDo connection. Using mock data for demonstration.');
        return {
            getBaseUrl: () => 'https://demo.sharedo.com',
            get: async () => ({ items: [] }),
            post: async () => ({}),
        } as any;
    }
    
    return client;
}

/**
 * Save document to file system
 */
async function saveDocument(
    buffer: Buffer,
    workType: IWorkType,
    templateId: string
): Promise<vscode.Uri> {
    const outputDir = await getOutputDirectory();
    
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${workType.systemName}_${templateId}_${timestamp}.docx`;
    const filepath = path.join(outputDir, filename);

    // Save file
    await fs.writeFile(filepath, buffer);

    return vscode.Uri.file(filepath);
}

/**
 * Get output directory for generated documents
 */
async function getOutputDirectory(): Promise<string> {
    // Check workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        return path.join(workspaceRoot, 'generated-hld');
    }

    // Fall back to temp directory
    const os = require('os');
    return path.join(os.tmpdir(), 'sharedo-hld');
}

/**
 * Handle errors consistently
 */
function handleError(error: any): void {
    console.error('HLD Generation Error:', error);
    
    let message = 'Failed to generate HLD document';
    if (error instanceof Error) {
        message += `: ${error.message}`;
    }

    vscode.window.showErrorMessage(message);
    
    // Log to output channel if available
    Inform.error('HLD Generation Error', error);
}