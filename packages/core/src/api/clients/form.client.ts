import { BaseApiClient, IApiClientConfig } from '../base.client';

export interface IForm {
  id: string;
  name: string;
  schema: any;
  uiSchema?: any;
  version: string;
}

export interface IFormValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class FormApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  async getForms(): Promise<IForm[]> {
    return this.get<IForm[]>('/api/public/forms');
  }

  async getForm(formId: string): Promise<IForm> {
    return this.get<IForm>(`/api/public/forms/${encodeURIComponent(formId)}`);
  }

  async getFormSchema(formId: string): Promise<any> {
    return this.get<any>(`/api/public/forms/${encodeURIComponent(formId)}/schema`);
  }

  async validateForm(formId: string, data: any): Promise<IFormValidationResult> {
    return this.post<IFormValidationResult>(`/api/public/forms/${encodeURIComponent(formId)}/validate`, data);
  }

  async submitForm(formId: string, data: any): Promise<any> {
    return this.post(`/api/public/forms/${encodeURIComponent(formId)}/submit`, data);
  }

  async getFormDefaults(formId: string): Promise<any> {
    return this.get<any>(`/api/public/forms/${encodeURIComponent(formId)}/defaults`);
  }
}