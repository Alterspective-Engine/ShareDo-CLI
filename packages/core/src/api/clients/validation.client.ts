import { BaseApiClient, IApiClientConfig } from '../base.client';
import { IWorkflow } from '../../models';

export interface IValidationResult {
  valid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    criticalErrors: number;
  };
}

export interface IValidationError {
  path: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
  details?: any;
}

export interface IValidationWarning {
  path: string;
  message: string;
  code: string;
  suggestion?: string;
}

export class ValidationApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  async validatePackage(packageData: any): Promise<IValidationResult> {
    return this.post<IValidationResult>('/api/modeller/importexport/validate', packageData);
  }

  async validateWorkflow(workflow: IWorkflow): Promise<IValidationResult> {
    return this.post<IValidationResult>('/api/modeller/workflows/validate', workflow);
  }

  async validateWorkType(workType: any): Promise<IValidationResult> {
    return this.post<IValidationResult>('/api/modeller/types/validate', workType);
  }

  async validateSchema(schema: any, data: any): Promise<IValidationResult> {
    return this.post<IValidationResult>('/api/modeller/schemas/validate', {
      schema,
      data
    });
  }

  async getValidationRules(entityType: string): Promise<any> {
    return this.get<any>(`/api/modeller/validation/rules/${encodeURIComponent(entityType)}`);
  }
}