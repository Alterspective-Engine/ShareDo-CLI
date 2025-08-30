/**
 * State Management System for ShareDo VS Code Extension
 * 
 * Provides centralized state management with persistence, subscriptions,
 * and change notifications following Redux-like patterns.
 */

import * as vscode from 'vscode';

export type StateListener<T = any> = (oldValue: T | undefined, newValue: T) => void;

export interface StateChange<T = any> {
    key: string;
    oldValue: T | undefined;
    newValue: T;
    timestamp: number;
}

export class StateManager {
    private state = new Map<string, any>();
    private subscribers = new Map<string, Set<StateListener>>();
    private history: StateChange[] = [];
    private readonly maxHistorySize = 100;
    
    constructor(private context: vscode.ExtensionContext) {
        this.loadPersistedState();
    }
    
    /**
     * Set a state value
     */
    setState<T>(key: string, value: T, persist: boolean = false): void {
        const oldValue = this.state.get(key);
        this.state.set(key, value);
        
        // Record change in history
        this.addToHistory({
            key,
            oldValue,
            newValue: value,
            timestamp: Date.now()
        });
        
        // Notify subscribers
        this.notifySubscribers(key, oldValue, value);
        
        // Persist if requested
        if (persist) {
            this.persistState(key, value);
        }
    }
    
    /**
     * Get a state value
     */
    getState<T>(key: string): T | undefined {
        return this.state.get(key);
    }
    
    /**
     * Get multiple state values
     */
    getStates<T extends Record<string, any>>(keys: string[]): Partial<T> {
        const result: Partial<T> = {};
        for (const key of keys) {
            const value = this.state.get(key);
            if (value !== undefined) {
                (result as any)[key] = value;
            }
        }
        return result;
    }
    
    /**
     * Update state with partial values
     */
    updateState<T>(key: string, updates: Partial<T>, persist: boolean = false): void {
        const current = this.getState<T>(key) || {} as T;
        const updated = { ...current, ...updates };
        this.setState(key, updated, persist);
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe<T>(key: string, listener: StateListener<T>): vscode.Disposable {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        this.subscribers.get(key)!.add(listener);
        
        return new vscode.Disposable(() => {
            const listeners = this.subscribers.get(key);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        });
    }
    
    /**
     * Subscribe to multiple state keys
     */
    subscribeMultiple(
        keys: string[],
        listener: (changes: Map<string, StateChange>) => void
    ): vscode.Disposable {
        const disposables: vscode.Disposable[] = [];
        const changes = new Map<string, StateChange>();
        
        for (const key of keys) {
            disposables.push(
                this.subscribe(key, (oldValue, newValue) => {
                    changes.set(key, { key, oldValue, newValue, timestamp: Date.now() });
                    listener(changes);
                    changes.clear();
                })
            );
        }
        
        return new vscode.Disposable(() => {
            disposables.forEach(d => d.dispose());
        });
    }
    
    /**
     * Clear a state value
     */
    clearState(key: string): void {
        const oldValue = this.state.get(key);
        this.state.delete(key);
        this.context.workspaceState.update(key, undefined);
        this.notifySubscribers(key, oldValue, undefined);
    }
    
    /**
     * Clear all state
     */
    clearAll(): void {
        const keys = Array.from(this.state.keys());
        for (const key of keys) {
            this.clearState(key);
        }
        this.history = [];
    }
    
    /**
     * Get state history
     */
    getHistory(key?: string): StateChange[] {
        if (key) {
            return this.history.filter(change => change.key === key);
        }
        return [...this.history];
    }
    
    /**
     * Export current state as JSON
     */
    exportState(): string {
        const exportData = {
            state: Object.fromEntries(this.state),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Import state from JSON
     */
    importState(json: string): void {
        try {
            const data = JSON.parse(json);
            if (data.state) {
                for (const [key, value] of Object.entries(data.state)) {
                    this.setState(key, value);
                }
            }
        } catch (error) {
            throw new Error(`Failed to import state: ${error}`);
        }
    }
    
    /**
     * Get all current state (for debugging)
     */
    getAllState(): Record<string, any> {
        return Object.fromEntries(this.state);
    }
    
    /**
     * Load persisted state from workspace storage
     */
    private loadPersistedState(): void {
        const keys = this.context.workspaceState.keys();
        for (const key of keys) {
            const value = this.context.workspaceState.get(key);
            if (value !== undefined) {
                this.state.set(key, value);
            }
        }
    }
    
    /**
     * Persist a state value to workspace storage
     */
    private persistState(key: string, value: any): void {
        this.context.workspaceState.update(key, value);
    }
    
    /**
     * Notify all subscribers of a state change
     */
    private notifySubscribers(key: string, oldValue: any, newValue: any): void {
        const listeners = this.subscribers.get(key);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(oldValue, newValue);
                } catch (error) {
                    console.error(`Error in state listener for key '${key}':`, error);
                }
            });
        }
    }
    
    /**
     * Add a change to history
     */
    private addToHistory(change: StateChange): void {
        this.history.push(change);
        
        // Trim history if it exceeds max size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
    }
}