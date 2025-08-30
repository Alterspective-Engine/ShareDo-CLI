/**
 * Error Handler Service - Smart error handling for ShareDo VS Code Extension
 * 
 * Provides intelligent error analysis, user-friendly messages, and recovery suggestions.
 */

import * as vscode from 'vscode';
import { NotificationService } from './NotificationService';
import { EventBus } from '../core/EventBus';

export interface ErrorSolution {
    message: string;
    solutions: string[];
    actions?: Array<{
        label: string;
        command?: string;
        callback?: () => void | Promise<void>;
    }>;
}

export interface ErrorPattern {
    pattern: RegExp;
    solution: ErrorSolution;
}

export class ErrorHandlerService {
    private errorPatterns: ErrorPattern[] = [];
    private errorCount = 0;
    private lastError?: Error;
    
    constructor(
        private notificationService: NotificationService,
        private eventBus: EventBus
    ) {
        this.registerErrorPatterns();
        this.setupGlobalErrorHandler();
    }
    
    /**
     * Register common error patterns and their solutions
     */
    private registerErrorPatterns(): void {
        // Network errors
        this.addPattern({
            pattern: /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/,
            solution: {
                message: 'Connection failed',
                solutions: [
                    'Check if the ShareDo server is running',
                    'Verify the server URL is correct',
                    'Check your network connection',
                    'Ensure firewall is not blocking the connection'
                ],
                actions: [
                    {
                        label: 'Change Server',
                        command: 'sharedo.setupWizard'
                    },
                    {
                        label: 'Retry',
                        callback: async () => {
                            await vscode.commands.executeCommand('sharedo.connect');
                        }
                    }
                ]
            }
        });
        
        // Authentication errors
        this.addPattern({
            pattern: /401|Unauthorized|Invalid credentials|Authentication failed/i,
            solution: {
                message: 'Authentication failed',
                solutions: [
                    'Your credentials may have expired',
                    'Check your API key or password',
                    'Verify you have the correct permissions'
                ],
                actions: [
                    {
                        label: 'Update Credentials',
                        command: 'sharedo.setupWizard'
                    },
                    {
                        label: 'View Logs',
                        callback: () => this.notificationService.showOutput()
                    }
                ]
            }
        });
        
        // Permission errors
        this.addPattern({
            pattern: /403|Forbidden|Access denied|Permission denied/i,
            solution: {
                message: 'Access denied',
                solutions: [
                    'You don\'t have permission for this action',
                    'Contact your ShareDo administrator',
                    'Check if your account has the required role'
                ],
                actions: [
                    {
                        label: 'Request Access',
                        callback: async () => {
                            const admin = await vscode.window.showInputBox({
                                prompt: 'Enter administrator email'
                            });
                            if (admin) {
                                await vscode.env.openExternal(
                                    vscode.Uri.parse(`mailto:${admin}?subject=ShareDo Access Request`)
                                );
                            }
                        }
                    }
                ]
            }
        });
        
        // File system errors
        this.addPattern({
            pattern: /ENOENT|EACCES|EISDIR|File not found/i,
            solution: {
                message: 'File operation failed',
                solutions: [
                    'Check if the file or directory exists',
                    'Verify you have read/write permissions',
                    'Ensure the path is correct'
                ],
                actions: [
                    {
                        label: 'Browse Files',
                        command: 'workbench.action.files.openFile'
                    }
                ]
            }
        });
        
        // API errors
        this.addPattern({
            pattern: /500|Internal Server Error|502|Bad Gateway|503|Service Unavailable/i,
            solution: {
                message: 'Server error',
                solutions: [
                    'The ShareDo server encountered an error',
                    'Try again in a few moments',
                    'Contact support if the problem persists'
                ],
                actions: [
                    {
                        label: 'Report Issue',
                        command: 'sharedo.reportIssue'
                    },
                    {
                        label: 'View Status',
                        callback: async () => {
                            await vscode.env.openExternal(
                                vscode.Uri.parse('https://status.sharedo.com')
                            );
                        }
                    }
                ]
            }
        });
        
        // Timeout errors
        this.addPattern({
            pattern: /timeout|timed out|request timeout/i,
            solution: {
                message: 'Operation timed out',
                solutions: [
                    'The operation took too long to complete',
                    'Check your network connection',
                    'Try with a smaller dataset',
                    'Server may be under heavy load'
                ],
                actions: [
                    {
                        label: 'Retry',
                        callback: () => this.retryLastOperation()
                    },
                    {
                        label: 'Increase Timeout',
                        callback: async () => {
                            await vscode.commands.executeCommand('workbench.action.openSettings', 'sharedo.timeout');
                        }
                    }
                ]
            }
        });
        
        // JSON parsing errors
        this.addPattern({
            pattern: /JSON|SyntaxError|Unexpected token|parse error/i,
            solution: {
                message: 'Invalid data format',
                solutions: [
                    'The data received was not in the expected format',
                    'Check for malformed JSON in your configuration',
                    'Ensure all required fields are present'
                ],
                actions: [
                    {
                        label: 'Validate JSON',
                        command: 'workbench.action.editor.validateJSON'
                    }
                ]
            }
        });
    }
    
