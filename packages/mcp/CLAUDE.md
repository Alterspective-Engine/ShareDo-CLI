# MCP Server - Developer AI Instructions

## Your Role
You are responsible for implementing the @sharedo/mcp package of the ShareDo Platform. This package provides the Model Context Protocol (MCP) server that allows AI assistants like Claude to interact with ShareDo.

## Package Overview
The MCP server implements:
- MCP protocol server
- Tool definitions for ShareDo operations
- Authentication handling
- Request routing
- Response streaming
- Error handling

## Dependencies
- @sharedo/core: ^1.0.0 (authentication, API clients)
- @sharedo/business: ^1.0.0 (all business logic)
- @modelcontextprotocol/sdk: ^0.5.0 (MCP SDK)

## Current Sprint Goals (Week 9)
- [ ] Set up MCP server
- [ ] Define ShareDo tools
- [ ] Implement authentication
- [ ] Add request handlers
- [ ] Create streaming responses

## MCP Server Implementation

### Server Setup
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class ShareDoMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
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

    this.registerTools();
    this.registerHandlers();
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### Tool Definitions
```typescript
private registerTools() {
  // Authentication tool
  this.server.setRequestHandler('tools/list', async () => ({
    tools: [
      {
        name: 'sharedo_authenticate',
        description: 'Authenticate with ShareDo server',
        inputSchema: {
          type: 'object',
          properties: {
            server: { type: 'string', description: 'ShareDo server URL' },
            clientId: { type: 'string', description: 'OAuth client ID' },
            clientSecret: { type: 'string', description: 'OAuth client secret' },
            impersonateUser: { type: 'string', description: 'User to impersonate' },
          },
          required: ['server', 'clientId'],
        },
      },
      {
        name: 'sharedo_list_workflows',
        description: 'List workflows from ShareDo',
        inputSchema: {
          type: 'object',
          properties: {
            filter: { type: 'string', description: 'Filter query' },
            limit: { type: 'number', description: 'Maximum results' },
          },
        },
      },
      {
        name: 'sharedo_download_workflow',
        description: 'Download a workflow',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Workflow name' },
          },
          required: ['name'],
        },
      },
    ],
  }));
}
```

### Request Handlers
```typescript
private registerHandlers() {
  this.server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'sharedo_authenticate':
        return await this.handleAuthenticate(args);
      
      case 'sharedo_list_workflows':
        return await this.handleListWorkflows(args);
      
      case 'sharedo_download_workflow':
        return await this.handleDownloadWorkflow(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}

private async handleAuthenticate(args: any) {
  const authService = new AuthenticationService();
  const token = await authService.authenticate({
    tokenEndpoint: `${args.server}/api/authorize`,
    clientId: args.clientId,
    clientSecret: args.clientSecret,
    impersonateUser: args.impersonateUser,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Authenticated successfully. Token expires in ${token.expires_in} seconds.`,
      },
    ],
  };
}
```

## File Structure
```
packages/mcp/
├── src/
│   ├── server/
│   │   ├── server.ts
│   │   └── transport.ts
│   ├── tools/
│   │   ├── auth.tools.ts
│   │   ├── workflow.tools.ts
│   │   ├── export.tools.ts
│   │   └── query.tools.ts
│   ├── handlers/
│   │   ├── auth.handler.ts
│   │   ├── workflow.handler.ts
│   │   └── export.handler.ts
│   ├── utils/
│   │   ├── error.handler.ts
│   │   └── response.formatter.ts
│   ├── index.ts
│   └── types.ts
├── tests/
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Tool Categories

### Authentication Tools
- `sharedo_authenticate`: Connect to ShareDo server
- `sharedo_logout`: Clear authentication
- `sharedo_whoami`: Get current user info

### Workflow Tools
- `sharedo_list_workflows`: List available workflows
- `sharedo_download_workflow`: Download workflow definition
- `sharedo_upload_workflow`: Upload workflow
- `sharedo_validate_workflow`: Validate workflow
- `sharedo_compare_workflows`: Compare two workflows

