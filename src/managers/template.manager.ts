import { ShareDoError } from '@sharedo/core';
import { IPlatform, IProgressReporter } from '@sharedo/platform-adapter';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'list' | 'object';
  description?: string;
  required?: boolean;
  defaultValue?: any;
  format?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  content: string;
  variables?: TemplateVariable[];
  conditional?: {
    variable: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
    value: any;
  };
  repeatable?: {
    variable: string;
    itemVariable?: string;
  };
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  type: 'document' | 'email' | 'report' | 'contract' | 'custom';
  format: 'word' | 'pdf' | 'html' | 'markdown' | 'text';
  version?: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateData {
  variables: Record<string, any>;
  context?: Record<string, any>;
}

export interface TemplateRenderResult {
  content: string;
  format: string;
  warnings?: string[];
  metadata?: Record<string, any>;
}

export class TemplateManager {
  private templatesCache: Map<string, Template> = new Map();
  
  constructor(
    private platform: IPlatform
  ) {}

  /**
   * Create a new template
   */
  async createTemplate(template: Partial<Template>): Promise<Template> {
    const progress = this.platform.ui.showProgress('Creating template...');
    
    try {
      // Validate template structure
      progress.report({ message: 'Validating template...', percentage: 20 });
      this.validateTemplateStructure(template);
      
      // Generate ID if not provided
      const newTemplate: Template = {
        id: template.id || this.generateTemplateId(),
        name: template.name || 'Untitled Template',
        description: template.description,
        type: template.type || 'document',
        format: template.format || 'markdown',
        version: template.version || '1.0.0',
        sections: template.sections || [],
        variables: template.variables || [],
        metadata: template.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Extract variables from sections
      progress.report({ message: 'Processing variables...', percentage: 40 });
      this.extractAndMergeVariables(newTemplate);
      
      // Save template
      progress.report({ message: 'Saving template...', percentage: 70 });
      await this.saveTemplate(newTemplate);
      
      // Cache the template
      this.templatesCache.set(newTemplate.id, newTemplate);
      
      progress.complete();
      await this.platform.ui.showInfo(`Template "${newTemplate.name}" created successfully`);
      
      return newTemplate;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to create template: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Read/load a template
   */
  async readTemplate(templateId: string): Promise<Template | null> {
    // Check cache first
    if (this.templatesCache.has(templateId)) {
      return this.templatesCache.get(templateId)!;
    }
    
    try {
      const templatePath = await this.getTemplatePath(templateId);
      
      if (!await this.platform.fs.exists(templatePath)) {
        return null;
      }
      
      const content = await this.platform.fs.readFile(templatePath);
      const template = JSON.parse(content) as Template;
      
      // Cache the template
      this.templatesCache.set(templateId, template);
      
      return template;
      
    } catch (error) {
      await this.platform.ui.showError(
        `Failed to read template ${templateId}: ${(error as Error).message}`
      );
      return null;
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
    const progress = this.platform.ui.showProgress('Updating template...');
    
    try {
      // Load existing template
      progress.report({ message: 'Loading template...', percentage: 20 });
      const existingTemplate = await this.readTemplate(templateId);
      
      if (!existingTemplate) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Merge updates
      progress.report({ message: 'Applying updates...', percentage: 40 });
      const updatedTemplate: Template = {
        ...existingTemplate,
        ...updates,
        id: existingTemplate.id, // Preserve ID
        createdAt: existingTemplate.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString()
      };
      
      // Validate updated template
      progress.report({ message: 'Validating changes...', percentage: 60 });
      this.validateTemplateStructure(updatedTemplate);
      this.extractAndMergeVariables(updatedTemplate);
      
      // Save updated template
      progress.report({ message: 'Saving template...', percentage: 80 });
      await this.saveTemplate(updatedTemplate);
      
      // Update cache
      this.templatesCache.set(templateId, updatedTemplate);
      
      progress.complete();
      await this.platform.ui.showInfo(`Template "${updatedTemplate.name}" updated successfully`);
      
      return updatedTemplate;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to update template: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const confirmed = await this.platform.ui.confirm(
      `Are you sure you want to delete template ${templateId}?`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      const templatePath = await this.getTemplatePath(templateId);
      
      if (await this.platform.fs.exists(templatePath)) {
        await this.platform.fs.unlink(templatePath);
      }
      
      // Remove from cache
      this.templatesCache.delete(templateId);
      
      await this.platform.ui.showInfo('Template deleted successfully');
      
    } catch (error) {
      await this.platform.ui.showError(
        `Failed to delete template: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * List all available templates
   */
  async listTemplates(type?: string): Promise<Template[]> {
    try {
      const templatesDir = await this.getTemplatesDirectory();
      
      if (!await this.platform.fs.exists(templatesDir)) {
        return [];
      }
      
      const files = await this.platform.fs.readdir(templatesDir);
      const templates: Template[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = this.platform.fs.join(templatesDir, file);
          const content = await this.platform.fs.readFile(filePath);
          
          try {
            const template = JSON.parse(content) as Template;
            
            // Filter by type if specified
            if (!type || template.type === type) {
              templates.push(template);
            }
          } catch (error) {
            await this.platform.ui.showWarning(
              `Failed to parse template file ${file}: ${(error as Error).message}`
            );
          }
        }
      }
      
      return templates.sort((a, b) => 
        (b.updatedAt || '').localeCompare(a.updatedAt || '')
      );
      
    } catch (error) {
      await this.platform.ui.showError(
        `Failed to list templates: ${(error as Error).message}`
      );
      return [];
    }
  }

  /**
   * Render a template with data
   */
  async renderTemplate(templateId: string, data: TemplateData): Promise<TemplateRenderResult> {
    const progress = this.platform.ui.showProgress('Rendering template...');
    
    try {
      // Load template
      progress.report({ message: 'Loading template...', percentage: 20 });
      const template = await this.readTemplate(templateId);
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Validate data
      progress.report({ message: 'Validating data...', percentage: 30 });
      const validation = this.validateTemplateData(template, data);
      
      if (!validation.isValid) {
        throw new Error(`Template data validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Process sections
      progress.report({ message: 'Processing sections...', percentage: 50 });
      const renderedSections: string[] = [];
      const warnings: string[] = [...validation.warnings];
      
      for (const section of template.sections) {
        const rendered = await this.renderSection(section, data, warnings);
        if (rendered !== null) {
          renderedSections.push(rendered);
        }
      }
      
      // Combine sections
      progress.report({ message: 'Combining content...', percentage: 70 });
      const content = this.combineSections(renderedSections, template.format);
      
      // Format output
      progress.report({ message: 'Formatting output...', percentage: 90 });
      const formattedContent = await this.formatContent(content, template.format);
      
      progress.complete();
      
      return {
        content: formattedContent,
        format: template.format,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          renderedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to render template: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(templateId: string): Promise<string> {
    const template = await this.readTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Generate sample data
    const sampleData: TemplateData = {
      variables: this.generateSampleData(template.variables)
    };
    
    // Render with sample data
    const result = await this.renderTemplate(templateId, sampleData);
    
    // Show preview
    await this.platform.ui.showDocument(result.content, {
      title: `Preview: ${template.name}`,
      language: template.format === 'html' ? 'html' : template.format === 'markdown' ? 'markdown' : 'text'
    });
    
    return result.content;
  }

  /**
   * Clone a template
   */
  async cloneTemplate(templateId: string, newName?: string): Promise<Template> {
    const original = await this.readTemplate(templateId);
    
    if (!original) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const cloned = await this.createTemplate({
      ...original,
      id: undefined, // Generate new ID
      name: newName || `${original.name} (Copy)`,
      metadata: {
        ...original.metadata,
        clonedFrom: templateId,
        clonedAt: new Date().toISOString()
      }
    });
    
    await this.platform.ui.showInfo(`Template cloned as "${cloned.name}"`);
    
    return cloned;
  }

  /**
   * Export template to file
   */
  async exportTemplate(templateId: string): Promise<string> {
    const template = await this.readTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const savePath = await this.platform.ui.saveFile({
      title: 'Export Template',
      defaultName: `${template.name.replace(/[^a-z0-9]/gi, '_')}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    
    if (!savePath) {
      throw new Error('Export cancelled');
    }
    
    await this.platform.fs.writeFile(savePath, JSON.stringify(template, null, 2));
    await this.platform.ui.showInfo(`Template exported to ${savePath}`);
    
    return savePath;
  }

  /**
   * Import template from file
   */
  async importTemplate(filePath: string): Promise<Template> {
    const progress = this.platform.ui.showProgress('Importing template...');
    
    try {
      // Read file
      progress.report({ message: 'Reading file...', percentage: 30 });
      const content = await this.platform.fs.readFile(filePath);
      const templateData = JSON.parse(content);
      
      // Create new template
      progress.report({ message: 'Creating template...', percentage: 70 });
      const template = await this.createTemplate({
        ...templateData,
        id: undefined, // Generate new ID
        metadata: {
          ...templateData.metadata,
          importedFrom: filePath,
          importedAt: new Date().toISOString()
        }
      });
      
      progress.complete();
      await this.platform.ui.showInfo(`Template "${template.name}" imported successfully`);
      
      return template;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to import template: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Validate template structure
   */
  private validateTemplateStructure(template: Partial<Template>): void {
    if (!template.name || template.name.trim() === '') {
      throw new Error('Template must have a name');
    }
    
    if (!template.type) {
      throw new Error('Template must have a type');
    }
    
    if (!template.format) {
      throw new Error('Template must have a format');
    }
    
    if (!template.sections || !Array.isArray(template.sections)) {
      throw new Error('Template must have sections array');
    }
    
    for (const section of template.sections) {
      if (!section.id || !section.name || !section.content) {
        throw new Error('Each section must have id, name, and content');
      }
    }
  }

  /**
   * Extract and merge variables from sections
   */
  private extractAndMergeVariables(template: Template): void {
    const allVariables = new Map<string, TemplateVariable>();
    
    // Add explicitly defined variables
    for (const variable of template.variables) {
      allVariables.set(variable.name, variable);
    }
    
    // Extract variables from section content
    for (const section of template.sections) {
      const extracted = this.extractVariablesFromContent(section.content);
      
      for (const varName of extracted) {
        if (!allVariables.has(varName)) {
          allVariables.set(varName, {
            name: varName,
            type: 'text',
            description: `Variable used in section: ${section.name}`
          });
        }
      }
      
      // Add section-specific variables
      if (section.variables) {
        for (const variable of section.variables) {
          allVariables.set(variable.name, variable);
        }
      }
    }
    
    template.variables = Array.from(allVariables.values());
  }

  /**
   * Extract variable names from content
   */
  private extractVariablesFromContent(content: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }
    
    return variables;
  }

  /**
   * Validate template data
   */
  private validateTemplateData(template: Template, data: TemplateData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const variable of template.variables) {
      const value = data.variables[variable.name];
      
      // Check required variables
      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required variable "${variable.name}" is missing`);
        continue;
      }
      
      // Skip validation for optional empty variables
      if (!variable.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Type validation
      if (!this.validateVariableType(value, variable.type)) {
        errors.push(`Variable "${variable.name}" has invalid type. Expected ${variable.type}`);
      }
      
      // Additional validation rules
      if (variable.validation) {
        const validationErrors = this.validateVariableRules(value, variable);
        errors.push(...validationErrors);
      }
    }
    
    // Check for undefined variables in data
    for (const varName in data.variables) {
      if (!template.variables.find(v => v.name === varName)) {
        warnings.push(`Unknown variable "${varName}" in data`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate variable type
   */
  private validateVariableType(value: any, type: string): boolean {
    switch (type) {
      case 'text':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(value));
      case 'boolean':
        return typeof value === 'boolean';
      case 'list':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validate variable against rules
   */
  private validateVariableRules(value: any, variable: TemplateVariable): string[] {
    const errors: string[] = [];
    const validation = variable.validation;
    
    if (!validation) {
      return errors;
    }
    
    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        errors.push(`Variable "${variable.name}" does not match required pattern`);
      }
    }
    
    // Min/Max for numbers
    if (variable.type === 'number') {
      const numValue = Number(value);
      
      if (validation.min !== undefined && numValue < validation.min) {
        errors.push(`Variable "${variable.name}" must be at least ${validation.min}`);
      }
      
      if (validation.max !== undefined && numValue > validation.max) {
        errors.push(`Variable "${variable.name}" must be at most ${validation.max}`);
      }
    }
    
    // Enum validation
    if (validation.enum && !validation.enum.includes(value)) {
      errors.push(`Variable "${variable.name}" must be one of: ${validation.enum.join(', ')}`);
    }
    
    return errors;
  }

  /**
   * Render a section with data
   */
  private async renderSection(
    section: TemplateSection, 
    data: TemplateData, 
    warnings: string[]
  ): Promise<string | null> {
    // Check conditional
    if (section.conditional) {
      const shouldRender = this.evaluateCondition(section.conditional, data.variables);
      if (!shouldRender) {
        return null;
      }
    }
    
    // Handle repeatable sections
    if (section.repeatable) {
      return this.renderRepeatableSection(section, data, warnings);
    }
    
    // Render normal section
    return this.substituteVariables(section.content, data.variables, warnings);
  }

  /**
   * Evaluate conditional expression
   */
  private evaluateCondition(
    condition: { variable: string; operator: string; value: any },
    variables: Record<string, any>
  ): boolean {
    const varValue = variables[condition.variable];
    
    switch (condition.operator) {
      case 'eq':
        return varValue === condition.value;
      case 'ne':
        return varValue !== condition.value;
      case 'gt':
        return varValue > condition.value;
      case 'lt':
        return varValue < condition.value;
      case 'gte':
        return varValue >= condition.value;
      case 'lte':
        return varValue <= condition.value;
      case 'contains':
        return String(varValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(varValue);
      default:
        return false;
    }
  }

  /**
   * Render repeatable section
   */
  private renderRepeatableSection(
    section: TemplateSection,
    data: TemplateData,
    warnings: string[]
  ): string {
    const listData = data.variables[section.repeatable!.variable];
    
    if (!Array.isArray(listData)) {
      warnings.push(`Variable "${section.repeatable!.variable}" should be a list for repeatable section`);
      return '';
    }
    
    const renderedItems: string[] = [];
    const itemVar = section.repeatable!.itemVariable || 'item';
    
    for (const item of listData) {
      const itemVariables = {
        ...data.variables,
        [itemVar]: item
      };
      
      const rendered = this.substituteVariables(section.content, itemVariables, warnings);
      renderedItems.push(rendered);
    }
    
    return renderedItems.join('\\n');
  }

  /**
   * Substitute variables in content
   */
  private substituteVariables(
    content: string,
    variables: Record<string, any>,
    warnings: string[]
  ): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      const value = variables[trimmedName];
      
      if (value === undefined) {
        warnings.push(`Variable "${trimmedName}" not found in data`);
        return match;
      }
      
      // Format value based on type
      if (value === null) {
        return '';
      } else if (typeof value === 'object') {
        return JSON.stringify(value);
      } else {
        return String(value);
      }
    });
  }

  /**
   * Combine sections based on format
   */
  private combineSections(sections: string[], format: string): string {
    switch (format) {
      case 'markdown':
      case 'text':
        return sections.join('\\n\\n');
      case 'html':
        return sections.join('\\n');
      default:
        return sections.join('\\n\\n');
    }
  }

  /**
   * Format content based on output format
   */
  private async formatContent(content: string, format: string): Promise<string> {
    // Basic formatting - in production, use proper formatters
    switch (format) {
      case 'html':
        if (!content.includes('<html>')) {
          return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
        }
        return content;
        
      case 'markdown':
        // Already in markdown format
        return content;
        
      default:
        return content;
    }
  }

  /**
   * Generate sample data for variables
   */
  private generateSampleData(variables: TemplateVariable[]): Record<string, any> {
    const sampleData: Record<string, any> = {};
    
    for (const variable of variables) {
      switch (variable.type) {
        case 'text':
          sampleData[variable.name] = variable.defaultValue || `Sample ${variable.name}`;
          break;
        case 'number':
          sampleData[variable.name] = variable.defaultValue || 42;
          break;
        case 'date':
          sampleData[variable.name] = variable.defaultValue || new Date().toISOString();
          break;
        case 'boolean':
          sampleData[variable.name] = variable.defaultValue !== undefined ? variable.defaultValue : true;
          break;
        case 'list':
          sampleData[variable.name] = variable.defaultValue || ['Item 1', 'Item 2', 'Item 3'];
          break;
        case 'object':
          sampleData[variable.name] = variable.defaultValue || { key: 'value' };
          break;
      }
    }
    
    return sampleData;
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get template file path
   */
  private async getTemplatePath(templateId: string): Promise<string> {
    const templatesDir = await this.getTemplatesDirectory();
    return this.platform.fs.join(templatesDir, `${templateId}.json`);
  }

  /**
   * Get templates directory
   */
  private async getTemplatesDirectory(): Promise<string> {
    const workspaceRoot = this.platform.fs.getWorkspaceRoot();
    const templatesDir = this.platform.fs.join(workspaceRoot, '.sharedo', 'templates');
    
    await this.platform.fs.ensureDir(templatesDir);
    return templatesDir;
  }

  /**
   * Save template to file
   */
  private async saveTemplate(template: Template): Promise<void> {
    const templatePath = await this.getTemplatePath(template.id);
    await this.platform.fs.writeFile(templatePath, JSON.stringify(template, null, 2));
  }
}