import { BaseApiClient, IApiClientConfig } from '../base.client';
import FormData from 'form-data';

export interface IDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  workItemId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface IDocumentUploadOptions {
  workItemId?: string;
  metadata?: Record<string, any>;
  overwrite?: boolean;
}

export class DocumentApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  async getDocuments(workItemId?: string): Promise<IDocument[]> {
    const params = workItemId ? { workItemId } : undefined;
    return this.get<IDocument[]>('/api/public/documents', { params });
  }

  async getDocument(documentId: string): Promise<IDocument> {
    return this.get<IDocument>(`/api/public/documents/${encodeURIComponent(documentId)}`);
  }

  async uploadDocument(file: Buffer | Blob, filename: string, options?: IDocumentUploadOptions): Promise<IDocument> {
    const formData = new FormData();
    formData.append('file', file instanceof Buffer ? new Blob([file]) : file, filename);
    
    if (options?.workItemId) {
      formData.append('workItemId', options.workItemId);
    }
    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    return this.post<IDocument>('/api/public/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async downloadDocument(documentId: string): Promise<Buffer> {
    const response = await this.get<ArrayBuffer>(`/api/public/documents/${encodeURIComponent(documentId)}/download`, {
      headers: {
        'Accept': 'application/octet-stream'
      }
    });
    return Buffer.from(response);
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.delete(`/api/public/documents/${encodeURIComponent(documentId)}`);
  }

  async getDocumentMetadata(documentId: string): Promise<Record<string, any>> {
    return this.get<Record<string, any>>(`/api/public/documents/${encodeURIComponent(documentId)}/metadata`);
  }
}