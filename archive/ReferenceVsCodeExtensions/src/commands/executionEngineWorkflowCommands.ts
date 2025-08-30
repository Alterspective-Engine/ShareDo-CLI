import { ExecutionEngineCommands } from '../commands/executionEngineCommands';
import { downloadWorkflow } from '../Request/Workflows/ExtensionHelpers/workflowDownload';
import { TreeNode } from '../treeprovider';
import { IExecutingPlanEnhanced } from '../Request/ExecutionEngine/GetExecutingPlans';
import * as vscode from 'vscode';
import { Inform } from '../Utilities/inform';

/**
 * Extended execution engine commands that integrate with workflow download functionality
 */
export class ExecutionEngineWorkflowCommands {

    /**
     * Download workflow code for an executing plan
     */
    static async downloadWorkflowCode(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient || !treeNode.additionalData) {
                vscode.window.showErrorMessage('No executing plan selected');
                return;
            }

            const plan = treeNode.additionalData as IExecutingPlanEnhanced;
            if (!plan.planSystemName) {
                vscode.window.showErrorMessage('No workflow system name found for this plan');
                return;
            }

            // Confirm download
            const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: `Download workflow code for "${plan.planTitle || plan.planName}"?`
            });

            if (confirmation !== 'Yes') { return; }

            // Show progress notification
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading workflow: ${plan.planSystemName}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Starting download...' });
                
                try {
                    // Download the workflow
                    await downloadWorkflow(plan.planSystemName, treeNode.sharedoClient);
                    
                    progress.report({ increment: 100, message: 'Download complete!' });
                    
                    vscode.window.showInformationMessage(
                        `✅ Workflow "${plan.planSystemName}" downloaded successfully!`
                    );
                    
                } catch (error) {
                    throw error;
                }
            });

        } catch (error) {
            Inform.writeError('ExecutionEngineWorkflowCommands::downloadWorkflowCode', 'Error downloading workflow code', error);
            vscode.window.showErrorMessage(`Failed to download workflow: ${error}`);
        }
    }

    /**
     * Download all executing workflows
     */
    static async downloadAllExecutingWorkflows(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient) {
                vscode.window.showErrorMessage('No ShareDo client available');
                return;
            }

            // Get executing plans
            const executingData = await treeNode.sharedoClient.getExecutingPlansEnhanced(1000, 0);
            
            if (!executingData || executingData.plans.length === 0) {
                vscode.window.showInformationMessage('No executing workflows found to download');
                return;
            }

            // Get unique workflow system names
            const uniqueWorkflows = [...new Set(
                executingData.plans
                    .filter(plan => plan.planSystemName)
                    .map(plan => plan.planSystemName!)
            )];

            if (uniqueWorkflows.length === 0) {
                vscode.window.showInformationMessage('No workflow system names found in executing plans');
                return;
            }

            // Confirm download
            const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: `Download ${uniqueWorkflows.length} unique executing workflows?`
            });

            if (confirmation !== 'Yes') { return; }

            // Download all workflows with progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading ${uniqueWorkflows.length} workflows`,
                cancellable: false
            }, async (progress) => {
                let completed = 0;
                
                for (const workflowSystemName of uniqueWorkflows) {
                    progress.report({ 
                        increment: (100 / uniqueWorkflows.length),
                        message: `Downloading: ${workflowSystemName}` 
                    });
                    
                    try {
                        await downloadWorkflow(workflowSystemName, treeNode.sharedoClient);
                        completed++;
                    } catch (error) {
                        Inform.writeError('ExecutionEngineWorkflowCommands::downloadAllExecutingWorkflows', 
                            `Error downloading workflow ${workflowSystemName}`, error);
                        // Continue with other downloads
                    }
                }
                
                progress.report({ increment: 100, message: 'All downloads complete!' });
                
                vscode.window.showInformationMessage(
                    `✅ Downloaded ${completed} of ${uniqueWorkflows.length} executing workflows`
                );
            });

        } catch (error) {
            Inform.writeError('ExecutionEngineWorkflowCommands::downloadAllExecutingWorkflows', 'Error downloading executing workflows', error);
            vscode.window.showErrorMessage(`Failed to download executing workflows: ${error}`);
        }
    }

    /**
     * Show workflow code for an executing plan
     */
    static async showWorkflowCode(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient || !treeNode.additionalData) {
                vscode.window.showErrorMessage('No executing plan selected');
                return;
            }

            const plan = treeNode.additionalData as IExecutingPlanEnhanced;
            if (!plan.planSystemName) {
                vscode.window.showErrorMessage('No workflow system name found for this plan');
                return;
            }

            // Get workflow data
            const workflowData = await treeNode.sharedoClient.getWorkflow({ systemName: plan.planSystemName });
            
            if (!workflowData) {
                vscode.window.showErrorMessage('Failed to retrieve workflow data');
                return;
            }

            // Create and show document
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(workflowData, null, 2),
                language: 'json'
            });
            
            await vscode.window.showTextDocument(doc, {
                preview: false,
                viewColumn: vscode.ViewColumn.Beside
            });

        } catch (error) {
            Inform.writeError('ExecutionEngineWorkflowCommands::showWorkflowCode', 'Error showing workflow code', error);
            vscode.window.showErrorMessage(`Failed to show workflow code: ${error}`);
        }
    }
}
