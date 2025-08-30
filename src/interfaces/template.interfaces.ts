export interface ITemplateService {
  listTemplates(options?: TemplateListOptions): Promise<Template[]>;
  getTemplate(id: string): Promise<Template>;
  createFromTemplate(templateId: string, options: CreateFromTemplateOptions): Promise<TemplateResult>;
  validateTemplate(template: Template): Promise<TemplateValidationResult>;
  getTemplateMetadata(id: string): Promise<TemplateMetadata>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  schema?: any;
  variables?: TemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateListOptions {
  search?: string;
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateFromTemplateOptions {
  name: string;
  variables?: Record<string, any>;
  destination?: string;
  overwrite?: boolean;
}

export interface TemplateResult {
  success: boolean;
  files: string[];
  message?: string;
  errors?: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description?: string;
  validation?: any;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateMetadata {
  id: string;
  author?: string;
  tags?: string[];
  dependencies?: string[];
  compatibility?: string[];
  documentation?: string;
}