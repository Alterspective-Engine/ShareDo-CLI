/**
 * Status Bar Service - Connection status and quick actions for ShareDo VS Code Extension
 * 
 * Provides real-time connection status, metrics, and quick access to common actions.
 */

import * as vscode from 'vscode';
import { EventBus } from '../core/EventBus';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface StatusMetrics {
    responseTime?: number;
    requestCount: number;
    errorCount: number;
    lastActivity?: Date;
}

export class StatusBarService {
    private statusBarItem: vscode.StatusBarItem;
    private metricsBarItem: vscode.StatusBarItem;
    private connectionStatus: ConnectionStatus = 'disconnected';
    private currentServer?: string;
    private metrics: StatusMetrics = {
        requestCount: 0,
        errorCount: 0
    };
    
    private updateTimer?: NodeJS.Timer;
    
    constructor(private eventBus: EventBus) {
        // Create status bar items
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        
        this.metricsBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99
        );
        
        this.setupEventListeners();
        this.updateStatus('disconnected');
    }
    
    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Connection events
        this.eventBus.on('connection.established', (data) => {
            this.currentServer = data.url;
            this.updateStatus('connected');
        });
        
        this.eventBus.on('connection.closed', () => {
            this.currentServer = undefined;
            this.updateStatus('disconnected');
        });
        
        this.eventBus.on('connection.error', () => {
            this.updateStatus('error');
        });
        
        // Request events
        this.eventBus.on('request.start', () => {
            this.metrics.requestCount++;
            this.metrics.lastActivity = new Date();
            this.updateMetrics();
        });
        
        this.eventBus.on('request.complete', (data: { responseTime: number }) => {
            this.metrics.responseTime = data.responseTime;
            this.updateMetrics();
        });
        
        this.eventBus.on('request.error', () => {
            this.metrics.errorCount++;
            this.updateMetrics();
        });
    }
    
    /**
     * Show status bar
     */
    show(): void {
        this.statusBarItem.show();
        this.metricsBarItem.show();
        
        // Start periodic updates
        this.updateTimer = setInterval(() => {
            this.updateMetrics();
        }, 5000);
    }
    
    /**
     * Hide status bar
     */
    hide(): void {
        this.statusBarItem.hide();
        this.metricsBarItem.hide();
        
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = undefined;
        }
    }
    
    /**
     * Update connection status
     */
    updateStatus(status: ConnectionStatus, message?: string): void {
        this.connectionStatus = status;
        
        const icons = {
            connected: '$(check-circle)',
            disconnected: '$(x-circle)',
            connecting: '$(sync~spin)',
            error: '$(error)'
        };
        
        const colors = {
            connected: undefined, // Use default
            disconnected: new vscode.ThemeColor('statusBarItem.warningBackground'),
            connecting: new vscode.ThemeColor('statusBarItem.prominentBackground'),
            error: new vscode.ThemeColor('statusBarItem.errorBackground')
        };
        
        const statusText = message || this.getStatusText(status);
        this.statusBarItem.text = `${icons[status]} ShareDo: ${statusText}`;
        this.statusBarItem.backgroundColor = colors[status];
        this.statusBarItem.tooltip = this.getTooltip(status);
        this.statusBarItem.command = 'sharedo.showConnectionDetails';
    }
    
    /**
     * Update metrics display
     */
    private updateMetrics(): void {
        if (this.connectionStatus !== 'connected') {
            this.metricsBarItem.hide();
            return;
        }
        
        const parts = [];
        
        // Response time
        if (this.metrics.responseTime !== undefined) {
            parts.push(`$(pulse) ${this.metrics.responseTime}ms`);
        }
        
        // Request count
        if (this.metrics.requestCount > 0) {
            parts.push(`$(arrow-both) ${this.metrics.requestCount}`);
        }
        
        // Error rate
        if (this.metrics.errorCount > 0) {
            const errorRate = ((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(1);
            parts.push(`$(alert) ${errorRate}%`);
        }
        
        // Last activity
        if (this.metrics.lastActivity) {
            const secondsAgo = Math.floor((Date.now() - this.metrics.lastActivity.getTime()) / 1000);
            if (secondsAgo < 60) {
                parts.push(`$(clock) ${secondsAgo}s ago`);
            } else {
                const minutesAgo = Math.floor(secondsAgo / 60);
                parts.push(`$(clock) ${minutesAgo}m ago`);
            }
        }
        
        if (parts.length > 0) {
            this.metricsBarItem.text = parts.join(' | ');
            this.metricsBarItem.tooltip = this.getMetricsTooltip();
            this.metricsBarItem.command = 'sharedo.showMetrics';
            this.metricsBarItem.show();
        } else {
            this.metricsBarItem.hide();
        }
    }
    
    /**
     * Get status text
     */
    private getStatusText(status: ConnectionStatus): string {
        switch (status) {
            case 'connected':
                return this.currentServer ? 
                    new URL(this.currentServer).hostname : 
                    'Connected';
            case 'disconnected':
                return 'Not Connected';
            case 'connecting':
                return 'Connecting...';
            case 'error':
                return 'Connection Error';
        }
    }
    
    /**
     * Get tooltip text
     */
    private getTooltip(status: ConnectionStatus): string {
        const lines = [`ShareDo Connection: ${status}`];
        
        if (this.currentServer) {
            lines.push(`Server: ${this.currentServer}`);
        }
        
        switch (status) {
            case 'connected':
                lines.push('Click to view connection details');
                break;
            case 'disconnected':
                lines.push('Click to connect to a server');
                break;
            case 'connecting':
                lines.push('Establishing connection...');
                break;
            case 'error':
                lines.push('Click to retry connection');
                break;
        }
        
        return lines.join('\n');
    }
    
    /**
     * Get metrics tooltip
     */
    private getMetricsTooltip(): string {
        const lines = ['ShareDo Metrics'];
        
        if (this.metrics.responseTime !== undefined) {
            lines.push(`Average Response: ${this.metrics.responseTime}ms`);
        }
        
        lines.push(`Total Requests: ${this.metrics.requestCount}`);
        
        if (this.metrics.errorCount > 0) {
            lines.push(`Errors: ${this.metrics.errorCount}`);
            const errorRate = ((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(1);
            lines.push(`Error Rate: ${errorRate}%`);
        }
        
        if (this.metrics.lastActivity) {
            lines.push(`Last Activity: ${this.metrics.lastActivity.toLocaleTimeString()}`);
        }
        
        lines.push('Click for detailed metrics');
        
        return lines.join('\n');
    }
    
    /**
     * Show connection details
     */
    async showConnectionDetails(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'connectionDetails',
            'ShareDo Connection Details',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );
        
        panel.webview.html = this.getConnectionDetailsHTML();
    }
    
    /**
     * Get connection details HTML
     */
    private getConnectionDetailsHTML(): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
        }
        .status-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .connected { background: #4caf50; }
        .disconnected { background: #f44336; }
        .connecting { background: #ff9800; }
        .error { background: #f44336; }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            font-weight: bold;
        }
        .metric-value {
            color: var(--vscode-descriptionForeground);
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h2>ShareDo Connection Status</h2>
    
    <div class="status-card">
        <h3>
            <span class="status-indicator ${this.connectionStatus}"></span>
            ${this.connectionStatus.charAt(0).toUpperCase() + this.connectionStatus.slice(1)}
        </h3>
        ${this.currentServer ? `<p>Server: ${this.currentServer}</p>` : ''}
    </div>
    
    <div class="status-card">
        <h3>Performance Metrics</h3>
        <div class="metric">
            <span class="metric-label">Response Time:</span>
            <span class="metric-value">${this.metrics.responseTime || 'N/A'} ms</span>
        </div>
        <div class="metric">
            <span class="metric-label">Total Requests:</span>
            <span class="metric-value">${this.metrics.requestCount}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Errors:</span>
            <span class="metric-value">${this.metrics.errorCount}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Error Rate:</span>
            <span class="metric-value">${this.metrics.requestCount > 0 ? 
                ((this.metrics.errorCount / this.metrics.requestCount) * 100).toFixed(1) : 0}%</span>
        </div>
        <div class="metric">
            <span class="metric-label">Last Activity:</span>
            <span class="metric-value">${this.metrics.lastActivity?.toLocaleString() || 'Never'}</span>
        </div>
    </div>
    
    <div style="margin-top: 20px;">
        ${this.connectionStatus === 'connected' ? 
            '<button onclick="vscode.postMessage({command: \'disconnect\'})">Disconnect</button>' :
            '<button onclick="vscode.postMessage({command: \'connect\'})">Connect</button>'
        }
        <button onclick="vscode.postMessage({command: 'refresh'})">Refresh</button>
        <button onclick="vscode.postMessage({command: 'settings'})">Settings</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Reset metrics
     */
    resetMetrics(): void {
        this.metrics = {
            requestCount: 0,
            errorCount: 0
        };
        this.updateMetrics();
    }
    
    /**
     * Dispose resources
     */
    dispose(): void {
        this.statusBarItem.dispose();
        this.metricsBarItem.dispose();
        
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
    }
}