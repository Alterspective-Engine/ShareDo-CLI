/**
 * Workflow Comparator
 * 
 * Compares workflows between different versions or servers
 * Provides detailed diff analysis and visualization
 */

import * as vscode from 'vscode';
import { IWorkflowDefinition, IWorkflowStep, IWorkflowAction } from './WorkflowManager';
import { Inform } from '../Utilities/inform';

export interface IComparisonOptions {
    leftTitle?: string;
    rightTitle?: string;
    showInDiffEditor?: boolean;
    generateReport?: boolean;
}

export interface IComparisonResult {
    identical: boolean;
    differences: IDifference[];
    summary: IComparisonSummary;
}

export interface IDifference {
    type: 'added' | 'removed' | 'modified';
    path: string;
    leftValue?: any;
    rightValue?: any;
    description: string;
}

export interface IComparisonSummary {
    stepsAdded: number;
    stepsRemoved: number;
    stepsModified: number;
    actionsAdded: number;
    actionsRemoved: number;
    actionsModified: number;
    variablesAdded: number;
    variablesRemoved: number;
    variablesModified: number;
}

export class WorkflowComparator {
    private static currentPanel: vscode.WebviewPanel | undefined;

    /**
     * Compare two workflows
     */
    async compare(
        leftWorkflow: IWorkflowDefinition,
        rightWorkflow: IWorkflowDefinition,
        options?: IComparisonOptions
    ): Promise<IComparisonResult> {
        const differences: IDifference[] = [];
        
        // Compare basic properties
        this.compareBasicProperties(leftWorkflow, rightWorkflow, differences);
        
        // Compare steps
        const stepComparison = this.compareSteps(leftWorkflow.steps || [], rightWorkflow.steps || [], differences);
        
        // Compare variables
        const variableComparison = this.compareVariables(leftWorkflow.variables || [], rightWorkflow.variables || [], differences);
        
        // Generate summary
        const summary: IComparisonSummary = {
            stepsAdded: stepComparison.added,
            stepsRemoved: stepComparison.removed,
            stepsModified: stepComparison.modified,
            actionsAdded: stepComparison.actionsAdded,
            actionsRemoved: stepComparison.actionsRemoved,
            actionsModified: stepComparison.actionsModified,
            variablesAdded: variableComparison.added,
            variablesRemoved: variableComparison.removed,
            variablesModified: variableComparison.modified
        };

        const result: IComparisonResult = {
            identical: differences.length === 0,
            differences,
            summary
        };

        // Show in diff editor if requested
        if (options?.showInDiffEditor !== false) {
            await this.showInDiffEditor(leftWorkflow, rightWorkflow, options);
        }

        // Show visual comparison
        if (options?.generateReport !== false) {
            await this.showComparisonReport(result, leftWorkflow, rightWorkflow, options);
        }

        return result;
    }

    /**
     * Compare basic workflow properties
     */
    private compareBasicProperties(
        left: IWorkflowDefinition,
        right: IWorkflowDefinition,
        differences: IDifference[]
    ): void {
        // Compare name
        if (left.name !== right.name) {
            differences.push({
                type: 'modified',
                path: 'name',
                leftValue: left.name,
                rightValue: right.name,
                description: `Workflow name changed from "${left.name}" to "${right.name}"`
            });
        }

        // Compare description
        if (left.description !== right.description) {
            differences.push({
                type: 'modified',
                path: 'description',
                leftValue: left.description,
                rightValue: right.description,
                description: 'Workflow description changed'
            });
        }

        // Compare notification settings
        if (left.overrideNotifications !== right.overrideNotifications) {
            differences.push({
                type: 'modified',
                path: 'overrideNotifications',
                leftValue: left.overrideNotifications,
                rightValue: right.overrideNotifications,
                description: `Override notifications changed from ${left.overrideNotifications} to ${right.overrideNotifications}`
            });
        }

        if (left.exceptionNotifications !== right.exceptionNotifications) {
            differences.push({
                type: 'modified',
                path: 'exceptionNotifications',
                leftValue: left.exceptionNotifications,
                rightValue: right.exceptionNotifications,
                description: `Exception notifications changed from ${left.exceptionNotifications} to ${right.exceptionNotifications}`
            });
        }
    }

