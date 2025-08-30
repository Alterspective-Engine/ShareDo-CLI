export interface IFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  extension?: string;
  parentId?: string;
  isFolder: boolean;
  createdBy: string;
  createdAt: Date;
  modifiedBy?: string;
  modifiedAt?: Date;
  permissions?: IFilePermissions;
  metadata?: IFileMetadata;
  content?: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface IFilePermissions {
  owner: string;
  canRead?: string[];
  canWrite?: string[];
  canDelete?: string[];
  isPublic?: boolean;
  sharedWith?: IShareInfo[];
}

export interface IShareInfo {
  userId?: string;
  groupId?: string;
  permission: 'read' | 'write' | 'admin';
  sharedAt: Date;
  sharedBy: string;
  expiresAt?: Date;
}

export interface IFileMetadata {
  description?: string;
  tags?: string[];
  version?: string;
  checksum?: string;
  encoding?: string;
  language?: string;
  customProperties?: Record<string, any>;
}

export interface IFolder extends IFile {
  isFolder: true;
  children?: IFile[];
  childCount?: number;
}

export interface IFileOperation {
  type: FileOperationType;
  sourceId: string;
  targetId?: string;
  newName?: string;
  options?: IFileOperationOptions;
}

export enum FileOperationType {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Move = 'move',
  Copy = 'copy',
  Rename = 'rename',
  Download = 'download',
  Upload = 'upload',
  Share = 'share',
  Unshare = 'unshare'
}

export interface IFileOperationOptions {
  overwrite?: boolean;
  createFolders?: boolean;
  preserveTimestamps?: boolean;
  includeMetadata?: boolean;
}

export interface IFileUploadOptions {
  chunkSize?: number;
  resumable?: boolean;
  onProgress?: (progress: IUploadProgress) => void;
}

export interface IUploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speed?: number;
  estimatedTime?: number;
}

export interface IFileSearchOptions {
  query?: string;
  path?: string;
  recursive?: boolean;
  fileTypes?: string[];
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  sizeMin?: number;
  sizeMax?: number;
  tags?: string[];
  owner?: string;
}