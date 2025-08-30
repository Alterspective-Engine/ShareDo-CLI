/**
 * Advanced Error Handling and Monitoring System
 * 
 * This module provides comprehensive error handling, monitoring, and debugging
 * capabilities for the ShareDo VS Code extension.
 * 
 * @responsibilities
 * - Centralized error handling with categorization
 * - Error tracking and analytics
 * - User-friendly error reporting
 * - Debug information collection
 * - Performance monitoring and alerts
 * 
 * @author ShareDo Team
 * @version 0.8.2
 */

import * as vscode from 'vscode';

export enum ErrorSeverity {
    low = 'low',
    medium = 'medium',
    high = 'high',
    critical = 'critical'
}

export enum ErrorCategory {
    network = 'network',
    authentication = 'authentication',
    validation = 'validation',
    configuration = 'configuration',
    permission = 'permission',
    performance = 'performance',
    unknown = 'unknown'
}

interface ErrorReport {
    id: string;
    timestamp: Date;
    severity: ErrorSeverity;
    category: ErrorCategory;
    message: string;
    stack?: string;
    context: any;
    userAction?: string;
    resolved: boolean;
    occurrenceCount: number;
}

interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: Date;
    success: boolean;
    metadata?: any;
}

/**
 * Advanced error handling and monitoring manager
 */
