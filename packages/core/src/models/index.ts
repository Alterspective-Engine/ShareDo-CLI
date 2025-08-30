/**
 * Core data models for ShareDo platform
 */

export interface IUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  workType?: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  steps?: IWorkflowStep[];
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IWorkflowSummary {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  workType?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface IWorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  next?: string[];
  condition?: string;
}

export interface IWorkType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  workflows?: string[];
  schema?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkTypeSummary {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  workflowCount?: number;
  updatedAt?: Date;
}

export interface ITemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  type?: string;
  category?: string;
  variables?: ITemplateVariable[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITemplateVariable {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface IExecutionResult {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  output?: any;
  logs?: string[];
}

export interface IPermission {
  id: string;
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions?: Record<string, any>;
}

export enum WorkflowStatus {
  Draft = 'draft',
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived'
}

export enum ExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}