    /**
     * Handle an error
     */
    async handleError(error: any, context?: string): Promise<void> {
        this.errorCount++;
        this.lastError = error;
        
        // Log error
        const errorMessage = this.extractErrorMessage(error);
        this.notificationService.log('error', `${context ? `[${context}] ` : ''}${errorMessage}`);
        
        // Emit error event
        this.eventBus.emit('error.occurred', {
            error,
            context,
            timestamp: Date.now(),
            count: this.errorCount
        });
        
        // Find matching solution
        const solution = this.findSolution(error);
        
        if (solution) {
            await this.showSmartError(solution, errorMessage);
        } else {
            await this.showGenericError(errorMessage, context);
        }
    }
    
    /**
     * Add a custom error pattern
     */
    addPattern(pattern: ErrorPattern): void {
        this.errorPatterns.push(pattern);
    }
    
    /**
     * Find a solution for an error
     */
    private findSolution(error: any): ErrorSolution | undefined {
        const errorString = this.errorToString(error);
        
        for (const pattern of this.errorPatterns) {
            if (pattern.pattern.test(errorString)) {
                return pattern.solution;
            }
        }
        
        return undefined;
    }
    
    /**
     * Show smart error with solutions
     */
    private async showSmartError(solution: ErrorSolution, originalMessage: string): Promise<void> {
        const detail = [
            `Error: ${originalMessage}`,
            '',
            'Possible solutions:',
            ...solution.solutions.map(s => `• ${s}`)
        ].join('\n');
        
        await this.notificationService.showError(solution.message, {
            detail,
            actions: solution.actions
        });
    }
    
    /**
     * Show generic error
     */
    private async showGenericError(message: string, context?: string): Promise<void> {
        const fullMessage = context ? `${context}: ${message}` : message;
        
        await this.notificationService.showError(fullMessage, {
            actions: [
                {
                    label: 'View Logs',
                    callback: () => this.notificationService.showOutput()
                },
                {
                    label: 'Report Issue',
                    command: 'sharedo.reportIssue'
                }
            ]
        });
    }
    
    /**
     * Extract error message from various error types
     */
    private extractErrorMessage(error: any): string {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error instanceof Error) {
            return error.message;
        }
        
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }
        
        if (error?.response?.data?.error) {
            return error.response.data.error;
        }
        
        if (error?.message) {
            return error.message;
        }
        
        return JSON.stringify(error);
    }
    
    /**
     * Convert error to string for pattern matching
     */
    private errorToString(error: any): string {
        if (typeof error === 'string') {
            return error;
        }
        
        const parts = [];
        
        if (error instanceof Error) {
            parts.push(error.message);
            parts.push(error.stack || '');
        }
        
        if (error?.code) {
            parts.push(error.code);
        }
        
        if (error?.response?.status) {
            parts.push(error.response.status.toString());
        }
        
        if (error?.response?.data) {
            parts.push(JSON.stringify(error.response.data));
        }
        
        return parts.join(' ');
    }
    
    /**
     * Retry the last operation
     */
    private async retryLastOperation(): Promise<void> {
        this.eventBus.emit('operation.retry');
    }
    
    /**
     * Setup global error handler
     */
    private setupGlobalErrorHandler(): void {
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.handleError(reason, 'Unhandled Promise Rejection');
        });
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.handleError(error, 'Uncaught Exception');
        });
    }
    
    /**
     * Get error statistics
     */
    getStatistics(): {
        totalErrors: number;
        lastError?: Error;
        errorRate: number;
    } {
        const now = Date.now();
        const hourAgo = now - 3600000;
        
        // Calculate error rate (errors per hour)
        const recentErrors = this.errorCount; // Simplified for now
        
        return {
            totalErrors: this.errorCount,
            lastError: this.lastError,
            errorRate: recentErrors
        };
    }
    
    /**
     * Clear error history
     */
    clearHistory(): void {
        this.errorCount = 0;
        this.lastError = undefined;
    }
}