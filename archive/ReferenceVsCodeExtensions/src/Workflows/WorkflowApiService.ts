/**
 * Workflow API Service
 * 
 * Handles all API operations for workflows including deployment
 * Based on actual ShareDo API patterns from production
 */

import * as vscode from 'vscode';
import { SharedoClient } from '../sharedoClient';
import { IWorkflowDefinition } from './WorkflowManager';
import { Inform } from '../Utilities/inform';
import { WorkflowSecurity } from './WorkflowSecurity';
import { CacheManagementService } from '../services/CacheManagementService';

export interface IWorkflowApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export class WorkflowApiService {
    /**
     * Deploy/Save workflow to ShareDo server
     * Based on actual API: POST /api/executionengine/visualmodeller/plans/{systemName}
     */
    static async deployWorkflow(
        workflow: IWorkflowDefinition, 
        server: SharedoClient
    ): Promise<IWorkflowApiResponse> {
        try {
            // Validate workflow before deployment
            const validation = WorkflowSecurity.validateSystemName(workflow.systemName);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid workflow system name: ${validation.error}`
                };
            }

            // Validate workflow size
            const sizeValidation = WorkflowSecurity.validateWorkflowSize(workflow);
            if (!sizeValidation.valid) {
                return {
                    success: false,
                    error: sizeValidation.error
                };
            }

            // Check for dangerous actions
            const warnings = WorkflowSecurity.checkDangerousActions(workflow);
            if (warnings.length > 0) {
                const proceed = await vscode.window.showWarningMessage(
                    `Workflow contains potentially dangerous actions:\n${warnings.join('\n')}\n\nDeploy anyway?`,
                    'Deploy',
                    'Cancel'
                );
                if (proceed !== 'Deploy') {
                    return {
                        success: false,
                        message: 'Deployment cancelled by user'
                    };
                }
            }

            // Prepare the workflow payload
            const payload = this.prepareWorkflowPayload(workflow);

            // Get bearer token
            const token = await server.getBearer();

            if (!token) {
                return {
                    success: false,
                    error: 'Failed to authenticate with server'
                };
            }

            // Construct API URL
            const apiUrl = `${server.url}/api/executionengine/visualmodeller/plans/${workflow.systemName}`;
            
            Inform.writeInfo(`Deploying workflow to: ${apiUrl}`);

            // Make the API request using VS Code's fetch implementation
            const https = require('https');
            const url = require('url');
            
            const parsedUrl = url.parse(apiUrl);
            const postData = JSON.stringify(payload);

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port || 443,
                    path: parsedUrl.path,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Content-Length': Buffer.byteLength(postData),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };

                const req = https.request(options, (res: any) => {
                    let responseData = '';

                    res.on('data', (chunk: any) => {
                        responseData += chunk;
                    });

                    res.on('end', async () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            Inform.writeInfo(`Workflow deployed successfully: ${res.statusCode}`);
                            
                            // Reset cache headers after successful deployment (using debouncer)
                            const cacheService = CacheManagementService.getInstance();
                            await cacheService.resetCacheHeadersDebounced(server);
                            
                            resolve({
                                success: true,
                                message: 'Workflow deployed successfully',
                                data: responseData ? JSON.parse(responseData) : null
                            });
                        } else {
                            Inform.writeError('WorkflowApiService.deployWorkflow', `Deployment failed: ${res.statusCode}`);
                            resolve({
                                success: false,
                                error: `Server returned ${res.statusCode}: ${responseData}`
                            });
                        }
                    });
                });

                req.on('error', (error: any) => {
                    Inform.writeError('WorkflowApiService.deployWorkflow', error);
                    resolve({
                        success: false,
                        error: `Network error: ${error.message}`
                    });
                });

                // Write data to request body
                req.write(postData);
                req.end();
            });

        } catch (error) {
            Inform.writeError('WorkflowApiService.deployWorkflow', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Prepare workflow payload for API
     * Ensures all required fields are present and properly formatted
     */
    private static prepareWorkflowPayload(workflow: IWorkflowDefinition): any {
        // Ensure all required fields are present
        const payload: any = {
            systemName: workflow.systemName,
            name: workflow.name,
            description: workflow.description || '',
            isSystem: false,
            overrideNotifications: workflow.overrideNotifications || false,
            exceptionNotifications: workflow.exceptionNotifications !== false,
            exceptionNotificationEmailAddresses: workflow.exceptionNotificationEmailAddresses || '',
            variables: workflow.variables || [],
            steps: workflow.steps || []
        };

        // Process steps to ensure proper format
        if (payload.steps) {
            payload.steps = payload.steps.map((step: any) => {
                // Ensure ideData is properly formatted
                if (step.ideData && typeof step.ideData === 'string') {
                    try {
                        step.ideData = JSON.parse(step.ideData);
                    } catch {
                        // If parsing fails, create default position
                        step.ideData = { x: 0, y: 0 };
                    }
                }

                // Ensure actions array exists
                if (!step.actions) {
                    step.actions = [];
                }

                // Process actions
                step.actions = step.actions.map((action: any) => {
                    // Ensure config is an object
                    if (typeof action.config === 'string') {
                        try {
                            action.config = JSON.parse(action.config);
                        } catch {
                            action.config = {};
                        }
                    }

                    // Ensure connections is an object
                    if (typeof action.connections === 'string') {
                        try {
                            action.connections = JSON.parse(action.connections);
                        } catch {
                            action.connections = {};
                        }
                    }

                    // Add default mappings if not present
                    if (!action.inputVariableMappings) {
                        action.inputVariableMappings = [];
                    }
                    if (!action.outputVariableMappings) {
                        action.outputVariableMappings = [];
                    }

                    return action;
                });

                return step;
            });
        }

        return payload;
    }

    /**
     * Get workflow from server
     * GET /api/executionengine/visualmodeller/plans/{systemName}
     */
    static async getWorkflow(
        systemName: string,
        server: SharedoClient
    ): Promise<IWorkflowApiResponse> {
        try {
            // Use existing method from SharedoClient
            const workflow = await server.getWorkflow({ systemName });
            
            if (workflow) {
                return {
                    success: true,
                    data: workflow
                };
            } else {
                return {
                    success: false,
                    error: 'Workflow not found'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get workflow'
            };
        }
    }

    /**
     * Delete workflow from server
     * DELETE /api/executionengine/visualmodeller/plans/{systemName}
     */
    static async deleteWorkflow(
        systemName: string,
        server: SharedoClient
    ): Promise<IWorkflowApiResponse> {
        try {
            // Get bearer token
            const token = await server.getBearer();

            if (!token) {
                return {
                    success: false,
                    error: 'Failed to authenticate with server'
                };
            }

            const apiUrl = `${server.url}/api/executionengine/visualmodeller/plans/${systemName}`;
            
            // Implementation would follow similar pattern to deployWorkflow
            // but with DELETE method
            
            return {
                success: false,
                error: 'Delete not yet implemented'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete workflow'
            };
        }
    }

    /**
     * Validate workflow on server without saving
     * Could be implemented as a dry-run option
     */
    static async validateWorkflow(
        workflow: IWorkflowDefinition,
        server: SharedoClient
    ): Promise<IWorkflowApiResponse> {
        try {
            // Local validation first
            const validation = WorkflowSecurity.validateSystemName(workflow.systemName);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            const sizeValidation = WorkflowSecurity.validateWorkflowSize(workflow);
            if (!sizeValidation.valid) {
                return {
                    success: false,
                    error: sizeValidation.error
                };
            }

            // Could make a validation API call here if server supports it
            
            return {
                success: true,
                message: 'Workflow validation passed'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }
}