/**
 * Optimized Tree Data Provider for ShareDo VS Code Extension
 * 
 * High-performance tree provider with virtual scrolling, lazy loading,
 * and intelligent caching strategies.
 */

import * as vscode from 'vscode';
import { DependencyContainer } from '../core/DependencyContainer';
import { TreeDataService, TreeNodeData } from '../services/TreeDataService';
import { EventBus } from '../core/EventBus';
import { StateManager } from '../core/StateManager';

/**
 * Tree node with optimized memory footprint
 */
export class OptimizedTreeNode extends vscode.TreeItem {
    private _children?: Promise<OptimizedTreeNode[]>;
    private _parent?: OptimizedTreeNode;
    
    constructor(
        public readonly nodeData: TreeNodeData,
        collapsibleState: vscode.TreeItemCollapsibleState,
        parent?: OptimizedTreeNode
    ) {
        super(nodeData.label, collapsibleState);
        
        this._parent = parent;
        this.id = nodeData.id;
        this.contextValue = nodeData.contextValue;
        this.description = nodeData.description;
        this.tooltip = nodeData.tooltip;
        this.iconPath = this.getIcon(nodeData.icon);
    }
    
    /**
     * Get icon for the node
     */
    private getIcon(icon?: string): vscode.ThemeIcon | undefined {
        if (!icon) return undefined;
        return new vscode.ThemeIcon(icon);
    }
    
    /**
     * Get parent node
     */
    get parent(): OptimizedTreeNode | undefined {
        return this._parent;
    }
    
    /**
     * Set children promise for lazy loading
     */
    setChildrenPromise(promise: Promise<OptimizedTreeNode[]>): void {
        this._children = promise;
    }
    
    /**
     * Get children (lazy loaded)
     */
    async getChildren(): Promise<OptimizedTreeNode[]> {
        if (!this._children) {
            return [];
        }
        return this._children;
    }
}

/**
 * Virtual tree node for large datasets
 */
class VirtualTreeNode extends OptimizedTreeNode {
    constructor(
        nodeData: TreeNodeData,
        private loadMore: () => Promise<OptimizedTreeNode[]>
    ) {
        super(
            {
                ...nodeData,
                label: '... Load More',
                icon: 'ellipsis'
            },
            vscode.TreeItemCollapsibleState.None
        );
    }
    
    async expand(): Promise<OptimizedTreeNode[]> {
        return this.loadMore();
    }
}

/**
 * Optimized tree data provider with virtual scrolling and caching
 */
