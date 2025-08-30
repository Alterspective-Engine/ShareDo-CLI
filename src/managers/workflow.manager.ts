import { WorkflowApiClient, ShareDoError } from '@sharedo/core';
import { IPlatform, IProgressReporter } from '@sharedo/platform-adapter';

export interface WorkflowManagerOptions {
  autoSave?: boolean;
  validateOnUpload?: boolean;
}

export class WorkflowManager {
  constructor(
    private platform: IPlatform,
    private apiClient: WorkflowApiClient
  ) {}

  /**
   * Download a workflow by name and save to selected location
   */
  async downloadWorkflow(name: string): Promise<void> {
    const progress = this.platform.ui.showProgress('Downloading workflow...');
    
    try {
      // Fetch workflow from server
      progress.report({ message: 'Fetching from server...', percentage: 20 });
      const workflow = await this.apiClient.getWorkflow(name);
      
      // Let user select save location
      progress.report({ message: 'Selecting save location...', percentage: 60 });
      const savePath = await this.platform.ui.selectFolder({
        title: 'Select folder to save workflow',
        defaultPath: this.platform.fs.getWorkspaceRoot()
      });
      
      if (!savePath) {
        progress.cancel();
        return;
      }
      
      // Save workflow to file
      progress.report({ message: 'Saving file...', percentage: 80 });
      const fileName = `${name.replace(/[^a-z0-9]/gi, '_')}.json`;
      const filePath = this.platform.fs.join(savePath, fileName);
      
      await this.platform.fs.writeFile(
        filePath, 
        JSON.stringify(workflow, null, 2)
      );
      
      progress.complete();
      await this.platform.ui.showInfo(`Workflow saved to ${filePath}`);
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to download workflow: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }

  /**
   * Upload a workflow from file or object
   */
  async uploadWorkflow(
    workflow: string | object, 
    options?: WorkflowManagerOptions
  ): Promise<void> {
    const progress = this.platform.ui.showProgress('Uploading workflow...');
    
    try {
      let workflowData: any;
      
      // Load workflow if path provided
      if (typeof workflow === 'string') {
        progress.report({ message: 'Loading workflow file...', percentage: 10 });
        const content = await this.platform.fs.readFile(workflow);
        workflowData = JSON.parse(content);
      } else {
        workflowData = workflow;
      }
      
      // Validate if requested
      if (options?.validateOnUpload) {
        progress.report({ message: 'Validating workflow...', percentage: 30 });
        const validation = await this.validateWorkflow(workflowData);
        
        if (!validation.isValid) {
          const errors = validation.errors.join('\n');
          throw new Error(`Workflow validation failed:\n${errors}`);
        }
      }
      
      // Upload to server
      progress.report({ message: 'Uploading to server...', percentage: 60 });
      const result = await this.apiClient.createWorkflow(workflowData);
      
      // Auto-save if requested
      if (options?.autoSave && result.id) {
        progress.report({ message: 'Saving uploaded workflow...', percentage: 80 });
        const savePath = this.platform.fs.join(
          this.platform.fs.getWorkspaceRoot(),
          'workflows',
          `${result.id}.json`
        );
        
        await this.platform.fs.ensureDir(
          this.platform.fs.dirname(savePath)
        );
        
        await this.platform.fs.writeFile(
          savePath,
          JSON.stringify(result, null, 2)
        );
      }
      
      progress.complete();
      await this.platform.ui.showInfo('Workflow uploaded successfully');
      
    } catch (error) {
      progress.error(error as Error);
      
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to upload workflow: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }

  /**
   * Validate a workflow structure
   */
  async validateWorkflow(workflow: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation
    if (!workflow.name) {
      errors.push('Workflow must have a name');
    }
    
    if (!workflow.type) {
      errors.push('Workflow must have a type');
    }
    
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      errors.push('Workflow must have steps array');
    } else {
      // Validate steps
      workflow.steps.forEach((step: any, index: number) => {
        if (!step.id) {
          errors.push(`Step ${index} is missing an ID`);
        }
        if (!step.type) {
          errors.push(`Step ${index} is missing a type`);
        }
      });
    }
    
    // Check for deprecated fields
    if (workflow.version && typeof workflow.version === 'number') {
      warnings.push('Numeric version is deprecated, use semantic versioning');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Compare two workflows and show differences
   */
  async compareWorkflows(
    workflow1: string | object,
    workflow2: string | object
  ): Promise<{
    identical: boolean;
    differences: Array<{
      path: string;
      type: 'added' | 'removed' | 'modified';
      value1?: any;
      value2?: any;
    }>;
  }> {
    const progress = this.platform.ui.showProgress('Comparing workflows...');
    
    try {
      // Load workflows
      progress.report({ message: 'Loading workflows...', percentage: 20 });
      
      let w1: any;
      let w2: any;
      
      if (typeof workflow1 === 'string') {
        const content = await this.platform.fs.readFile(workflow1);
        w1 = JSON.parse(content);
      } else {
        w1 = workflow1;
      }
      
      if (typeof workflow2 === 'string') {
        const content = await this.platform.fs.readFile(workflow2);
        w2 = JSON.parse(content);
      } else {
        w2 = workflow2;
      }
      
      // Compare workflows
      progress.report({ message: 'Analyzing differences...', percentage: 60 });
      const differences: any[] = [];
      
      this.compareObjects(w1, w2, '', differences);
      
      progress.complete();
      
      // Show summary
      if (differences.length === 0) {
        await this.platform.ui.showInfo('Workflows are identical');
      } else {
        await this.platform.ui.showInfo(
          `Found ${differences.length} difference(s) between workflows`
        );
      }
      
      return {
        identical: differences.length === 0,
        differences
      };
      
    } catch (error) {
      progress.error(error as Error);
      throw error;
    }
  }

  /**
   * List available workflows
   */
  async listWorkflows(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<any[]> {
    try {
      const workflows = await this.apiClient.listWorkflows(
        options?.limit || 20,
        options?.offset || 0,
        options?.search
      );
      
      return workflows;
    } catch (error) {
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to list workflows: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const confirmed = await this.platform.ui.confirm(
      `Are you sure you want to delete workflow ${id}?`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      await this.apiClient.deleteWorkflow(id);
      await this.platform.ui.showInfo('Workflow deleted successfully');
    } catch (error) {
      if (error instanceof ShareDoError) {
        await this.platform.ui.showError(
          `Failed to delete workflow: ${(error as Error).message}`
        );
      }
      throw error;
    }
  }

  /**
   * Helper method to compare objects recursively
   */
  private compareObjects(
    obj1: any,
    obj2: any,
    path: string,
    differences: any[]
  ): void {
    const keys1 = Object.keys(obj1 || {});
    const keys2 = Object.keys(obj2 || {});
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];
      
      if (val1 === undefined && val2 !== undefined) {
        differences.push({
          path: currentPath,
          type: 'added',
          value2: val2
        });
      } else if (val1 !== undefined && val2 === undefined) {
        differences.push({
          path: currentPath,
          type: 'removed',
          value1: val1
        });
      } else if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (Array.isArray(val1) && Array.isArray(val2)) {
          if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            differences.push({
              path: currentPath,
              type: 'modified',
              value1: val1,
              value2: val2
            });
          }
        } else if (val1 !== null && val2 !== null) {
          this.compareObjects(val1, val2, currentPath, differences);
        } else if (val1 !== val2) {
          differences.push({
            path: currentPath,
            type: 'modified',
            value1: val1,
            value2: val2
          });
        }
      } else if (val1 !== val2) {
        differences.push({
          path: currentPath,
          type: 'modified',
          value1: val1,
          value2: val2
        });
      }
    }
  }
}