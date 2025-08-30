/**
 * @sharedo/business - Business logic layer for ShareDo platform
 * 
 * This package contains core business logic shared across all platforms:
 * - Workflow management
 * - Export operations
 * - HLD generation
 * - Template operations
 */

export interface IWorkflowService {
  getWorkflows(): Promise<any[]>;
  getWorkflow(id: string): Promise<any>;
  createWorkflow(data: any): Promise<any>;
  updateWorkflow(id: string, data: any): Promise<any>;
  deleteWorkflow(id: string): Promise<void>;
}

export interface IExportService {
  exportWorkflow(workflowId: string, format: string): Promise<string>;
  exportWorkType(workTypeId: string, format: string): Promise<string>;
  getExportStatus(jobId: string): Promise<any>;
}

export interface IHLDService {
  generateHLD(workTypeId: string, options?: any): Promise<string>;
  generateConfigurableHLD(workTypeId: string, options?: any): Promise<string>;
}

export interface ITemplateService {
  getTemplates(): Promise<any[]>;
  getTemplate(id: string): Promise<any>;
  createTemplate(data: any): Promise<any>;
  updateTemplate(id: string, data: any): Promise<any>;
  deleteTemplate(id: string): Promise<void>;
}

export class BusinessLogicManager {
  constructor(
    private workflowService: IWorkflowService,
    private exportService: IExportService,
    private hldService: IHLDService,
    private templateService: ITemplateService
  ) {}

  async initialize(): Promise<void> {
    // Initialize business logic
  }

  getWorkflowService(): IWorkflowService {
    return this.workflowService;
  }

  getExportService(): IExportService {
    return this.exportService;
  }

  getHLDService(): IHLDService {
    return this.hldService;
  }

  getTemplateService(): ITemplateService {
    return this.templateService;
  }
}