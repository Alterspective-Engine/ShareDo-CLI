import { BaseApiClient, IWorkflow } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';
import {
  IWorkflowService,
  WorkflowListOptions,
  WorkflowComparison,
  WorkflowDifference,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ExportFormat
} from '../interfaces/workflow.interfaces';
import * as path from 'path';

export class WorkflowService implements IWorkflowService {
  constructor(
    private apiClient: BaseApiClient,
    private platform: IPlatform
  ) {}

  async listWorkflows(options?: WorkflowListOptions): Promise<IWorkflow[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    
    const response = await this.apiClient.post(
      `/api/listview/core-admin-plan-list/${limit}/${page}/noSort/asc/?view=table&withCounts=1`,
      []
    );

    if (response?.data) {
      return response.data;
    }
    
    return [];
  }

  async getWorkflow(id: string): Promise<IWorkflow> {
    const response = await this.apiClient.get(
      `/api/executionengine/visualmodeller/plans/${id}`
    );
    
    if (!response) {
      throw new Error(`Workflow ${id} not found`);
    }
    
    return response;
  }

  async downloadWorkflow(id: string, destination?: string): Promise<void> {
    const workflow = await this.getWorkflow(id);
    
    const workspaceRoot = this.platform.getWorkspaceRoot();
    const workflowPath = destination || path.join(workspaceRoot, 'workflows', `${id}.json`);
    
    const dir = path.dirname(workflowPath);
    await this.platform.createDirectory(dir);
    
    await this.platform.writeFile(workflowPath, JSON.stringify(workflow, null, 2));
    
    this.platform.showInformationMessage(`Workflow ${id} downloaded to ${workflowPath}`);
  }

  async uploadWorkflow(workflowPath: string): Promise<IWorkflow> {
    const content = await this.platform.readFile(workflowPath);
    const workflow = JSON.parse(content);
    
    const response = await this.apiClient.post(
      '/api/executionengine/visualmodeller/plans',
      workflow
    );
    
    if (!response) {
      throw new Error('Failed to upload workflow');
    }
    
    this.platform.showInformationMessage(`Workflow uploaded successfully`);
    return response;
  }

  async compareWorkflows(id1: string, id2: string): Promise<WorkflowComparison> {
    const [workflow1, workflow2] = await Promise.all([
      this.getWorkflow(id1),
      this.getWorkflow(id2)
    ]);
    
    const differences: WorkflowDifference[] = [];
    
    this.compareObjects(workflow1, workflow2, '', differences);
    
    return {
      id1,
      id2,
      differences,
      isSame: differences.length === 0
    };
  }

  async validateWorkflow(workflow: IWorkflow): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Basic validation rules
    if (!workflow.id) {
      errors.push({
        path: 'id',
        message: 'Workflow ID is required',
        code: 'MISSING_ID'
      });
    }
    
    if (!workflow.name) {
      errors.push({
        path: 'name',
        message: 'Workflow name is required',
        code: 'MISSING_NAME'
      });
    }
    
    // Check for deprecated features
    if ((workflow as any).legacyField) {
      warnings.push({
        path: 'legacyField',
        message: 'This field is deprecated and will be removed in future versions',
        code: 'DEPRECATED_FIELD'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async exportWorkflow(id: string, format: ExportFormat): Promise<Buffer> {
    const workflow = await this.getWorkflow(id);
    
    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(workflow, null, 2));
        
      case 'xml':
        return Buffer.from(this.convertToXML(workflow));
        
      case 'hld':
        const response = await this.apiClient.get(
          `/api/executionengine/visualmodeller/plans/${id}/export/hld`
        );
        return Buffer.from(response);
        
      case 'pdf':
        throw new Error('PDF export not yet implemented');
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private compareObjects(
    obj1: any,
    obj2: any,
    path: string,
    differences: WorkflowDifference[]
  ): void {
    const keys1 = Object.keys(obj1 || {});
    const keys2 = Object.keys(obj2 || {});
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const value1 = obj1?.[key];
      const value2 = obj2?.[key];
      
      if (value1 === undefined && value2 !== undefined) {
        differences.push({
          path: currentPath,
          type: 'added',
          newValue: value2
        });
      } else if (value1 !== undefined && value2 === undefined) {
        differences.push({
          path: currentPath,
          type: 'removed',
          oldValue: value1
        });
      } else if (typeof value1 === 'object' && typeof value2 === 'object') {
        if (Array.isArray(value1) && Array.isArray(value2)) {
          if (JSON.stringify(value1) !== JSON.stringify(value2)) {
            differences.push({
              path: currentPath,
              type: 'modified',
              oldValue: value1,
              newValue: value2
            });
          }
        } else {
          this.compareObjects(value1, value2, currentPath, differences);
        }
      } else if (value1 !== value2) {
        differences.push({
          path: currentPath,
          type: 'modified',
          oldValue: value1,
          newValue: value2
        });
      }
    }
  }

  private convertToXML(obj: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<workflow>\n';
    
    const convertValue = (key: string, value: any, indent: number = 2): string => {
      const spacing = ' '.repeat(indent);
      
      if (value === null || value === undefined) {
        return `${spacing}<${key}/>\n`;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          let result = '';
          for (const item of value) {
            result += `${spacing}<${key}>\n`;
            if (typeof item === 'object') {
              for (const [k, v] of Object.entries(item)) {
                result += convertValue(k, v, indent + 2);
              }
            } else {
              result += `${spacing}  ${item}\n`;
            }
            result += `${spacing}</${key}>\n`;
          }
          return result;
        } else {
          let result = `${spacing}<${key}>\n`;
          for (const [k, v] of Object.entries(value)) {
            result += convertValue(k, v, indent + 2);
          }
          result += `${spacing}</${key}>\n`;
          return result;
        }
      } else {
        return `${spacing}<${key}>${value}</${key}>\n`;
      }
    };
    
    for (const [key, value] of Object.entries(obj)) {
      xml += convertValue(key, value);
    }
    
    xml += '</workflow>';
    return xml;
  }
}