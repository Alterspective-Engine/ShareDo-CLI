# ShareDo VS Code Extension - AI Developer Instructions

## 🚨 IMPORTANT: Project Reset Notice
**Date**: 2025-08-29
**Status**: Fresh start - NEW package

This is a completely new package created during the reorganization. It will be the VS Code extension version of the ShareDo platform, sharing 80% of code with the CLI.

## Your Package Identity
- **Package Name**: `@sharedo/vscode`
- **Version**: 1.0.0
- **Purpose**: VS Code extension for ShareDo platform integration
- **Location**: `C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-vscode`

## What This Package Should Contain

### ✅ IN SCOPE for @sharedo/vscode:
1. **Extension Activation**
   - Extension entry point (activate/deactivate)
   - Command registration
   - Context menu items
   - Status bar items

2. **VS Code UI Components**
   - Tree view providers (workflows, files, templates)
   - Webview panels for rich UI
   - Quick pick menus
   - Input boxes
   - Progress notifications

3. **Platform Implementation**
   - Implement IPlatform for VS Code
   - VS Code file system API usage
   - VS Code UI API usage

4. **VS Code Specific Features**
   - Workspace settings
   - Decorations and highlights
   - Code lens providers
   - Hover providers
   - Snippets

### ❌ NOT IN SCOPE (use from other packages):
- Authentication logic → Use `@sharedo/core`
- Workflow operations → Use `@sharedo/business`
- Business logic → Use `@sharedo/business`
- API calls → Use `@sharedo/core`

## Your Dependencies

You depend on the shared packages:
```typescript
import { AuthenticationService } from '@sharedo/core';
import { WorkflowService, FileService } from '@sharedo/business';
import { IPlatform } from '@sharedo/platform-adapter';
```

## Your Development Tasks

### Phase 1: Basic Extension Setup (CURRENT)
1. Set up extension manifest (package.json)
2. Create activation events
3. Register basic commands
4. Implement VSCodePlatform class

### Phase 2: Extension Manifest
Update your `package.json`:
```json
{
  "name": "@sharedo/vscode",
  "displayName": "ShareDo",
  "description": "ShareDo workflow automation for VS Code",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCommand:sharedo.connect",
    "onCommand:sharedo.listWorkflows",
    "onView:sharedoWorkflows"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "sharedo.connect",
        "title": "ShareDo: Connect to Server"
      },
      {
        "command": "sharedo.listWorkflows",
        "title": "ShareDo: List Workflows"
      },
      {
        "command": "sharedo.downloadWorkflow",
        "title": "ShareDo: Download Workflow"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "sharedoWorkflows",
          "name": "ShareDo Workflows",
          "icon": "$(cloud)"
        }
      ]
    },
    "configuration": {
      "title": "ShareDo",
      "properties": {
        "sharedo.serverUrl": {
          "type": "string",
          "default": "",
          "description": "ShareDo server URL"
        },
        "sharedo.autoConnect": {
          "type": "boolean",
          "default": false,
          "description": "Automatically connect on startup"
        }
      }
    }
  }
}
```

### Phase 3: Platform Implementation
```typescript
// src/platform/vscode-platform.ts
import * as vscode from 'vscode';
import { IPlatform, IFileSystem, IUserInterface } from '@sharedo/platform-adapter';

export class VSCodePlatform implements IPlatform {
  fs: IFileSystem = {
    readFile: async (path) => {
      const uri = vscode.Uri.file(path);
      const data = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(data).toString('utf-8');
    },
    
    writeFile: async (path, content) => {
      const uri = vscode.Uri.file(path);
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    },
    
    exists: async (path) => {
      try {
        const uri = vscode.Uri.file(path);
        await vscode.workspace.fs.stat(uri);
        return true;
      } catch {
        return false;
      }
    },
    // ... implement all IFileSystem methods
  };

  ui: IUserInterface = {
    showMessage: (message, type = 'info') => {
      switch (type) {
        case 'error':
          vscode.window.showErrorMessage(message);
          break;
        case 'warning':
          vscode.window.showWarningMessage(message);
          break;
        default:
          vscode.window.showInformationMessage(message);
      }
    },
    
    prompt: async (message, defaultValue) => {
      return vscode.window.showInputBox({
        prompt: message,
        value: defaultValue
      });
    },
    
    confirm: async (message) => {
      const answer = await vscode.window.showInformationMessage(
        message,
        'Yes',
        'No'
      );
      return answer === 'Yes';
    },
    
    showProgress: (message, cancellable = false) => {
      let resolver: () => void;
      const promise = new Promise<void>(resolve => resolver = resolve);
      
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable
      }, async (progress) => {
        await promise;
        return;
      });
      
      return {
        report: (increment, message) => {
          // VS Code progress is handled differently
        },
        complete: () => resolver()
      };
    },
    // ... implement all IUserInterface methods
  };

  getWorkspaceRoot(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }

  getExtensionPath(): string {
    return this.context.extensionPath;
  }

  getPlatformName() {
    return 'vscode' as const;
  }
  
  constructor(private context: vscode.ExtensionContext) {}
}
```

