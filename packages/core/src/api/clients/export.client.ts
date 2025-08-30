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

export class ExportApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  /**
   * Create a new export job
   */
  async createExportJob(config: IExportConfig): Promise<IExportJob> {
    return this.post<IExportJob>('/api/public/export/create', config);
  }

  /**
   * Get export job status
   */
  async getExportJobStatus(jobId: string): Promise<IExportJob> {
    return this.get<IExportJob>(`/api/public/export/job/${jobId}`);
  }

  /**
   * Cancel an export job
   */
  async cancelExportJob(jobId: string): Promise<void> {
    await this.post(`/api/public/export/job/${jobId}/cancel`);
  }

  /**
   * List all export jobs for the current user
   */
  async listExportJobs(filter?: {
    status?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    limit?: number;
  }): Promise<IExportJob[]> {
    const params: Record<string, any> = {};
    if (filter) {
      if (filter.status) params.status = filter.status;
      if (filter.createdAfter) params.createdAfter = filter.createdAfter.toISOString();
      if (filter.createdBefore) params.createdBefore = filter.createdBefore.toISOString();
      if (filter.limit) params.limit = filter.limit;
    }
    
    return this.get<IExportJob[]>('/api/public/export/jobs', { params });
  }

  /**
   * Download export package
   */
  async downloadExportPackage(packageId: string): Promise<Blob> {
    const response = await this.get<ArrayBuffer>(
      `/api/public/export/package/${packageId}/download`,
      {
        headers: {
          'Accept': 'application/octet-stream'
        }
      }
    );
    return new Blob([response]);
  }

  /**
   * Get export package metadata
   */
  async getExportPackageInfo(packageId: string): Promise<IExportPackage> {
    return this.get<IExportPackage>(`/api/public/export/package/${packageId}`);
  }

  /**
   * Delete an export package
   */
  async deleteExportPackage(packageId: string): Promise<void> {
    await this.delete(`/api/public/export/package/${packageId}`);
  }

  /**
   * Generate HLD from export package
   */
  async generateHLD(packageId: string, options?: {
    templateId?: string;
    format?: 'docx' | 'pdf' | 'html';
    includeeDiagrams?: boolean;
  }): Promise<IExportJob> {
    return this.post<IExportJob>(`/api/public/export/package/${packageId}/hld`, options);
  }

  /**
   * Poll for export job completion
   */
  async waitForExportCompletion(
    jobId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: IExportJob) => void;
    }
  ): Promise<IExportJob> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 300000; // 5 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getExportJobStatus(jobId);
      
      if (options?.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Export job ${jobId} timed out after ${timeout}ms`);
  }

  /**
   * Create and wait for export
   */
  async createAndWaitForExport(
    config: IExportConfig,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (job: IExportJob) => void;
    }
  ): Promise<IExportPackage> {
    const job = await this.createExportJob(config);
    const completedJob = await this.waitForExportCompletion(job.jobId, options);
    
    if (completedJob.status === 'failed') {
      throw new Error(`Export failed: ${completedJob.error}`);
    }

    if (!completedJob.downloadUrl) {
      throw new Error('Export completed but no download URL available');
    }

    // Extract package ID from download URL or job response
    const packageId = this.extractPackageId(completedJob);
    return this.getExportPackageInfo(packageId);
  }

  private extractPackageId(job: IExportJob): string {
    // Extract package ID from download URL
    // Format: /api/public/export/package/{packageId}/download
    if (job.downloadUrl) {
      const match = job.downloadUrl.match(/package\/([^\/]+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback to job ID if package ID not found
    return job.jobId;
  }
}