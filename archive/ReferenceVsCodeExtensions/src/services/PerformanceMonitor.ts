/**
 * Performance Monitor Service
 * 
 * Tracks performance metrics and memory usage for HLD generation
 */

import { Inform } from '../Utilities/inform';
import * as vscode from 'vscode';

export interface IPerformanceMetrics {
    operationName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryBefore: number;
    memoryAfter?: number;
    memoryDelta?: number;
    success?: boolean;
    error?: string;
}

export interface IPerformanceStats {
    totalOperations: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
    p95Duration: number;
    p99Duration: number;
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, IPerformanceMetrics[]> = new Map();
    private activeOperations: Map<string, IPerformanceMetrics> = new Map();
    private memoryThreshold: number = 500 * 1024 * 1024; // 500MB
    private memoryWarningShown: boolean = false;
    
    private constructor() {
        // Start memory monitoring
        this.startMemoryMonitoring();
    }
    
    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    
    /**
     * Start tracking an operation
     */
    public startOperation(operationId: string, operationName: string): void {
        const metrics: IPerformanceMetrics = {
            operationName,
            startTime: Date.now(),
            memoryBefore: this.getMemoryUsage()
        };
        
        this.activeOperations.set(operationId, metrics);
        
        // Check memory before operation
        if (metrics.memoryBefore > this.memoryThreshold) {
            this.handleHighMemory(metrics.memoryBefore);
        }
    }
    
    /**
     * End tracking an operation
     */
    public endOperation(operationId: string, success: boolean = true, error?: string): void {
        const metrics = this.activeOperations.get(operationId);
        if (!metrics) {
            return;
        }
        
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.memoryAfter = this.getMemoryUsage();
        metrics.memoryDelta = metrics.memoryAfter - metrics.memoryBefore;
        metrics.success = success;
        metrics.error = error;
        
        // Store completed metrics
        const operationMetrics = this.metrics.get(metrics.operationName) || [];
        operationMetrics.push(metrics);
        this.metrics.set(metrics.operationName, operationMetrics);
        
        // Remove from active
        this.activeOperations.delete(operationId);
        
        // Log if operation was slow or used lots of memory
        if (metrics.duration > 30000) { // > 30 seconds
            Inform.writeInfo(`⚠️ Slow operation: ${metrics.operationName} took ${Math.round(metrics.duration / 1000)}s`);
        }
        
        if (metrics.memoryDelta > 100 * 1024 * 1024) { // > 100MB
            Inform.writeInfo(`⚠️ High memory usage: ${metrics.operationName} used ${Math.round(metrics.memoryDelta / 1024 / 1024)}MB`);
        }
        
        // Check memory after operation
        if (metrics.memoryAfter > this.memoryThreshold) {
            this.handleHighMemory(metrics.memoryAfter);
        }
    }
    
    /**
     * Get performance statistics for an operation
     */
    public getStats(operationName: string): IPerformanceStats | null {
        const operationMetrics = this.metrics.get(operationName);
        if (!operationMetrics || operationMetrics.length === 0) {
            return null;
        }
        
        const successMetrics = operationMetrics.filter(m => m.success);
        const failureMetrics = operationMetrics.filter(m => !m.success);
        
        const durations = successMetrics
            .map(m => m.duration || 0)
            .filter(d => d > 0)
            .sort((a, b) => a - b);
        
        const memoryUsages = successMetrics
            .map(m => m.memoryAfter || 0)
            .filter(m => m > 0);
        
        if (durations.length === 0) {
            return null;
        }
        
        return {
            totalOperations: operationMetrics.length,
            successCount: successMetrics.length,
            failureCount: failureMetrics.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            maxDuration: Math.max(...durations),
            minDuration: Math.min(...durations),
            averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
            maxMemoryUsage: Math.max(...memoryUsages),
            p95Duration: this.getPercentile(durations, 95),
            p99Duration: this.getPercentile(durations, 99)
        };
    }
    
