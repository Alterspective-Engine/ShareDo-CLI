import * as vscode from 'vscode';
import { TreeNode } from '../treeprovider';
import { ElementTypes } from '../enums';
import { TreeProviderRegistry } from './TreeProviderRegistry';
import { ITreeDataService } from './interfaces/ITreeProvider';
import { WorkflowTreeProvider } from './providers/WorkflowTreeProvider';
import { WorkTypeTreeProvider } from './providers/WorkTypeTreeProvider';
import { ExecutionEngineTreeProvider } from './providers/ExecutionEngineTreeProvider';
import { BasicElementProvider } from './providers/BasicElementProvider';
import { SharedoEnvironments } from '../environments';

export class CompositeTreeProvider implements vscode.TreeDataProvider<TreeNode> {
    private registry = new TreeProviderRegistry();
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private environment?: SharedoEnvironments;

    constructor(private dataService: ITreeDataService) {
        this.registerProviders();
    }

    /**
     * Set the ShareDo environment for compatibility with existing extension structure
     */
    setEnvironment(environment: SharedoEnvironments): void {
        this.environment = environment;
    }

    private registerProviders(): void {
        // Register domain-specific providers
        this.registry.register(ElementTypes.workflows, new WorkflowTreeProvider(this.dataService));
        this.registry.register(ElementTypes.workTypes, new WorkTypeTreeProvider(this.dataService));
        this.registry.register(ElementTypes.executionOverview, new ExecutionEngineTreeProvider(this.dataService));
        
        // Register basic element provider as wildcard
        this.registry.registerWildcard(new BasicElementProvider(this.dataService));
        
        // Register additional providers as needed
        // this.registry.register(ElementTypes.forms, new FormBuilderTreeProvider(this.dataService));
    }

