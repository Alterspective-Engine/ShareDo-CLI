/**
 * WorkType API client
 */

import { BaseApiClient, IApiClientConfig } from '../base.client';
import { IWorkType, IWorkTypeSummary } from '../../models';

export interface IWorkTypeFilter {
  name?: string;
  category?: string;
  isActive?: boolean;
  hasWorkflows?: boolean;
}

export interface IWorkTypeCreateOptions {
  template?: string;
  copyFrom?: string;
}

export class WorkTypeApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  /**
   * Get all work types with optional filtering
   */
  async getWorkTypes(filter?: IWorkTypeFilter): Promise<IWorkTypeSummary[]> {
    return this.get<IWorkTypeSummary[]>('/api/public/worktype', {
      params: filter
    });
  }

  /**
   * Get a specific work type by ID
   */
  async getWorkType(id: string): Promise<IWorkType> {
    return this.get<IWorkType>(`/api/public/worktype/${encodeURIComponent(id)}`);
  }

  /**
   * Create a new work type
   */
  async createWorkType(workType: Partial<IWorkType>, options?: IWorkTypeCreateOptions): Promise<IWorkType> {
    return this.post<IWorkType>('/api/public/worktype', workType, {
      params: options
    });
  }

  /**
   * Update an existing work type
   */
  async updateWorkType(id: string, updates: Partial<IWorkType>): Promise<IWorkType> {
    return this.put<IWorkType>(`/api/public/worktype/${encodeURIComponent(id)}`, updates);
  }

  /**
   * Delete a work type
   */
  async deleteWorkType(id: string): Promise<void> {
    await this.delete(`/api/public/worktype/${encodeURIComponent(id)}`);
  }

  /**
   * Get work type schema
   */
  async getWorkTypeSchema(id: string): Promise<any> {
    return this.get(`/api/public/worktype/${encodeURIComponent(id)}/schema`);
  }

  /**
   * Get work type workflows
   */
  async getWorkTypeWorkflows(id: string): Promise<string[]> {
    return this.get<string[]>(`/api/public/worktype/${encodeURIComponent(id)}/workflows`);
  }

  /**
   * Validate work type configuration
   */
  async validateWorkType(workType: Partial<IWorkType>): Promise<{ valid: boolean; errors?: string[] }> {
    return this.post<{ valid: boolean; errors?: string[] }>(
      '/api/public/worktype/validate',
      workType
    );
  }

  /**
   * Export work type configuration
   */
  async exportWorkType(id: string, format: 'json' | 'xml' | 'yaml' = 'json'): Promise<string> {
    return this.get<string>(`/api/public/worktype/${encodeURIComponent(id)}/export`, {
      params: { format }
    });
  }

  /**
   * Import work type configuration
   */
  async importWorkType(data: string, format: 'json' | 'xml' | 'yaml' = 'json'): Promise<IWorkType> {
    return this.post<IWorkType>('/api/public/worktype/import', { data, format });
  }

  /**
   * Get work type statistics
   */
  async getWorkTypeStats(id: string): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    lastModified: Date;
    executionCount: number;
  }> {
    return this.get(`/api/public/worktype/${encodeURIComponent(id)}/stats`);
  }

  /**
   * Clone a work type
   */
  async cloneWorkType(id: string, newName: string): Promise<IWorkType> {
    return this.post<IWorkType>(`/api/public/worktype/${encodeURIComponent(id)}/clone`, {
      newName
    });
  }
}