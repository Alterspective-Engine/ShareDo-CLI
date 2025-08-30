import { IWorkflow } from '@sharedo/core';

export interface IWorkflowService {
  listWorkflows(options?: WorkflowListOptions): Promise<IWorkflow[]>;
  getWorkflow(id: string): Promise<IWorkflow>;
  downloadWorkflow(id: string, destination?: string): Promise<void>;
  uploadWorkflow(workflowPath: string): Promise<IWorkflow>;
  compareWorkflows(id1: string, id2: string): Promise<WorkflowComparison>;
  validateWorkflow(workflow: IWorkflow): Promise<ValidationResult>;
  exportWorkflow(id: string, format: ExportFormat): Promise<Buffer>;
}

export interface WorkflowListOptions {
  search?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'draft';
  limit?: number;
  offset?: number;
}

export interface WorkflowComparison {
  id1: string;
  id2: string;
  differences: WorkflowDifference[];
  isSame: boolean;
}

export interface WorkflowDifference {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

export type ExportFormat = 'json' | 'xml' | 'hld' | 'pdf';