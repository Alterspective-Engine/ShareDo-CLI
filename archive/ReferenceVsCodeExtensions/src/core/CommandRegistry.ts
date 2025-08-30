import * as vscode from 'vscode';
import { Inform } from '../Utilities/inform';
import { ErrorMonitor } from '../Utilities/ErrorMonitor';

/**
 * Interface for command registration information
 */
export interface CommandRegistration {
    /** Unique command identifier */
    id: string;
    /** Human-readable command title */
    title: string;
    /** Command category for organization */
    category?: string;
    /** Command implementation function */
    handler: (...args: any[]) => any;
    /** Command description for documentation */
    description?: string;
    /** Whether the command should be shown in command palette */
    showInPalette?: boolean;
    /** Command enablement conditions */
    when?: string;
    /** Command arguments schema for validation */
    argsSchema?: any;
}

/**
 * Interface for command execution context
 */
export interface CommandContext {
    /** The command being executed */
    command: CommandRegistration;
    /** Arguments passed to the command */
    args: any[];
    /** Execution start time */
    startTime: number;
    /** Unique execution ID for tracking */
    executionId: string;
}

/**
 * Centralized command registry for managing all VS Code commands
 * Provides standardized error handling, logging, and command lifecycle management
 */
export class CommandRegistry {
    private static instance: CommandRegistry;
    private registeredCommands: Map<string, CommandRegistration> = new Map();
    private disposables: vscode.Disposable[] = [];
    private commandExecutions: Map<string, CommandContext> = new Map();
    private errorMonitor?: ErrorMonitor;

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): CommandRegistry {
        if (!CommandRegistry.instance) {
            CommandRegistry.instance = new CommandRegistry();
        }
        return CommandRegistry.instance;
    }

    /**
     * Initialize the command registry with error monitoring
     */
    public initialize(errorMonitor?: ErrorMonitor): void {
        this.errorMonitor = errorMonitor;
        Inform.writeInfo('CommandRegistry::initialize', 'Command registry initialized');
    }

    /**
     * Register a command with the registry
     */
    public registerCommand(registration: CommandRegistration): vscode.Disposable {
        try {
            // Check for duplicate registrations
            if (this.registeredCommands.has(registration.id)) {
                const existing = this.registeredCommands.get(registration.id);
                Inform.writeError('CommandRegistry::registerCommand', 
                    `Command '${registration.id}' is already registered. Skipping duplicate registration.`);
                
                // Return a dummy disposable to maintain interface compatibility
                return { dispose: () => {} };
            }

            // Wrap the handler with error handling and logging
            const wrappedHandler = this.wrapCommandHandler(registration);

            // Register with VS Code
            const disposable = vscode.commands.registerCommand(registration.id, wrappedHandler);

            // Store registration information
            this.registeredCommands.set(registration.id, registration);
            this.disposables.push(disposable);

            Inform.writeInfo('CommandRegistry::registerCommand', 
                `Registered command: ${registration.id} (${registration.title || 'No title'})`);

            return disposable;

        } catch (error) {
            Inform.writeError('CommandRegistry::registerCommand', 
                `Failed to register command '${registration.id}'`, error);
            
            if (this.errorMonitor) {
                this.errorMonitor.handleError(
                    `Failed to register command '${registration.id}'`,
                    { commandId: registration.id },
                    (error as Error)?.message || 'Unknown error',
                    'high' as any
                );
            }

            throw error;
        }
    }

    /**
     * Register multiple commands at once
     */
    public registerCommands(registrations: CommandRegistration[]): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];
        
        for (const registration of registrations) {
            try {
                const disposable = this.registerCommand(registration);
                disposables.push(disposable);
            } catch (error) {
                Inform.writeError('CommandRegistry::registerCommands', 
                    `Failed to register command '${registration.id}' in batch`, error);
                // Continue registering other commands even if one fails
            }
        }

        Inform.writeInfo('CommandRegistry::registerCommands', 
            `Registered ${disposables.length} out of ${registrations.length} commands`);

        return disposables;
    }

    /**
     * Unregister a specific command
     */
    public unregisterCommand(commandId: string): void {
        try {
            const registration = this.registeredCommands.get(commandId);
            if (!registration) {
                Inform.writeError('CommandRegistry::unregisterCommand', 
                    `Command '${commandId}' not found in registry`);
                return;
            }

            // Find and dispose the command
            const disposableIndex = this.disposables.findIndex(d => {
                // This is a limitation - we can't directly identify which disposable belongs to which command
                // In a real implementation, we'd need to maintain a map
                return false; // For now, we'll rely on dispose() being called externally
            });

            this.registeredCommands.delete(commandId);
            Inform.writeInfo('CommandRegistry::unregisterCommand', `Unregistered command: ${commandId}`);

        } catch (error) {
            Inform.writeError('CommandRegistry::unregisterCommand', 
                `Failed to unregister command '${commandId}'`, error);
        }
    }

    /**
     * Get information about a registered command
     */
    public getCommandInfo(commandId: string): CommandRegistration | undefined {
        return this.registeredCommands.get(commandId);
    }

    /**
     * Get all registered commands
     */
    public getAllCommands(): CommandRegistration[] {
        return Array.from(this.registeredCommands.values());
    }

    /**
     * Get commands by category
     */
    public getCommandsByCategory(category: string): CommandRegistration[] {
        return this.getAllCommands().filter(cmd => cmd.category === category);
    }

    /**
     * Execute a command programmatically
     */
    public async executeCommand(commandId: string, ...args: any[]): Promise<any> {
        try {
            const registration = this.registeredCommands.get(commandId);
            if (!registration) {
                throw new Error(`Command '${commandId}' not found in registry`);
            }

            Inform.writeDebug('CommandRegistry::executeCommand', 
                `Executing command: ${commandId} with ${args.length} arguments`);

            return await vscode.commands.executeCommand(commandId, ...args);

        } catch (error) {
            Inform.writeError('CommandRegistry::executeCommand', 
                `Failed to execute command '${commandId}'`, error);
            
            if (this.errorMonitor) {
                this.errorMonitor.handleError(
                    `Failed to execute command '${commandId}'`,
                    { commandId, args },
                    (error as Error)?.message || 'Unknown error',
                    'medium' as any
                );
            }

            throw error;
        }
    }

    /**
     * Get command execution statistics
     */
    public getExecutionStats(): { 
        totalCommands: number;
        activeExecutions: number;
        categories: string[];
    } {
        const categories = [...new Set(this.getAllCommands()
            .map(cmd => cmd.category)
            .filter((category): category is string => Boolean(category)))];

        return {
            totalCommands: this.registeredCommands.size,
            activeExecutions: this.commandExecutions.size,
            categories
        };
    }

    /**
     * Clean up all registered commands
     */
    public dispose(): void {
        try {
            this.disposables.forEach(disposable => {
                try {
                    disposable.dispose();
                } catch (error) {
                    Inform.writeError('CommandRegistry::dispose', 'Error disposing command', error);
                }
            });

            this.disposables.length = 0;
            this.registeredCommands.clear();
            this.commandExecutions.clear();

            Inform.writeInfo('CommandRegistry::dispose', 'Command registry disposed');

        } catch (error) {
            Inform.writeError('CommandRegistry::dispose', 'Error during disposal', error);
        }
    }

    /**
     * Wrap a command handler with standardized error handling and logging
     */
    private wrapCommandHandler(registration: CommandRegistration): (...args: any[]) => any {
        return async (...args: any[]) => {
            const executionId = `${registration.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const startTime = Date.now();

            const context: CommandContext = {
                command: registration,
                args,
                startTime,
                executionId
            };

            this.commandExecutions.set(executionId, context);

            try {
                Inform.writeDebug('CommandRegistry::executeCommand', 
                    `Starting execution of '${registration.id}' [${executionId}]`);

                // Validate arguments if schema is provided
                if (registration.argsSchema) {
                    this.validateCommandArgs(args, registration.argsSchema);
                }

                // Execute the command
                const result = await registration.handler(...args);

                const duration = Date.now() - startTime;
                Inform.writeDebug('CommandRegistry::executeCommand', 
                    `Completed execution of '${registration.id}' in ${duration}ms [${executionId}]`);

                // Track performance for monitoring
                if (this.errorMonitor) {
                    this.errorMonitor.trackPerformance(`command.${registration.id}`, duration);
                }

                return result;

            } catch (error) {
                const duration = Date.now() - startTime;
                Inform.writeError('CommandRegistry::executeCommand', 
                    `Command '${registration.id}' failed after ${duration}ms [${executionId}]`, error);

                // Report error to monitoring system
                if (this.errorMonitor) {
                    this.errorMonitor.handleError(
                        `Command '${registration.id}' failed`,
                        {
                            commandId: registration.id,
                            executionId,
                            duration,
                            args: args.length > 0 ? 'provided' : 'none'
                        },
                        (error as Error)?.message || 'Unknown error',
                        'medium' as any
                    );
                }

                // Show user-friendly error message
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(
                    `Command '${registration.title || registration.id}' failed: ${errorMessage}`
                );

                throw error;

            } finally {
                // Clean up execution tracking
                this.commandExecutions.delete(executionId);
            }
        };
    }

    /**
     * Validate command arguments against schema
     */
    private validateCommandArgs(args: any[], schema: any): void {
        // Basic validation implementation
        // In a real scenario, you might use a library like Joi or Yup
        if (schema.minArgs && args.length < schema.minArgs) {
            throw new Error(`Command requires at least ${schema.minArgs} arguments, got ${args.length}`);
        }

        if (schema.maxArgs && args.length > schema.maxArgs) {
            throw new Error(`Command accepts at most ${schema.maxArgs} arguments, got ${args.length}`);
        }

        // Additional validation logic can be added here
    }

    /**
     * Generate command registration report for debugging
     */
    public generateRegistrationReport(): string {
        const commands = this.getAllCommands();
        const stats = this.getExecutionStats();

        const report = [
            '=== ShareDo VS Code Extension - Command Registry Report ===',
            `Total Commands: ${stats.totalCommands}`,
            `Active Executions: ${stats.activeExecutions}`,
            `Categories: ${stats.categories.join(', ') || 'None'}`,
            '',
            '=== Registered Commands ===',
            ...commands.map(cmd => 
                `- ${cmd.id} (${cmd.title || 'No title'}) [${cmd.category || 'No category'}]`
            ),
            '',
            '=== Command Categories ===',
            ...stats.categories.map(category => {
                const categoryCommands = this.getCommandsByCategory(category);
                return `${category} (${categoryCommands.length} commands):\n` +
                       categoryCommands.map(cmd => `  - ${cmd.id}`).join('\n');
            })
        ];

        return report.join('\n');
    }
}

/**
 * Helper function to create a command registration with defaults
 */
export function createCommandRegistration(
    id: string,
    handler: (...args: any[]) => any,
    options: Partial<CommandRegistration> = {}
): CommandRegistration {
    return {
        id,
        title: options.title || id,
        category: options.category || 'ShareDo',
        handler,
        description: options.description,
        showInPalette: options.showInPalette !== false, // Default to true
        when: options.when,
        argsSchema: options.argsSchema
    };
}
