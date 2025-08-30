/**
 * Workflow Commands for ShareDo VS Code Extension
 * 
 * Commands for workflow management including download, preview, validation,
 * deployment, and comparison operations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TreeNode } from '../treeprovider';
import { WorkflowManager } from '../Workflows/WorkflowManager';
import { WorkflowTemplates } from '../Workflows/WorkflowTemplates';
import { ElementTypes } from '../enums';
import { Inform } from '../Utilities/inform';
import { Settings } from '../settings';
import { SharedoClient } from '../sharedoClient';

export class WorkflowCommands {
    private static workflowManager: WorkflowManager;

    /**
     * Initialize workflow manager
     */
    private static getWorkflowManager(): WorkflowManager {
        if (!WorkflowCommands.workflowManager) {
            WorkflowCommands.workflowManager = new WorkflowManager();
        }
        return WorkflowCommands.workflowManager;
    }

    /**
     * Download workflow from server
     */
    static async downloadWorkflow(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient) {
                vscode.window.showErrorMessage('No workflow selected');
                return;
            }

            // Extract the actual workflow system name from the tree node data
            let systemName: string | undefined;
            if (treeNode.data && treeNode.data.data && treeNode.data.data.systemName) {
                // For workflow nodes, data is a SharedoWorkflowRow
                systemName = treeNode.data.data.systemName;
            } else if (treeNode.data && treeNode.data.systemName) {
                // Direct workflow object
                systemName = treeNode.data.systemName;
            } else {
                vscode.window.showErrorMessage('Unable to determine workflow system name');
                return;
            }
            
            const server = treeNode.sharedoClient;
            const manager = WorkflowCommands.getWorkflowManager();

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading workflow: ${systemName}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Starting download...' });
                
                const result = await manager.downloadWorkflow(systemName!, server, {
                    overwrite: false,
                    backup: true,
                    showDiff: true
                });

                if (result) {
                    progress.report({ increment: 100, message: 'Download complete!' });
                    
                    // Open the downloaded file
                    const doc = await vscode.workspace.openTextDocument(result.path);
                    await vscode.window.showTextDocument(doc);
                }
            });

        } catch (error) {
            Inform.writeError('WorkflowCommands.downloadWorkflow', error);
            vscode.window.showErrorMessage(`Failed to download workflow: ${error}`);
        }
    }

    /**
     * Preview workflow visually
     */
    static async previewWorkflow(resource?: vscode.Uri | TreeNode): Promise<void> {
        try {
            const manager = WorkflowCommands.getWorkflowManager();
            let workflowPath: string | undefined;

            if (resource instanceof vscode.Uri) {
                // Called from file explorer context menu
                workflowPath = resource.fsPath;
            } else if (resource && 'sharedoClient' in resource) {
                // Called from tree view - need to download first
                const treeNode = resource as TreeNode;
                if (!treeNode.sharedoClient) {
                    vscode.window.showErrorMessage('No server connection available');
                    return;
                }

                // Extract the actual workflow system name from the tree node data
                let systemName: string | undefined;
                if (treeNode.data && treeNode.data.data && treeNode.data.data.systemName) {
                    // For workflow nodes, data is a SharedoWorkflowRow
                    systemName = treeNode.data.data.systemName;
                } else if (treeNode.data && treeNode.data.systemName) {
                    // Direct workflow object
                    systemName = treeNode.data.systemName;
                } else {
                    // Fallback to using the ID (might be too long)
                    systemName = treeNode.id;
                }
                
                if (!systemName) {
                    vscode.window.showErrorMessage('Unable to determine workflow system name');
                    return;
                }

                const tempResult = await manager.downloadWorkflow(systemName, treeNode.sharedoClient, {
                    overwrite: false,
                    backup: false,
                    showDiff: false
                });

                if (tempResult) {
                    workflowPath = tempResult.path;
                }
            } else {
                // Try to get active editor
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor && activeEditor.document.fileName.endsWith('.json')) {
                    workflowPath = activeEditor.document.fileName;
                } else {
                    // If no active editor, ask user to select a workflow file
                    const files = await vscode.workspace.findFiles('**/workflows/*.json');
                    if (files.length > 0) {
                        const selected = await vscode.window.showQuickPick(
                            files.map(f => ({ label: path.basename(f.fsPath), uri: f })),
                            { placeHolder: 'Select a workflow file' }
                        );
                        if (selected) {
                            workflowPath = selected.uri.fsPath;
                        }
                    }
                }
            }

            if (!workflowPath) {
                vscode.window.showErrorMessage('No workflow file selected');
                return;
            }

            await manager.previewWorkflow(workflowPath);

        } catch (error) {
            Inform.writeError('WorkflowCommands.previewWorkflow', error);
            vscode.window.showErrorMessage(`Failed to preview workflow: ${error}`);
        }
    }

    /**
     * Validate workflow
     */
    static async validateWorkflow(resource?: vscode.Uri): Promise<void> {
        try {
            const manager = WorkflowCommands.getWorkflowManager();
            let workflowPath: string | undefined;

            if (resource instanceof vscode.Uri) {
                workflowPath = resource.fsPath;
            } else {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor && activeEditor.document.fileName.endsWith('.json')) {
                    workflowPath = activeEditor.document.fileName;
                } else {
                    // If no active editor, ask user to select a workflow file
                    const files = await vscode.workspace.findFiles('**/workflows/*.json');
                    if (files.length > 0) {
                        const selected = await vscode.window.showQuickPick(
                            files.map(f => ({ label: path.basename(f.fsPath), uri: f })),
                            { placeHolder: 'Select a workflow file to validate' }
                        );
                        if (selected) {
                            workflowPath = selected.uri.fsPath;
                        }
                    }
                }
            }

            if (!workflowPath) {
                vscode.window.showErrorMessage('No workflow file selected');
                return;
            }

            const result = await manager.validateWorkflow(workflowPath);
            
            if (result.valid) {
                vscode.window.showInformationMessage('✅ Workflow is valid');
            } else {
                const choice = await vscode.window.showErrorMessage(
                    `Workflow has ${result.errors.length} validation error(s)`,
                    'Show Details',
                    'Cancel'
                );

                if (choice === 'Show Details') {
                    // Create output channel for validation results
                    const outputChannel = vscode.window.createOutputChannel('Workflow Validation');
                    outputChannel.clear();
                    outputChannel.appendLine('Workflow Validation Results');
                    outputChannel.appendLine('=' .repeat(50));
                    outputChannel.appendLine(`File: ${workflowPath}`);
                    outputChannel.appendLine('');
                    outputChannel.appendLine('Errors:');
                    result.errors.forEach((error, index) => {
                        outputChannel.appendLine(`${index + 1}. ${error}`);
                    });
                    outputChannel.show();
                }
            }

        } catch (error) {
            Inform.writeError('WorkflowCommands.validateWorkflow', error);
            vscode.window.showErrorMessage(`Failed to validate workflow: ${error}`);
        }
    }

    /**
     * Publish/Deploy workflow to server
     */
    static async publishWorkflow(resource?: vscode.Uri): Promise<void> {
        try {
            if (!resource) {
                vscode.window.showErrorMessage('No workflow file selected');
                return;
            }

            const manager = WorkflowCommands.getWorkflowManager();
            
            // Get list of available servers from current context
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

            // Let user select target server
            const serverOptions = environments.map((env: SharedoClient) => ({
                label: env.url,
                description: env.clientId,
                client: env
            }));

            const selected = await vscode.window.showQuickPick(serverOptions, {
                placeHolder: 'Select target server for deployment'
            });

            if (!selected) {
                return;
            }

            // Use the selected server directly
            const client = selected.client;

            // Publish the workflow
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Publishing workflow to ${selected.label}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Validating workflow...' });
                
                const success = await manager.publishWorkflow(resource, client);
                
                if (success) {
                    progress.report({ increment: 100, message: 'Published successfully!' });
                    vscode.window.showInformationMessage(`✅ Workflow published to ${selected.label}`);
                }
            });

        } catch (error) {
            Inform.writeError('WorkflowCommands.publishWorkflow', error);
            vscode.window.showErrorMessage(`Failed to publish workflow: ${error}`);
        }
    }

    /**
     * Compare workflow with server version
     */
    static async compareWithServer(resource?: vscode.Uri): Promise<void> {
        try {
            if (!resource) {
                vscode.window.showErrorMessage('No workflow file selected');
                return;
            }

            const manager = WorkflowCommands.getWorkflowManager();
            
            // Get list of available servers from current context
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

            // Let user select server to compare with
            const serverOptions = environments.map((env: SharedoClient) => ({
                label: env.url,
                description: env.clientId,
                client: env
            }));

            const selected = await vscode.window.showQuickPick(serverOptions, {
                placeHolder: 'Select server to compare with'
            });

            if (!selected) {
                return;
            }

            // Compare workflows
            await manager.compareWithLocal(resource.fsPath, selected.client);

        } catch (error) {
            Inform.writeError('WorkflowCommands.compareWithServer', error);
            vscode.window.showErrorMessage(`Failed to compare workflow: ${error}`);
        }
    }

    /**
     * Compare workflows across servers
     */
    static async compareAcrossServers(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode) {
                vscode.window.showErrorMessage('No workflow selected');
                return;
            }

            // Extract the actual workflow system name from the tree node data
            let systemName: string | undefined;
            if (treeNode.data && treeNode.data.data && treeNode.data.data.systemName) {
                // For workflow nodes, data is a SharedoWorkflowRow
                systemName = treeNode.data.data.systemName;
            } else if (treeNode.data && treeNode.data.systemName) {
                // Direct workflow object
                systemName = treeNode.data.systemName;
            } else {
                vscode.window.showErrorMessage('Unable to determine workflow system name');
                return;
            }
            
            const manager = WorkflowCommands.getWorkflowManager();
            
            // Get list of available servers from current context
            const context = (global as any).sharedoExtensionContext;
            if (!context) {
                vscode.window.showErrorMessage('Extension context not available');
                return;
            }

            const settings = new Settings(context);
            settings.populate();
            const environments = settings.sharedoEnvironments.internalArray;
            
            if (environments.length < 2) {
                vscode.window.showErrorMessage('Need at least 2 servers configured for comparison');
                return;
            }

            // Let user select first server
            const server1Options = environments.map((env: SharedoClient) => ({
                label: env.url,
                description: env.clientId,
                client: env
            }));

            const server1 = await vscode.window.showQuickPick(server1Options, {
                placeHolder: 'Select first server'
            });

            if (!server1) {
                return;
            }

            // Let user select second server
            const server2Options = environments
                .filter((env: SharedoClient) => env.url !== server1.client.url)
                .map((env: SharedoClient) => ({
                    label: env.url,
                    description: env.clientId,
                    client: env
                }));

            const server2 = await vscode.window.showQuickPick(server2Options, {
                placeHolder: 'Select second server'
            });

            if (!server2) {
                return;
            }

            // Compare workflows
            await manager.compareAcrossServers(systemName!, server1.client, server2.client);

        } catch (error) {
            Inform.writeError('WorkflowCommands.compareAcrossServers', error);
            vscode.window.showErrorMessage(`Failed to compare workflows: ${error}`);
        }
    }

    /**
     * Batch download workflows
     */
    static async batchDownloadWorkflows(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient) {
                vscode.window.showErrorMessage('No server selected');
                return;
            }

            const server = treeNode.sharedoClient;
            const manager = WorkflowCommands.getWorkflowManager();

            // Get list of workflows from server
            const workflowsResult = await server.getWorkflows();
            
            if (!workflowsResult || !workflowsResult.rows || workflowsResult.rows.length === 0) {
                vscode.window.showInformationMessage('No workflows found on server');
                return;
            }

            // Let user select workflows to download
            const items = workflowsResult.rows.map(w => ({
                label: w.data.name,
                description: w.data.systemName,
                picked: false,
                systemName: w.data.systemName
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select workflows to download',
                canPickMany: true
            });

            if (!selected || selected.length === 0) {
                return;
            }

            // Download selected workflows
            const systemNames = selected.map(s => s.systemName);
            await manager.batchDownloadWorkflows(systemNames, server);

        } catch (error) {
            Inform.writeError('WorkflowCommands.batchDownloadWorkflows', error);
            vscode.window.showErrorMessage(`Failed to batch download workflows: ${error}`);
        }
    }

    /**
     * Search workflows
     */
    static async searchWorkflows(): Promise<void> {
        try {
            const manager = WorkflowCommands.getWorkflowManager();

            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query',
                placeHolder: 'Search for workflows...'
            });

            if (!query) {
                return;
            }

            const results = await manager.searchWorkflows(query);

            if (results.length === 0) {
                vscode.window.showInformationMessage('No workflows found matching your query');
                return;
            }

            // Show results in quick pick
            const items = results.map(w => ({
                label: w.name,
                description: w.systemName,
                detail: w.description,
                workflow: w
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `Found ${results.length} workflow(s)`
            });

            if (selected) {
                // Open the workflow file
                const workflowsPath = path.join(vscode.workspace.rootPath || '', 'workflows', `${selected.workflow.systemName}.json`);
                const doc = await vscode.workspace.openTextDocument(workflowsPath);
                await vscode.window.showTextDocument(doc);
            }

        } catch (error) {
            Inform.writeError('WorkflowCommands.searchWorkflows', error);
            vscode.window.showErrorMessage(`Failed to search workflows: ${error}`);
        }
    }

    /**
     * Export workflow as documentation
     */
    static async exportAsDocumentation(resource?: vscode.Uri): Promise<void> {
        try {
            if (!resource) {
                vscode.window.showErrorMessage('No workflow file selected');
                return;
            }

            const manager = WorkflowCommands.getWorkflowManager();

            // Ask for format
            const format = await vscode.window.showQuickPick(['Markdown', 'HTML'], {
                placeHolder: 'Select export format'
            });

            if (!format) {
                return;
            }

            await manager.exportAsDocumentation(
                resource.fsPath,
                format.toLowerCase() as 'markdown' | 'html'
            );

        } catch (error) {
            Inform.writeError('WorkflowCommands.exportAsDocumentation', error);
            vscode.window.showErrorMessage(`Failed to export documentation: ${error}`);
        }
    }

    /**
     * Create new workflow
     */
    static async createNewWorkflow(): Promise<void> {
        try {
            const systemName = await vscode.window.showInputBox({
                prompt: 'Enter workflow system name',
                placeHolder: 'my-workflow',
                validateInput: (value) => {
                    if (!value) return 'System name is required';
                    if (!/^[a-z0-9-]+$/.test(value)) return 'Use only lowercase letters, numbers, and hyphens';
                    return null;
                }
            });

            if (!systemName) {
                return;
            }

            const name = await vscode.window.showInputBox({
                prompt: 'Enter workflow display name',
                placeHolder: 'My Workflow',
                validateInput: (value) => {
                    if (!value) return 'Name is required';
                    return null;
                }
            });

            if (!name) {
                return;
            }

            const description = await vscode.window.showInputBox({
                prompt: 'Enter workflow description (optional)',
                placeHolder: 'Description of what this workflow does'
            });

            // Ask if user wants to use a template
            const templates = WorkflowTemplates.getTemplates();
            const templateOptions = [
                { label: 'Blank Workflow', description: 'Start with a basic workflow structure' },
                ...templates.map(t => ({
                    label: t.name,
                    description: t.description,
                    template: t
                }))
            ];

            const selectedTemplate = await vscode.window.showQuickPick(templateOptions, {
                placeHolder: 'Select a workflow template'
            });

            let workflow;
            if (selectedTemplate && 'template' in selectedTemplate) {
                // Use selected template
                workflow = WorkflowTemplates.createFromTemplate(
                    selectedTemplate.template.name,
                    systemName,
                    name,
                    description
                );
            } else {
                // Create basic workflow structure
                workflow = {
                    systemName,
                    name,
                    description: description || '',
                    overrideNotifications: false,
                    exceptionNotifications: true,
                    exceptionNotificationEmailAddresses: '',
                    variables: [],
                    steps: [
                        {
                            systemName: 'start',
                            name: 'Start',
                            description: 'Workflow entry point',
                            isStart: true,
                            isEnd: false,
                            isOptimal: true,
                            ideData: JSON.stringify({ x: 0, y: 0 }),
                            actions: []
                        },
                        {
                            systemName: 'end',
                            name: 'End',
                            description: 'Workflow completion',
                            isStart: false,
                            isEnd: true,
                            isOptimal: true,
                            ideData: JSON.stringify({ x: 400, y: 0 }),
                            actions: []
                        }
                    ]
                };
            }

            if (!workflow) {
                vscode.window.showErrorMessage('Failed to create workflow from template');
                return;
            }

            // Save the workflow
            const workflowsPath = path.join(vscode.workspace.rootPath || '', 'workflows');
            const filePath = path.join(workflowsPath, `${systemName}.json`);
            
            // Ensure workflows directory exists
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(workflowsPath));
            
            // Write file
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(filePath),
                Buffer.from(JSON.stringify(workflow, null, 2))
            );

            // Open the file
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`✅ Workflow '${name}' created successfully`);

        } catch (error) {
            Inform.writeError('WorkflowCommands.createNewWorkflow', error);
            vscode.window.showErrorMessage(`Failed to create workflow: ${error}`);
        }
    }

    /**
     * Show workflow list
     */
    static async showWorkflowList(): Promise<void> {
        try {
            const manager = WorkflowCommands.getWorkflowManager();
            const workflows = await manager.getLocalWorkflows();

            if (workflows.length === 0) {
                vscode.window.showInformationMessage('No local workflows found');
                return;
            }

            const items = workflows.map(w => {
                const name = path.basename(w.path, '.json');
                return {
                    label: name,
                    description: w.lastModified.toLocaleString(),
                    detail: w.path,
                    path: w.path
                };
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `${workflows.length} local workflow(s)`
            });

            if (selected) {
                const doc = await vscode.workspace.openTextDocument(selected.path);
                await vscode.window.showTextDocument(doc);
            }

        } catch (error) {
            Inform.writeError('WorkflowCommands.showWorkflowList', error);
            vscode.window.showErrorMessage(`Failed to show workflow list: ${error}`);
        }
    }
}