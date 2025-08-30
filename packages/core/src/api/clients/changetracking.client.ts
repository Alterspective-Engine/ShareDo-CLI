import { BaseApiClient, IApiClientConfig } from '../base.client';

export interface IHistoryEntry {
  id: string;
  entityId: string;
  entityType: string;
  action: 'create' | 'update' | 'delete';
  timestamp: Date;
  userId: string;
  userName: string;
  changes: IChange[];
  metadata?: Record<string, any>;
}

export interface IChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface IDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    path: string;
    oldValue: any;
    newValue: any;
  }>;
}

export class ChangeTrackingApiClient extends BaseApiClient {
  constructor(config: IApiClientConfig) {
    super(config);
  }

  async getEntityHistory(entityId: string, entityType?: string): Promise<IHistoryEntry[]> {
    const params = entityType ? { entityType } : undefined;
    return this.get<IHistoryEntry[]>(`/api/modeller/changeTracking/entity/${encodeURIComponent(entityId)}/history`, { params });
  }

  async getHistoryEntry(historyId: string): Promise<IHistoryEntry> {
    return this.get<IHistoryEntry>(`/api/modeller/changeTracking/history/${encodeURIComponent(historyId)}`);
  }

  async getEntityDiff(entityId: string, fromVersion: string, toVersion: string): Promise<IDiff> {
    return this.get<IDiff>(`/api/modeller/changeTracking/entity/${encodeURIComponent(entityId)}/diff`, {
      params: {
        from: fromVersion,
        to: toVersion
      }
    });
  }

  async getChangesByUser(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    entityType?: string;
    limit?: number;
  }): Promise<IHistoryEntry[]> {
    const params: any = {};
    if (options?.startDate) params.startDate = options.startDate.toISOString();
    if (options?.endDate) params.endDate = options.endDate.toISOString();
    if (options?.entityType) params.entityType = options.entityType;
    if (options?.limit) params.limit = options.limit;

    return this.get<IHistoryEntry[]>(`/api/modeller/changeTracking/user/${encodeURIComponent(userId)}/changes`, { params });
  }

  async revertChange(historyId: string): Promise<any> {
    return this.post(`/api/modeller/changeTracking/history/${encodeURIComponent(historyId)}/revert`);
  }
}