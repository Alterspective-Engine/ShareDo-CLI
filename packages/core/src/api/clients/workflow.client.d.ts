/**
 * Workflow API client
 */
import { BaseApiClient, IApiClientConfig } from '../base.client';
import { IWorkflow, IWorkflowSummary } from '../../models';
export interface IWorkflowFilter {
    name?: string;
    workType?: string;
    status?: string;
    modifiedAfter?: Date;
    modifiedBefore?: Date;
}
export interface IWorkflowUploadOptions {
    overwrite?: boolean;
    validateOnly?: boolean;
    createBackup?: boolean;
}
export declare class WorkflowApiClient extends BaseApiClient {
    constructor(config: IApiClientConfig);
    /**
     * Get all workflows with optional filtering
     */
    getWorkflows(filter?: IWorkflowFilter): Promise<IWorkflowSummary[]>;
    /**
     * Get a specific workflow by name
     */
    getWorkflow(name: string): Promise<IWorkflow>;
    /**
     * Download workflow as JSON
     */
    downloadWorkflow(name: string): Promise<IWorkflow>;
    /**
     * Upload a workflow
     */
    uploadWorkflow(workflow: IWorkflow, options?: IWorkflowUploadOptions): Promise<IWorkflow>;
    /**
     * Validate a workflow without saving
     */
    validateWorkflow(workflow: IWorkflow): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Delete a workflow
     */
    deleteWorkflow(name: string): Promise<void>;
    /**
     * Compare two workflows
     */
    compareWorkflows(workflow1: string, workflow2: string): Promise<any>;
    /**
     * Get workflow execution history
     */
    getWorkflowHistory(name: string, limit?: number): Promise<any[]>;
    /**
     * Execute a workflow
     */
    executeWorkflow(name: string, input?: any): Promise<{
        executionId: string;
    }>;
    /**
     * Get workflow execution status
     */
    getExecutionStatus(executionId: string): Promise<any>;
    private buildFilterParams;
}
