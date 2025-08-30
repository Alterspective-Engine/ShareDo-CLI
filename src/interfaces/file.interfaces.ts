import { IFile } from '@sharedo/core';

export interface IFileService {
  listFiles(options?: FileListOptions): Promise<IFile[]>;
  getFile(id: string): Promise<IFile>;
  createFile(file: FileCreateOptions): Promise<IFile>;
  saveFile(id: string, content: string | Buffer): Promise<IFile>;
  downloadFile(id: string, destination?: string): Promise<void>;
  publishFile(id: string, options?: PublishOptions): Promise<PublishResult>;
  deleteFile(id: string): Promise<void>;
  getDTDFile(name: string): Promise<string>;
}

export interface FileListOptions {
  search?: string;
  type?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface FileCreateOptions {
  name: string;
  type: string;
  content?: string | Buffer;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface PublishOptions {
  version?: string;
  environment?: 'development' | 'staging' | 'production';
  notes?: string;
}

export interface PublishResult {
  fileId: string;
  version: string;
  publishedAt: Date;
  url?: string;
  status: 'success' | 'failed';
  message?: string;
}