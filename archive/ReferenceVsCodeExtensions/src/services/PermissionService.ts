/**
 * Permission Service - Manages ShareDo permissions for VS Code Extension
 * 
 * Handles work type permissions, role assignments, and access control.
 */

import * as vscode from 'vscode';
import { ConnectionManager } from '../core/ConnectionManager';
import { StateManager } from '../core/StateManager';

export interface Permission {
    id: string;
    name: string;
    type: 'create' | 'read' | 'update' | 'delete' | 'execute';
    scope: 'worktype' | 'workflow' | 'form' | 'global';
    target?: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export class PermissionService {
    private permissionCache = new Map<string, Permission[]>();
    private roleCache = new Map<string, Role>();
    
    constructor(
        private connectionManager: ConnectionManager,
        private stateManager: StateManager
    ) {}
    
    /**
     * Grant permission to derived work types
     */
    async grantPermissionToDerived(node: any): Promise<void> {
        try {
            const workTypeId = node?.data?.id;
            if (!workTypeId) {
                vscode.window.showErrorMessage('No work type selected');
                return;
            }
            
            // Get permission to grant
            const permission = await this.selectPermission('create');
            if (!permission) return;
            
            // Get derived work types
            const derived = await this.getDerivedWorkTypes(workTypeId);
            
            if (derived.length === 0) {
                vscode.window.showInformationMessage('No derived work types found');
                return;
            }
            
            // Confirm action
            const confirm = await vscode.window.showWarningMessage(
                `Grant ${permission.name} permission to ${derived.length} derived work types?`,
                { modal: true },
                'Grant',
                'Cancel'
            );
            
            if (confirm !== 'Grant') return;
            
            // Grant permissions with progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Granting permissions...',
                cancellable: true
            }, async (progress, token) => {
                for (let i = 0; i < derived.length; i++) {
                    if (token.isCancellationRequested) break;
                    
                    progress.report({
                        increment: (100 / derived.length),
                        message: `Processing ${derived[i].name}...`
                    });
                    
                    await this.grantPermission(derived[i].id, permission);
                }
            });
            
            vscode.window.showInformationMessage('Permissions granted successfully');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to grant permissions: ${error}`);
        }
    }
    
    /**
     * Remove permission from derived work types
     */
    async removePermissionFromDerived(node: any): Promise<void> {
        try {
            const workTypeId = node?.data?.id;
            if (!workTypeId) {
                vscode.window.showErrorMessage('No work type selected');
                return;
            }
            
            // Get permission to remove
            const permission = await this.selectPermission('create');
            if (!permission) return;
            
            // Get derived work types
            const derived = await this.getDerivedWorkTypes(workTypeId);
            
            if (derived.length === 0) {
                vscode.window.showInformationMessage('No derived work types found');
                return;
            }
            
            // Confirm action
            const confirm = await vscode.window.showWarningMessage(
                `Remove ${permission.name} permission from ${derived.length} derived work types?`,
                { modal: true, detail: 'This action cannot be undone.' },
                'Remove',
                'Cancel'
            );
            
            if (confirm !== 'Remove') return;
            
            // Remove permissions with progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Removing permissions...',
                cancellable: true
            }, async (progress, token) => {
                for (let i = 0; i < derived.length; i++) {
                    if (token.isCancellationRequested) break;
                    
                    progress.report({
                        increment: (100 / derived.length),
                        message: `Processing ${derived[i].name}...`
                    });
                    
                    await this.removePermission(derived[i].id, permission);
                }
            });
            
            vscode.window.showInformationMessage('Permissions removed successfully');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove permissions: ${error}`);
        }
    }
    
    /**
     * Copy permissions between work types
     */
    async copyPermissions(sourceId: string, targetIds: string[]): Promise<void> {
        try {
            // Get source permissions
            const sourcePermissions = await this.getPermissions(sourceId);
            
            if (sourcePermissions.length === 0) {
                vscode.window.showInformationMessage('Source has no permissions to copy');
                return;
            }
            
            // Copy to targets with progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Copying permissions...',
                cancellable: true
            }, async (progress, token) => {
                for (let i = 0; i < targetIds.length; i++) {
                    if (token.isCancellationRequested) break;
                    
                    progress.report({
                        increment: (100 / targetIds.length),
                        message: `Copying to target ${i + 1}/${targetIds.length}...`
                    });
                    
                    for (const permission of sourcePermissions) {
                        await this.grantPermission(targetIds[i], permission);
                    }
                }
            });
            
            vscode.window.showInformationMessage('Permissions copied successfully');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy permissions: ${error}`);
        }
    }
    
    /**
     * Check if user has permission
     */
    async hasPermission(target: string, permission: string): Promise<boolean> {
        try {
            const permissions = await this.getPermissions(target);
            return permissions.some(p => p.name === permission);
        } catch {
            return false;
        }
    }
    
    /**
     * Get permissions for a target
     */
    private async getPermissions(targetId: string): Promise<Permission[]> {
        // Check cache
        if (this.permissionCache.has(targetId)) {
            return this.permissionCache.get(targetId)!;
        }
        
        // TODO: Fetch from API
        // For now, return mock data
        const permissions: Permission[] = [
            {
                id: '1',
                name: 'Create',
                type: 'create',
                scope: 'worktype',
                target: targetId
            }
        ];
        
        this.permissionCache.set(targetId, permissions);
        return permissions;
    }
    
    /**
     * Grant a permission
     */
    private async grantPermission(targetId: string, permission: Permission): Promise<void> {
        // TODO: Make API call to grant permission
        // For now, just update cache
        const permissions = await this.getPermissions(targetId);
        if (!permissions.find(p => p.id === permission.id)) {
            permissions.push(permission);
            this.permissionCache.set(targetId, permissions);
        }
    }
    
    /**
     * Remove a permission
     */
    private async removePermission(targetId: string, permission: Permission): Promise<void> {
        // TODO: Make API call to remove permission
        // For now, just update cache
        const permissions = await this.getPermissions(targetId);
        const index = permissions.findIndex(p => p.id === permission.id);
        if (index >= 0) {
            permissions.splice(index, 1);
            this.permissionCache.set(targetId, permissions);
        }
    }
    
    /**
     * Get derived work types
     */
    private async getDerivedWorkTypes(parentId: string): Promise<Array<{ id: string; name: string }>> {
        // TODO: Fetch from API
        // For now, return mock data
        return [
            { id: 'derived1', name: 'Derived Work Type 1' },
            { id: 'derived2', name: 'Derived Work Type 2' }
        ];
    }
    
    /**
     * Select a permission type
     */
    private async selectPermission(defaultType?: string): Promise<Permission | undefined> {
        const permissions: Permission[] = [
            {
                id: 'create',
                name: 'Create',
                type: 'create',
                scope: 'worktype'
            },
            {
                id: 'read',
                name: 'Read',
                type: 'read',
                scope: 'worktype'
            },
            {
                id: 'update',
                name: 'Update',
                type: 'update',
                scope: 'worktype'
            },
            {
                id: 'delete',
                name: 'Delete',
                type: 'delete',
                scope: 'worktype'
            }
        ];
        
        const selected = await vscode.window.showQuickPick(
            permissions.map(p => ({
                label: p.name,
                description: `${p.type} permission`,
                permission: p
            })),
            {
                placeHolder: 'Select permission to grant'
            }
        );
        
        return selected?.permission;
    }
    
    /**
     * Clear permission cache
     */
    clearCache(): void {
        this.permissionCache.clear();
        this.roleCache.clear();
    }
}