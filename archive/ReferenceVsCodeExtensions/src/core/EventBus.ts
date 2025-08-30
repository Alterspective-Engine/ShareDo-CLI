/**
 * Event Bus for ShareDo VS Code Extension
 * 
 * Provides a centralized event system for decoupled communication
 * between components using publish-subscribe pattern.
 */

import * as vscode from 'vscode';

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface EventSubscription {
    event: string;
    handler: EventHandler;
    once: boolean;
}

export interface EventMetrics {
    event: string;
    count: number;
    lastEmitted: number;
    averageHandlerTime: number;
}

export class EventBus {
    private events = new Map<string, Set<EventSubscription>>();
    private eventMetrics = new Map<string, EventMetrics>();
    private wildcardHandlers = new Set<EventHandler<{ event: string; data: any }>>();
    private asyncQueue: Array<{ event: string; data: any }> = [];
    private processing = false;
    
    /**
     * Emit an event synchronously
     */
    emit<T = any>(event: string, data?: T): void {
        this.updateMetrics(event);
        
        // Notify specific event handlers
        const subscriptions = this.events.get(event);
        if (subscriptions) {
            const toRemove: EventSubscription[] = [];
            
            subscriptions.forEach(subscription => {
                try {
                    const startTime = Date.now();
                    subscription.handler(data);
                    this.updateHandlerMetrics(event, Date.now() - startTime);
                    
                    if (subscription.once) {
                        toRemove.push(subscription);
                    }
                } catch (error) {
                    console.error(`Error in event handler for '${event}':`, error);
                }
            });
            
            // Remove one-time handlers
            toRemove.forEach(sub => subscriptions.delete(sub));
        }
        
        // Notify wildcard handlers
        this.wildcardHandlers.forEach(handler => {
            try {
                handler({ event, data });
            } catch (error) {
                console.error(`Error in wildcard handler for '${event}':`, error);
            }
        });
    }
    
    /**
     * Emit an event asynchronously
     */
    async emitAsync<T = any>(event: string, data?: T): Promise<void> {
        this.asyncQueue.push({ event, data });
        
        if (!this.processing) {
            await this.processAsyncQueue();
        }
    }
    
    /**
     * Subscribe to an event
     */
    on<T = any>(event: string, handler: EventHandler<T>): vscode.Disposable {
        return this.subscribe(event, handler, false);
    }
    
    /**
     * Subscribe to an event once
     */
    once<T = any>(event: string, handler: EventHandler<T>): vscode.Disposable {
        return this.subscribe(event, handler, true);
    }
    
    /**
     * Subscribe to all events
     */
    onAny(handler: EventHandler<{ event: string; data: any }>): vscode.Disposable {
        this.wildcardHandlers.add(handler);
        
        return new vscode.Disposable(() => {
            this.wildcardHandlers.delete(handler);
        });
    }
    
    /**
     * Remove all handlers for an event
     */
    off(event: string): void {
        this.events.delete(event);
    }
    
    /**
     * Remove a specific handler
     */
    removeHandler<T = any>(event: string, handler: EventHandler<T>): void {
        const subscriptions = this.events.get(event);
        if (subscriptions) {
            const toRemove = Array.from(subscriptions).find(sub => sub.handler === handler);
            if (toRemove) {
                subscriptions.delete(toRemove);
            }
        }
    }
    
    /**
     * Wait for an event to be emitted
     */
    waitFor<T = any>(event: string, timeout?: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = timeout ? setTimeout(() => {
                this.removeHandler(event, handler);
                reject(new Error(`Timeout waiting for event '${event}'`));
            }, timeout) : undefined;
            
            const handler = (data: T) => {
                if (timer) clearTimeout(timer);
                resolve(data);
            };
            
            this.once(event, handler);
        });
    }
    
    /**
     * Create a typed event emitter for a specific event
     */
    createEmitter<T>(): {
        emit: (data: T) => void;
        on: (handler: EventHandler<T>) => vscode.Disposable;
        once: (handler: EventHandler<T>) => vscode.Disposable;
    } {
        const eventName = `typed-${Date.now()}-${Math.random()}`;
        
        return {
            emit: (data: T) => this.emit(eventName, data),
            on: (handler: EventHandler<T>) => this.on(eventName, handler),
            once: (handler: EventHandler<T>) => this.once(eventName, handler)
        };
    }
    
    /**
     * Get event metrics
     */
    getMetrics(event?: string): EventMetrics[] {
        if (event) {
            const metrics = this.eventMetrics.get(event);
            return metrics ? [metrics] : [];
        }
        return Array.from(this.eventMetrics.values());
    }
    
    /**
     * Clear all event handlers
     */
    clear(): void {
        this.events.clear();
        this.wildcardHandlers.clear();
        this.asyncQueue = [];
        this.eventMetrics.clear();
    }
    
    /**
     * Get list of all registered events
     */
    getEvents(): string[] {
        return Array.from(this.events.keys());
    }
    
    /**
     * Get handler count for an event
     */
    getHandlerCount(event: string): number {
        const subscriptions = this.events.get(event);
        return subscriptions ? subscriptions.size : 0;
    }
    
    /**
     * Subscribe to an event (internal)
     */
    private subscribe<T = any>(
        event: string,
        handler: EventHandler<T>,
        once: boolean
    ): vscode.Disposable {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        const subscription: EventSubscription = { event, handler, once };
        this.events.get(event)!.add(subscription);
        
        return new vscode.Disposable(() => {
            const subscriptions = this.events.get(event);
            if (subscriptions) {
                subscriptions.delete(subscription);
                if (subscriptions.size === 0) {
                    this.events.delete(event);
                }
            }
        });
    }
    
    /**
     * Process async event queue
     */
    private async processAsyncQueue(): Promise<void> {
        this.processing = true;
        
        while (this.asyncQueue.length > 0) {
            const { event, data } = this.asyncQueue.shift()!;
            
            const subscriptions = this.events.get(event);
            if (subscriptions) {
                const promises: Promise<void>[] = [];
                
                subscriptions.forEach(subscription => {
                    const promise = Promise.resolve(subscription.handler(data)).catch(error => {
                        console.error(`Error in async event handler for '${event}':`, error);
                    });
                    promises.push(promise);
                });
                
                await Promise.all(promises);
            }
        }
        
        this.processing = false;
    }
    
    /**
     * Update event metrics
     */
    private updateMetrics(event: string): void {
        const metrics = this.eventMetrics.get(event) || {
            event,
            count: 0,
            lastEmitted: 0,
            averageHandlerTime: 0
        };
        
        metrics.count++;
        metrics.lastEmitted = Date.now();
        
        this.eventMetrics.set(event, metrics);
    }
    
    /**
     * Update handler execution metrics
     */
    private updateHandlerMetrics(event: string, executionTime: number): void {
        const metrics = this.eventMetrics.get(event);
        if (metrics) {
            // Calculate running average
            metrics.averageHandlerTime = 
                (metrics.averageHandlerTime * (metrics.count - 1) + executionTime) / metrics.count;
        }
    }
}