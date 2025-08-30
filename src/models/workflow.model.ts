export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  type: WorkflowType;
  category?: string;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  publishedAt?: Date;
  steps?: IWorkflowStep[];
  variables?: IWorkflowVariable[];
  triggers?: IWorkflowTrigger[];
  permissions?: IWorkflowPermissions;
  metadata?: Record<string, any>;
}

export enum WorkflowStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
  Deprecated = 'deprecated'
}

export enum WorkflowType {
  Standard = 'standard',
  Template = 'template',
  System = 'system',
  Custom = 'custom'
}

export interface IWorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: string;
  order: number;
  config?: Record<string, any>;
  inputs?: IWorkflowStepInput[];
  outputs?: IWorkflowStepOutput[];
  connections?: IWorkflowConnection[];
  conditions?: IWorkflowCondition[];
  errorHandling?: IErrorHandling;
}

export interface IWorkflowStepInput {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  validation?: IValidationRule[];
}

export interface IWorkflowStepOutput {
  name: string;
  type: string;
  description?: string;
}

export interface IWorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

export interface IWorkflowCondition {
  type: 'if' | 'switch' | 'while';
  expression: string;
  trueBranch?: string;
  falseBranch?: string;
}

export interface IWorkflowVariable {
  name: string;
  type: string;
  value?: any;
  scope: 'global' | 'local';
  description?: string;
}

export interface IWorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface IWorkflowPermissions {
  canView?: string[];
  canEdit?: string[];
  canExecute?: string[];
  canDelete?: string[];
}

export interface IErrorHandling {
  strategy: 'retry' | 'skip' | 'fail' | 'custom';
  retryCount?: number;
  retryDelay?: number;
  fallbackStep?: string;
  customHandler?: string;
}

export interface IValidationRule {
  type: 'required' | 'pattern' | 'range' | 'custom';
  value?: any;
  message?: string;
}

export interface IWorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  executionTime?: number;
  currentStep?: string;
  context?: Record<string, any>;
  results?: Record<string, any>;
  errors?: IExecutionError[];
}

export enum ExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Paused = 'paused'
}

export interface IExecutionError {
  step: string;
  message: string;
  code?: string;
  timestamp: Date;
  details?: any;
}