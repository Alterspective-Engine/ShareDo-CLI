# VS Code Extension - Developer AI Instructions

## Your Role
You are responsible for implementing the @sharedo/vscode package of the ShareDo Platform. This package provides the VS Code extension using the shared business logic.

## Package Overview
The VS Code extension implements:
- Tree view for ShareDo artifacts
- Command palette integration
- File watching and auto-publish
- Status bar indicators
- Webview panels for previews
- Platform adapter for VS Code environment

## Dependencies
- @sharedo/core: ^1.0.0 (authentication, API clients)
- @sharedo/business: ^1.0.0 (all business logic)
- @sharedo/platform-adapter: ^1.0.0 (interfaces to implement)
- @types/vscode: ^1.85.0 (VS Code API types)

## Current Sprint Goals (Week 7)
- [ ] Implement VSCodePlatformAdapter
- [ ] Create tree view provider
- [ ] Add command palette commands
- [ ] Implement file watching
- [ ] Add status bar items

## Platform Adapter Implementation

### VSCodePlatformAdapter
You must implement all interfaces from @sharedo/platform-adapter:

```typescript
import * as vscode from 'vscode';
import { IPlatform } from '@sharedo/platform-adapter';

export class VSCodePlatformAdapter implements IPlatform {
  constructor(private context: vscode.ExtensionContext) {}

  // UI Operations
  ui = {
    showMessage: (message: string, type?: MessageType) => {
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
    showProgress: (title: string) => {
      // Use vscode.window.withProgress
    },
    prompt: async (message: string, options?: IPromptOptions) => {
      // Use vscode.window.showInputBox
    }
  };

  // File System
  fs = {
    readFile: async (path: string) => {
      // Use vscode.workspace.fs
    }
  };

  // Secrets
  secrets = {
    get: async (key: string) => {
      // Use context.secrets
      return this.context.secrets.get(key);
    }
  };
}
```

## Extension Structure

### Activation
```typescript
export async function activate(context: vscode.ExtensionContext) {
  const platform = new VSCodePlatformAdapter(context);
  const authService = new AuthenticationService();
  
  // Register commands
  registerCommands(context, platform);
  
  // Create tree view
  const treeProvider = new ShareDoTreeProvider(platform);
  vscode.window.createTreeView('sharedo', { treeDataProvider: treeProvider });
  
  // Set up file watcher
  const watcher = new FileWatcher(platform);
  watcher.start();
}
```

### Tree View Provider
```typescript
export class ShareDoTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  constructor(
    private platform: IPlatform,
    private workflowManager: WorkflowManager
  ) {}

  getTreeItem(element: TreeNode): vscode.TreeItem {
    // Return tree item with icon and context
  }

  getChildren(element?: TreeNode): Promise<TreeNode[]> {
    // Return child nodes
  }
}
```

### Commands Registration
```typescript
function registerCommands(
  context: vscode.ExtensionContext,
  platform: IPlatform
) {
  // Connect to server
  context.subscriptions.push(
    vscode.commands.registerCommand('sharedo.connect', async () => {
      // Implementation
    })
  );

  // Download workflow
  context.subscriptions.push(
    vscode.commands.registerCommand('sharedo.downloadWorkflow', async (node) => {
      const manager = new WorkflowManager(platform, apiClient);
      await manager.downloadWorkflow(node.name);
    })
  );
}
```

