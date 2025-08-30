import { BaseApiClient, IFile } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';
import {
  IFileService,
  FileListOptions,
  FileCreateOptions,
  PublishOptions,
  PublishResult
} from '../interfaces/file.interfaces';
import * as path from 'path';

export class FileService implements IFileService {
  constructor(
    private apiClient: BaseApiClient,
    private platform: IPlatform
  ) {}

  async listFiles(options?: FileListOptions): Promise<IFile[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    
    const params: any = {
      page,
      limit,
      view: 'table'
    };
    
    if (options?.search) {
      params.search = options.search;
    }
    
    if (options?.type) {
      params.type = options.type;
    }
    
    if (options?.tags && options.tags.length > 0) {
      params.tags = options.tags.join(',');
    }
    
    const response = await this.apiClient.get('/api/files', { params });
    
    if (response?.data) {
      return response.data;
    }
    
    return [];
  }

  async getFile(id: string): Promise<IFile> {
    const response = await this.apiClient.get(`/api/files/${id}`);
    
    if (!response) {
      throw new Error(`File ${id} not found`);
    }
    
    return response;
  }

  async createFile(options: FileCreateOptions): Promise<IFile> {
    const payload = {
      name: options.name,
      type: options.type,
      content: options.content,
      metadata: options.metadata || {},
      tags: options.tags || []
    };
    
    const response = await this.apiClient.post('/api/files', payload);
    
    if (!response) {
      throw new Error('Failed to create file');
    }
    
    this.platform.showInformationMessage(`File ${options.name} created successfully`);
    return response;
  }

  async saveFile(id: string, content: string | Buffer): Promise<IFile> {
    const contentString = content instanceof Buffer ? content.toString('base64') : content;
    
    const payload = {
      content: contentString,
      encoding: content instanceof Buffer ? 'base64' : 'utf8'
    };
    
    const response = await this.apiClient.put(`/api/files/${id}`, payload);
    
    if (!response) {
      throw new Error(`Failed to save file ${id}`);
    }
    
    this.platform.showInformationMessage(`File saved successfully`);
    return response;
  }

  async downloadFile(id: string, destination?: string): Promise<void> {
    const file = await this.getFile(id);
    
    const response = await this.apiClient.get(`/api/files/${id}/content`, {
      responseType: 'arraybuffer'
    });
    
    if (!response) {
      throw new Error(`Failed to download file ${id}`);
    }
    
    const workspaceRoot = this.platform.getWorkspaceRoot();
    const fileName = file.name || `file_${id}`;
    const filePath = destination || path.join(workspaceRoot, 'downloads', fileName);
    
    const dir = path.dirname(filePath);
    await this.platform.createDirectory(dir);
    
    const content = Buffer.from(response);
    await this.platform.writeFile(filePath, content.toString());
    
    this.platform.showInformationMessage(`File downloaded to ${filePath}`);
  }

  async publishFile(id: string, options?: PublishOptions): Promise<PublishResult> {
    const payload = {
      version: options?.version,
      environment: options?.environment || 'development',
      notes: options?.notes
    };
    
    try {
      const response = await this.apiClient.post(`/api/files/${id}/publish`, payload);
      
      if (!response) {
        throw new Error('Failed to publish file');
      }
      
      this.platform.showInformationMessage(`File published successfully`);
      
      return {
        fileId: id,
        version: response.version || options?.version || '1.0.0',
        publishedAt: new Date(response.publishedAt || Date.now()),
        url: response.url,
        status: 'success',
        message: response.message || 'File published successfully'
      };
    } catch (error: any) {
      return {
        fileId: id,
        version: options?.version || '1.0.0',
        publishedAt: new Date(),
        status: 'failed',
        message: error.message || 'Failed to publish file'
      };
    }
  }

  async deleteFile(id: string): Promise<void> {
    const response = await this.apiClient.delete(`/api/files/${id}`);
    
    if (!response || response.status >= 400) {
      throw new Error(`Failed to delete file ${id}`);
    }
    
    this.platform.showInformationMessage(`File deleted successfully`);
  }

  async getDTDFile(name: string): Promise<string> {
    const response = await this.apiClient.get(`/api/dtd/${name}`);
    
    if (!response) {
      throw new Error(`DTD file ${name} not found`);
    }
    
    return response;
  }
}