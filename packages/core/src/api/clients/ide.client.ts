import { BaseApiClient, IApiClientConfig } from '../base.client';

export interface IIDEItem {
  id: string;
  name: string;
  type: 'folder' | 'workflow' | 'form' | 'document';
  parentId?: string;
  children?: IIDEItem[];
  metadata?: Record<string, any>;
}

export class IDEApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  async getIDETree(): Promise<IIDEItem[]> {
    return this.get<IIDEItem[]>('/api/ide');
  }

  async getIDENode(nodeId: string): Promise<IIDEItem> {
    return this.get<IIDEItem>(`/api/ide/${encodeURIComponent(nodeId)}`);
  }

  async createIDENode(parentId: string, node: Partial<IIDEItem>): Promise<IIDEItem> {
    return this.post<IIDEItem>(`/api/ide/${encodeURIComponent(parentId)}/children`, node);
  }

  async updateIDENode(nodeId: string, updates: Partial<IIDEItem>): Promise<IIDEItem> {
    return this.put<IIDEItem>(`/api/ide/${encodeURIComponent(nodeId)}`, updates);
  }

  async deleteIDENode(nodeId: string): Promise<void> {
    await this.delete(`/api/ide/${encodeURIComponent(nodeId)}`);
  }

  async moveIDENode(nodeId: string, newParentId: string): Promise<IIDEItem> {
    return this.post<IIDEItem>(`/api/ide/${encodeURIComponent(nodeId)}/move`, {
      newParentId
    });
  }
}