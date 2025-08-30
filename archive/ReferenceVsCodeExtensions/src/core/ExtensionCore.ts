/**
 * Extension Core - Central orchestrator for ShareDo VS Code Extension
 * 
 * Manages extension lifecycle, coordinates services, and provides
 * a clean separation of concerns from the extension entry point.
 */

import * as vscode from 'vscode';
import { DependencyContainer } from './DependencyContainer';
import { StateManager } from './StateManager';
import { EventBus } from './EventBus';
import { CommandRegistry } from './CommandRegistry';
import { TreeDataProvider } from '../providers/TreeDataProvider';

export class ExtensionCore {
    private static instance: ExtensionCore;
    private container: DependencyContainer;
    private treeView?: vscode.TreeView<any>;
    private disposables: vscode.Disposable[] = [];
    private isActivated = false;
    
    constructor(container: DependencyContainer) {
        this.container = container;
        ExtensionCore.instance = this;
    }
    
    /**
     * Activate the extension
     */
    async activate(): Promise<any> {
        if (this.isActivated) {
            return;
        }
        
        try {
            // Show activation progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: 'Activating ShareDo Extension...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 10, message: 'Initializing services...' });
                await this.initializeServices();
                
                progress.report({ increment: 30, message: 'Registering commands...' });
                await this.registerCommands();
                
                progress.report({ increment: 30, message: 'Setting up tree view...' });
                await this.setupTreeView();
                
                progress.report({ increment: 20, message: 'Loading configuration...' });
                await this.loadConfiguration();
                
                progress.report({ increment: 10, message: 'Ready!' });
            });
            
            this.isActivated = true;
            
            // Emit activation event
            const eventBus = this.container.get<EventBus>('EventBus');
            eventBus.emit('extension.activated');
            
            // Show welcome message if first time
            const stateManager = this.container.get<StateManager>('StateManager');
            const hasShownWelcome = stateManager.getState<boolean>('hasShownWelcome');
            
            if (!hasShownWelcome) {
                this.showWelcomeMessage();
                stateManager.setState('hasShownWelcome', true, true);
            }
            
            return {
                container: this.container,
                treeDataProvider: this.container.get('TreeDataProvider')
            };
            
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to activate ShareDo extension: ${error}`
            );
            throw error;
        }
    }
    
    /**
     * Deactivate the extension
     */
    static async deactivate(): Promise<void> {
        if (ExtensionCore.instance) {
            await ExtensionCore.instance.cleanup();
        }
    }
    
    /**
     * Initialize core services
     */
    private async initializeServices(): Promise<void> {
        // Services are registered in DependencyContainer constructor
        // Here we can perform any async initialization if needed
        
        // Initialize connection manager
        const connectionManager = this.container.get('ConnectionManager') as any;
        await connectionManager.initialize();
        
        // Initialize status bar
        const statusBar = this.container.get('StatusBarService') as any;
        statusBar.show();
    }
    
    /**
     * Register all commands
     */
    private async registerCommands(): Promise<void> {
        const CommandRegistryClass = CommandRegistry as any;
        const commandRegistry = new CommandRegistryClass(this.container);
        const disposables = await commandRegistry.registerAll();
        this.disposables.push(...disposables);
    }
    
    /**
     * Setup tree view
     */
    private async setupTreeView(): Promise<void> {
        const treeDataProvider = new TreeDataProvider(this.container);
        this.container.registerSingleton('TreeDataProvider', () => treeDataProvider);
        
        this.treeView = vscode.window.createTreeView('SharedoServers', {
            treeDataProvider,
            showCollapseAll: true,
            canSelectMany: false
        });
        
        this.disposables.push(this.treeView);
        
        // Set up tree view event handlers
        const eventBus = this.container.get<EventBus>('EventBus');
        
        eventBus.on('tree.refresh', () => {
            treeDataProvider.refresh();
        });
        
        eventBus.on('tree.refreshNode', (node: any) => {
            treeDataProvider.refreshNode(node);
        });
    }
    
    /**
     * Load configuration
     */
    private async loadConfiguration(): Promise<void> {
        const stateManager = this.container.get<StateManager>('StateManager');
        
        // Load workspace configuration
        const config = vscode.workspace.getConfiguration('sharedo');
        
        // Store configuration in state
        stateManager.setState('config', {
            useNewTreeProvider: config.get('useNewTreeProvider', false),
            autoConnect: config.get('autoConnect', true),
            showStatusBar: config.get('showStatusBar', true),
            debugMode: config.get('debugMode', false)
        });
        
        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('sharedo')) {
                    this.reloadConfiguration();
                }
            })
        );
    }
    
    /**
     * Reload configuration
     */
    private reloadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('sharedo');
        const stateManager = this.container.get<StateManager>('StateManager');
        const eventBus = this.container.get<EventBus>('EventBus');
        
        stateManager.updateState('config', {
            useNewTreeProvider: config.get('useNewTreeProvider', false),
            autoConnect: config.get('autoConnect', true),
            showStatusBar: config.get('showStatusBar', true),
            debugMode: config.get('debugMode', false)
        });
        
        eventBus.emit('config.changed', config);
    }
    
    /**
     * Show welcome message
     */
    private showWelcomeMessage(): void {
        vscode.window.showInformationMessage(
            'Welcome to ShareDo VS Code Extension! Get started by adding a ShareDo server.',
            'Add Server',
            'View Documentation',
            'Dismiss'
        ).then(selection => {
            switch (selection) {
                case 'Add Server':
                    vscode.commands.executeCommand('sharedo.setupWizard');
                    break;
                case 'View Documentation':
                    vscode.env.openExternal(
                        vscode.Uri.parse('https://github.com/Alter-Igor/sharedo-vscode-extension')
                    );
                    break;
            }
        });
    }
    
    /**
     * Cleanup resources
     */
    private async cleanup(): Promise<void> {
        const eventBus = this.container.get<EventBus>('EventBus');
        
        // Emit deactivation event
        eventBus.emit('extension.deactivating');
        
        // Dispose all disposables
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        
        // Dispose tree view
        if (this.treeView) {
            this.treeView.dispose();
        }
        
        // Dispose container (will dispose all services)
        this.container.dispose();
        
        this.isActivated = false;
    }
}