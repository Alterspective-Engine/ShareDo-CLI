import { ShareDoError } from '@sharedo/core';
import { IPlatform, IProgressReporter } from '@sharedo/platform-adapter';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'textarea';
  label: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: string;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  version?: string;
  sections: FormSection[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormData {
  formId: string;
  values: Record<string, any>;
  submittedAt?: string;
  submittedBy?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Array<{
    fieldId: string;
    message: string;
  }>;
  warnings: Array<{
    fieldId: string;
    message: string;
  }>;
}

export class FormManager {
  private formsCache: Map<string, Form> = new Map();
  
  constructor(
    private platform: IPlatform
  ) {}

  /**
   * Create a new form
   */
  async createForm(form: Partial<Form>): Promise<Form> {
    const progress = this.platform.ui.showProgress('Creating form...');
    
    try {
      // Validate form structure
      progress.report({ message: 'Validating form structure...', percentage: 20 });
      this.validateFormStructure(form);
      
      // Generate ID if not provided
      const newForm: Form = {
        id: form.id || this.generateFormId(),
        name: form.name || 'Untitled Form',
        description: form.description,
        version: form.version || '1.0.0',
        sections: form.sections || [],
        metadata: form.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save form
      progress.report({ message: 'Saving form...', percentage: 60 });
      await this.saveForm(newForm);
      
      // Cache the form
      this.formsCache.set(newForm.id, newForm);
      
      progress.complete();
      await this.platform.ui.showInfo(`Form "${newForm.name}" created successfully`);
      
      return newForm;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to create form: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Read/load a form
   */
  async readForm(formId: string): Promise<Form | null> {
    // Check cache first
    if (this.formsCache.has(formId)) {
      return this.formsCache.get(formId)!;
    }
    
    try {
      const formPath = await this.getFormPath(formId);
      
      if (!await this.platform.fs.exists(formPath)) {
        return null;
      }
      
      const content = await this.platform.fs.readFile(formPath);
      const form = JSON.parse(content) as Form;
      
      // Cache the form
      this.formsCache.set(formId, form);
      
      return form;
      
    } catch (error) {
      await this.platform.ui.showError(
        `Failed to read form ${formId}: ${(error as Error).message}`
      );
      return null;
    }
  }

  /**
   * Update an existing form
   */
  async updateForm(formId: string, updates: Partial<Form>): Promise<Form> {
    const progress = this.platform.ui.showProgress('Updating form...');
    
    try {
      // Load existing form
      progress.report({ message: 'Loading form...', percentage: 20 });
      const existingForm = await this.readForm(formId);
      
      if (!existingForm) {
        throw new Error(`Form ${formId} not found`);
      }
      
      // Merge updates
      progress.report({ message: 'Applying updates...', percentage: 40 });
      const updatedForm: Form = {
        ...existingForm,
        ...updates,
        id: existingForm.id, // Preserve ID
        createdAt: existingForm.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString()
      };
      
      // Validate updated form
      progress.report({ message: 'Validating changes...', percentage: 60 });
      this.validateFormStructure(updatedForm);
      
      // Save updated form
      progress.report({ message: 'Saving form...', percentage: 80 });
      await this.saveForm(updatedForm);
      
      // Update cache
      this.formsCache.set(formId, updatedForm);
      
      progress.complete();
      await this.platform.ui.showInfo(`Form "${updatedForm.name}" updated successfully`);
      
      return updatedForm;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to update form: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Delete a form
   */
  async deleteForm(formId: string): Promise<void> {
    const confirmed = await this.platform.ui.confirm(
      `Are you sure you want to delete form ${formId}?`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      const formPath = await this.getFormPath(formId);
      
      if (await this.platform.fs.exists(formPath)) {
        await this.platform.fs.unlink(formPath);
      }
      
      // Remove from cache
      this.formsCache.delete(formId);
      
      await this.platform.ui.showInfo('Form deleted successfully');
      
    } catch (error) {
      await this.platform.ui.showError(
        `Failed to delete form: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * List all available forms
   */
  async listForms(): Promise<Form[]> {
    try {
      const formsDir = await this.getFormsDirectory();
      
      if (!await this.platform.fs.exists(formsDir)) {
        return [];
      }
      
      const files = await this.platform.fs.readdir(formsDir);
      const forms: Form[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = this.platform.fs.join(formsDir, file);
          const content = await this.platform.fs.readFile(filePath);
          
          try {
            const form = JSON.parse(content) as Form;
            forms.push(form);
          } catch (error) {
            await this.platform.ui.showWarning(
              `Failed to parse form file ${file}: ${(error as Error).message}`
            );
          }
        }
      }
      
      return forms.sort((a, b) => 
        (b.updatedAt || '').localeCompare(a.updatedAt || '')
      );
      
    } catch (error) {
      await this.platform.ui.showError(
        `Failed to list forms: ${(error as Error).message}`
      );
      return [];
    }
  }

  /**
   * Validate form data against form structure
   */
  async validateFormData(formId: string, data: Record<string, any>): Promise<FormValidationResult> {
    const form = await this.readForm(formId);
    
    if (!form) {
      return {
        isValid: false,
        errors: [{ fieldId: '', message: `Form ${formId} not found` }],
        warnings: []
      };
    }
    
    const errors: Array<{ fieldId: string; message: string }> = [];
    const warnings: Array<{ fieldId: string; message: string }> = [];
    
    // Validate each section
    for (const section of form.sections) {
      for (const field of section.fields) {
        const value = data[field.id];
        
        // Check required fields
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push({
            fieldId: field.id,
            message: `Field "${field.label}" is required`
          });
          continue;
        }
        
        // Skip validation for empty optional fields
        if (!field.required && (value === undefined || value === null || value === '')) {
          continue;
        }
        
        // Type validation
        if (!this.validateFieldType(value, field.type)) {
          errors.push({
            fieldId: field.id,
            message: `Invalid type for field "${field.label}". Expected ${field.type}`
          });
          continue;
        }
        
        // Custom validation rules
        if (field.validation) {
          const validationErrors = this.validateFieldRules(value, field);
          errors.push(...validationErrors);
        }
        
        // Check for deprecated fields (example warning)
        if ((field as any).metadata?.deprecated) {
          warnings.push({
            fieldId: field.id,
            message: `Field "${field.label}" is deprecated`
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Submit form data
   */
  async submitFormData(formId: string, data: Record<string, any>): Promise<FormData> {
    const progress = this.platform.ui.showProgress('Submitting form...');
    
    try {
      // Validate data
      progress.report({ message: 'Validating form data...', percentage: 20 });
      const validation = await this.validateFormData(formId, data);
      
      if (!validation.isValid) {
        const errorMessages = validation.errors
          .map(e => `- ${e.message}`)
          .join('\\n');
        throw new Error(`Form validation failed:\\n${errorMessages}`);
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        const warningMessages = validation.warnings
          .map(w => `- ${w.message}`)
          .join('\\n');
        await this.platform.ui.showWarning(
          `Form has warnings:\\n${warningMessages}`
        );
      }
      
      // Create form data object
      progress.report({ message: 'Processing submission...', percentage: 60 });
      const formData: FormData = {
        formId,
        values: data,
        submittedAt: new Date().toISOString(),
        submittedBy: 'current-user' // Would get from auth context
      };
      
      // Save form data
      progress.report({ message: 'Saving submission...', percentage: 80 });
      await this.saveFormData(formData);
      
      progress.complete();
      await this.platform.ui.showInfo('Form submitted successfully');
      
      return formData;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to submit form: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Export form to different formats
   */
  async exportForm(formId: string, format: 'json' | 'yaml' | 'html'): Promise<string> {
    const form = await this.readForm(formId);
    
    if (!form) {
      throw new Error(`Form ${formId} not found`);
    }
    
    let content: string;
    let extension: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(form, null, 2);
        extension = 'json';
        break;
        
      case 'yaml':
        content = this.convertToYAML(form);
        extension = 'yaml';
        break;
        
      case 'html':
        content = this.generateHTMLForm(form);
        extension = 'html';
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    // Select save location
    const savePath = await this.platform.ui.saveFile({
      title: 'Export Form',
      defaultName: `${form.name.replace(/[^a-z0-9]/gi, '_')}.${extension}`,
      filters: [{ name: format.toUpperCase(), extensions: [extension] }]
    });
    
    if (!savePath) {
      throw new Error('Export cancelled');
    }
    
    await this.platform.fs.writeFile(savePath, content);
    await this.platform.ui.showInfo(`Form exported to ${savePath}`);
    
    return savePath;
  }

  /**
   * Import form from file
   */
  async importForm(filePath: string): Promise<Form> {
    const progress = this.platform.ui.showProgress('Importing form...');
    
    try {
      // Read file
      progress.report({ message: 'Reading file...', percentage: 20 });
      const content = await this.platform.fs.readFile(filePath);
      
      // Parse based on extension
      progress.report({ message: 'Parsing form...', percentage: 40 });
      const extension = this.platform.fs.extname(filePath).toLowerCase();
      let formData: any;
      
      switch (extension) {
        case '.json':
          formData = JSON.parse(content);
          break;
          
        case '.yaml':
        case '.yml':
          formData = this.parseYAML(content);
          break;
          
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
      
      // Validate and create form
      progress.report({ message: 'Creating form...', percentage: 70 });
      const form = await this.createForm({
        ...formData,
        id: undefined, // Generate new ID
        metadata: {
          ...formData.metadata,
          importedFrom: filePath,
          importedAt: new Date().toISOString()
        }
      });
      
      progress.complete();
      await this.platform.ui.showInfo(`Form "${form.name}" imported successfully`);
      
      return form;
      
    } catch (error) {
      progress.error(error as Error);
      await this.platform.ui.showError(
        `Failed to import form: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Validate form structure
   */
  private validateFormStructure(form: Partial<Form>): void {
    if (!form.name || form.name.trim() === '') {
      throw new Error('Form must have a name');
    }
    
    if (!form.sections || !Array.isArray(form.sections)) {
      throw new Error('Form must have sections array');
    }
    
    for (const section of form.sections) {
      if (!section.id || !section.title) {
        throw new Error('Each section must have an ID and title');
      }
      
      if (!section.fields || !Array.isArray(section.fields)) {
        throw new Error(`Section "${section.title}" must have fields array`);
      }
      
      const fieldIds = new Set<string>();
      for (const field of section.fields) {
        if (!field.id || !field.name || !field.type || !field.label) {
          throw new Error('Each field must have id, name, type, and label');
        }
        
        if (fieldIds.has(field.id)) {
          throw new Error(`Duplicate field ID: ${field.id}`);
        }
        fieldIds.add(field.id);
        
        if (!this.isValidFieldType(field.type)) {
          throw new Error(`Invalid field type: ${field.type}`);
        }
      }
    }
  }

  /**
   * Check if field type is valid
   */
  private isValidFieldType(type: string): boolean {
    const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'textarea'];
    return validTypes.includes(type);
  }

  /**
   * Validate field value against type
   */
  private validateFieldType(value: any, type: string): boolean {
    switch (type) {
      case 'text':
      case 'textarea':
        return typeof value === 'string';
        
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
        
      case 'date':
        return !isNaN(Date.parse(value));
        
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
        
      case 'select':
        return typeof value === 'string';
        
      case 'multiselect':
        return Array.isArray(value);
        
      default:
        return false;
    }
  }

  /**
   * Validate field against validation rules
   */
  private validateFieldRules(value: any, field: FormField): Array<{ fieldId: string; message: string }> {
    const errors: Array<{ fieldId: string; message: string }> = [];
    const validation = field.validation;
    
    if (!validation) {
      return errors;
    }
    
    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          fieldId: field.id,
          message: `Field "${field.label}" does not match required pattern`
        });
      }
    }
    
    // Min/Max for numbers
    if (field.type === 'number') {
      const numValue = Number(value);
      
      if (validation.min !== undefined && numValue < validation.min) {
        errors.push({
          fieldId: field.id,
          message: `Field "${field.label}" must be at least ${validation.min}`
        });
      }
      
      if (validation.max !== undefined && numValue > validation.max) {
        errors.push({
          fieldId: field.id,
          message: `Field "${field.label}" must be at most ${validation.max}`
        });
      }
    }
    
    // Length validation for strings
    if (typeof value === 'string') {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        errors.push({
          fieldId: field.id,
          message: `Field "${field.label}" must be at least ${validation.minLength} characters`
        });
      }
      
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        errors.push({
          fieldId: field.id,
          message: `Field "${field.label}" must be at most ${validation.maxLength} characters`
        });
      }
    }
    
    return errors;
  }

  /**
   * Generate unique form ID
   */
  private generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get form file path
   */
  private async getFormPath(formId: string): Promise<string> {
    const formsDir = await this.getFormsDirectory();
    return this.platform.fs.join(formsDir, `${formId}.json`);
  }

  /**
   * Get forms directory
   */
  private async getFormsDirectory(): Promise<string> {
    const workspaceRoot = this.platform.fs.getWorkspaceRoot();
    const formsDir = this.platform.fs.join(workspaceRoot, '.sharedo', 'forms');
    
    await this.platform.fs.ensureDir(formsDir);
    return formsDir;
  }

  /**
   * Save form to file
   */
  private async saveForm(form: Form): Promise<void> {
    const formPath = await this.getFormPath(form.id);
    await this.platform.fs.writeFile(formPath, JSON.stringify(form, null, 2));
  }

  /**
   * Save form data submission
   */
  private async saveFormData(formData: FormData): Promise<void> {
    const workspaceRoot = this.platform.fs.getWorkspaceRoot();
    const dataDir = this.platform.fs.join(workspaceRoot, '.sharedo', 'form-data');
    
    await this.platform.fs.ensureDir(dataDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${formData.formId}_${timestamp}.json`;
    const filePath = this.platform.fs.join(dataDir, fileName);
    
    await this.platform.fs.writeFile(filePath, JSON.stringify(formData, null, 2));
  }

  /**
   * Convert form to YAML format (simplified)
   */
  private convertToYAML(form: Form): string {
    // Simplified YAML conversion - in production, use a proper YAML library
    let yaml = `name: ${form.name}\\n`;
    yaml += `description: ${form.description || ''}\\n`;
    yaml += `version: ${form.version}\\n`;
    yaml += `sections:\\n`;
    
    for (const section of form.sections) {
      yaml += `  - id: ${section.id}\\n`;
      yaml += `    title: ${section.title}\\n`;
      yaml += `    fields:\\n`;
      
      for (const field of section.fields) {
        yaml += `      - id: ${field.id}\\n`;
        yaml += `        name: ${field.name}\\n`;
        yaml += `        type: ${field.type}\\n`;
        yaml += `        label: ${field.label}\\n`;
        yaml += `        required: ${field.required || false}\\n`;
      }
    }
    
    return yaml;
  }

  /**
   * Parse YAML content (simplified)
   */
  private parseYAML(content: string): any {
    // Simplified YAML parsing - in production, use a proper YAML library
    throw new Error('YAML parsing not yet implemented. Use JSON format for now.');
  }

  /**
   * Generate HTML form preview
   */
  private generateHTMLForm(form: Form): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${form.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .form-section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; }
    .form-field { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select, textarea { width: 100%; padding: 8px; }
    .required::after { content: ' *'; color: red; }
  </style>
</head>
<body>
  <h1>${form.name}</h1>
  <p>${form.description || ''}</p>
  <form>
`;
    
    for (const section of form.sections) {
      html += `    <div class="form-section">
      <h2>${section.title}</h2>
      ${section.description ? `<p>${section.description}</p>` : ''}
`;
      
      for (const field of section.fields) {
        html += `      <div class="form-field">
        <label${field.required ? ' class="required"' : ''}>${field.label}</label>
`;
        
        switch (field.type) {
          case 'textarea':
            html += `        <textarea name="${field.id}" ${field.required ? 'required' : ''}></textarea>\\n`;
            break;
            
          case 'select':
            html += `        <select name="${field.id}" ${field.required ? 'required' : ''}>\\n`;
            if (field.options) {
              for (const option of field.options) {
                html += `          <option value="${option.value}">${option.label}</option>\\n`;
              }
            }
            html += `        </select>\\n`;
            break;
            
          case 'boolean':
            html += `        <input type="checkbox" name="${field.id}" />\\n`;
            break;
            
          default:
            html += `        <input type="${field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}" name="${field.id}" ${field.required ? 'required' : ''} />\\n`;
        }
        
        html += `      </div>\\n`;
      }
      
      html += `    </div>\\n`;
    }
    
    html += `  </form>
</body>
</html>`;
    
    return html;
  }
}