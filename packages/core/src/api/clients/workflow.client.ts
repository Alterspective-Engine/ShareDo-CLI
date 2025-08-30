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

export class WorkflowApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  /**
   * Get all workflows with optional filtering
   */
  async getWorkflows(filter?: IWorkflowFilter): Promise<IWorkflowSummary[]> {
    return this.get<IWorkflowSummary[]>('/api/public/workflow', {
      params: filter ? this.buildFilterParams(filter) : undefined
    });
  }

  /**
   * Get a specific workflow by name
   */
  async getWorkflow(name: string): Promise<IWorkflow> {
    return this.get<IWorkflow>(`/api/public/workflow/${encodeURIComponent(name)}`);
  }

  /**
   * Download workflow as JSON
   */
  async downloadWorkflow(name: string): Promise<IWorkflow> {
    return this.get<IWorkflow>(`/api/public/workflow/${encodeURIComponent(name)}/download`);
  }

  /**
   * Upload a workflow
   */
  async uploadWorkflow(workflow: IWorkflow, options?: IWorkflowUploadOptions): Promise<IWorkflow> {
    return this.post<IWorkflow>('/api/public/workflow/upload', workflow, {
      params: options
    });
  }

  /**
   * Validate a workflow without saving
   */
  async validateWorkflow(workflow: IWorkflow): Promise<{ valid: boolean; errors?: string[] }> {
    return this.post<{ valid: boolean; errors?: string[] }>(
      '/api/public/workflow/validate',
      workflow
    );
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(name: string): Promise<void> {
    await this.delete(`/api/public/workflow/${encodeURIComponent(name)}`);
  }

  /**
   * Compare two workflows
   */
  async compareWorkflows(workflow1: string, workflow2: string): Promise<any> {
    return this.get('/api/public/workflow/compare', {
      params: { workflow1, workflow2 }
    });
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowHistory(name: string, limit: number = 10): Promise<any[]> {
    return this.get(`/api/public/workflow/${encodeURIComponent(name)}/history`, {
      params: { limit }
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(name: string, input?: any): Promise<{ executionId: string }> {
    return this.post(`/api/public/workflow/${encodeURIComponent(name)}/execute`, input);
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    return this.get(`/api/public/workflow/execution/${executionId}`);
  }

  private buildFilterParams(filter: IWorkflowFilter): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (filter.name) params.name = filter.name;
    if (filter.workType) params.workType = filter.workType;
    if (filter.status) params.status = filter.status;
    if (filter.modifiedAfter) params.modifiedAfter = filter.modifiedAfter.toISOString();
    if (filter.modifiedBefore) params.modifiedBefore = filter.modifiedBefore.toISOString();
    
    return params;
  }
}