    /**
     * Compare workflow steps
     */
    private compareSteps(
        leftSteps: IWorkflowStep[],
        rightSteps: IWorkflowStep[],
        differences: IDifference[]
    ): any {
        const leftStepMap = new Map(leftSteps.map(s => [s.systemName, s]));
        const rightStepMap = new Map(rightSteps.map(s => [s.systemName, s]));
        
        let added = 0, removed = 0, modified = 0;
        let actionsAdded = 0, actionsRemoved = 0, actionsModified = 0;

        // Check for removed steps
        for (const [systemName, leftStep] of leftStepMap) {
            if (!rightStepMap.has(systemName)) {
                differences.push({
                    type: 'removed',
                    path: `steps.${systemName}`,
                    leftValue: leftStep,
                    description: `Step "${leftStep.name}" removed`
                });
                removed++;
            }
        }

        // Check for added or modified steps
        for (const [systemName, rightStep] of rightStepMap) {
            const leftStep = leftStepMap.get(systemName);
            
            if (!leftStep) {
                differences.push({
                    type: 'added',
                    path: `steps.${systemName}`,
                    rightValue: rightStep,
                    description: `Step "${rightStep.name}" added`
                });
                added++;
            } else {
                // Compare step properties
                const stepDiffs = this.compareStep(leftStep, rightStep);
                if (stepDiffs.length > 0) {
                    modified++;
                    stepDiffs.forEach(diff => {
                        differences.push({
                            ...diff,
                            path: `steps.${systemName}.${diff.path}`
                        });
                    });
                }

                // Compare actions
                const actionComparison = this.compareActions(
                    leftStep.actions || [],
                    rightStep.actions || [],
                    `steps.${systemName}.actions`,
                    differences
                );
                actionsAdded += actionComparison.added;
                actionsRemoved += actionComparison.removed;
                actionsModified += actionComparison.modified;
            }
        }

        return { added, removed, modified, actionsAdded, actionsRemoved, actionsModified };
    }

    /**
     * Compare individual step
     */
    private compareStep(left: IWorkflowStep, right: IWorkflowStep): IDifference[] {
        const differences: IDifference[] = [];

        if (left.name !== right.name) {
            differences.push({
                type: 'modified',
                path: 'name',
                leftValue: left.name,
                rightValue: right.name,
                description: `Step name changed from "${left.name}" to "${right.name}"`
            });
        }

        if (left.description !== right.description) {
            differences.push({
                type: 'modified',
                path: 'description',
                leftValue: left.description,
                rightValue: right.description,
                description: 'Step description changed'
            });
        }

        if (left.isStart !== right.isStart) {
            differences.push({
                type: 'modified',
                path: 'isStart',
                leftValue: left.isStart,
                rightValue: right.isStart,
                description: `Step start flag changed from ${left.isStart} to ${right.isStart}`
            });
        }

        if (left.isEnd !== right.isEnd) {
            differences.push({
                type: 'modified',
                path: 'isEnd',
                leftValue: left.isEnd,
                rightValue: right.isEnd,
                description: `Step end flag changed from ${left.isEnd} to ${right.isEnd}`
            });
        }

        return differences;
    }

    /**
     * Compare actions
     */
    private compareActions(
        leftActions: IWorkflowAction[],
        rightActions: IWorkflowAction[],
        basePath: string,
        differences: IDifference[]
    ): any {
        let added = 0, removed = 0, modified = 0;

        // Create maps for comparison
        const leftActionMap = new Map(leftActions.map((a, i) => [a.id || `${a.actionSystemName}_${i}`, a]));
        const rightActionMap = new Map(rightActions.map((a, i) => [a.id || `${a.actionSystemName}_${i}`, a]));

        // Check for removed actions
        for (const [id, leftAction] of leftActionMap) {
            if (!rightActionMap.has(id)) {
                differences.push({
                    type: 'removed',
                    path: `${basePath}.${id}`,
                    leftValue: leftAction,
                    description: `Action "${leftAction.name}" removed`
                });
                removed++;
            }
        }

        // Check for added or modified actions
        for (const [id, rightAction] of rightActionMap) {
            const leftAction = leftActionMap.get(id);
            
            if (!leftAction) {
                differences.push({
                    type: 'added',
                    path: `${basePath}.${id}`,
                    rightValue: rightAction,
                    description: `Action "${rightAction.name}" added`
                });
                added++;
            } else {
                // Compare action properties
                if (this.isActionModified(leftAction, rightAction)) {
                    differences.push({
                        type: 'modified',
                        path: `${basePath}.${id}`,
                        leftValue: leftAction,
                        rightValue: rightAction,
                        description: `Action "${rightAction.name}" modified`
                    });
                    modified++;
                }
            }
        }

        return { added, removed, modified };
    }

