/**
 * Export API client for managing export jobs and packages
 */
import { BaseApiClient, IApiClientConfig } from '../base.client';
export interface IExportConfig {
    workTypeId: string;
    format: 'docx' | 'pdf' | 'html' | 'json';
    includeWorkflows?: boolean;
    includeSchemas?: boolean;
    includeDiagrams?: boolean;
    templateId?: string;
}
export interface IExportJob {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message?: string;
    createdAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    error?: string;
}
export interface IExportPackage {
    packageId: string;
    name: string;
    size: number;
    format: string;
    createdAt: Date;
    expiresAt: Date;
    downloadUrl: string;
    contents: {
        workflows?: string[];
        schemas?: string[];
        diagrams?: string[];
        documents?: string[];
    };
}
export declare class ExportApiClient extends BaseApiClient {
    constructor(config: IApiClientConfig);
    /**
     * Create a new export job
     */
    createExportJob(config: IExportConfig): Promise<IExportJob>;
    /**
     * Get export job status
     */
    getExportJobStatus(jobId: string): Promise<IExportJob>;
    /**
     * Cancel an export job
     */
    cancelExportJob(jobId: string): Promise<void>;
    /**
     * List all export jobs for the current user
     */
    listExportJobs(filter?: {
        status?: string;
        createdAfter?: Date;
        createdBefore?: Date;
        limit?: number;
    }): Promise<IExportJob[]>;
    /**
     * Download export package
     */
    downloadExportPackage(packageId: string): Promise<Blob>;
    /**
     * Get export package metadata
     */
    getExportPackageInfo(packageId: string): Promise<IExportPackage>;
    /**
     * Delete an export package
     */
    deleteExportPackage(packageId: string): Promise<void>;
    /**
     * Generate HLD from export package
     */
    generateHLD(packageId: string, options?: {
        templateId?: string;
        format?: 'docx' | 'pdf' | 'html';
        includeeDiagrams?: boolean;
    }): Promise<IExportJob>;
    /**
     * Poll for export job completion
     */
    waitForExportCompletion(jobId: string, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (job: IExportJob) => void;
    }): Promise<IExportJob>;
    /**
     * Create and wait for export
     */
    createAndWaitForExport(config: IExportConfig, options?: {
        pollInterval?: number;
        timeout?: number;
        onProgress?: (job: IExportJob) => void;
    }): Promise<IExportPackage>;
    private extractPackageId;
}