export class TreeDataProvider implements vscode.TreeDataProvider<OptimizedTreeNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<OptimizedTreeNode | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    private treeDataService: TreeDataService;
    private eventBus: EventBus;
    private stateManager: StateManager;
    
    // Performance optimization
    private nodeCache = new Map<string, OptimizedTreeNode>();
    private loadingNodes = new Set<string>();
    private pageSize = 50; // Virtual scrolling page size
    private refreshDebounceTimer?: NodeJS.Timer;
    private refreshDebounceDelay = 300; // ms
    
    constructor(private container: DependencyContainer) {
        this.treeDataService = container.get<TreeDataService>('TreeDataService');
        this.eventBus = container.get<EventBus>('EventBus');
        this.stateManager = container.get<StateManager>('StateManager');
        
        this.setupEventHandlers();
        this.loadSettings();
    }
    
    /**
     * Setup event handlers
     */
    private setupEventHandlers(): void {
        // Tree refresh events
        this.eventBus.on('tree.refresh', () => this.refresh());
        this.eventBus.on('tree.refreshNode', (node: OptimizedTreeNode) => this.refreshNode(node));
        
        // Connection events
        this.eventBus.on('connection.established', () => this.refresh());
        this.eventBus.on('connection.closed', () => this.refresh());
        
        // File change events
        this.eventBus.on('file.changed', () => this.debouncedRefresh());
    }
    
    /**
     * Load settings
     */
    private loadSettings(): void {
        const config = vscode.workspace.getConfiguration('sharedo');
        this.pageSize = config.get('treePageSize', 50);
    }
    
    /**
     * Get tree item
     */
    getTreeItem(element: OptimizedTreeNode): vscode.TreeItem {
        return element;
    }
    
    /**
     * Get children with virtual scrolling
     */
    async getChildren(element?: OptimizedTreeNode): Promise<OptimizedTreeNode[]> {
        try {
            const nodeId = element?.nodeData.id;
            
            // Check if already loading
            if (nodeId && this.loadingNodes.has(nodeId)) {
                return []; // Return empty to prevent duplicate loading
            }
            
            // Mark as loading
            if (nodeId) {
                this.loadingNodes.add(nodeId);
            }
            
            // Get data from service
            const childrenData = await this.treeDataService.getChildren(nodeId);
            
            // Convert to tree nodes with virtualization
            const nodes = await this.createNodes(childrenData, element);
            
            // Cache nodes
            nodes.forEach(node => {
                this.nodeCache.set(node.nodeData.id, node);
            });
            
            return nodes;
            
        } catch (error) {
            console.error('Error loading tree children:', error);
            const errorHandler = this.container.get('ErrorHandler') as any;
            if (errorHandler && typeof errorHandler.handleError === 'function') {
                await errorHandler.handleError(error, 'TreeDataProvider.getChildren');
            }
            return [];
            
        } finally {
            if (element?.nodeData.id) {
                this.loadingNodes.delete(element.nodeData.id);
            }
        }
    }
    
    /**
     * Get parent of a node
     */
    getParent(element: OptimizedTreeNode): vscode.ProviderResult<OptimizedTreeNode> {
        return element.parent;
    }
    
    /**
     * Create tree nodes with virtualization
     */
    private async createNodes(
        dataNodes: TreeNodeData[],
        parent?: OptimizedTreeNode
    ): Promise<OptimizedTreeNode[]> {
        const nodes: OptimizedTreeNode[] = [];
        
        // Apply virtual scrolling for large datasets
        const useVirtualization = dataNodes.length > this.pageSize;
        const nodesToCreate = useVirtualization ? 
            dataNodes.slice(0, this.pageSize) : 
            dataNodes;
        
        for (const data of nodesToCreate) {
            // Check cache first
            let node = this.nodeCache.get(data.id);
            
            if (!node) {
                // Determine collapsible state
                const hasChildren = data.children && data.children.length > 0;
                const collapsibleState = hasChildren ?
                    vscode.TreeItemCollapsibleState.Collapsed :
                    vscode.TreeItemCollapsibleState.None;
                
                // Create new node
                node = new OptimizedTreeNode(data, collapsibleState, parent);
                
                // Set up lazy loading for children
                if (hasChildren) {
                    node.setChildrenPromise(
                        this.loadChildrenLazy(node)
                    );
                }
            }
            
            nodes.push(node);
        }
        
        // Add virtual "Load More" node if needed
        if (useVirtualization) {
            const loadMoreNode = new VirtualTreeNode(
                {
                    id: `${parent?.nodeData.id || 'root'}-loadmore`,
                    label: `... ${dataNodes.length - this.pageSize} more items`,
                    type: 'loadmore' as any, // Cast to avoid enum issues
                    data: {}
                },
                async () => {
                    // Load next page
                    const nextPage = dataNodes.slice(
                        this.pageSize,
                        this.pageSize * 2
                    );
                    return this.createNodes(nextPage, parent);
                }
            );
            nodes.push(loadMoreNode);
        }
        
        return nodes;
    }
    
    /**
     * Load children lazily
     */
    private async loadChildrenLazy(node: OptimizedTreeNode): Promise<OptimizedTreeNode[]> {
        const childrenData = await this.treeDataService.getChildren(node.nodeData.id);
        return this.createNodes(childrenData, node);
    }
    
    /**
     * Refresh the entire tree
     */
    refresh(): void {
        // Clear caches
        this.nodeCache.clear();
        this.loadingNodes.clear();
        this.treeDataService.clearCache();
        
        // Trigger refresh
        this._onDidChangeTreeData.fire();
    }
    
    /**
     * Refresh a specific node
     */
    refreshNode(node: OptimizedTreeNode): void {
        // Clear cache for this node and its children
        this.clearNodeCache(node);
        this.treeDataService.clearNodeCache(node.nodeData.id);
        
        // Trigger refresh for the node
        this._onDidChangeTreeData.fire(node);
    }
    
    /**
     * Debounced refresh for file changes
     */
    private debouncedRefresh(): void {
        if (this.refreshDebounceTimer) {
            clearTimeout(this.refreshDebounceTimer);
        }
        
        this.refreshDebounceTimer = setTimeout(() => {
            this.refresh();
            this.refreshDebounceTimer = undefined;
        }, this.refreshDebounceDelay);
    }
    
    /**
     * Clear cache for a node and its descendants
     */
    private clearNodeCache(node: OptimizedTreeNode): void {
        const nodeId = node.nodeData.id;
        
        // Clear this node
        this.nodeCache.delete(nodeId);
        
        // Clear descendants
        for (const [id, cachedNode] of this.nodeCache) {
            if (id.startsWith(nodeId)) {
                this.nodeCache.delete(id);
            }
        }
    }
    
    /**
     * Reveal a node in the tree
     */
    async revealNode(nodeId: string, options?: {
        select?: boolean;
        focus?: boolean;
        expand?: boolean | number;
    }): Promise<void> {
        const node = this.nodeCache.get(nodeId);
        if (!node) {
            // Node not in cache, need to load path to it
            // This would require traversing from root
            return;
        }
        
        // Fire reveal event
        this.eventBus.emit('tree.reveal', { node, options });
    }
    
    /**
     * Get statistics
     */
    getStatistics(): {
        cachedNodes: number;
        loadingNodes: number;
        cacheHitRate: number;
    } {
        // Would need to track cache hits/misses for accurate rate
        return {
            cachedNodes: this.nodeCache.size,
            loadingNodes: this.loadingNodes.size,
            cacheHitRate: 0 // Placeholder
        };
    }
    
    /**
     * Dispose resources
     */
    dispose(): void {
        this._onDidChangeTreeData.dispose();
        this.nodeCache.clear();
        this.loadingNodes.clear();
        
        if (this.refreshDebounceTimer) {
            clearTimeout(this.refreshDebounceTimer);
        }
    }
}