    /**
     * Check if action is modified
     */
    private isActionModified(left: IWorkflowAction, right: IWorkflowAction): boolean {
        // Compare basic properties
        if (left.name !== right.name || 
            left.actionSystemName !== right.actionSystemName ||
            left.order !== right.order) {
            return true;
        }

        // Compare configuration
        const leftConfig = typeof left.config === 'string' ? left.config : JSON.stringify(left.config);
        const rightConfig = typeof right.config === 'string' ? right.config : JSON.stringify(right.config);
        if (leftConfig !== rightConfig) {
            return true;
        }

        // Compare connections
        const leftConnections = typeof left.connections === 'string' ? left.connections : JSON.stringify(left.connections);
        const rightConnections = typeof right.connections === 'string' ? right.connections : JSON.stringify(right.connections);
        if (leftConnections !== rightConnections) {
            return true;
        }

        return false;
    }

    /**
     * Compare variables
     */
    private compareVariables(
        leftVariables: any[],
        rightVariables: any[],
        differences: IDifference[]
    ): any {
        let added = 0, removed = 0, modified = 0;

        const leftVarMap = new Map(leftVariables.map(v => [v.systemName, v]));
        const rightVarMap = new Map(rightVariables.map(v => [v.systemName, v]));

        // Check for removed variables
        for (const [systemName, leftVar] of leftVarMap) {
            if (!rightVarMap.has(systemName)) {
                differences.push({
                    type: 'removed',
                    path: `variables.${systemName}`,
                    leftValue: leftVar,
                    description: `Variable "${leftVar.name}" removed`
                });
                removed++;
            }
        }

        // Check for added or modified variables
        for (const [systemName, rightVar] of rightVarMap) {
            const leftVar = leftVarMap.get(systemName);
            
            if (!leftVar) {
                differences.push({
                    type: 'added',
                    path: `variables.${systemName}`,
                    rightValue: rightVar,
                    description: `Variable "${rightVar.name}" added`
                });
                added++;
            } else if (JSON.stringify(leftVar) !== JSON.stringify(rightVar)) {
                differences.push({
                    type: 'modified',
                    path: `variables.${systemName}`,
                    leftValue: leftVar,
                    rightValue: rightVar,
                    description: `Variable "${rightVar.name}" modified`
                });
                modified++;
            }
        }

        return { added, removed, modified };
    }

