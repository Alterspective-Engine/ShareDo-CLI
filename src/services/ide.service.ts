import { BaseApiClient } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';
import {
  IIDEService,
  IDERequest,
  IDEResponse,
  IDEContext,
  ActionManifest,
  IDEAction,
  IDECommand,
  IDEProvider,
  ActionResult,
  IDEHelpers,
  CodeSnippet,
  Shortcut,
  SyncOptions,
  SyncResult
} from '../interfaces/ide.interfaces';
import * as path from 'path';

export class IDEService implements IIDEService {
  private actionHandlers: Map<string, (params: any) => Promise<any>>;

  constructor(
    private apiClient: BaseApiClient,
    private platform: IPlatform
  ) {
    this.actionHandlers = new Map();
    this.registerDefaultActions();
  }

  async handleIDERequest(request: IDERequest): Promise<IDEResponse> {
    try {
      switch (request.type) {
        case 'action':
          return await this.handleAction(request);
        
        case 'query':
          return await this.handleQuery(request);
        
        case 'command':
          return await this.handleCommand(request);
        
        default:
          return {
            success: false,
            error: `Unknown request type: ${request.type}`
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to handle IDE request'
      };
    }
  }

  async getActionManifest(): Promise<ActionManifest> {
    const response = await this.apiClient.get('/api/ide/manifest');
    
    if (response) {
      return response;
    }
    
    // Return default manifest if API doesn't provide one
    return {
      version: '1.0.0',
      actions: this.getDefaultActions(),
      commands: this.getDefaultCommands(),
      providers: this.getDefaultProviders()
    };
  }

  async executeAction(actionId: string, params: any): Promise<ActionResult> {
    try {
      // Check if we have a local handler
      const handler = this.actionHandlers.get(actionId);
      if (handler) {
        const result = await handler(params);
        return {
          success: true,
          result,
          affectedFiles: params.files || []
        };
      }
      
      // Otherwise, send to server
      const response = await this.apiClient.post('/api/ide/actions/execute', {
        actionId,
        params
      });
      
      if (!response || !response.success) {
        return {
          success: false,
          error: response?.error || 'Action execution failed'
        };
      }
      
      return {
        success: true,
        result: response.result,
        affectedFiles: response.affectedFiles || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to execute action'
      };
    }
  }

  async getIDEHelpers(): Promise<IDEHelpers> {
    const response = await this.apiClient.get('/api/ide/helpers');
    
    if (response) {
      return response;
    }
    
    // Return default helpers
    return {
      snippets: this.getDefaultSnippets(),
      templates: [],
      shortcuts: this.getDefaultShortcuts()
    };
  }

  async syncWorkspace(options: SyncOptions): Promise<SyncResult> {
    try {
      const workspaceRoot = this.platform.getWorkspaceRoot();
      
      const payload = {
        workspacePath: workspaceRoot,
        direction: options.direction,
        includeFiles: options.includeFiles || [],
        excludeFiles: options.excludeFiles || [],
        force: options.force || false
      };
      
      const response = await this.apiClient.post('/api/ide/sync', payload);
      
      if (!response || !response.success) {
        return {
          success: false,
          filesUpdated: [],
          filesCreated: [],
          filesDeleted: [],
          error: response?.error || 'Sync failed'
        };
      }
      
      // Apply changes locally if pulling or bidirectional sync
      if (options.direction === 'pull' || options.direction === 'both') {
        for (const file of response.filesToCreate || []) {
          const filePath = path.join(workspaceRoot, file.path);
          await this.platform.createDirectory(path.dirname(filePath));
          await this.platform.writeFile(filePath, file.content);
        }
        
        for (const file of response.filesToUpdate || []) {
          const filePath = path.join(workspaceRoot, file.path);
          await this.platform.writeFile(filePath, file.content);
        }
        
        for (const filePath of response.filesToDelete || []) {
          const fullPath = path.join(workspaceRoot, filePath);
          await this.platform.deleteFile(fullPath);
        }
      }
      
      this.platform.showInformationMessage(`Workspace sync completed successfully`);
      
      return {
        success: true,
        filesUpdated: response.filesUpdated || [],
        filesCreated: response.filesCreated || [],
        filesDeleted: response.filesDeleted || [],
        conflicts: response.conflicts || []
      };
    } catch (error: any) {
      return {
        success: false,
        filesUpdated: [],
        filesCreated: [],
        filesDeleted: [],
        error: error.message || 'Sync failed'
      };
    }
  }

  private async handleAction(request: IDERequest): Promise<IDEResponse> {
    if (!request.action) {
      return {
        success: false,
        error: 'Action ID is required'
      };
    }
    
    const result = await this.executeAction(request.action, request.params);
    
    return {
      success: result.success,
      data: result.result,
      error: result.error,
      metadata: {
        affectedFiles: result.affectedFiles
      }
    };
  }

  private async handleQuery(request: IDERequest): Promise<IDEResponse> {
    const response = await this.apiClient.post('/api/ide/query', {
      query: request.action,
      params: request.params,
      context: request.context
    });
    
    if (!response) {
      return {
        success: false,
        error: 'Query failed'
      };
    }
    
    return {
      success: true,
      data: response
    };
  }

  private async handleCommand(request: IDERequest): Promise<IDEResponse> {
    const response = await this.apiClient.post('/api/ide/command', {
      command: request.action,
      params: request.params,
      context: request.context
    });
    
    if (!response) {
      return {
        success: false,
        error: 'Command execution failed'
      };
    }
    
    return {
      success: true,
      data: response
    };
  }

  private registerDefaultActions(): void {
    // Register format action
    this.actionHandlers.set('format', async (params: any) => {
      const { file, content } = params;
      // Simple formatting logic - in real implementation, use proper formatters
      const formatted = content
        .replace(/\s+$/gm, '') // Remove trailing whitespace
        .replace(/\t/g, '  '); // Replace tabs with spaces
      
      if (file) {
        await this.platform.writeFile(file, formatted);
      }
      
      return { formatted, file };
    });
    
    // Register validate action
    this.actionHandlers.set('validate', async (params: any) => {
      const { file, content, type } = params;
      const errors: any[] = [];
      
      if (type === 'json') {
        try {
          JSON.parse(content);
        } catch (error: any) {
          errors.push({
            line: 1,
            message: error.message
          });
        }
      }
      
      return { valid: errors.length === 0, errors };
    });
  }

  private getDefaultActions(): IDEAction[] {
    return [
      {
        id: 'format',
        name: 'Format Document',
        description: 'Format the current document',
        category: 'Editor',
        shortcut: 'Shift+Alt+F',
        params: [
          {
            name: 'file',
            type: 'string',
            required: false,
            description: 'File path to format'
          },
          {
            name: 'content',
            type: 'string',
            required: true,
            description: 'Content to format'
          }
        ]
      },
      {
        id: 'validate',
        name: 'Validate Document',
        description: 'Validate the current document',
        category: 'Editor',
        params: [
          {
            name: 'file',
            type: 'string',
            required: false,
            description: 'File path to validate'
          },
          {
            name: 'content',
            type: 'string',
            required: true,
            description: 'Content to validate'
          },
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Document type (json, xml, etc.)'
          }
        ]
      }
    ];
  }

