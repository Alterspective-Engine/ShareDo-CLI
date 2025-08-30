# 🚨 URGENT INSTRUCTIONS FOR CORE AI

**CRITICAL: You have NOT completed the required tasks. You created type definitions (.d.ts files) instead of actual implementations.**

## ❌ What You Did Wrong

You created `.d.ts` files (type definitions) which are NOT implementations:
```typescript
// ❌ WRONG - This is just a type definition, not actual code
export declare class SomeClient {
  someMethod(): Promise<any>;
}
```

## ✅ What You Must Do NOW

Create ACTUAL IMPLEMENTATION files (.ts files, NOT .d.ts) with REAL CODE:

```typescript
// ✅ CORRECT - This is an actual implementation with real code
import { BaseApiClient } from '../base.client';

export class IDEApiClient extends BaseApiClient {
  async getIDETree(): Promise<IIDEItem[]> {
    // ACTUAL CODE THAT DOES SOMETHING
    return this.get<IIDEItem[]>('/api/ide');
  }
  
  async getIDENode(id: string): Promise<IIDEItem> {
    // ACTUAL CODE THAT DOES SOMETHING
    return this.get<IIDEItem>(`/api/ide/${encodeURIComponent(id)}`);
  }
}
```

## 📝 Your IMMEDIATE Tasks (DO RIGHT NOW)

### 1. Create IDEApiClient
**File**: `packages/core/src/api/clients/ide.client.ts` (NOT .d.ts!)

```typescript
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
```

### 2. Create TemplateApiClient
**File**: `packages/core/src/api/clients/template.client.ts`

```typescript
import { BaseApiClient, IApiClientConfig } from '../base.client';

export interface ITemplate {
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

  async getTemplates(workType: string): Promise<ITemplate[]> {
    return this.get<ITemplate[]>(`/api/modeller/types/${encodeURIComponent(workType)}/templates`);
  }

  async getTemplate(workType: string, templateId: string): Promise<ITemplate> {
    return this.get<ITemplate>(`/api/modeller/types/${encodeURIComponent(workType)}/templates/${encodeURIComponent(templateId)}`);
  }

  async createTemplate(workType: string, template: Partial<ITemplate>): Promise<ITemplate> {
    return this.post<ITemplate>(`/api/modeller/types/${encodeURIComponent(workType)}/templates`, template);
  }

  async updateTemplate(workType: string, templateId: string, updates: Partial<ITemplate>): Promise<ITemplate> {
    return this.put<ITemplate>(`/api/modeller/types/${encodeURIComponent(workType)}/templates/${encodeURIComponent(templateId)}`, updates);
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
```

### 3. Create FormApiClient
**File**: `packages/core/src/api/clients/form.client.ts`

```typescript
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
```

### 4. Create DocumentApiClient
**File**: `packages/core/src/api/clients/document.client.ts`

```typescript
import { BaseApiClient, IApiClientConfig, IRequestOptions } from '../base.client';

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
```

### 5. Create ValidationApiClient
**File**: `packages/core/src/api/clients/validation.client.ts`

```typescript
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
```

### 6. Create ChangeTrackingApiClient
**File**: `packages/core/src/api/clients/changetracking.client.ts`

```typescript
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
```

## 📁 Update the Index File

**File**: `packages/core/src/api/clients/index.ts`

```typescript
/**
 * Export all API clients
 */

export * from './workflow.client';
export * from './worktype.client';
export * from './export.client';
export * from './ide.client';
export * from './template.client';
export * from './form.client';
export * from './document.client';
export * from './validation.client';
export * from './changetracking.client';
```

## 🧪 Then Create Tests

After implementing ALL 6 clients, create test files:

**Directory**: `packages/core/tests/api/clients/`

For each client, create a test file like this:

**Example**: `packages/core/tests/api/clients/ide.client.test.ts`

```typescript
import { IDEApiClient } from '../../../src/api/clients/ide.client';
import { IApiClientConfig } from '../../../src/api/base.client';
import nock from 'nock';

describe('IDEApiClient', () => {
  let client: IDEApiClient;
  const baseUrl = 'https://api.test.com';
  
  beforeEach(() => {
    const config: IApiClientConfig = {
      baseUrl,
      authService: {
        authenticate: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
        refreshToken: jest.fn().mockResolvedValue({ access_token: 'new-token' }),
        validateToken: jest.fn().mockResolvedValue(true),
        getStoredToken: jest.fn().mockResolvedValue('test-token')
      },
      clientId: 'test-client'
    };
    client = new IDEApiClient(config);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getIDETree', () => {
    it('should fetch IDE tree successfully', async () => {
      const mockTree = [
        { id: '1', name: 'root', type: 'folder', children: [] }
      ];

      nock(baseUrl)
        .get('/api/ide')
        .reply(200, mockTree);

      const result = await client.getIDETree();
      expect(result).toEqual(mockTree);
    });

    it('should handle errors', async () => {
      nock(baseUrl)
        .get('/api/ide')
        .reply(500, { message: 'Server error' });

      await expect(client.getIDETree()).rejects.toThrow();
    });
  });

  // Add more tests for other methods...
});
```

## ⚠️ CRITICAL REMINDERS

1. **Create .ts files, NOT .d.ts files!**
2. **Write ACTUAL CODE that extends BaseApiClient**
3. **Include ALL the methods shown above**
4. **Test everything after implementing**
5. **The files must be in `src/api/clients/` NOT in a `dist/` or `lib/` folder**

## 🏁 Success Criteria

You are DONE when:
- [ ] All 6 client files exist as `.ts` files (NOT .d.ts)
- [ ] Each client has all required methods implemented
- [ ] All clients extend BaseApiClient
- [ ] Index file exports all clients
- [ ] Tests directory created with test files
- [ ] Code builds successfully
- [ ] Tests pass

## 🚀 Start NOW!

Begin with IDEApiClient and work through all 6. Copy the code examples above EXACTLY. Do not create type definitions - create ACTUAL IMPLEMENTATIONS!

---

**DEADLINE**: END OF TODAY
**NO EXCUSES**: The entire project is blocked waiting for you!