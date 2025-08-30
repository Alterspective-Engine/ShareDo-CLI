/**
 * Workflow Validator
 * 
 * Validates workflow definitions for correctness and completeness
 * Checks for structural issues, missing connections, and configuration errors
 */

import { IWorkflowDefinition, IWorkflowStep, IWorkflowAction } from './WorkflowManager';
import { Inform } from '../Utilities/inform';

export interface IValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    info: string[];
}

export interface IValidationRule {
    name: string;
    description: string;
    validate: (workflow: IWorkflowDefinition) => IValidationResult;
}

export class WorkflowValidator {
    private rules: IValidationRule[] = [];

    constructor() {
        this.initializeRules();
    }

    /**
     * Initialize validation rules
     */
    private initializeRules(): void {
        // Basic structure validation
        this.addRule({
            name: 'Basic Structure',
            description: 'Validates basic workflow structure',
            validate: (workflow) => this.validateBasicStructure(workflow)
        });

        // Start and end steps validation
        this.addRule({
            name: 'Start/End Steps',
            description: 'Validates start and end step configuration',
            validate: (workflow) => this.validateStartEndSteps(workflow)
        });

        // Connections validation
        this.addRule({
            name: 'Connections',
            description: 'Validates step connections and flow',
            validate: (workflow) => this.validateConnections(workflow)
        });

        // Variables validation
        this.addRule({
            name: 'Variables',
            description: 'Validates variable usage and references',
            validate: (workflow) => this.validateVariables(workflow)
        });

        // Actions validation
        this.addRule({
            name: 'Actions',
            description: 'Validates action configurations',
            validate: (workflow) => this.validateActions(workflow)
        });

        // Circular dependencies
        this.addRule({
            name: 'Circular Dependencies',
            description: 'Checks for circular dependencies in workflow',
            validate: (workflow) => this.validateCircularDependencies(workflow)
        });

        // Orphaned steps
        this.addRule({
            name: 'Orphaned Steps',
            description: 'Checks for unreachable steps',
            validate: (workflow) => this.validateOrphanedSteps(workflow)
        });
    }

    /**
     * Add a custom validation rule
     */
    addRule(rule: IValidationRule): void {
        this.rules.push(rule);
    }

    /**
     * Validate a workflow
     */
    validate(workflow: IWorkflowDefinition): { valid: boolean; errors: string[] } {
        const allErrors: string[] = [];
        const allWarnings: string[] = [];
        const allInfo: string[] = [];

        try {
            // Run all validation rules
            for (const rule of this.rules) {
                try {
                    const result = rule.validate(workflow);
                    
                    if (result.errors.length > 0) {
                        allErrors.push(`[${rule.name}] ${result.errors.join(', ')}`);
                    }
                    
                    if (result.warnings.length > 0) {
                        allWarnings.push(...result.warnings);
                    }
                    
                    if (result.info.length > 0) {
                        allInfo.push(...result.info);
                    }
                } catch (error) {
                    allErrors.push(`[${rule.name}] Validation failed: ${error}`);
                }
            }

            // Log warnings and info
            allWarnings.forEach(warning => Inform.writeInfo(`Workflow Validation Warning: ${warning}`));
            allInfo.forEach(info => Inform.writeInfo(`Workflow Validation Info: ${info}`));

        } catch (error) {
            allErrors.push(`Critical validation error: ${error}`);
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors
        };
    }