### Export Tools
- `sharedo_create_export`: Create export configuration
- `sharedo_export_status`: Check export job status
- `sharedo_download_export`: Download export package
- `sharedo_list_exports`: List recent exports

### Query Tools
- `sharedo_query_worktypes`: Query work types
- `sharedo_query_forms`: Query forms
- `sharedo_query_users`: Query users
- `sharedo_search`: General search

## Implementation Guidelines

### Error Handling
```typescript
private handleError(error: any) {
  if (error instanceof BusinessError) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}\nOperation: ${error.operation}`,
        },
      ],
      isError: true,
    };
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Unexpected error: ${error.message}`,
      },
    ],
    isError: true,
  };
}
```

### Response Formatting
```typescript
private formatResponse(data: any, format?: 'json' | 'table') {
  if (format === 'json') {
    return {
      content: [
        {
          type: 'text',
          text: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
        },
      ],
    };
  }
  
  // Default text format
  return {
    content: [
      {
        type: 'text',
        text: this.toReadableText(data),
      },
    ],
  };
}
```

### Streaming Responses
```typescript
private async* streamLargeResult(data: any[]) {
  const chunkSize = 10;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    yield {
      content: [
        {
          type: 'text',
          text: this.formatChunk(chunk, i, data.length),
        },
      ],
    };
  }
}
```

## Configuration
```json
{
  "name": "sharedo-mcp",
  "description": "ShareDo MCP server for AI assistants",
  "command": "node",
  "args": ["dist/index.js"],
  "env": {
    "SHAREDO_DEFAULT_SERVER": "https://api.sharedo.com"
  }
}
```

## Testing Requirements
- Test all tool handlers
- Mock business layer
- Test error scenarios
- Test streaming responses
- Integration tests with MCP SDK

## Git Workflow Requirements

### IMPORTANT: Follow Git Best Practices
See `/GIT_BEST_PRACTICES.md` for full details. Key requirements:

1. **Create feature branch for MCP features**:
   ```bash
   git checkout -b feature/mcp-tools
   ```

2. **Commit tools and handlers separately**:
   ```bash
   git commit -m "feat(mcp): implement workflow list tool"
   git commit -m "feat(mcp): add export monitoring handler"
   ```

3. **Document protocol decisions**:
   ```bash
   git commit -m "feat(mcp): add streaming for large responses
   
   Implements chunked response streaming for workflow downloads
   to handle large files without timeout"
   ```

### Your Git Workflow
```bash
# Start of session
git checkout main
git pull origin main
git checkout -b feature/mcp-server

# After implementing tools
git add packages/mcp/src/tools/workflow-tools.ts
git commit -m "feat(mcp): implement workflow management tools"

# After server setup
git add packages/mcp/src/server.ts
git commit -m "feat(mcp): setup MCP server with authentication"

# End of session
git push origin feature/mcp-server
```

## Communication with Architect
- Report MCP SDK limitations
- Coordinate tool naming with other packages
- Request business logic enhancements
- Submit PRs for review

## Current Tasks
- [ ] MCP server setup
- [ ] Tool registration
- [ ] Authentication handler
- [ ] Workflow tools
- [ ] Export tools
- [ ] Query tools
- [ ] Error handling
- [ ] Response formatting
- [ ] Unit tests
- [ ] Integration tests

## MCP Guidelines
- Keep tool names descriptive
- Provide clear descriptions
- Use proper JSON schema for inputs
- Handle errors gracefully
- Format responses for readability

## Known Considerations
- MCP protocol version compatibility
- Response size limits
- Streaming for large datasets
- Authentication persistence

## PR Status
- No PRs pending

## Notes for Next Sprint
- Add resource providers
- Implement prompts
- Add sampling support
- Create tool composition

---

**Sprint**: Week 9
**Status**: Not Started
**Last Updated**: 2025-01-29