    /**
     * Get all performance statistics
     */
    public getAllStats(): Map<string, IPerformanceStats> {
        const allStats = new Map<string, IPerformanceStats>();
        
        for (const [operationName] of this.metrics) {
            const stats = this.getStats(operationName);
            if (stats) {
                allStats.set(operationName, stats);
            }
        }
        
        return allStats;
    }
    
    /**
     * Clear all metrics
     */
    public clearMetrics(): void {
        this.metrics.clear();
        this.activeOperations.clear();
        this.memoryWarningShown = false;
    }
    
    /**
     * Export metrics as JSON
     */
    public exportMetrics(): string {
        const exportData = {
            timestamp: new Date().toISOString(),
            currentMemory: this.getMemoryUsage(),
            activeOperations: Array.from(this.activeOperations.entries()),
            statistics: Object.fromEntries(this.getAllStats()),
            rawMetrics: Object.fromEntries(this.metrics)
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Show performance report in output channel
     */
    public showReport(): void {
        Inform.writeInfo('');
        Inform.writeInfo('=== Performance Report ===');
        Inform.writeInfo(`Current Memory: ${Math.round(this.getMemoryUsage() / 1024 / 1024)}MB`);
        Inform.writeInfo(`Active Operations: ${this.activeOperations.size}`);
        Inform.writeInfo('');
        
        const allStats = this.getAllStats();
        for (const [operation, stats] of allStats) {
            Inform.writeInfo(`📊 ${operation}:`);
            Inform.writeInfo(`   Total: ${stats.totalOperations} (${stats.successCount} success, ${stats.failureCount} failed)`);
            Inform.writeInfo(`   Duration: avg ${Math.round(stats.averageDuration)}ms, max ${Math.round(stats.maxDuration)}ms`);
            Inform.writeInfo(`   P95: ${Math.round(stats.p95Duration)}ms, P99: ${Math.round(stats.p99Duration)}ms`);
            Inform.writeInfo(`   Memory: avg ${Math.round(stats.averageMemoryUsage / 1024 / 1024)}MB, max ${Math.round(stats.maxMemoryUsage / 1024 / 1024)}MB`);
            Inform.writeInfo('');
        }
        
        Inform.writeInfo('==========================');
    }
    
    /**
     * Get current memory usage
     */
    private getMemoryUsage(): number {
        return process.memoryUsage().heapUsed;
    }
    
    /**
     * Calculate percentile
     */
    private getPercentile(sortedArray: number[], percentile: number): number {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }
    
    /**
     * Handle high memory situation
     */
    private handleHighMemory(memoryUsage: number): void {
        const memoryMB = Math.round(memoryUsage / 1024 / 1024);
        
        if (!this.memoryWarningShown) {
            vscode.window.showWarningMessage(
                `High memory usage detected: ${memoryMB}MB. Consider clearing cache or restarting VS Code.`,
                'Clear Cache',
                'Show Report'
            ).then(choice => {
                if (choice === 'Clear Cache') {
                    vscode.commands.executeCommand('sharedo.hld.clearCache');
                } else if (choice === 'Show Report') {
                    this.showReport();
                }
            });
            
            this.memoryWarningShown = true;
        }
        
        Inform.writeInfo(`⚠️ High memory usage: ${memoryMB}MB`);
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            const newMemory = Math.round(this.getMemoryUsage() / 1024 / 1024);
            Inform.writeInfo(`   After GC: ${newMemory}MB`);
        }
    }
    
    /**
     * Start periodic memory monitoring
     */
    private startMemoryMonitoring(): void {
        setInterval(() => {
            const memory = this.getMemoryUsage();
            
            // Auto-clear cache if memory is critically high
            if (memory > 700 * 1024 * 1024) { // 700MB
                Inform.writeInfo('🚨 Critical memory usage - auto-clearing cache');
                vscode.commands.executeCommand('sharedo.hld.clearCache');
                
                // Reset warning flag after auto-clear
                this.memoryWarningShown = false;
            }
        }, 30000); // Check every 30 seconds
    }
}