## File Structure
```
packages/vscode/
├── src/
│   ├── adapters/
│   │   └── vscode-platform.adapter.ts
│   ├── views/
│   │   ├── tree-provider.ts
│   │   └── webview-provider.ts
│   ├── commands/
│   │   ├── auth.commands.ts
│   │   ├── workflow.commands.ts
│   │   └── export.commands.ts
│   ├── features/
│   │   ├── file-watcher.ts
│   │   ├── status-bar.ts
│   │   └── auto-publish.ts
│   ├── extension.ts
│   └── types.ts
├── resources/
│   ├── icons/
│   └── webview/
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Extension Manifest (package.json)
```json
{
  "contributes": {
    "commands": [
      {
        "command": "sharedo.connect",
        "title": "ShareDo: Connect to Server"
      },
      {
        "command": "sharedo.downloadWorkflow",
        "title": "ShareDo: Download Workflow"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "sharedo",
          "name": "ShareDo",
          "icon": "resources/icons/sharedo.svg"
        }
      ]
    },
    "configuration": {
      "title": "ShareDo",
      "properties": {
        "sharedo.defaultServer": {
          "type": "string",
          "description": "Default ShareDo server URL"
        },
        "sharedo.autoPublish": {
          "type": "boolean",
          "default": false,
          "description": "Automatically publish changes"
        }
      }
    }
  }
}
```

## Implementation Guidelines

### Tree Node Structure
```typescript
export class TreeNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: 'server' | 'workflow' | 'worktype' | 'form',
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly data?: any
  ) {
    super(label, collapsibleState);
    this.contextValue = type;
    this.iconPath = this.getIcon();
  }
}
```

### File Watching
```typescript
export class FileWatcher {
  private watcher?: vscode.FileSystemWatcher;

  start() {
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{json,xml}');
    this.watcher.onDidChange(uri => this.handleChange(uri));
  }

  private async handleChange(uri: vscode.Uri) {
    if (this.shouldAutoPublish(uri)) {
      await this.publish(uri);
    }
  }
}
```

### Status Bar
```typescript
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );
  }

  setConnected(server: string) {
    this.statusBarItem.text = `$(cloud) ShareDo: ${server}`;
    this.statusBarItem.show();
  }
}
```

## Testing Requirements
- Test all commands with mocked business layer
- Test tree view provider
- Test file watcher
- Mock VS Code API for unit tests
- Integration tests with VS Code test runner

## Git Workflow Requirements

### IMPORTANT: Follow Git Best Practices
See `/GIT_BEST_PRACTICES.md` for full details. Key requirements:

1. **Create feature branch for features**:
   ```bash
   git checkout -b feature/vscode-tree-provider
   ```

2. **Commit UI components separately**:
   ```bash
   git commit -m "feat(vscode): implement workflow tree provider"
   git commit -m "feat(vscode): add webview for export status"
   ```

3. **Document UI/UX decisions**:
   ```bash
   git commit -m "feat(vscode): add status bar item for auth status
   
   Shows green checkmark when authenticated, red X when not.
   Clicking opens authentication quickpick."
   ```

### Your Git Workflow
```bash
# Start of session
git checkout main
git pull origin main
git checkout -b feature/vscode-tree-views

# After implementing tree provider
git add packages/vscode/src/tree/workflow-tree.ts
git commit -m "feat(vscode): implement workflow tree with refresh"

# After adding commands
git add packages/vscode/src/commands/
git commit -m "feat(vscode): add workflow management commands"

# End of session
git push origin feature/vscode-tree-views
```

## Communication with Architect
- Report VS Code API limitations
- Coordinate with CLI on shared patterns
- Request business logic enhancements
- Submit PRs for review

## Current Tasks
- [ ] VSCodePlatformAdapter implementation
- [ ] Extension activation
- [ ] Tree view provider
- [ ] Command registration
- [ ] File watcher
- [ ] Status bar manager
- [ ] Configuration handling
- [ ] Webview for previews
- [ ] Unit tests
- [ ] Integration tests

## UX Guidelines
- Follow VS Code design patterns
- Use appropriate icons
- Provide context menus
- Show progress in notification area
- Respect theme colors

## Known Considerations
- Extension size limits
- Webview security policies
- Workspace trust requirements
- Multi-root workspace support

## PR Status
- No PRs pending

## Notes for Next Sprint
- Add IntelliSense providers
- Implement code lens
- Add snippets
- Create walkthrough

---

**Sprint**: Week 7
**Status**: Not Started
**Last Updated**: 2025-01-29