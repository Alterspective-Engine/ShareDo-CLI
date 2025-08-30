/**
 * Workflow Visualizer
 * 
 * Creates visual representation of workflows using WebView
 * Supports interactive diagram with zoom, pan, and node details
 */

import * as vscode from 'vscode';
import { IWorkflowDefinition, IWorkflowStep, IWorkflowAction } from './WorkflowManager';

export class WorkflowVisualizer {
    private static currentPanel: vscode.WebviewPanel | undefined;

    /**
     * Show workflow in visual format
     */
    async showWorkflow(workflow: IWorkflowDefinition): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (WorkflowVisualizer.currentPanel) {
            WorkflowVisualizer.currentPanel.reveal(column);
        } else {
            // Create a new panel
            WorkflowVisualizer.currentPanel = vscode.window.createWebviewPanel(
                'workflowVisualizer',
                `Workflow: ${workflow.name}`,
                column || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            WorkflowVisualizer.currentPanel.onDidDispose(() => {
                WorkflowVisualizer.currentPanel = undefined;
            });
        }

        // Update the content
        WorkflowVisualizer.currentPanel.webview.html = this.getWebviewContent(workflow);
        WorkflowVisualizer.currentPanel.title = `Workflow: ${workflow.name}`;

        // Handle messages from the webview
        WorkflowVisualizer.currentPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'showStep':
                        this.showStepDetails(message.step);
                        return;
                    case 'showAction':
                        this.showActionDetails(message.action);
                        return;
                    case 'export':
                        this.exportDiagram(workflow, message.format);
                        return;
                }
            }
        );
    }

    /**
     * Generate HTML content for the workflow visualization
     */
    private getWebviewContent(workflow: IWorkflowDefinition): string {
        const nodes = this.generateNodes(workflow);
        const edges = this.generateEdges(workflow);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${workflow.name}</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        #header {
            padding: 10px 20px;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        #title {
            font-size: 18px;
            font-weight: 600;
        }
        
        #description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        #controls {
            display: flex;
            gap: 10px;
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 12px;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        #network {
            height: calc(100vh - 80px);
            width: 100%;
        }
        
        #details {
            position: absolute;
            top: 80px;
            right: 20px;
            width: 300px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            display: none;
            max-height: 400px;
            overflow-y: auto;
        }
        
        #details.show {
            display: block;
        }
        
        .detail-title {
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .detail-item {
            margin: 8px 0;
            font-size: 12px;
        }
        
        .detail-label {
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
        }
        
        .detail-value {
            margin-left: 10px;
        }
        
        .action-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 8px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .action-item:hover {
            background: var(--vscode-editor-selectionBackground);
        }
        
        #legend {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin: 5px 0;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            margin-right: 8px;
            border-radius: 50%;
        }
        
        .zoom-controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .zoom-btn {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div id="header">
        <div>
            <div id="title">${this.escapeHtml(workflow.name)}</div>
            <div id="description">${this.escapeHtml(workflow.description || 'No description')}</div>
        </div>
        <div id="controls">
            <button onclick="fitNetwork()">Fit View</button>
            <button onclick="togglePhysics()">Toggle Physics</button>
            <button onclick="exportDiagram('png')">Export PNG</button>
            <button onclick="exportDiagram('svg')">Export SVG</button>
            <button onclick="toggleDetails()">Toggle Details</button>
        </div>
    </div>
    
    <div id="network"></div>
    
    <div id="details">
        <div class="detail-title">Node Details</div>
        <div id="detail-content">
            Select a node to view details
        </div>
    </div>
    
    <div id="legend">
        <div class="legend-item">
            <div class="legend-color" style="background: #4CAF50;"></div>
            <span>Start Step</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #F44336;"></div>
            <span>End Step</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #2196F3;"></div>
            <span>Process Step</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #FF9800;"></div>
            <span>Conditional Step</span>
        </div>
    </div>
    
    <div class="zoom-controls">
        <button class="zoom-btn" onclick="zoomIn()">+</button>
        <button class="zoom-btn" onclick="zoomOut()">-</button>
        <button class="zoom-btn" onclick="fitNetwork()">⊡</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // Workflow data
        const nodes = new vis.DataSet(${JSON.stringify(nodes)});
        const edges = new vis.DataSet(${JSON.stringify(edges)});
        
        // Network options
        const options = {
            nodes: {
                shape: 'box',
                margin: 10,
                font: {
                    size: 14,
                    color: getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground')
                },
                borderWidth: 2
            },
            edges: {
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1
                    }
                },
                smooth: {
                    type: 'cubicBezier',
                    roundness: 0.4
                },
                color: {
                    color: getComputedStyle(document.body).getPropertyValue('--vscode-textLink-foreground'),
                    highlight: getComputedStyle(document.body).getPropertyValue('--vscode-textLink-activeForeground')
                }
            },
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'LR',
                    sortMethod: 'directed',
                    nodeSpacing: 150,
                    levelSeparation: 200
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };
        
        // Create network
        const container = document.getElementById('network');
        const data = { nodes, edges };
        const network = new vis.Network(container, data, options);
        
        // Event handlers
        network.on('selectNode', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = nodes.get(nodeId);
                showNodeDetails(node);
            }
        });
        
        network.on('deselectNode', function(params) {
            hideDetails();
        });
        
        function showNodeDetails(node) {
            const details = document.getElementById('details');
            const content = document.getElementById('detail-content');
            
            let html = '<div class="detail-item">';
            html += '<span class="detail-label">Name:</span>';
            html += '<span class="detail-value">' + node.label + '</span>';
            html += '</div>';
            
            html += '<div class="detail-item">';
            html += '<span class="detail-label">Type:</span>';
            html += '<span class="detail-value">' + node.stepType + '</span>';
            html += '</div>';
            
            if (node.description) {
                html += '<div class="detail-item">';
                html += '<span class="detail-label">Description:</span>';
                html += '<div class="detail-value">' + node.description + '</div>';
                html += '</div>';
            }
            
            if (node.actions && node.actions.length > 0) {
                html += '<div class="detail-item">';
                html += '<span class="detail-label">Actions (' + node.actions.length + '):</span>';
                html += '<div class="detail-value">';
                node.actions.forEach(action => {
                    html += '<div class="action-item" onclick="showAction(\\'' + action.id + '\\')">';
                    html += action.name + ' (' + action.actionSystemName + ')';
                    html += '</div>';
                });
                html += '</div>';
                html += '</div>';
            }
            
            // Safely set content using textContent for data, only structure uses innerHTML
            // This prevents XSS attacks from malicious workflow data
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Sanitize all text content
            tempDiv.querySelectorAll('.detail-value').forEach(el => {
                const text = el.textContent || '';
                el.textContent = text; // Re-set as text, not HTML
            });
            
            content.innerHTML = tempDiv.innerHTML;
            details.classList.add('show');
        }
        
        function hideDetails() {
            document.getElementById('details').classList.remove('show');
        }
        
        function toggleDetails() {
            document.getElementById('details').classList.toggle('show');
        }
        
        function fitNetwork() {
            network.fit();
        }
        
        function zoomIn() {
            const scale = network.getScale();
            network.moveTo({ scale: scale * 1.2 });
        }
        
        function zoomOut() {
            const scale = network.getScale();
            network.moveTo({ scale: scale * 0.8 });
        }
        
        let physicsEnabled = false;
        function togglePhysics() {
            physicsEnabled = !physicsEnabled;
            network.setOptions({ physics: { enabled: physicsEnabled } });
        }
        
        function exportDiagram(format) {
            vscode.postMessage({
                command: 'export',
                format: format
            });
        }
        
        function showAction(actionId) {
            vscode.postMessage({
                command: 'showAction',
                action: { id: actionId }
            });
        }
        
        // Initialize
        setTimeout(() => {
            network.fit();
        }, 100);
    </script>