### Phase 4: Extension Entry Point
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { AuthenticationService } from '@sharedo/core';
import { WorkflowService, FileService } from '@sharedo/business';
import { VSCodePlatform } from './platform/vscode-platform';
import { WorkflowTreeProvider } from './providers/workflow-tree-provider';

export function activate(context: vscode.ExtensionContext) {
  console.log('ShareDo extension is now active!');
  
  // Initialize platform
  const platform = new VSCodePlatform(context);
  const auth = new AuthenticationService();
  const workflowService = new WorkflowService(auth.getApiClient(), platform);
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sharedo.connect', async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter ShareDo server URL'
      });
      
      if (url) {
        try {
          await auth.connect(url);
          vscode.window.showInformationMessage('Connected to ShareDo!');
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to connect: ${error}`);
        }
      }
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('sharedo.listWorkflows', async () => {
      const workflows = await workflowService.listWorkflows();
      const selected = await vscode.window.showQuickPick(
        workflows.map(w => ({
          label: w.name,
          description: w.description,
          workflow: w
        }))
      );
      
      if (selected) {
        await workflowService.downloadWorkflow(selected.workflow.id);
      }
    })
  );
  
  // Register tree view
  const treeProvider = new WorkflowTreeProvider(workflowService);
  vscode.window.createTreeView('sharedoWorkflows', {
    treeDataProvider: treeProvider
  });
}

export function deactivate() {}
```

### Phase 5: Tree View Provider
```typescript
// src/providers/workflow-tree-provider.ts
import * as vscode from 'vscode';
import { WorkflowService } from '@sharedo/business';

export class WorkflowTreeProvider implements vscode.TreeDataProvider<WorkflowItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  constructor(private workflowService: WorkflowService) {}
  
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  
  getTreeItem(element: WorkflowItem): vscode.TreeItem {
    return element;
  }
  
  async getChildren(element?: WorkflowItem): Promise<WorkflowItem[]> {
    if (!element) {
      const workflows = await this.workflowService.listWorkflows();
      return workflows.map(w => new WorkflowItem(w.name, w.id));
    }
    return [];
  }
}

class WorkflowItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly id: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${this.label} (${this.id})`;
    this.contextValue = 'workflow';
  }
}
```

## How to Start Fresh

```bash
# 1. Navigate to your package
cd C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-vscode

# 2. Install dependencies
npm install

# 3. Install VS Code extension tools
npm install -g @vscode/vsce

# 4. Build the extension
npm run build

# 5. Test in VS Code
# Press F5 in VS Code to launch Extension Development Host
```

## Testing Your Extension

1. Open the package folder in VS Code
2. Press `F5` to launch a new VS Code window with your extension
3. Open Command Palette (`Ctrl+Shift+P`)
4. Type "ShareDo" to see your commands
5. Check the Explorer sidebar for your tree view

## Important Resources

### VS Code Extension API
- [VS Code API Documentation](https://code.visualstudio.com/api)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

### ShareDo Knowledge Base
**Path**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`

## Features to Implement

Based on the existing VS Code extension reference:
- Workflow tree view with icons
- Download/upload workflows
- File operations
- Template management
- Status bar with connection status
- Settings/configuration
- Webview for rich UI (workflow designer)

## Coordination Notes

**Wait for these packages first:**
1. `@sharedo/core` - Need authentication
2. `@sharedo/platform-adapter` - Need interfaces  
3. `@sharedo/business` - Need services

Your extension will provide the same functionality as the CLI but with VS Code's rich UI!

---
**Last Updated**: 2025-08-29
**Package Status**: New package - ready for VS Code extension development