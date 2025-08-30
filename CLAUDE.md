# ShareDo MCP Server - AI Developer Instructions

## 🚨 IMPORTANT: Project Reset Notice
**Date**: 2025-08-29
**Status**: Fresh start - NEW package

This is a completely new package created during the reorganization. It implements a Model Context Protocol (MCP) server for ShareDo, allowing AI assistants like Claude to interact with ShareDo workflows.

## Your Package Identity
- **Package Name**: `@sharedo/mcp`
- **Version**: 1.0.0
- **Purpose**: MCP server for AI integration with ShareDo platform
- **Location**: `C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-mcp`

## What This Package Should Contain

### ✅ IN SCOPE for @sharedo/mcp:
1. **MCP Server Implementation**
   - Server initialization and lifecycle
   - Tool registration
   - Resource management
   - Protocol compliance

2. **ShareDo Tools for AI**
   - List workflows tool
   - Download workflow tool
   - Execute workflow tool
   - File operations tools
   - Template tools

3. **Resource Providers**
   - Workflow resources
   - File resources
   - Template resources
   - Configuration resources

4. **Platform Implementation**
   - Implement IPlatform for MCP context
   - Server-side file operations
   - Logging and monitoring

### ❌ NOT IN SCOPE (use from other packages):
- Authentication logic → Use `@sharedo/core`
- Workflow operations → Use `@sharedo/business`
- Business logic → Use `@sharedo/business`
- API calls → Use `@sharedo/core`

## What is MCP?

Model Context Protocol (MCP) is a protocol that allows AI assistants to interact with external tools and resources. Your server will expose ShareDo functionality as MCP tools that Claude and other AI assistants can use.

## Your Dependencies

```typescript
import { AuthenticationService } from '@sharedo/core';
import { WorkflowService, FileService } from '@sharedo/business';
import { IPlatform } from '@sharedo/platform-adapter';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

## Your Development Tasks

### Phase 1: Basic MCP Server (CURRENT)
1. Set up MCP server structure
2. Implement basic tools
3. Create MCPPlatform class
4. Test with Claude Desktop

### Phase 2: Server Implementation
```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AuthenticationService } from '@sharedo/core';
import { WorkflowService, FileService, TemplateService } from '@sharedo/business';
import { MCPPlatform } from './platform/mcp-platform';

// Initialize server
const server = new Server(
  {
    name: 'sharedo-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Initialize platform and services
const platform = new MCPPlatform();
const auth = new AuthenticationService();
const workflowService = new WorkflowService(auth.getApiClient(), platform);
const fileService = new FileService(auth.getApiClient(), platform);

// Register Tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'sharedo_list_workflows',
      description: 'List all available ShareDo workflows',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Optional filter for workflow names',
          },
        },
      },
    },
    {
      name: 'sharedo_download_workflow',
      description: 'Download a ShareDo workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The ID of the workflow to download',
          },
        },
        required: ['workflowId'],
      },
    },
    {
      name: 'sharedo_execute_workflow',
      description: 'Execute a ShareDo workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The ID of the workflow to execute',
          },
          parameters: {
            type: 'object',
            description: 'Parameters for the workflow',
          },
        },
        required: ['workflowId'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'sharedo_list_workflows': {
      const workflows = await workflowService.listWorkflows();
      const filtered = args.filter
        ? workflows.filter(w => w.name.includes(args.filter))
        : workflows;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(filtered, null, 2),
          },
        ],
      };
    }

    case 'sharedo_download_workflow': {
      await workflowService.downloadWorkflow(args.workflowId);
      return {
        content: [
          {
            type: 'text',
            text: `Workflow ${args.workflowId} downloaded successfully`,
          },
        ],
      };
    }

    case 'sharedo_execute_workflow': {
      const result = await workflowService.executeWorkflow(
        args.workflowId,
        args.parameters
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Register Resources
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'sharedo://workflows',
      name: 'ShareDo Workflows',
      description: 'List of available workflows',
      mimeType: 'application/json',
    },
    {
      uri: 'sharedo://templates',
      name: 'ShareDo Templates',
      description: 'List of available templates',
      mimeType: 'application/json',
    },
  ],
}));