    /**
     * Validate basic structure
     */
    private validateBasicStructure(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        // Check required fields
        if (!workflow.systemName) {
            errors.push('Workflow must have a systemName');
        }

        if (!workflow.name) {
            errors.push('Workflow must have a name');
        }

        // Check steps
        if (!workflow.steps || workflow.steps.length === 0) {
            warnings.push('Workflow has no steps defined');
        }

        // Check for duplicate step names
        if (workflow.steps) {
            const stepNames = new Set<string>();
            for (const step of workflow.steps) {
                if (stepNames.has(step.systemName)) {
                    errors.push(`Duplicate step systemName: ${step.systemName}`);
                }
                stepNames.add(step.systemName);
            }
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Validate start and end steps
     */
    private validateStartEndSteps(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        if (!workflow.steps) {
            return { valid: true, errors, warnings, info };
        }

        const startSteps = workflow.steps.filter(s => s.isStart);
        const endSteps = workflow.steps.filter(s => s.isEnd);

        // Check for start steps
        if (startSteps.length === 0) {
            warnings.push('No start step defined');
        } else if (startSteps.length > 1) {
            info.push(`Multiple start steps found: ${startSteps.map(s => s.systemName).join(', ')}`);
        }

        // Check for end steps
        if (endSteps.length === 0) {
            warnings.push('No end step defined');
        }

        // Validate that start steps have outgoing connections
        for (const startStep of startSteps) {
            if (startStep.actions && startStep.actions.length > 0) {
                const hasConnection = startStep.actions.some(a => a.connections);
                if (!hasConnection) {
                    warnings.push(`Start step '${startStep.systemName}' has no outgoing connections`);
                }
            } else {
                warnings.push(`Start step '${startStep.systemName}' has no actions`);
            }
        }

        // Validate that end steps have no outgoing connections
        for (const endStep of endSteps) {
            if (endStep.actions && endStep.actions.length > 0) {
                const hasConnection = endStep.actions.some(a => a.connections);
                if (hasConnection) {
                    warnings.push(`End step '${endStep.systemName}' should not have outgoing connections`);
                }
            }
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Validate connections
     */
    private validateConnections(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        if (!workflow.steps) {
            return { valid: true, errors, warnings, info };
        }

        const stepNames = new Set(workflow.steps.map(s => s.systemName));

        for (const step of workflow.steps) {
            if (!step.actions) continue;

            for (const action of step.actions) {
                if (!action.connections) continue;

                const connections = typeof action.connections === 'string' 
                    ? JSON.parse(action.connections) 
                    : action.connections;

                // Check execute connection
                if (connections.execute && connections.execute.step) {
                    if (!stepNames.has(connections.execute.step)) {
                        errors.push(`Action '${action.name}' in step '${step.systemName}' references non-existent step: ${connections.execute.step}`);
                    }
                }

                // Check conditional connections
                if (connections.yes && connections.yes.step) {
                    if (!stepNames.has(connections.yes.step)) {
                        errors.push(`Action '${action.name}' in step '${step.systemName}' references non-existent step in 'yes' branch: ${connections.yes.step}`);
                    }
                }

                if (connections.no && connections.no.step) {
                    if (!stepNames.has(connections.no.step)) {
                        errors.push(`Action '${action.name}' in step '${step.systemName}' references non-existent step in 'no' branch: ${connections.no.step}`);
                    }
                }

                // Check loop connection
                if (connections.loop && connections.loop.step) {
                    if (!stepNames.has(connections.loop.step)) {
                        errors.push(`Action '${action.name}' in step '${step.systemName}' references non-existent step in loop: ${connections.loop.step}`);
                    }
                }

                // Check forEach connection
                if (connections.forEach && connections.forEach.step) {
                    if (!stepNames.has(connections.forEach.step)) {
                        errors.push(`Action '${action.name}' in step '${step.systemName}' references non-existent step in forEach: ${connections.forEach.step}`);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Validate variables
     */
    private validateVariables(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        // Check for variable definitions if workflow has variables
        if (workflow.variables && workflow.variables.length > 0) {
            const variableNames = new Set<string>();

            for (const variable of workflow.variables) {
                // Check for duplicate variable names
                if (variableNames.has(variable.systemName)) {
                    errors.push(`Duplicate variable systemName: ${variable.systemName}`);
                }
                variableNames.add(variable.systemName);

                // Check mandatory input variables
                if (variable.isMandatory && variable.isInputVariable && !variable.defaultValue) {
                    warnings.push(`Mandatory input variable '${variable.systemName}' has no default value`);
                }
            }

            // Check variable usage in actions
            if (workflow.steps) {
                for (const step of workflow.steps) {
                    if (!step.actions) continue;

                    for (const action of step.actions) {
                        if (!action.config) continue;

                        const config = typeof action.config === 'string' 
                            ? JSON.parse(action.config) 
                            : action.config;

                        // Check for references to undefined variables
                        const configStr = JSON.stringify(config);
                        const variableReferences = configStr.match(/[a-zA-Z_][a-zA-Z0-9_]*Variable/g) || [];
                        
                        for (const ref of variableReferences) {
                            const varName = config[ref];
                            if (varName && !variableNames.has(varName)) {
                                warnings.push(`Action '${action.name}' references undefined variable: ${varName}`);
                            }
                        }
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Validate actions
     */
    private validateActions(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        if (!workflow.steps) {
            return { valid: true, errors, warnings, info };
        }

        const knownActionTypes = [
            'startStep', 'endStep', 'ifElse', 'switch', 'forEach', 'Each', 'when',
            'createNotification', 'OutboundEmail', 'createOutgoingSms',
            'CreatePrepareDocumentV2', 'loadData', 'UpdateAttribute',
            'createTask', 'completeTask', 'cancelTask',
            'logMessage', 'setVariable', 'callApi', 'runScript'
        ];

        for (const step of workflow.steps) {
            if (!step.actions || step.actions.length === 0) {
                if (!step.isEnd) {
                    warnings.push(`Step '${step.systemName}' has no actions`);
                }
                continue;
            }

            // Check for duplicate action IDs
            const actionIds = new Set<string>();
            for (const action of step.actions) {
                if (action.id) {
                    if (actionIds.has(action.id)) {
                        errors.push(`Duplicate action ID in step '${step.systemName}': ${action.id}`);
                    }
                    actionIds.add(action.id);
                }

                // Validate action type
                if (!knownActionTypes.includes(action.actionSystemName)) {
                    info.push(`Unknown action type in step '${step.systemName}': ${action.actionSystemName}`);
                }

                // Validate action configuration
                if (action.config) {
                    try {
                        const config = typeof action.config === 'string' 
                            ? JSON.parse(action.config) 
                            : action.config;
                        
                        // Specific validation for different action types
                        this.validateActionConfig(action.actionSystemName, config, errors, warnings);
                    } catch (e) {
                        errors.push(`Invalid configuration for action '${action.name}' in step '${step.systemName}': ${e}`);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Validate specific action configuration
     */
    private validateActionConfig(actionType: string, config: any, errors: string[], warnings: string[]): void {
        switch (actionType) {
            case 'startStep':
                if (!config.now && !config.startOnDateTimeVariable && !config.startIn) {
                    warnings.push('Start step action has no timing configuration');
                }
                break;

            case 'createNotification':
                if (!config.notificationTypeSystemName) {
                    errors.push('Notification action missing notificationTypeSystemName');
                }
                if (!config.title && !config.message) {
                    warnings.push('Notification has no title or message');
                }
                break;

            case 'OutboundEmail':
                if (!config.taskType) {
                    errors.push('Email action missing taskType');
                }
                if (!config.fromParticipantRole && !config.toParticipantRole) {
                    warnings.push('Email action missing participant roles');
                }
                break;

            case 'loadData':
                if (!config.workItemType && !config.entityType) {
                    errors.push('Load data action missing entity type');
                }
                break;

            case 'Each':
            case 'forEach':
                if (!config.sourceCollection) {
                    errors.push('Loop action missing source collection');
                }
                if (!config.currentValueVariable) {
                    errors.push('Loop action missing current value variable');
                }
                break;
        }
    }

    /**
     * Check for circular dependencies
     */
    private validateCircularDependencies(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        if (!workflow.steps) {
            return { valid: true, errors, warnings, info };
        }

        // Build adjacency list
        const graph = new Map<string, Set<string>>();
        
        for (const step of workflow.steps) {
            if (!graph.has(step.systemName)) {
                graph.set(step.systemName, new Set());
            }

            if (step.actions) {
                for (const action of step.actions) {
                    if (!action.connections) continue;

                    const connections = typeof action.connections === 'string' 
                        ? JSON.parse(action.connections) 
                        : action.connections;

                    // Add all connection targets
                    const targets = [
                        connections.execute?.step,
                        connections.yes?.step,
                        connections.no?.step,
                        connections.loop?.step,
                        connections.forEach?.step,
                        connections.complete?.step
                    ].filter(Boolean);

                    for (const target of targets) {
                        graph.get(step.systemName)!.add(target);
                    }
                }
            }
        }

        // Check for cycles using DFS
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycle = (node: string): boolean => {
            visited.add(node);
            recursionStack.add(node);

            const neighbors = graph.get(node) || new Set();
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor)) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    errors.push(`Circular dependency detected: ${node} -> ${neighbor}`);
                    return true;
                }
            }

            recursionStack.delete(node);
            return false;
        };

        for (const step of workflow.steps) {
            if (!visited.has(step.systemName)) {
                hasCycle(step.systemName);
            }
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Check for orphaned steps
     */
    private validateOrphanedSteps(workflow: IWorkflowDefinition): IValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        if (!workflow.steps || workflow.steps.length === 0) {
            return { valid: true, errors, warnings, info };
        }

        // Find all steps that are referenced
        const referencedSteps = new Set<string>();
        const startSteps = new Set<string>();

        for (const step of workflow.steps) {
            if (step.isStart) {
                startSteps.add(step.systemName);
            }

            if (step.actions) {
                for (const action of step.actions) {
                    if (!action.connections) continue;

                    const connections = typeof action.connections === 'string' 
                        ? JSON.parse(action.connections) 
                        : action.connections;

                    // Add all referenced steps
                    const targets = [
                        connections.execute?.step,
                        connections.yes?.step,
                        connections.no?.step,
                        connections.loop?.step,
                        connections.forEach?.step,
                        connections.complete?.step
                    ].filter(Boolean);

                    for (const target of targets) {
                        referencedSteps.add(target);
                    }
                }
            }
        }

        // Check for orphaned steps (not start and not referenced)
        for (const step of workflow.steps) {
            if (!step.isStart && !referencedSteps.has(step.systemName)) {
                warnings.push(`Step '${step.systemName}' is not reachable from any other step`);
            }
        }

        // Check if there's at least one path from start to end
        if (startSteps.size === 0 && workflow.steps.length > 0) {
            warnings.push('No start step defined - workflow may not be executable');
        }

        return { valid: errors.length === 0, errors, warnings, info };
    }

    /**
     * Get a summary of validation rules
     */
    getRulesSummary(): string[] {
        return this.rules.map(rule => `${rule.name}: ${rule.description}`);
    }
}