/**
 * @sharedo/mcp - MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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

// TODO: Register tools and resources

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ShareDo MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
