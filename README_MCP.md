# ShareDo MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to the ShareDo platform capabilities including workflow management, file operations, and IDE integration.

## Features

### Tools
- **authenticate** - Authenticate with ShareDo platform
- **list_workflows** - List all available workflows
- **get_workflow** - Get details of a specific workflow
- **execute_workflow** - Execute a workflow with parameters
- **download_file** - Download files from ShareDo
- **upload_file** - Upload files to ShareDo
- **list_templates** - List available IDE templates
- **get_ide_info** - Get IDE configuration information
- **deploy_project** - Deploy projects to ShareDo

### Resources
- `sharedo://config` - Current ShareDo configuration
- `sharedo://workflows` - List of all available workflows
- `sharedo://templates` - List of all available templates

### Prompts
- **create_workflow** - Generate new workflow definitions
- **analyze_workflow** - Analyze and suggest improvements for workflows

## Installation

```bash
npm install
npm run build
```

## Configuration

The server can be configured through the `mcp.json` file:

```json
{
  "mcpServers": {
    "sharedo": {
      "command": "node",
      "args": ["lib/mcp/server.js"],
      "env": {
        "SHAREDO_API_URL": "https://api.sharedo.com"
      }
    }
  }
}
```

## Usage

### Start the MCP Server

```bash
# Production mode
npm run mcp:start

# Development mode
npm run mcp:dev
```

### Use with Claude Desktop

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "sharedo": {
      "command": "node",
      "args": ["C:/Users/IgorJericevich/Documents/GitHub/ShareDo-Platform/sharedo-mcp/lib/mcp/server.js"]
    }
  }
}
```

## Authentication

Before using most features, authenticate with ShareDo:

```javascript
// Using the authenticate tool
{
  "tool": "authenticate",
  "arguments": {
    "username": "your-username",
    "password": "your-password",
    "serverUrl": "https://api.sharedo.com" // optional
  }
}
```

## Examples

### List Workflows
```javascript
{
  "tool": "list_workflows",
  "arguments": {}
}
```

### Execute a Workflow
```javascript
{
  "tool": "execute_workflow",
  "arguments": {
    "workflowId": "workflow-123",
    "parameters": {
      "input1": "value1",
      "input2": "value2"
    }
  }
}
```

### Upload a File
```javascript
{
  "tool": "upload_file",
  "arguments": {
    "filePath": "/path/to/file.js",
    "description": "JavaScript module"
  }
}
```

## Development

### Project Structure
```
sharedo-mcp/
├── src/
│   ├── mcp/
│   │   └── server.ts       # MCP server implementation
│   ├── server/
│   │   ├── sharedoClient.ts   # ShareDo API client
│   │   └── authenticate.ts    # Authentication logic
│   └── Request/            # API request handlers
├── lib/                    # Compiled JavaScript
├── package.json
├── tsconfig.json
└── mcp.json               # MCP configuration
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

## API Integration

The MCP server integrates with the ShareDo platform API to provide:
- Workflow automation
- Document management
- IDE file operations
- Template management
- Project deployment

## Security

- Credentials are stored securely in the local configuration
- Authentication tokens expire and are refreshed automatically
- All API communications use HTTPS

## Troubleshooting

### Server doesn't start
- Ensure all dependencies are installed: `npm install`
- Build the project: `npm run build`
- Check Node.js version (requires v14+)

### Authentication fails
- Verify credentials are correct
- Check server URL is accessible
- Ensure network connectivity

### Tools not working
- Authenticate first before using other tools
- Check the server logs for errors
- Verify API endpoints are reachable

## License

See LICENSE file in the project root.

## Support

For issues and questions, please contact the ShareDo support team.