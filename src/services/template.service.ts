import { BaseApiClient } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';
import {
  ITemplateService,
  Template,
  TemplateListOptions,
  CreateFromTemplateOptions,
  TemplateResult,
  TemplateValidationResult,
  TemplateMetadata,
  TemplateVariable
} from '../interfaces/template.interfaces';
import * as path from 'path';

export class TemplateService implements ITemplateService {
  constructor(
    private apiClient: BaseApiClient,
    private platform: IPlatform
  ) {}

  async listTemplates(options?: TemplateListOptions): Promise<Template[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    
    const params: any = {
      page,
      limit
    };
    
    if (options?.search) {
      params.search = options.search;
    }
    
    if (options?.category) {
      params.category = options.category;
    }
    
    if (options?.tags && options.tags.length > 0) {
      params.tags = options.tags.join(',');
    }
    
    const response = await this.apiClient.get('/api/templates', { params });
    
    if (response?.data) {
      return response.data.map(this.mapToTemplate);
    }
    
    return [];
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await this.apiClient.get(`/api/templates/${id}`);
    
    if (!response) {
      throw new Error(`Template ${id} not found`);
    }
    
    return this.mapToTemplate(response);
  }

  async createFromTemplate(templateId: string, options: CreateFromTemplateOptions): Promise<TemplateResult> {
    try {
      const template = await this.getTemplate(templateId);
      
      // Validate required variables
      if (template.variables) {
        const missingVariables = template.variables
          .filter(v => v.required && !options.variables?.[v.name])
          .map(v => v.name);
        
        if (missingVariables.length > 0) {
          return {
            success: false,
            files: [],
            errors: [`Missing required variables: ${missingVariables.join(', ')}`]
          };
        }
      }
      
      const payload = {
        templateId,
        name: options.name,
        variables: options.variables || {},
        overwrite: options.overwrite || false
      };
      
      const response = await this.apiClient.post('/api/templates/create', payload);
      
      if (!response || !response.success) {
        return {
          success: false,
          files: [],
          message: response?.message || 'Failed to create from template',
          errors: response?.errors || []
        };
      }
      
      // Save files locally if destination is provided
      if (options.destination && response.files) {
        const savedFiles: string[] = [];
        
        for (const file of response.files) {
          const filePath = path.join(options.destination, file.path);
          const dir = path.dirname(filePath);
          
          await this.platform.createDirectory(dir);
          await this.platform.writeFile(filePath, file.content);
          
          savedFiles.push(filePath);
        }
        
        this.platform.showInformationMessage(`Created ${savedFiles.length} files from template`);
        
        return {
          success: true,
          files: savedFiles,
          message: `Successfully created from template ${templateId}`
        };
      }
      
      return {
        success: true,
        files: response.files?.map((f: any) => f.path) || [],
        message: response.message || `Successfully created from template ${templateId}`
      };
    } catch (error: any) {
      return {
        success: false,
        files: [],
        message: error.message || 'Failed to create from template',
        errors: [error.message]
      };
    }
  }

  async validateTemplate(template: Template): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic validation
    if (!template.id) {
      errors.push('Template ID is required');
    }
    
    if (!template.name) {
      errors.push('Template name is required');
    }
    
    if (!template.category) {
      errors.push('Template category is required');
    }
    
    // Validate variables
    if (template.variables) {
      const variableNames = new Set<string>();
      
      for (const variable of template.variables) {
        if (!variable.name) {
          errors.push('Variable name is required');
        } else if (variableNames.has(variable.name)) {
          errors.push(`Duplicate variable name: ${variable.name}`);
        } else {
          variableNames.add(variable.name);
        }
        
        if (!['string', 'number', 'boolean', 'array', 'object'].includes(variable.type)) {
          errors.push(`Invalid variable type: ${variable.type}`);
        }
        
        // Check for deprecated patterns
        if (variable.name.startsWith('_')) {
          warnings.push(`Variable name ${variable.name} starts with underscore, which is deprecated`);
        }
      }
    }
    
    // Validate schema if present
    if (template.schema) {
      try {
        if (typeof template.schema === 'string') {
          JSON.parse(template.schema);
        }
      } catch (error) {
        errors.push('Invalid template schema: must be valid JSON');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async getTemplateMetadata(id: string): Promise<TemplateMetadata> {
    const response = await this.apiClient.get(`/api/templates/${id}/metadata`);
    
    if (!response) {
      // Return basic metadata if endpoint doesn't exist
      const template = await this.getTemplate(id);
      return {
        id: template.id,
        author: undefined,
        tags: [],
        dependencies: [],
        compatibility: [],
        documentation: template.description
      };
    }
    
    return {
      id,
      author: response.author,
      tags: response.tags || [],
      dependencies: response.dependencies || [],
      compatibility: response.compatibility || [],
      documentation: response.documentation
    };
  }

  private mapToTemplate(data: any): Template {
    return {
      id: data.id || data.systemName,
      name: data.name || data.displayName,
      description: data.description || '',
      category: data.category || 'general',
      version: data.version || '1.0.0',
      schema: data.schema,
      variables: this.mapVariables(data.variables || data.parameters),
      createdAt: new Date(data.createdAt || data.created || Date.now()),
      updatedAt: new Date(data.updatedAt || data.modified || Date.now())
    };
  }

  private mapVariables(variables: any): TemplateVariable[] | undefined {
    if (!variables) {
      return undefined;
    }
    
    if (Array.isArray(variables)) {
      return variables.map(v => ({
        name: v.name || v.key,
        type: this.mapVariableType(v.type),
        required: v.required !== false,
        default: v.default || v.defaultValue,
        description: v.description,
        validation: v.validation || v.rules
      }));
    }
    
    // Handle object-based variable definitions
    return Object.entries(variables).map(([key, value]: [string, any]) => ({
      name: key,
      type: this.mapVariableType(value.type || typeof value),
      required: value.required !== false,
      default: value.default || value,
      description: value.description,
      validation: value.validation
    }));
  }

  private mapVariableType(type: any): 'string' | 'number' | 'boolean' | 'array' | 'object' {
    const typeStr = String(type).toLowerCase();
    
    switch (typeStr) {
      case 'string':
      case 'text':
        return 'string';
      case 'number':
      case 'integer':
      case 'float':
        return 'number';
      case 'boolean':
      case 'bool':
        return 'boolean';
      case 'array':
      case 'list':
        return 'array';
      case 'object':
      case 'json':
        return 'object';
      default:
        return 'string';
    }
  }
}