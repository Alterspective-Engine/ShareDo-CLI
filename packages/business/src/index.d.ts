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
export declare class BusinessLogicManager {
    private workflowService;
    private exportService;
    private hldService;
    private templateService;
    constructor(workflowService: IWorkflowService, exportService: IExportService, hldService: IHLDService, templateService: ITemplateService);
    initialize(): Promise<void>;
    getWorkflowService(): IWorkflowService;
    getExportService(): IExportService;
    getHLDService(): IHLDService;
    getTemplateService(): ITemplateService;
}
