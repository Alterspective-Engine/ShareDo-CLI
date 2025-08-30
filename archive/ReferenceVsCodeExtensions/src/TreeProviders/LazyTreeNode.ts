import * as vscode from 'vscode';
import { TreeNode } from '../treeprovider';
import { ILazyTreeNode } from './interfaces/ITreeProvider';

export class LazyTreeNode extends TreeNode implements ILazyTreeNode {
    private _children?: TreeNode[];
    private _isLoaded = false;
    private _loadingPromise?: Promise<TreeNode[]>;

    constructor(
        label: string,
        private childrenLoader: () => Promise<TreeNode[]>,
        collapsibleState?: vscode.TreeItemCollapsibleState,
        type?: any,
        data?: any,
        sharedoClient?: any,
        parent?: TreeNode,
        children?: TreeNode[],
        id?: string,
        iconPath?: any,
        contextValue?: any
    ) {
        super(
            label, 
            collapsibleState || vscode.TreeItemCollapsibleState.Collapsed,
            type,
            data,
            sharedoClient,
            parent,
            children,
            id,
            iconPath,
            contextValue
        );
    }

    get isLoaded(): boolean {
        return this._isLoaded;
    }

    get loadingPromise(): Promise<TreeNode[]> | undefined {
        return this._loadingPromise;
    }

    async loadChildren(): Promise<TreeNode[]> {
        if (this._isLoaded && this._children) {
            return this._children;
        }

        if (this._loadingPromise) {
            return this._loadingPromise;
        }

        this._loadingPromise = this.doLoadChildren();
        
        try {
            this._children = await this._loadingPromise;
            this._isLoaded = true;
            return this._children;
        } finally {
            this._loadingPromise = undefined;
        }
    }

    private async doLoadChildren(): Promise<TreeNode[]> {
        try {
            const children = await this.childrenLoader();
            
            // Convert regular TreeNodes to LazyTreeNodes if they have children
            return children.map(child => {
                if (child.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed ||
                    child.collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
                    return new LazyTreeNode(
                        child.label as string,
                        () => this.getChildrenForNode(child),
                        child.collapsibleState,
                        child.type,
                        child.data,
                        child.sharedoClient,
                        child,
                        undefined, // children
                        child.id,
                        child.iconPath,
                        child.contextValue
                    );
                }
                return child;
            });
        } catch (error) {
            console.error(`Failed to load children for ${this.label}:`, error);
            return [];
        }
    }

    private async getChildrenForNode(node: TreeNode): Promise<TreeNode[]> {
        // This would delegate back to the tree provider
        // For now, return empty array - this would need to be integrated with the provider system
        return [];
    }

    invalidate(): void {
        this._isLoaded = false;
        this._children = undefined;
        this._loadingPromise = undefined;
    }

    getChildren(): TreeNode[] | undefined {
        return this._children;
    }
}