export class ErrorMonitor {
    private errors: Map<string, ErrorReport> = new Map();
    private performanceMetrics: PerformanceMetric[] = [];
    private maxErrors = 1000;
    private maxMetrics = 5000;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('ShareDo Debug');
    }

    /**
     * Handle and categorize an error
     * 
     * @param error - Error object or message
     * @param context - Additional context information
     * @param userAction - What the user was trying to do
     * @param severity - Error severity level
     * @returns Error report ID
     */
    handleError(
        error: Error | string,
        context: any = {},
        userAction?: string,
        severity: ErrorSeverity = ErrorSeverity.medium
    ): string {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorStack = typeof error === 'object' ? error.stack : undefined;
        
        // Generate error signature for deduplication
        const signature = this.generateErrorSignature(errorMessage, errorStack);
        
        // Check if this error already exists
        const existing = this.errors.get(signature);
        if (existing) {
            existing.occurrenceCount++;
            existing.timestamp = new Date();
            this.logError(existing);
            return existing.id;
        }

        // Create new error report
        const report: ErrorReport = {
            id: this.generateErrorId(),
            timestamp: new Date(),
            severity,
            category: this.categorizeError(errorMessage, context),
            message: errorMessage,
            stack: errorStack,
            context,
            userAction,
            resolved: false,
            occurrenceCount: 1
        };

        this.errors.set(signature, report);
        this.logError(report);
        this.cleanupOldErrors();

        // Show user notification based on severity
        this.notifyUser(report);

        return report.id;
    }

    /**
     * Track performance metrics
     * 
     * @param operation - Operation name
     * @param startTime - Operation start time
     * @param success - Whether operation succeeded
     * @param metadata - Additional metadata
     */
    trackPerformance(
        operation: string,
        startTime: number,
        success: boolean = true,
        metadata?: any
    ): void {
        const metric: PerformanceMetric = {
            operation,
            duration: Date.now() - startTime,
            timestamp: new Date(),
            success,
            metadata
        };

        this.performanceMetrics.push(metric);
        this.cleanupOldMetrics();

        // Log slow operations
        if (metric.duration > 5000) { // 5 seconds
            this.handleError(
                `Slow operation detected: ${operation} took ${metric.duration}ms`,
                { metric },
                undefined,
                ErrorSeverity.low
            );
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByCategory: Record<ErrorCategory, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        recentErrors: ErrorReport[];
    } {
        const errors = Array.from(this.errors.values());
        
        const errorsByCategory = Object.values(ErrorCategory).reduce((acc, category) => {
            acc[category] = errors.filter(e => e.category === category).length;
            return acc;
        }, {} as Record<ErrorCategory, number>);

        const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
            acc[severity] = errors.filter(e => e.severity === severity).length;
            return acc;
        }, {} as Record<ErrorSeverity, number>);

        const recentErrors = errors
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);

        return {
            totalErrors: errors.length,
            errorsByCategory,
            errorsBySeverity,
            recentErrors
        };
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        averageResponseTime: number;
        slowestOperations: PerformanceMetric[];
        operationStats: Record<string, { avg: number; count: number; successRate: number }>;
    } {
        if (this.performanceMetrics.length === 0) {
            return {
                averageResponseTime: 0,
                slowestOperations: [],
                operationStats: {}
            };
        }

        const avgResponseTime = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length;
        
        const slowestOperations = [...this.performanceMetrics]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);

        // Group by operation
        const operationGroups = this.performanceMetrics.reduce((acc, metric) => {
            if (!acc[metric.operation]) {
                acc[metric.operation] = [];
            }
            acc[metric.operation].push(metric);
            return acc;
        }, {} as Record<string, PerformanceMetric[]>);

        const operationStats = Object.entries(operationGroups).reduce((acc, [operation, metrics]) => {
            const avg = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
            const successCount = metrics.filter(m => m.success).length;
            const successRate = successCount / metrics.length;

            acc[operation] = {
                avg: Math.round(avg),
                count: metrics.length,
                successRate: Math.round(successRate * 100) / 100
            };
            return acc;
        }, {} as Record<string, { avg: number; count: number; successRate: number }>);

        return {
            averageResponseTime: Math.round(avgResponseTime),
            slowestOperations,
            operationStats
        };
    }

    /**
     * Export debug information
     */
    async exportDebugInfo(): Promise<void> {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            errors: this.getErrorStats(),
            performance: this.getPerformanceStats(),
            systemInfo: {
                vscodeVersion: vscode.version,
                platform: process.platform,
                nodeVersion: process.version
            },
            extensionInfo: {
                // Add extension-specific info
            }
        };

        const document = await vscode.workspace.openTextDocument({
            content: JSON.stringify(debugInfo, null, 2),
            language: 'json'
        });

        await vscode.window.showTextDocument(document);
    }

    /**
     * Mark an error as resolved
     */
    resolveError(errorId: string): boolean {
        for (const report of this.errors.values()) {
            if (report.id === errorId) {
                report.resolved = true;
                return true;
            }
        }
        return false;
    }

    /**
     * Categorize error based on message and context
     */
    private categorizeError(message: string, context: any): ErrorCategory {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
            return ErrorCategory.network;
        }
        if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
            return ErrorCategory.authentication;
        }
        if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
            return ErrorCategory.validation;
        }
        if (lowerMessage.includes('config') || lowerMessage.includes('setting')) {
            return ErrorCategory.configuration;
        }
        if (lowerMessage.includes('permission') || lowerMessage.includes('access denied')) {
            return ErrorCategory.permission;
        }
        if (lowerMessage.includes('slow') || lowerMessage.includes('timeout') || lowerMessage.includes('performance')) {
            return ErrorCategory.performance;
        }

        return ErrorCategory.unknown;
    }

    /**
     * Generate error signature for deduplication
     */
    private generateErrorSignature(message: string, stack?: string): string {
        // Use first few lines of stack trace for signature
        const stackLines = stack ? stack.split('\n').slice(0, 3).join('\n') : '';
        return `${message}:${stackLines}`.replace(/\s+/g, ' ').trim();
    }

    /**
     * Generate unique error ID
     */
    private generateErrorId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Log error to output channel
     */
    private logError(report: ErrorReport): void {
        const timestamp = report.timestamp.toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${report.severity.toUpperCase()}] [${report.category}] ${report.message}`);
        
        if (report.stack) {
            this.outputChannel.appendLine(`Stack: ${report.stack}`);
        }
        
        if (report.context && Object.keys(report.context).length > 0) {
            this.outputChannel.appendLine(`Context: ${JSON.stringify(report.context, null, 2)}`);
        }
        
        this.outputChannel.appendLine('---');
    }

    /**
     * Notify user based on error severity
     */
    private notifyUser(report: ErrorReport): void {
        const message = `${report.message} (Error ID: ${report.id})`;

        switch (report.severity) {
            case ErrorSeverity.critical:
                vscode.window.showErrorMessage(message, 'Show Details', 'Export Debug Info')
                    .then(choice => {
                        if (choice === 'Show Details') {
                            this.outputChannel.show();
                        } else if (choice === 'Export Debug Info') {
                            this.exportDebugInfo();
                        }
                    });
                break;
            case ErrorSeverity.high:
                vscode.window.showErrorMessage(message, 'Show Details')
                    .then(choice => {
                        if (choice === 'Show Details') {
                            this.outputChannel.show();
                        }
                    });
                break;
            case ErrorSeverity.medium:
                vscode.window.showWarningMessage(message);
                break;
            case ErrorSeverity.low:
                // Log only, no user notification
                break;
        }
    }

    /**
     * Clean up old errors to prevent memory leaks
     */
    private cleanupOldErrors(): void {
        if (this.errors.size <= this.maxErrors) {
            return;
        }

        const errors = Array.from(this.errors.entries())
            .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

        const toRemove = errors.slice(0, this.errors.size - this.maxErrors);
        toRemove.forEach(([signature]) => this.errors.delete(signature));
    }

    /**
     * Clean up old performance metrics
     */
    private cleanupOldMetrics(): void {
        if (this.performanceMetrics.length <= this.maxMetrics) {
            return;
        }

        this.performanceMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        this.performanceMetrics.splice(0, this.performanceMetrics.length - this.maxMetrics);
    }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor();