// Handle resource reads
server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'sharedo://workflows': {
      const workflows = await workflowService.listWorkflows();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(workflows, null, 2),
          },
        ],
      };
    }

    case 'sharedo://templates': {
      const templates = await templateService.listTemplates();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(templates, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ShareDo MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

### Phase 3: Platform Implementation
```typescript
// src/platform/mcp-platform.ts
import { IPlatform, IFileSystem, IUserInterface } from '@sharedo/platform-adapter';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MCPPlatform implements IPlatform {
  private workspaceRoot: string;

  constructor() {
    // MCP servers typically run in a specific workspace
    this.workspaceRoot = process.env.MCP_WORKSPACE || process.cwd();
  }

  fs: IFileSystem = {
    readFile: async (filepath) => fs.readFile(filepath, 'utf-8'),
    writeFile: async (filepath, content) => fs.writeFile(filepath, content),
    exists: async (filepath) => {
      try {
        await fs.access(filepath);
        return true;
      } catch {
        return false;
      }
    },
    // ... implement all IFileSystem methods
  };

  ui: IUserInterface = {
    // MCP servers don't have interactive UI, return appropriate responses
    showMessage: (message, type) => {
      console.error(`[${type?.toUpperCase() || 'INFO'}] ${message}`);
    },
    
    prompt: async () => {
      // MCP cannot prompt users
      return undefined;
    },
    
    confirm: async () => {
      // MCP cannot get user confirmation
      return false;
    },
    
    showProgress: (message) => {
      console.error(`[PROGRESS] ${message}`);
      return {
        report: () => {},
        complete: () => {},
      };
    },
    // ... implement all IUserInterface methods (mostly no-ops for MCP)
  };

  logger = {
    debug: (msg: string) => console.error(`[DEBUG] ${msg}`),
    info: (msg: string) => console.error(`[INFO] ${msg}`),
    warn: (msg: string) => console.error(`[WARN] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
  };

  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  getExtensionPath(): string {
    return __dirname;
  }

  getPlatformName() {
    return 'mcp' as const;
  }
}
```

### Phase 4: Configuration for Claude Desktop
Create a configuration file for users to add to their Claude Desktop:

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "sharedo": {
      "command": "node",
      "args": ["C:/path/to/sharedo-mcp/dist/index.js"],
      "env": {
        "SHAREDO_SERVER_URL": "https://api.sharedo.com",
        "MCP_WORKSPACE": "C:/Users/username/sharedo-workspace"
      }
    }
  }
}
```

## How to Start Fresh

```bash
# 1. Navigate to your package
cd C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-mcp

# 2. Install dependencies
npm install

# 3. Build the server
npm run build

# 4. Test locally
node dist/index.js

# 5. Test with Claude Desktop
# Add configuration to Claude Desktop config file
```

## Testing Your MCP Server

### Local Testing:
```bash
# Build first
npm run build

# Run the server
node dist/index.js

# In another terminal, send test commands
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

### With Claude Desktop:
1. Build your server: `npm run build`
2. Add configuration to Claude Desktop
3. Restart Claude Desktop
4. Ask Claude: "Can you list my ShareDo workflows?"

## MCP Tools to Implement

Based on ShareDo functionality:
- `sharedo_connect` - Connect to ShareDo server
- `sharedo_list_workflows` - List available workflows
- `sharedo_download_workflow` - Download a workflow
- `sharedo_upload_workflow` - Upload a workflow
- `sharedo_execute_workflow` - Execute a workflow
- `sharedo_create_file` - Create a file from template
- `sharedo_list_templates` - List available templates
- `sharedo_get_file` - Get file contents
- `sharedo_save_file` - Save file changes

## Important Resources

### MCP Documentation
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [MCP Specification](https://modelcontextprotocol.io)

### ShareDo Knowledge Base
**Path**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`

## Coordination Notes

**Wait for these packages first:**
1. `@sharedo/core` - Need authentication
2. `@sharedo/platform-adapter` - Need interfaces
3. `@sharedo/business` - Need services

Your MCP server will expose ShareDo functionality to AI assistants!

## Your Goal

Create an MCP server that:
- Exposes all ShareDo operations as MCP tools
- Provides resources for workflows and templates
- Handles errors gracefully
- Logs operations for debugging
- Works seamlessly with Claude Desktop

---
**Last Updated**: 2025-08-29
**Package Status**: New package - ready for MCP server development