/**
 * Tree Data Service - Manages tree data operations for ShareDo VS Code Extension
 * 
 * Provides data management for the tree view with caching and optimization.
 */

import * as vscode from 'vscode';
import { ConnectionManager } from '../core/ConnectionManager';
import { StateManager } from '../core/StateManager';
import { EventBus } from '../core/EventBus';
import { ElementTypes } from '../enums';

export interface TreeNodeData {
    id: string;
    label: string;
    type: ElementTypes;
    data: any;
    children?: TreeNodeData[];
    icon?: string;
    contextValue?: string;
    description?: string;
    tooltip?: string;
}

export class TreeDataService {
    private cache = new Map<string, TreeNodeData[]>();
    private loadingNodes = new Set<string>();
    private expandedNodes = new Set<string>();
    
    constructor(
        private connectionManager: ConnectionManager,
        private stateManager: StateManager,
        private eventBus: EventBus
    ) {
        this.initialize();
    }
    
    /**
     * Initialize the service
     */
    private initialize(): void {
        // Load expanded nodes from state
        const expanded = this.stateManager.getState<string[]>('expandedNodes') || [];
        expanded.forEach(id => this.expandedNodes.add(id));
        
        // Listen for refresh events
        this.eventBus.on('tree.refresh', () => this.clearCache());
        this.eventBus.on('tree.refreshNode', (nodeId: string) => this.clearNodeCache(nodeId));
    }
    
    /**
     * Get children for a node
     */
    async getChildren(nodeId?: string): Promise<TreeNodeData[]> {
        const cacheKey = nodeId || 'root';
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }
        
        // Check if already loading
        if (this.loadingNodes.has(cacheKey)) {
            // Wait for loading to complete
            await this.waitForLoading(cacheKey);
            return this.cache.get(cacheKey) || [];
        }
        
        // Mark as loading
        this.loadingNodes.add(cacheKey);
        
        try {
            const children = await this.loadChildren(nodeId);
            this.cache.set(cacheKey, children);
            return children;
        } finally {
            this.loadingNodes.delete(cacheKey);
        }
    }
    
    /**
     * Load children from server
     */
    private async loadChildren(nodeId?: string): Promise<TreeNodeData[]> {
        if (!nodeId) {
            // Root level - return servers
            return this.getServers();
        }
        
        // Parse node ID to determine type
        const [type, ...parts] = nodeId.split(':');
        
        switch (type) {
            case 'server':
                return this.getServerChildren(parts.join(':'));
            case 'worktype':
                return this.getWorkTypeChildren(parts.join(':'));
            case 'workflow':
                return this.getWorkflowChildren(parts.join(':'));
            case 'folder':
                return this.getFolderChildren(parts.join(':'));
            default:
                return [];
        }
    }
    
    /**
     * Get server nodes
     */
    private async getServers(): Promise<TreeNodeData[]> {
        const connections = this.connectionManager.getAllConnections();
        const nodes: TreeNodeData[] = [];
        
        for (const [url, client] of connections) {
            nodes.push({
                id: `server:${url}`,
                label: new URL(url).hostname,
                type: ElementTypes.server,
                data: { url, client },
                icon: 'server',
                contextValue: 'server',
                description: 'Connected',
                tooltip: url
            });
        }
        
        return nodes;
    }
    
    /**
     * Get server children
     */
    private async getServerChildren(serverId: string): Promise<TreeNodeData[]> {
        return [
            {
                id: `worktypes:${serverId}`,
                label: 'Work Types',
                type: ElementTypes.workTypes,
                data: { serverId },
                icon: 'folder',
                contextValue: 'workTypesRoot'
            },
            {
                id: `workflows:${serverId}`,
                label: 'Workflows',
                type: ElementTypes.workflows,
                data: { serverId },
                icon: 'folder',
                contextValue: 'workflowsRoot'
            },
            {
                id: `ide:${serverId}`,
                label: 'IDE Files',
                type: ElementTypes.ide,
                data: { serverId },
                icon: 'folder',
                contextValue: 'ideRoot'
            },
            {
                id: `forms:${serverId}`,
                label: 'Forms',
                type: ElementTypes.forms,
                data: { serverId },
                icon: 'folder',
                contextValue: 'formsRoot'
            }
        ];
    }
    
    /**
     * Get work type children
     */
    private async getWorkTypeChildren(parentId: string): Promise<TreeNodeData[]> {
        // This would fetch from the actual API
        // For now, return mock data
        return [
            {
                id: `worktype:${parentId}:sample`,
                label: 'Sample Work Type',
                type: ElementTypes.workType,
                data: { id: 'sample' },
                icon: 'symbol-class',
                contextValue: 'workType'
            }
        ];
    }
    
    /**
     * Get workflow children
     */
    private async getWorkflowChildren(parentId: string): Promise<TreeNodeData[]> {
        // This would fetch from the actual API
        return [
            {
                id: `workflow:${parentId}:sample`,
                label: 'Sample Workflow',
                type: ElementTypes.workflow,
                data: { id: 'sample' },
                icon: 'symbol-event',
                contextValue: 'workflow'
            }
        ];
    }
    
    /**
     * Get folder children
     */
    private async getFolderChildren(folderId: string): Promise<TreeNodeData[]> {
        // This would fetch from the actual API
        return [];
    }
    
    /**
     * Wait for loading to complete
     */
    private async waitForLoading(nodeId: string): Promise<void> {
        const maxWait = 10000; // 10 seconds
        const interval = 100; // Check every 100ms
        let elapsed = 0;
        
        while (this.loadingNodes.has(nodeId) && elapsed < maxWait) {
            await new Promise(resolve => setTimeout(resolve, interval));
            elapsed += interval;
        }
    }
    
    /**
     * Clear all cache
     */
    clearCache(): void {
        this.cache.clear();
        this.eventBus.emit('tree.cacheCleared');
    }
    
    /**
     * Clear cache for a specific node
     */
    clearNodeCache(nodeId: string): void {
        this.cache.delete(nodeId);
        // Also clear children
        for (const key of this.cache.keys()) {
            if (key.startsWith(nodeId)) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Track node expansion
     */
    onNodeExpanded(nodeId: string): void {
        this.expandedNodes.add(nodeId);
        this.saveExpandedNodes();
    }
    
    /**
     * Track node collapse
     */
    onNodeCollapsed(nodeId: string): void {
        this.expandedNodes.delete(nodeId);
        this.saveExpandedNodes();
    }
    
    /**
     * Save expanded nodes to state
     */
    private saveExpandedNodes(): void {
        const expanded = Array.from(this.expandedNodes);
        this.stateManager.setState('expandedNodes', expanded, true);
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        nodes: number;
        loading: number;
    } {
        let nodeCount = 0;
        for (const children of this.cache.values()) {
            nodeCount += children.length;
        }
        
        return {
            size: this.cache.size,
            nodes: nodeCount,
            loading: this.loadingNodes.size
        };
    }
}