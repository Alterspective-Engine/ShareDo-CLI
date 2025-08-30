export interface IIDEService {
  handleIDERequest(request: IDERequest): Promise<IDEResponse>;
  getActionManifest(): Promise<ActionManifest>;
  executeAction(actionId: string, params: any): Promise<ActionResult>;
  getIDEHelpers(): Promise<IDEHelpers>;
  syncWorkspace(options: SyncOptions): Promise<SyncResult>;
}

export interface IDERequest {
  type: 'action' | 'query' | 'command';
  action?: string;
  params?: any;
  context?: IDEContext;
}

export interface IDEResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface IDEContext {
  workspaceId?: string;
  projectId?: string;
  userId?: string;
  environment?: string;
  selection?: {
    file?: string;
    line?: number;
    column?: number;
    text?: string;
  };
}

export interface ActionManifest {
  version: string;
  actions: IDEAction[];
  commands: IDECommand[];
  providers: IDEProvider[];
}

export interface IDEAction {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  shortcut?: string;
  params?: ActionParam[];
}

export interface ActionParam {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}

export interface IDECommand {
  id: string;
  name: string;
  description: string;
  handler: string;
}

export interface IDEProvider {
  id: string;
  type: 'completion' | 'hover' | 'diagnostic' | 'formatter';
  languages: string[];
  configuration?: any;
}

export interface ActionResult {
  success: boolean;
  result?: any;
  error?: string;
  affectedFiles?: string[];
}

export interface IDEHelpers {
  snippets: CodeSnippet[];
  templates: string[];
  shortcuts: Shortcut[];
}

export interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
  description?: string;
  variables?: string[];
}

export interface Shortcut {
  key: string;
  command: string;
  when?: string;
}

export interface SyncOptions {
  direction: 'push' | 'pull' | 'both';
  includeFiles?: string[];
  excludeFiles?: string[];
  force?: boolean;
}

export interface SyncResult {
  success: boolean;
  filesUpdated: string[];
  filesCreated: string[];
  filesDeleted: string[];
  conflicts?: string[];
  error?: string;
}