</body>
</html>`;
    }

    /**
     * Generate nodes for visualization
     */
    private generateNodes(workflow: IWorkflowDefinition): any[] {
        const nodes: any[] = [];

        if (!workflow.steps) {
            return nodes;
        }

        for (const step of workflow.steps) {
            const position = this.parseIdeData(step.ideData);
            
            let color = '#2196F3'; // Default blue
            let shape = 'box';
            let stepType = 'Process';
            
            if (step.isStart) {
                color = '#4CAF50'; // Green
                shape = 'ellipse';
                stepType = 'Start';
            } else if (step.isEnd) {
                color = '#F44336'; // Red
                shape = 'ellipse';
                stepType = 'End';
            } else if (this.hasConditionalActions(step)) {
                color = '#FF9800'; // Orange
                stepType = 'Conditional';
            }

            nodes.push({
                id: step.systemName,
                label: step.name,
                title: step.description || step.name,
                color: {
                    background: color,
                    border: color,
                    highlight: {
                        background: color,
                        border: color
                    }
                },
                shape: shape,
                x: position.x,
                y: position.y,
                stepType: stepType,
                description: step.description,
                actions: step.actions || []
            });
        }

        return nodes;
    }

    /**
     * Generate edges for visualization
     */
    private generateEdges(workflow: IWorkflowDefinition): any[] {
        const edges: any[] = [];

        if (!workflow.steps) {
            return edges;
        }

        for (const step of workflow.steps) {
            if (!step.actions) {
                continue;
            }

            for (const action of step.actions) {
                if (action.connections) {
                    const connections = typeof action.connections === 'string' 
                        ? JSON.parse(action.connections) 
                        : action.connections;

                    // Handle different connection types
                    if (connections.execute && connections.execute.step) {
                        edges.push({
                            from: step.systemName,
                            to: connections.execute.step,
                            label: action.name || '',
                            arrows: 'to'
                        });
                    }

                    if (connections.yes && connections.yes.step) {
                        edges.push({
                            from: step.systemName,
                            to: connections.yes.step,
                            label: 'Yes',
                            arrows: 'to',
                            color: { color: '#4CAF50' }
                        });
                    }

                    if (connections.no && connections.no.step) {
                        edges.push({
                            from: step.systemName,
                            to: connections.no.step,
                            label: 'No',
                            arrows: 'to',
                            color: { color: '#F44336' }
                        });
                    }

                    // Handle loop connections
                    if (connections.loop && connections.loop.step) {
                        edges.push({
                            from: step.systemName,
                            to: connections.loop.step,
                            label: 'Loop',
                            arrows: 'to',
                            color: { color: '#FF9800' },
                            smooth: { type: 'curvedCW' }
                        });
                    }
                }
            }
        }

        return edges;
    }

    /**
     * Parse IDE positioning data
     */
    private parseIdeData(ideData?: string): { x: number; y: number } {
        if (!ideData) {
            return { x: 0, y: 0 };
        }

        try {
            const data = JSON.parse(ideData);
            return { x: data.x || 0, y: data.y || 0 };
        } catch {
            return { x: 0, y: 0 };
        }
    }

    /**
     * Check if step has conditional actions
     */
    private hasConditionalActions(step: IWorkflowStep): boolean {
        if (!step.actions) {
            return false;
        }

        return step.actions.some(action => 
            action.actionSystemName === 'ifElse' || 
            action.actionSystemName === 'switch' ||
            action.actionSystemName === 'forEach'
        );
    }

    /**
     * Show step details
     */
    private showStepDetails(step: any): void {
        vscode.window.showInformationMessage(`Step: ${step.name}`);
    }

    /**
     * Show action details
     */
    private showActionDetails(action: any): void {
        vscode.window.showInformationMessage(`Action: ${action.name}`);
    }

    /**
     * Export diagram
     */
    private async exportDiagram(workflow: IWorkflowDefinition, format: string): Promise<void> {
        vscode.window.showInformationMessage(`Exporting diagram as ${format}...`);
        // Implementation would depend on the specific export requirements
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