import { SharedoClient } from '../sharedoClient';
import { TreeNode } from '../treeprovider';
import { Settings } from '../settings';
import * as vscode from 'vscode';

export async function addAsFavorite(node: TreeNode, settings: Settings): Promise<void> {
    try {
        if (!node || !node.sharedoClient) {
            throw new Error('Invalid node or missing SharedoClient');
        }

        if (!node.entityId) {
            throw new Error('Node must have an entityId to be added to favorites');
        }

        const server: SharedoClient = node.sharedoClient;
        server.addFavorite(node);
        
        // Save settings to persist favorites
        await settings.save();
        
        // Refresh the tree view to show the new favorite
        refreshTreeView();
        
        console.log(`Added "${node.label}" to favorites`);
        vscode.window.showInformationMessage(`Added "${node.label}" to favorites`);
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
}

export async function removeAsFavorite(node: TreeNode, settings: Settings): Promise<void> {
    try {
        if (!node || !node.sharedoClient) {
            throw new Error('Invalid node or missing SharedoClient');
        }

        if (!node.entityId) {
            throw new Error('Node must have an entityId to be removed from favorites');
        }

        const server: SharedoClient = node.sharedoClient;
        server.removeFavorite(node);
        
        // Save settings to persist favorites
        await settings.save();
        
        // Refresh the tree view to reflect the removal
        refreshTreeView();
        
        console.log(`Removed "${node.label}" from favorites`);
        vscode.window.showInformationMessage(`Removed "${node.label}" from favorites`);
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
}

export function isFavorite(node: TreeNode): boolean {
    if (!node || !node.sharedoClient || !node.entityId) {
        return false;
    }

    return node.sharedoClient.favorites.some(fav => fav.entityId === node.entityId);
}

/**
 * Refreshes the tree view to reflect changes in favorites
 */
function refreshTreeView(): void {
    try {
        // Use the global tree provider if available
        if ((globalThis as any).treeDataProvider && typeof (globalThis as any).treeDataProvider.refresh === 'function') {
            (globalThis as any).treeDataProvider.refresh();
        }
    } catch (error) {
        console.error('Error refreshing tree view:', error);
    }
}
