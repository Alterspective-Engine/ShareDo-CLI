import * as vscode from 'vscode';
import { SharedoClient } from '../sharedoClient';
import { TreeNode } from '../treeprovider';
import { IExecutingPlanEnhanced } from '../Request/ExecutionEngine/GetExecutingPlans';
import { Inform } from '../Utilities/inform';

/**
 * Commands for execution engine functionality
 */
export class ExecutionEngineCommands {

    /**
     * Start manual execution of a workflow plan
     */
    static async startManualExecution(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient) {
                vscode.window.showErrorMessage('No ShareDo client available for execution');
                return;
            }

            // Get plan ID from user or tree node
            let planId = '';
            if (treeNode.additionalData && treeNode.additionalData.planId) {
                planId = treeNode.additionalData.planId;
            } else {
                const userInput = await vscode.window.showInputBox({
                    prompt: 'Enter Plan ID to execute',
                    placeHolder: 'e.g., 12345678-1234-1234-1234-123456789012'
                });
                if (!userInput) { return; }
                planId = userInput;
            }

            // Get execution context
            const contextInput = await vscode.window.showInputBox({
                prompt: 'Enter execution context (JSON format)',
                placeHolder: '{}',
                value: '{}'
            });
            if (!contextInput) { return; }

            let context: any = {};
            try {
                context = JSON.parse(contextInput);
            } catch (error) {
                vscode.window.showErrorMessage('Invalid JSON format for context');
                return;
            }

            // Get priority
            const priorityOptions = ['low', 'normal', 'high', 'urgent'];
            const priority = await vscode.window.showQuickPick(priorityOptions, {
                placeHolder: 'Select execution priority'
            }) as 'low' | 'normal' | 'high' | 'urgent' || 'normal';

            // Start execution
            const result = await treeNode.sharedoClient.startManualExecution(planId, context, priority);

