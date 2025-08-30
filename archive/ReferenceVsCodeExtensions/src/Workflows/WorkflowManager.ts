/**
 * Workflow Manager for ShareDo VS Code Extension
 * 
 * Comprehensive workflow management including:
 * - Download and storage
 * - Visual preview
 * - Git integration
 * - Validation
 * - Deployment
 * - Comparison (local and cross-server)
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SharedoClient } from '../sharedoClient';
import { getWorkflowRootPath } from '../Utilities/common';
import { Inform } from '../Utilities/inform';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { WorkflowValidator } from './WorkflowValidator';
import { WorkflowComparator } from './WorkflowComparator';
import { WorkflowSecurity } from './WorkflowSecurity';
import { WorkflowApiService } from './WorkflowApiService';

export interface IWorkflowDefinition {
    systemName: string;
    name: string;
    description?: string;
    overrideNotifications?: boolean;
    exceptionNotifications?: boolean;
    exceptionNotificationEmailAddresses?: string;
    variables?: any[];
    steps?: IWorkflowStep[];
}

export interface IWorkflowStep {
    systemName: string;
    name: string;
    description?: string;
    isStart?: boolean;
    isEnd?: boolean;
    isOptimal?: boolean;
    ideData?: string;
    actions?: IWorkflowAction[];
}

export interface IWorkflowAction {
    id?: string;
    actionSystemName: string;
    name: string;
    config?: any;
    connections?: any;
    order?: number;
}

export interface IWorkflowFile {
    path: string;
    serverUrl?: string;
    lastModified: Date;
    version?: string;
    checksum?: string;
}

export class WorkflowManager {
    private workflowsPath: string;
    private visualizer: WorkflowVisualizer;
    private validator: WorkflowValidator;
    private comparator: WorkflowComparator;
    private cachedWorkflows: Map<string, IWorkflowDefinition> = new Map();

    constructor() {
        this.workflowsPath = getWorkflowRootPath();
        this.visualizer = new WorkflowVisualizer();
        this.validator = new WorkflowValidator();
        this.comparator = new WorkflowComparator();
        
        // Ensure workflows directory exists
        this.ensureWorkflowsDirectory();
    }

    private async ensureWorkflowsDirectory() {
        const workflowsUri = vscode.Uri.file(this.workflowsPath);
        try {
            await vscode.workspace.fs.createDirectory(workflowsUri);
        } catch (error) {
            // Directory might already exist
        }
    }

    /**
     * Download a workflow from the server
     */
    async downloadWorkflow(systemName: string, server: SharedoClient, options?: {
        overwrite?: boolean;
        backup?: boolean;
        showDiff?: boolean;
    }): Promise<IWorkflowFile | undefined> {
        try {
            // Validate system name for security
            const validation = WorkflowSecurity.validateSystemName(systemName);
            if (!validation.valid) {
                throw new Error(`Invalid workflow system name: ${validation.error}`);
            }
            
            Inform.writeInfo(`Downloading workflow [${systemName}] from ${server.url}`);

            // Download the workflow
            const workflow = await server.getWorkflow({ systemName }) as any;
            if (!workflow) {
                throw new Error(`Workflow ${systemName} not found`);
            }

            // Prepare file path with sanitized name
            const safeFileName = WorkflowSecurity.createSafeFileName(systemName);
            const fileName = `${safeFileName}.json`;
            const filePath = path.join(this.workflowsPath, fileName);
            
            // Validate the path is within allowed directory
            if (!WorkflowSecurity.validateFilePath(filePath, this.workflowsPath)) {
                throw new Error('Invalid file path detected');
            }
            
            const fileUri = vscode.Uri.file(filePath);

            // Check if file exists
            let fileExists = false;
            try {
                await vscode.workspace.fs.stat(fileUri);
                fileExists = true;
            } catch {
                fileExists = false;
            }

            if (fileExists && !options?.overwrite) {
                // Check if content is different
                const existingContent = await vscode.workspace.fs.readFile(fileUri);
                const existingWorkflow = JSON.parse(existingContent.toString());

                if (JSON.stringify(existingWorkflow) === JSON.stringify(workflow)) {
                    vscode.window.showInformationMessage(`Workflow ${systemName} is already up-to-date`);
                    return {
                        path: filePath,
                        serverUrl: server.url,
                        lastModified: new Date()
                    };
                }

                // Show diff if requested
                if (options?.showDiff) {
                    await this.showWorkflowDiff(existingWorkflow as IWorkflowDefinition, workflow as IWorkflowDefinition, systemName);
                }

                // Ask user what to do
                const action = await vscode.window.showWarningMessage(
                    `Workflow ${systemName} already exists locally. What would you like to do?`,
                    'Overwrite',
                    'Create Backup',
                    'Cancel'
                );

                if (action === 'Cancel') {
                    return undefined;
                }

                if (action === 'Create Backup' || options?.backup) {
                    await this.createBackup(filePath);
                }
            }

            // Write workflow to file
            const content = JSON.stringify(workflow, null, 2);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content));

            // Cache the workflow
            this.cachedWorkflows.set(systemName, workflow as IWorkflowDefinition);

            // Add metadata file
            await this.saveWorkflowMetadata(systemName, {
                serverUrl: server.url,
                downloadedAt: new Date().toISOString(),
                version: '1.0.0',
                checksum: this.calculateChecksum(content)
            });

            vscode.window.showInformationMessage(`✅ Workflow ${systemName} downloaded successfully`);

            return {
                path: filePath,
                serverUrl: server.url,
                lastModified: new Date(),
                checksum: this.calculateChecksum(content)
            };

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download workflow: ${error}`);
            Inform.writeError('WorkflowManager.downloadWorkflow', error);
            return undefined;
        }
    }

    /**
     * Preview workflow visually
     */
    async previewWorkflow(workflowPath: string): Promise<void> {
        try {
            // Always read fresh from disk for preview to reflect any changes
            const workflow = await this.loadWorkflow(workflowPath, true);
            if (workflow) {
                await this.visualizer.showWorkflow(workflow);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to preview workflow: ${error}`);
        }
    }

    /**
     * Validate workflow
     */
    async validateWorkflow(workflowPath: string): Promise<{ valid: boolean; errors: string[] }> {
        try {
            // Always read fresh from disk for validation
            const workflow = await this.loadWorkflow(workflowPath, true);
            if (!workflow) {
                return { valid: false, errors: ['Failed to load workflow'] };
            }

            return this.validator.validate(workflow);
        } catch (error) {
            return { valid: false, errors: [`Validation error: ${error}`] };
        }
    }

    /**
     * Deploy/Redeploy workflow to server
     */
    async deployWorkflow(workflowPath: string, server: SharedoClient, options?: {
        validate?: boolean;
        backup?: boolean;
        force?: boolean;
    }): Promise<boolean> {
        try {
            // Always read fresh from disk for deployment
            const workflow = await this.loadWorkflow(workflowPath, true);
            if (!workflow) {
                throw new Error('Failed to load workflow');
            }

            // Validate if requested
            if (options?.validate) {
                const validation = await this.validateWorkflow(workflowPath);
                if (!validation.valid) {
                    const proceed = await vscode.window.showWarningMessage(
                        `Workflow has validation errors:\n${validation.errors.join('\n')}\n\nDeploy anyway?`,
                        'Deploy',
                        'Cancel'
                    );
                    if (proceed !== 'Deploy') {
                        return false;
                    }
                }
            }

            // Check if workflow exists on server
            const existingWorkflow = await server.getWorkflow({ systemName: workflow.systemName });
            if (existingWorkflow && !options?.force) {
                // Create backup if requested
                if (options?.backup) {
                    await this.downloadWorkflow(workflow.systemName, server, { 
                        backup: true, 
                        overwrite: false 
                    });
                }

                const action = await vscode.window.showWarningMessage(
                    `Workflow ${workflow.systemName} already exists on server. Overwrite?`,
                    'Overwrite',
                    'Cancel'
                );

                if (action !== 'Overwrite') {
                    return false;
                }
            }

            // Deploy the workflow using the real API
            let deploymentSuccess = false;
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Deploying workflow ${workflow.systemName}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Preparing workflow...' });

                // Use the WorkflowApiService for actual deployment
                progress.report({ increment: 30, message: 'Connecting to server...' });
                const apiResponse = await WorkflowApiService.deployWorkflow(workflow, server);
                
                progress.report({ increment: 90, message: 'Processing response...' });
                
                if (apiResponse.success) {
                    progress.report({ increment: 100, message: 'Deployment complete!' });
                    vscode.window.showInformationMessage(`✅ Workflow ${workflow.systemName} deployed successfully`);
                    deploymentSuccess = true;
                } else {
                    throw new Error(apiResponse.error || 'Deployment failed');
                }
            });

            return deploymentSuccess;

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to deploy workflow: ${error}`);
            return false;
        }
    }

    /**
     * Publish workflow to server (called from context menu on workflow files)
     */
    async publishWorkflow(workflowUri: vscode.Uri, server: SharedoClient): Promise<boolean> {
        try {
            const workflowPath = workflowUri.fsPath;
            // Always read fresh from disk for publishing
            const workflow = await this.loadWorkflow(workflowPath, true);
            if (!workflow) {
                throw new Error('Failed to load workflow');
            }

            // Validate before publishing
            const validation = await this.validateWorkflow(workflowPath);
            if (!validation.valid) {
                const proceed = await vscode.window.showWarningMessage(
                    `Workflow has validation errors:\n${validation.errors.join('\n')}\n\nPublish anyway?`,
                    'Publish',
                    'Cancel'
                );
                if (proceed !== 'Publish') {
                    return false;
                }
            }

            // Use the WorkflowApiService directly for publishing
            const apiResponse = await WorkflowApiService.deployWorkflow(workflow, server);
            
            if (apiResponse.success) {
                vscode.window.showInformationMessage(`✅ Workflow ${workflow.systemName} published successfully`);
                return true;
            } else {
                vscode.window.showErrorMessage(`Publishing failed: ${apiResponse.error || 'Unknown error'}`);
                return false;
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to publish workflow: ${error}`);
            return false;
        }
    }

    /**
     * Compare workflow with local version
     */
    async compareWithLocal(workflowPath: string, server: SharedoClient): Promise<void> {
        try {
            // Always read fresh from disk for comparison
            const localWorkflow = await this.loadWorkflow(workflowPath, true);
            if (!localWorkflow) {
                vscode.window.showErrorMessage('Failed to load local workflow file');
                return;
            }

            // Try to download server version
            let serverWorkflow: any;
            try {
                serverWorkflow = await server.getWorkflow({ systemName: localWorkflow.systemName });
            } catch (error) {
                vscode.window.showWarningMessage(
                    `Workflow '${localWorkflow.systemName}' not found on server:\n` +
                    `• ${server.url}\n\n` +
                    `The workflow only exists locally.`
                );
                Inform.writeInfo(`Workflow '${localWorkflow.systemName}' not found on server: ${server.url}`);
                return;
            }

            if (!serverWorkflow) {
                vscode.window.showWarningMessage(
                    `Workflow '${localWorkflow.systemName}' not found on server:\n` +
                    `• ${server.url}\n\n` +
                    `The workflow only exists locally.`
                );
                return;
            }

            // Show comparison
            await this.comparator.compare(localWorkflow, serverWorkflow as IWorkflowDefinition, {
                leftTitle: 'Local',
                rightTitle: `Server (${server.url})`
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to compare workflows: ${error}`);
        }
    }

    /**
     * Compare workflow across servers
     */
    async compareAcrossServers(systemName: string, server1: SharedoClient, server2: SharedoClient): Promise<void> {
        try {
            // Try to get workflow from both servers
            let workflow1: any;
            let workflow2: any;
            let server1HasWorkflow = true;
            let server2HasWorkflow = true;

            // Try to get from server 1
            try {
                workflow1 = await server1.getWorkflow({ systemName });
                if (!workflow1) {
                    server1HasWorkflow = false;
                }
            } catch (error) {
                server1HasWorkflow = false;
                Inform.writeInfo(`Workflow '${systemName}' not found on server: ${server1.url}`);
            }

            // Try to get from server 2
            try {
                workflow2 = await server2.getWorkflow({ systemName });
                if (!workflow2) {
                    server2HasWorkflow = false;
                }
            } catch (error) {
                server2HasWorkflow = false;
                Inform.writeInfo(`Workflow '${systemName}' not found on server: ${server2.url}`);
            }

            // Handle missing workflows
            if (!server1HasWorkflow && !server2HasWorkflow) {
                vscode.window.showErrorMessage(
                    `Workflow '${systemName}' not found on either server:\n` +
                    `• ${server1.url}\n` +
                    `• ${server2.url}`
                );
                return;
            } else if (!server1HasWorkflow) {
                vscode.window.showWarningMessage(
                    `Workflow '${systemName}' only exists on:\n` +
                    `• ${server2.url}\n\n` +
                    `Missing from:\n` +
                    `• ${server1.url}`
                );
                return;
            } else if (!server2HasWorkflow) {
                vscode.window.showWarningMessage(
                    `Workflow '${systemName}' only exists on:\n` +
                    `• ${server1.url}\n\n` +
                    `Missing from:\n` +
                    `• ${server2.url}`
                );
                return;
            }

            // Both servers have the workflow, proceed with comparison
            await this.comparator.compare(workflow1 as IWorkflowDefinition, workflow2 as IWorkflowDefinition, {
                leftTitle: `Server 1 (${server1.url})`,
                rightTitle: `Server 2 (${server2.url})`
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to compare workflows: ${error}`);
        }
    }

    /**
     * Batch download workflows
     */
    async batchDownloadWorkflows(systemNames: string[], server: SharedoClient): Promise<void> {
        const total = systemNames.length;
        let completed = 0;
        let failed = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading ${total} workflows`,
            cancellable: true
        }, async (progress, token) => {
            for (const systemName of systemNames) {
                if (token.isCancellationRequested) {
                    break;
                }

                progress.report({ 
                    increment: (100 / total), 
                    message: `Downloading ${systemName}...` 
                });

                const result = await this.downloadWorkflow(systemName, server, {
                    overwrite: false,
                    backup: true,
                    showDiff: false
                });

                if (result) {
                    completed++;
                } else {
                    failed++;
                }
            }

            vscode.window.showInformationMessage(
                `Download complete: ${completed} succeeded, ${failed} failed`
            );
        });
    }

    /**
     * Search workflows
     */
    async searchWorkflows(query: string): Promise<IWorkflowDefinition[]> {
        const results: IWorkflowDefinition[] = [];
        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(this.workflowsPath));

        for (const [fileName, fileType] of files) {
            if (fileType === vscode.FileType.File && fileName.endsWith('.json')) {
                const filePath = path.join(this.workflowsPath, fileName);
                const workflow = await this.loadWorkflow(filePath);

                if (workflow) {
                    // Search in various fields
                    const searchText = JSON.stringify(workflow).toLowerCase();
                    if (searchText.includes(query.toLowerCase())) {
                        results.push(workflow);
                    }
                }
            }
        }

        return results;
    }

    /**
     * Get list of local workflows
     */
    async getLocalWorkflows(): Promise<IWorkflowFile[]> {
        const workflows: IWorkflowFile[] = [];
        try {
            const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(this.workflowsPath));
            
            for (const [fileName, fileType] of files) {
                if (fileType === vscode.FileType.File && fileName.endsWith('.json')) {
                    const filePath = path.join(this.workflowsPath, fileName);
                    const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
                    
                    workflows.push({
                        path: filePath,
                        lastModified: new Date(stat.mtime)
                    });
                }
            }
        } catch (error) {
            Inform.writeError('WorkflowManager.getLocalWorkflows', error);
        }
        return workflows;
    }

    /**
     * Export workflow as documentation
     */
    async exportAsDocumentation(workflowPath: string, format: 'markdown' | 'html' = 'markdown'): Promise<void> {
        try {
            // Always read fresh from disk for export
            const workflow = await this.loadWorkflow(workflowPath, true);
            if (!workflow) {
                throw new Error('Failed to load workflow');
            }

            const documentation = this.generateDocumentation(workflow, format);
            const outputPath = workflowPath.replace('.json', `.${format === 'markdown' ? 'md' : 'html'}`);
            
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(outputPath),
                Buffer.from(documentation)
            );

            // Open the documentation
            const doc = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage('Documentation exported successfully');

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export documentation: ${error}`);
        }
    }

    // Helper methods

    private async loadWorkflow(workflowPath: string, bypassCache: boolean = false): Promise<IWorkflowDefinition | undefined> {
        try {
            // Check cache first (unless bypassing)
            const fileName = path.basename(workflowPath, '.json');
            if (!bypassCache && this.cachedWorkflows.has(fileName)) {
                return this.cachedWorkflows.get(fileName);
            }

            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(workflowPath));
            const workflow = JSON.parse(content.toString()) as IWorkflowDefinition;
            
            // Update cache with fresh data
            this.cachedWorkflows.set(workflow.systemName, workflow);
            
            return workflow;
        } catch (error) {
            Inform.writeError('WorkflowManager.loadWorkflow', error);
            return undefined;
        }
    }

    private async createBackup(filePath: string): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = filePath.replace('.json', `_backup_${timestamp}.json`);
        
        await vscode.workspace.fs.copy(
            vscode.Uri.file(filePath),
            vscode.Uri.file(backupPath)
        );
    }

    private async showWorkflowDiff(local: IWorkflowDefinition, remote: IWorkflowDefinition, title: string): Promise<void> {
        // Create temporary files for diff
        const localUri = vscode.Uri.parse(`sharedo://workflow/local/${title}.json`);
        const remoteUri = vscode.Uri.parse(`sharedo://workflow/remote/${title}.json`);

        // Show diff
        await vscode.commands.executeCommand('vscode.diff', 
            localUri, 
            remoteUri, 
            `${title}: Local ↔ Remote`
        );
    }

    private calculateChecksum(content: string): string {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(content).digest('hex');
    }

    private async saveWorkflowMetadata(systemName: string, metadata: any): Promise<void> {
        const metadataPath = path.join(this.workflowsPath, `.metadata`, `${systemName}.meta.json`);
        const metadataUri = vscode.Uri.file(metadataPath);

        // Ensure metadata directory exists
        const metadataDir = vscode.Uri.file(path.dirname(metadataPath));
        try {
            await vscode.workspace.fs.createDirectory(metadataDir);
        } catch {
            // Directory might already exist
        }

        await vscode.workspace.fs.writeFile(
            metadataUri,
            Buffer.from(JSON.stringify(metadata, null, 2))
        );
    }

    private generateDocumentation(workflow: IWorkflowDefinition, format: 'markdown' | 'html'): string {
        if (format === 'markdown') {
            let doc = `# Workflow: ${workflow.name}\n\n`;
            doc += `**System Name:** ${workflow.systemName}\n\n`;
            doc += `**Description:** ${workflow.description || 'No description'}\n\n`;
            
            if (workflow.steps && workflow.steps.length > 0) {
                doc += `## Steps\n\n`;
                for (const step of workflow.steps) {
                    doc += `### ${step.name}\n`;
                    doc += `- **System Name:** ${step.systemName}\n`;
                    doc += `- **Type:** ${step.isStart ? 'Start' : step.isEnd ? 'End' : 'Process'}\n`;
                    if (step.description) {
                        doc += `- **Description:** ${step.description}\n`;
                    }
                    
                    if (step.actions && step.actions.length > 0) {
                        doc += `\n**Actions:**\n`;
                        for (const action of step.actions) {
                            doc += `- ${action.name} (${action.actionSystemName})\n`;
                        }
                    }
                    doc += '\n';
                }
            }
            
            return doc;
        } else {
            // HTML format
            return `<!DOCTYPE html>
<html>
<head>
    <title>${workflow.name}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        h2 { color: #666; }
        .step { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${workflow.name}</h1>
    <p><strong>System Name:</strong> ${workflow.systemName}</p>
    <p>${workflow.description || ''}</p>
    ${this.generateHtmlSteps(workflow.steps || [])}
</body>
</html>`;
        }
    }

    private generateHtmlSteps(steps: IWorkflowStep[]): string {
        return steps.map(step => `
            <div class="step">
                <h3>${step.name}</h3>
                <p>System Name: ${step.systemName}</p>
                ${step.description ? `<p>${step.description}</p>` : ''}
            </div>
        `).join('');
    }
}