  private getDefaultCommands(): IDECommand[] {
    return [
      {
        id: 'sharedo.syncWorkspace',
        name: 'Sync Workspace',
        description: 'Synchronize workspace with ShareDo',
        handler: 'syncWorkspace'
      },
      {
        id: 'sharedo.downloadWorkflow',
        name: 'Download Workflow',
        description: 'Download a workflow from ShareDo',
        handler: 'downloadWorkflow'
      }
    ];
  }

  private getDefaultProviders(): IDEProvider[] {
    return [
      {
        id: 'sharedo.completion',
        type: 'completion',
        languages: ['javascript', 'typescript', 'json'],
        configuration: {}
      },
      {
        id: 'sharedo.hover',
        type: 'hover',
        languages: ['javascript', 'typescript'],
        configuration: {}
      }
    ];
  }

  private getDefaultSnippets(): CodeSnippet[] {
    return [
      {
        id: 'workflow-template',
        name: 'Workflow Template',
        language: 'json',
        code: JSON.stringify({
          id: '${1:workflow-id}',
          name: '${2:Workflow Name}',
          description: '${3:Description}',
          steps: []
        }, null, 2),
        description: 'Basic workflow template',
        variables: ['workflow-id', 'Workflow Name', 'Description']
      }
    ];
  }

  private getDefaultShortcuts(): Shortcut[] {
    return [
      {
        key: 'ctrl+shift+s',
        command: 'sharedo.syncWorkspace',
        when: 'editorFocus'
      },
      {
        key: 'ctrl+shift+d',
        command: 'sharedo.downloadWorkflow',
        when: 'editorFocus'
      }
    ];
  }
}