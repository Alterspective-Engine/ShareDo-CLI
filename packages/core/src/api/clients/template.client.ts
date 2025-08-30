import { BaseApiClient, IApiClientConfig } from '../base.client';

export interface IWorkTypeTemplate {
  id: string;
  name: string;
  workType: string;
  description?: string;
  content: any;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  async getTemplates(workType: string): Promise<IWorkTypeTemplate[]> {
    return this.get<IWorkTypeTemplate[]>(`/api/modeller/types/${encodeURIComponent(workType)}/templates`);
  }

  async getTemplate(workType: string, templateId: string): Promise<IWorkTypeTemplate> {
    return this.get<IWorkTypeTemplate>(`/api/modeller/types/${encodeURIComponent(workType)}/templates/${encodeURIComponent(templateId)}`);
  }

  async createTemplate(workType: string, template: Partial<IWorkTypeTemplate>): Promise<IWorkTypeTemplate> {
    return this.post<IWorkTypeTemplate>(`/api/modeller/types/${encodeURIComponent(workType)}/templates`, template);
  }

  async updateTemplate(workType: string, templateId: string, updates: Partial<IWorkTypeTemplate>): Promise<IWorkTypeTemplate> {
    return this.put<IWorkTypeTemplate>(`/api/modeller/types/${encodeURIComponent(workType)}/templates/${encodeURIComponent(templateId)}`, updates);
  }

  async deleteTemplate(workType: string, templateId: string): Promise<void> {
    await this.delete(`/api/modeller/types/${encodeURIComponent(workType)}/templates/${encodeURIComponent(templateId)}`);
  }

  async applyTemplate(workType: string, templateId: string, targetId: string): Promise<any> {
    return this.post(`/api/modeller/types/${encodeURIComponent(workType)}/templates/${encodeURIComponent(templateId)}/apply`, {
      targetId
    });
  }
}