    async getChildren(element?: TreeNode): Promise<TreeNode[]> {
        if (!element) {
            return this.generateTopLevelElements();
        }

        const provider = this.registry.getProvider(element.type);
        if (provider) {
            try {
                return await provider.getChildren(element);
            } catch (error) {
                console.error(`Error getting children for ${element.type}:`, error);
                return this.createErrorNode(error);
            }
        }

        // Fallback to generic object key generation
        return this.generateFallbackNodes(element);
    }

    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }

    refresh(element?: TreeNode): void {
        if (element) {
            const provider = this.registry.getProvider(element.type);
            if (provider) {
                provider.refresh();
            } else {
                // Clear cache for this specific element
                const cacheKey = `${element.type}_${element.entityId || 'root'}`;
                this.dataService.invalidateCache(cacheKey);
            }
        } else {
            // Refresh all providers
            this.registry.refreshAll();
        }
        
        this._onDidChangeTreeData.fire(element);
    }

    async preloadData(): Promise<void> {
        await this.registry.preloadAll();
    }

    private async generateTopLevelElements(): Promise<TreeNode[]> {
        const cacheKey = 'toplevel_elements';
        
        return this.dataService.fetchData(cacheKey, async () => {
            // Generate top-level tree elements based on ShareDo environments
            const topLevelElements: TreeNode[] = [];
            
            if (this.environment) {
                // Import generateIDE function
                const { generateIDE } = await import('../Request/IDE/ideTreeProviderHelper');
                
                this.environment.forEach(server => {
                    let elementType = ElementTypes.server;
                    if (server.parent?.isDeployToServer(server)) {
                        elementType = ElementTypes.deployToServer;
                    }
                    const newServer = new TreeNode(
                        server.url,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        elementType, 
                        undefined, 
                        server, 
                        undefined
                    );
                    topLevelElements.push(newServer);
                    
                    // Generate IDE for the server (if needed)
                    // This matches the legacy behavior
                    generateIDE(newServer);
                });
            }
            
            return topLevelElements;
        });
    }

    private async generateFallbackNodes(element: TreeNode): Promise<TreeNode[]> {
        const cacheKey = `fallback_${element.type}_${element.entityId || 'root'}`;
        
        return this.dataService.fetchData(cacheKey, async () => {
            // Try to handle specific legacy cases
            switch (element.type) {
                case ElementTypes.server:
                case ElementTypes.deployToServer:
                    return this.handleServerNodes(element);
                case ElementTypes.favorites:
                    return this.handleFavoritesNodes(element);
                case ElementTypes.errors:
                    return this.handleErrorNodes(element);
                case ElementTypes.forms:
                    return this.handleFormNodes(element);
                case ElementTypes.ide:
                    return this.handleIDENodes(element);
                default:
                    // Final fallback to generic object generation
                    const { generateObjectKeysInfoTreeNodes } = await import('../Helpers/treeProviderHelper');
                    return generateObjectKeysInfoTreeNodes(element.data, element);
            }
        });
    }

    private async handleServerNodes(element: TreeNode): Promise<TreeNode[]> {
        // For server nodes, we need to delegate to legacy TreeNodeProvider
        // since the logic is complex and involves private methods
        try {
            const { TreeNodeProvider: legacyTreeNodeProvider } = await import('../treeprovider');
            const legacyProvider = new legacyTreeNodeProvider(this.environment!);
            return legacyProvider.getChildren(element) as Promise<TreeNode[]>;
        } catch (error) {
            console.error('Error handling server nodes:', error);
            return [];
        }
    }

    private async handleFavoritesNodes(element: TreeNode): Promise<TreeNode[]> {
        // Delegate to legacy provider for favorites
        try {
            const { TreeNodeProvider: legacyTreeNodeProvider } = await import('../treeprovider');
            const legacyProvider = new legacyTreeNodeProvider(this.environment!);
            return legacyProvider.getChildren(element) as Promise<TreeNode[]>;
        } catch (error) {
            console.error('Error handling favorites nodes:', error);
            return [];
        }
    }

    private async handleErrorNodes(element: TreeNode): Promise<TreeNode[]> {
        // Delegate to legacy provider for errors
        try {
            const { TreeNodeProvider: legacyTreeNodeProvider } = await import('../treeprovider');
            const legacyProvider = new legacyTreeNodeProvider(this.environment!);
            return legacyProvider.getChildren(element) as Promise<TreeNode[]>;
        } catch (error) {
            console.error('Error handling error nodes:', error);
            return [];
        }
    }

    private async handleFormNodes(element: TreeNode): Promise<TreeNode[]> {
        // Try to find forms helper
        try {
            const { generateFormBuildersTreeNodes } = await import('../TreeHelpers/FormBuilderTreeProviderHelper');
            return generateFormBuildersTreeNodes(element);
        } catch (error) {
            // Fallback to generic object generation
            const { generateObjectKeysInfoTreeNodes } = await import('../Helpers/treeProviderHelper');
            return generateObjectKeysInfoTreeNodes(element.data, element);
        }
    }

    private async handleIDENodes(element: TreeNode): Promise<TreeNode[]> {
        // Handle IDE nodes
        try {
            const { generateIDE } = await import('../Request/IDE/ideTreeProviderHelper');
            return generateIDE(element);
        } catch (error) {
            console.error('Error handling IDE nodes:', error);
            return [];
        }
    }

    private createErrorNode(error: any): TreeNode[] {
        const errorNode = new TreeNode(
            `Error: ${error.message || 'Unknown error'}`,
            vscode.TreeItemCollapsibleState.None,
            ElementTypes.error,
            error,
            null as any, // sharedoClient
            undefined, // parent
            undefined, // children
            undefined, // id
            'error' // icon
        );
        errorNode.tooltip = error.stack || error.toString();
        errorNode.iconPath = new vscode.ThemeIcon('error');
        return [errorNode];
    }

    getProviderStats(): any {
        return {
            registeredProviders: this.registry.getProviderCount(),
            registeredTypes: this.registry.getRegisteredTypes(),
            cacheStats: this.dataService.getCacheStats()
        };
    }
}