            if (result) {
                vscode.window.showInformationMessage(
                    `✅ Execution started successfully!\\n` +
                    `Execution ID: ${result.executionId}\\n` +
                    `Status: ${result.status}\\n` +
                    `Started: ${result.startedAt}`
                );
                
                // Refresh tree to show new executing plan
                vscode.commands.executeCommand('sharedo.refreshAll');
            } else {
                vscode.window.showErrorMessage('Failed to start execution');
            }

        } catch (error) {
            Inform.writeError('ExecutionEngineCommands::startManualExecution', 'Error starting manual execution', error);
            vscode.window.showErrorMessage(`Failed to start execution: ${error}`);
        }
    }

    /**
     * Cancel an executing plan
     */
    static async cancelExecution(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient || !treeNode.additionalData) {
                vscode.window.showErrorMessage('No executing plan selected');
                return;
            }

            const plan = treeNode.additionalData as IExecutingPlanEnhanced;
            if (!plan.executionId) {
                vscode.window.showErrorMessage('No execution ID found for this plan');
                return;
            }

            // Confirm cancellation
            const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], {
                placeHolder: `Cancel execution of "${plan.planTitle || plan.planName}"?`
            });

            if (confirmation !== 'Yes') { return; }

            // Get cancellation reason
            const reason = await vscode.window.showInputBox({
                prompt: 'Enter reason for cancellation (optional)',
                placeHolder: 'e.g., User requested cancellation'
            });

            // Cancel execution
            const result = await treeNode.sharedoClient.cancelExecution(plan.executionId, reason);

            if (result) {
                vscode.window.showInformationMessage(
                    `🚫 Cancellation requested for "${plan.planTitle || plan.planName}"\\n` +
                    `Cancellation ID: ${result.cancellationId}\\n` +
                    `Status: ${result.status}`
                );
                
                // Refresh tree to update status
                vscode.commands.executeCommand('sharedo.refreshAll');
            } else {
                vscode.window.showErrorMessage('Failed to request cancellation');
            }

        } catch (error) {
            Inform.writeError('ExecutionEngineCommands::cancelExecution', 'Error cancelling execution', error);
            vscode.window.showErrorMessage(`Failed to cancel execution: ${error}`);
        }
    }

    /**
     * Show detailed execution information
     */
    static async showExecutionDetails(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.additionalData) {
                vscode.window.showErrorMessage('No execution plan selected');
                return;
            }

            const plan = treeNode.additionalData as IExecutingPlanEnhanced;
            
            const details = [
                `# Execution Plan Details`,
                ``,
                `**Plan Name:** ${plan.planTitle || plan.planName}`,
                `**Plan ID:** ${plan.planId}`,
                `**Execution ID:** ${plan.executionId}`,
                `**System Name:** ${plan.planSystemName}`,
                `**Status:** ${plan.status}`,
                `**Type:** ${plan.planType}`,
                `**Started:** ${new Date(plan.startTime).toLocaleString()}`,
                plan.endTime ? `**Ended:** ${new Date(plan.endTime).toLocaleString()}` : '',
                plan.sharedoTitle ? `**Sharedo:** ${plan.sharedoTitle}` : '',
                plan.sharedoId ? `**Sharedo ID:** ${plan.sharedoId}` : '',
                ``,
                plan.subProcesses && plan.subProcesses.length > 0 ? `## Sub-Processes (${plan.subProcesses.length})` : '',
                ...(plan.subProcesses ? plan.subProcesses.map(sp => 
                    `- **${sp.name}** (${sp.systemName})${sp.entryPoint ? ' [Entry Point]' : ''}${sp.endState ? ' [End State]' : ''}${sp.optimalPath ? ' [Optimal Path]' : ''}`
                ) : [])
            ].filter(line => line !== '').join('\\n');

            // Create and show document
            const doc = await vscode.workspace.openTextDocument({
                content: details,
                language: 'markdown'
            });
            
            await vscode.window.showTextDocument(doc);

        } catch (error) {
            Inform.writeError('ExecutionEngineCommands::showExecutionDetails', 'Error showing execution details', error);
            vscode.window.showErrorMessage(`Failed to show execution details: ${error}`);
        }
    }

    /**
     * Refresh execution monitoring data
     */
    static async refreshExecutionMonitoring(): Promise<void> {
        try {
            // This will trigger a refresh of the tree view which will fetch latest execution data
            vscode.commands.executeCommand('sharedo.refreshAll');
            vscode.window.showInformationMessage('📊 Execution monitoring data refreshed');

        } catch (error) {
            Inform.writeError('ExecutionEngineCommands::refreshExecutionMonitoring', 'Error refreshing execution monitoring', error);
            vscode.window.showErrorMessage(`Failed to refresh execution monitoring: ${error}`);
        }
    }

    /**
     * Show advisor issues in a dedicated view
     */
    static async showAdvisorIssues(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient) {
                vscode.window.showErrorMessage('No ShareDo client available');
                return;
            }

            // Get advisor issues
            const issues = await treeNode.sharedoClient.getAdvisorIssues();
            
            if (!issues || issues.length === 0) {
                vscode.window.showInformationMessage('✅ No advisor issues found!');
                return;
            }

            // Group issues by severity
            const grouped = issues.reduce((acc, issue) => {
                if (!acc[issue.severity]) { acc[issue.severity] = []; }
                acc[issue.severity].push(issue);
                return acc;
            }, {} as Record<string, any[]>);

            const content = [
                `# Workflow Advisor Issues (${issues.length})`,
                ``,
                ...Object.entries(grouped).map(([severity, severityIssues]) => [
                    `## ${severity.toUpperCase()} Issues (${severityIssues.length})`,
                    ``,
                    ...severityIssues.map(issue => [
                        `### ${issue.title}`,
                        ``,
                        `**Category:** ${issue.category}`,
                        `**Description:** ${issue.description}`,
                        `**Recommendation:** ${issue.recommendation}`,
                        issue.planId ? `**Plan ID:** ${issue.planId}` : '',
                        issue.stepId ? `**Step ID:** ${issue.stepId}` : '',
                        `**Detected:** ${new Date(issue.detected).toLocaleString()}`,
                        `**Resolved:** ${issue.resolved ? 'Yes' : 'No'}`,
                        ``,
                        `---`,
                        ``
                    ]).flat()
                ]).flat()
            ].flat().filter(line => line !== undefined).join('\\n');

            // Create and show document
            const doc = await vscode.workspace.openTextDocument({
                content: content,
                language: 'markdown'
            });
            
            await vscode.window.showTextDocument(doc);

        } catch (error) {
            Inform.writeError('ExecutionEngineCommands::showAdvisorIssues', 'Error showing advisor issues', error);
            vscode.window.showErrorMessage(`Failed to show advisor issues: ${error}`);
        }
    }

    /**
     * Export execution statistics to CSV
     */
    static async exportExecutionStatistics(treeNode?: TreeNode): Promise<void> {
        try {
            if (!treeNode || !treeNode.sharedoClient) {
                vscode.window.showErrorMessage('No ShareDo client available');
                return;
            }

            // Get executing plans
            const executingData = await treeNode.sharedoClient.getExecutingPlansEnhanced(1000, 0);
            
            if (!executingData || executingData.plans.length === 0) {
                vscode.window.showInformationMessage('No execution data available to export');
                return;
            }

            // Create CSV content
            const headers = [
                'Execution ID', 'Plan ID', 'Plan Name', 'Plan System Name', 'Status', 
                'Plan Type', 'Start Time', 'End Time', 'Sharedo Title', 'Sharedo ID'
            ];
            
            const csvContent = [
                headers.join(','),
                ...executingData.plans.map(plan => [
                    plan.executionId || '',
                    plan.planId || '',
                    `"${(plan.planTitle || plan.planName || '').replace(/"/g, '""')}"`,
                    plan.planSystemName || '',
                    plan.status || '',
                    plan.planType || '',
                    plan.startTime || '',
                    plan.endTime || '',
                    `"${(plan.sharedoTitle || '').replace(/"/g, '""')}"`,
                    plan.sharedoId || ''
                ].join(','))
            ].join('\\n');

            // Save to file
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`execution-statistics-${new Date().toISOString().split('T')[0]}.csv`),
                filters: {
                    csvFiles: ['csv'],
                    allFiles: ['*']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, new Uint8Array(Buffer.from(csvContent, 'utf8')));
                vscode.window.showInformationMessage(`📊 Execution statistics exported to ${uri.fsPath}`);
            }

        } catch (error) {
            Inform.writeError('ExecutionEngineCommands::exportExecutionStatistics', 'Error exporting execution statistics', error);
            vscode.window.showErrorMessage(`Failed to export execution statistics: ${error}`);
        }
    }
}
