export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface INamedEntity extends IBaseEntity {
  name: string;
  description?: string;
}

export interface IVersionedEntity extends IBaseEntity {
  version: string;
  isLatest: boolean;
  previousVersionId?: string;
}

export interface IAuditLog {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  userId: string;
  timestamp: Date;
  changes?: IChange[];
  metadata?: Record<string, any>;
}

export interface IChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface IServerInfo {
  name: string;
  version: string;
  environment: string;
  url: string;
  status: 'online' | 'offline' | 'maintenance';
  features?: string[];
}

export interface IEnvironment {
  name: string;
  alias: string;
  url: string;
  tokenEndpoint?: string;
  isDefault?: boolean;
  isProduction?: boolean;
  config?: Record<string, any>;
}

export interface IProject {
  id: string;
  name: string;
  description?: string;
  type: string;
  path?: string;
  repositoryUrl?: string;
  environments?: IEnvironment[];
  settings?: IProjectSettings;
  metadata?: Record<string, any>;
}

export interface IProjectSettings {
  defaultEnvironment?: string;
  autoSync?: boolean;
  syncInterval?: number;
  excludePaths?: string[];
  includePaths?: string[];
}