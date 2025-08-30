/**
 * Dependency Injection Container for ShareDo VS Code Extension
 * 
 * Provides centralized service registration and resolution using IoC pattern.
 * Supports singleton services, lazy loading, and hierarchical containers.
 */

import * as vscode from 'vscode';
import { StateManager } from './StateManager';
import { EventBus } from './EventBus';
import { ConnectionManager } from './ConnectionManager';
import { ServerRegistrationService } from '../services/ServerRegistrationService';
import { TreeDataService } from '../services/TreeDataService';
import { FileWatcherService } from '../services/FileWatcherService';
import { PermissionService } from '../services/PermissionService';
import { NotificationService } from '../services/NotificationService';
import { ErrorHandlerService } from '../services/ErrorHandlerService';
import { StatusBarService } from '../services/StatusBarService';

export interface ServiceDescriptor {
    factory: (container: DependencyContainer) => any;
    singleton: boolean;
    instance?: any;
}

export class DependencyContainer {
    private services = new Map<string, ServiceDescriptor>();
    private parent?: DependencyContainer;
    
    constructor(
        private context: vscode.ExtensionContext,
        parent?: DependencyContainer
    ) {
        this.parent = parent;
        this.registerCoreServices();
    }
    
    /**
     * Register core services that are always needed
     */
    private registerCoreServices(): void {
        // Core infrastructure services
        this.registerSingleton('ExtensionContext', () => this.context);
        this.registerSingleton('StateManager', (c) => new StateManager(c.get('ExtensionContext')));
        this.registerSingleton('EventBus', () => new EventBus());
        
        // Connection and authentication
        this.registerSingleton('ConnectionManager', (c) => 
            new ConnectionManager(c.get('StateManager'), c.get('EventBus')));
        
        // UI Services
        this.registerSingleton('NotificationService', () => new NotificationService());
        this.registerSingleton('ErrorHandler', (c) => 
            new ErrorHandlerService(c.get('NotificationService'), c.get('EventBus')));
        this.registerSingleton('StatusBarService', (c) => 
            new StatusBarService(c.get('EventBus')));
        
        // Business services - lazy loaded
        this.registerLazy('ServerRegistration', (c) => 
            new ServerRegistrationService(
                c.get('ConnectionManager'),
                c.get('StateManager'),
                c.get('NotificationService')
            ));
        
        this.registerLazy('TreeDataService', (c) => 
            new TreeDataService(
                c.get('ConnectionManager'),
                c.get('StateManager'),
                c.get('EventBus')
            ));
        
        this.registerLazy('FileWatcher', (c) => 
            new FileWatcherService(c.get('EventBus')));
        
        this.registerLazy('PermissionService', (c) => 
            new PermissionService(
                c.get('ConnectionManager'),
                c.get('StateManager')
            ));
    }
    
    /**
     * Register a singleton service
     */
    registerSingleton<T>(
        key: string, 
        factory: (container: DependencyContainer) => T
    ): void {
        this.services.set(key, {
            factory,
            singleton: true
        });
    }
    
    /**
     * Register a transient service (new instance each time)
     */
    registerTransient<T>(
        key: string,
        factory: (container: DependencyContainer) => T
    ): void {
        this.services.set(key, {
            factory,
            singleton: false
        });
    }
    
    /**
     * Register a lazy-loaded singleton service
     */
    registerLazy<T>(
        key: string,
        factory: (container: DependencyContainer) => T
    ): void {
        this.registerSingleton(key, factory);
    }
    
    /**
     * Get a service instance
     */
    get<T>(key: string): T {
        const descriptor = this.services.get(key);
        
        if (!descriptor) {
            // Try parent container
            if (this.parent) {
                return this.parent.get<T>(key);
            }
            throw new Error(`Service '${key}' not registered in container`);
        }
        
        if (descriptor.singleton) {
            if (!descriptor.instance) {
                descriptor.instance = descriptor.factory(this);
            }
            return descriptor.instance;
        }
        
        return descriptor.factory(this);
    }
    
    /**
     * Check if a service is registered
     */
    has(key: string): boolean {
        return this.services.has(key) || (this.parent?.has(key) ?? false);
    }
    
    /**
     * Create a child container
     */
    createChildContainer(): DependencyContainer {
        return new DependencyContainer(this.context, this);
    }
    
    /**
     * Dispose all singleton instances
     */
    dispose(): void {
        for (const descriptor of this.services.values()) {
            if (descriptor.instance && typeof descriptor.instance.dispose === 'function') {
                descriptor.instance.dispose();
            }
        }
        this.services.clear();
    }
}