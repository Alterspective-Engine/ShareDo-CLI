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
export declare class WorkTypeApiClient extends BaseApiClient {
    constructor(config: IApiClientConfig);
    /**
     * Get all work types with optional filtering
     */
    getWorkTypes(filter?: IWorkTypeFilter): Promise<IWorkTypeSummary[]>;
    /**
     * Get a specific work type by ID
     */
    getWorkType(id: string): Promise<IWorkType>;
    /**
     * Create a new work type
     */
    createWorkType(workType: Partial<IWorkType>, options?: IWorkTypeCreateOptions): Promise<IWorkType>;
    /**
     * Update an existing work type
     */
    updateWorkType(id: string, updates: Partial<IWorkType>): Promise<IWorkType>;
    /**
     * Delete a work type
     */
    deleteWorkType(id: string): Promise<void>;
    /**
     * Get work type schema
     */
    getWorkTypeSchema(id: string): Promise<any>;
    /**
     * Get work type workflows
     */
    getWorkTypeWorkflows(id: string): Promise<string[]>;
    /**
     * Validate work type configuration
     */
    validateWorkType(workType: Partial<IWorkType>): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Export work type configuration
     */
    exportWorkType(id: string, format?: 'json' | 'xml' | 'yaml'): Promise<string>;
    /**
     * Import work type configuration
     */
    importWorkType(data: string, format?: 'json' | 'xml' | 'yaml'): Promise<IWorkType>;
    /**
     * Get work type statistics
     */
    getWorkTypeStats(id: string): Promise<{
        totalWorkflows: number;
        activeWorkflows: number;
        lastModified: Date;
        executionCount: number;
    }>;
    /**
     * Clone a work type
     */
    cloneWorkType(id: string, newName: string): Promise<IWorkType>;
}