    /**
     * Show comparison in diff editor
     */
    private async showInDiffEditor(
        leftWorkflow: IWorkflowDefinition,
        rightWorkflow: IWorkflowDefinition,
        options?: IComparisonOptions
    ): Promise<void> {
        const leftTitle = options?.leftTitle || 'Left';
        const rightTitle = options?.rightTitle || 'Right';

        // Create temporary documents
        const leftDoc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(leftWorkflow, null, 2),
            language: 'json'
        });

        const rightDoc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(rightWorkflow, null, 2),
            language: 'json'
        });

        // Show diff
        await vscode.commands.executeCommand('vscode.diff',
            leftDoc.uri,
            rightDoc.uri,
            `Workflow Comparison: ${leftTitle} ↔ ${rightTitle}`
        );
    }

    /**
     * Show visual comparison report
     */
    private async showComparisonReport(
        result: IComparisonResult,
        leftWorkflow: IWorkflowDefinition,
        rightWorkflow: IWorkflowDefinition,
        options?: IComparisonOptions
    ): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Create or reveal panel
        if (WorkflowComparator.currentPanel) {
            WorkflowComparator.currentPanel.reveal(column);
        } else {
            WorkflowComparator.currentPanel = vscode.window.createWebviewPanel(
                'workflowComparison',
                'Workflow Comparison',
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            WorkflowComparator.currentPanel.onDidDispose(() => {
                WorkflowComparator.currentPanel = undefined;
            });
        }

        // Update content
        WorkflowComparator.currentPanel.webview.html = this.getComparisonHtml(result, leftWorkflow, rightWorkflow, options);
        WorkflowComparator.currentPanel.title = `Workflow Comparison: ${leftWorkflow.name} ↔ ${rightWorkflow.name}`;
    }

    /**
     * Generate HTML for comparison report
     */
    private getComparisonHtml(
        result: IComparisonResult,
        leftWorkflow: IWorkflowDefinition,
        rightWorkflow: IWorkflowDefinition,
        options?: IComparisonOptions
    ): string {
        const leftTitle = options?.leftTitle || 'Left';
        const rightTitle = options?.rightTitle || 'Right';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Comparison</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        
        .workflow-names {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .summary {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .summary h2 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .summary-item {
            background: var(--vscode-editor-background);
            padding: 10px;
            border-radius: 3px;
        }
        
        .summary-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
        }
        
        .summary-value {
            font-size: 20px;
            font-weight: 600;
        }
        
        .added { color: #4CAF50; }
        .removed { color: #F44336; }
        .modified { color: #FF9800; }
        
        .differences {
            margin-top: 20px;
        }
        
        .differences h2 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        .difference-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 3px;
            border-left: 3px solid;
        }
        
        .difference-item.added {
            border-left-color: #4CAF50;
        }
        
        .difference-item.removed {
            border-left-color: #F44336;
        }
        
        .difference-item.modified {
            border-left-color: #FF9800;
        }
        
        .difference-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 10px;
        }
        
        .difference-path {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            color: var(--vscode-textLink-foreground);
            margin: 5px 0;
        }
        
        .difference-description {
            font-size: 14px;
            margin-top: 5px;
        }
        
        .identical-message {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            text-align: center;
            border-radius: 4px;
            color: #4CAF50;
            font-size: 16px;
        }
        
        .filter-buttons {
            margin: 15px 0;
            display: flex;
            gap: 10px;
        }
        
        .filter-btn {
            padding: 6px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .filter-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .filter-btn.active {
            background: var(--vscode-button-hoverBackground);
        }
        
        .no-differences {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Workflow Comparison</h1>
        <div class="workflow-names">
            <span><strong>${leftTitle}:</strong> ${this.escapeHtml(leftWorkflow.name)}</span>
            <span>↔</span>
            <span><strong>${rightTitle}:</strong> ${this.escapeHtml(rightWorkflow.name)}</span>
        </div>
    </div>
    
    ${result.identical ? `
        <div class="identical-message">
            ✅ Workflows are identical
        </div>
    ` : `
        <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Steps</div>
                    <div class="summary-value">
                        <span class="added">+${result.summary.stepsAdded}</span> /
                        <span class="removed">-${result.summary.stepsRemoved}</span> /
                        <span class="modified">~${result.summary.stepsModified}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Actions</div>
                    <div class="summary-value">
                        <span class="added">+${result.summary.actionsAdded}</span> /
                        <span class="removed">-${result.summary.actionsRemoved}</span> /
                        <span class="modified">~${result.summary.actionsModified}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Variables</div>
                    <div class="summary-value">
                        <span class="added">+${result.summary.variablesAdded}</span> /
                        <span class="removed">-${result.summary.variablesRemoved}</span> /
                        <span class="modified">~${result.summary.variablesModified}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="differences">
            <h2>Differences (${result.differences.length})</h2>
            
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterDifferences('all')">All</button>
                <button class="filter-btn" onclick="filterDifferences('added')">Added</button>
                <button class="filter-btn" onclick="filterDifferences('removed')">Removed</button>
                <button class="filter-btn" onclick="filterDifferences('modified')">Modified</button>
            </div>
            
            <div id="differences-list">
                ${result.differences.length > 0 ? result.differences.map(diff => `
                    <div class="difference-item ${diff.type}" data-type="${diff.type}">
                        <span class="difference-type ${diff.type}">${diff.type}</span>
                        <div class="difference-path">${this.escapeHtml(diff.path)}</div>
                        <div class="difference-description">${this.escapeHtml(diff.description)}</div>
                    </div>
                `).join('') : `
                    <div class="no-differences">No differences found</div>
                `}
            </div>
        </div>
    `}
    
    <script>
        function filterDifferences(type) {
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const items = document.querySelectorAll('.difference-item');
            items.forEach(item => {
                if (type === 'all' || item.dataset.type === type) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
    }

    /**
     * Escape HTML for safe display
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}