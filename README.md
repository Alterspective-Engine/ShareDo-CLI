# ShareDo Platform - Unified CLI, VS Code Extension & MCP Server

## Overview

ShareDo Platform is a monorepo implementing a unified architecture that shares 80% of business logic across CLI, VS Code extension, and MCP (Model Context Protocol) server implementations.

## Architecture

```
sharedo-platform/
├── packages/
│   ├── core/                    # Core utilities and interfaces (100% shared)
│   ├── business/                 # Business logic layer (95% shared)
│   ├── platform-adapter/        # Platform abstraction layer
│   ├── cli/                     # CLI application
│   ├── vscode/                  # VS Code extension
│   └── mcp/                     # MCP server
```

## Important Resources

### ShareDo Knowledge Base
**Location**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`
- Comprehensive ShareDo platform documentation
- API specifications and architecture guides
- Best practices and patterns

### Derived Private APIs (⚠️ USE WITH EXTREME CAUTION)
**Location**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\DerivedAPIs`

This directory contains automatically generated API documentation from ShareDo's Nancy modules:
- **580** Nancy modules analyzed
- **975** API endpoints documented
- **319** endpoints with verified response types
- See `README.md` in that directory for complete details
- See `API_CATALOG_CONSOLIDATED.md` for the full API catalog

**⚠️ WARNING**: These are PRIVATE APIs that are:
- NOT officially supported
- Subject to change without notice
- May break in future releases
- Should only be used when public APIs are insufficient

### Private API Usage Requirements

All private API usage MUST be:
1. **Documented** in `docs/PRIVATE_API_REGISTRY.md`
2. **Justified** with clear business requirements
3. **Risk-assessed** for stability and security
4. **Migration-planned** with plugin architecture specification
5. **Time-bound** with concrete migration timeline

See `docs/PRIVATE_API_REGISTRY.md` for the required documentation format and current private API usage.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/sharedo/sharedo-platform.git
cd sharedo-platform

# Install dependencies
npm install

# Bootstrap all packages
npm run bootstrap

# Build all packages
npm run build
```

### Development

```bash
# Start development mode (all packages)
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

### Using the CLI

```bash
# Install globally
npm install -g @sharedo/cli

# Connect to ShareDo server
sharedo connect --url https://api.sharedo.com

# List workflows
sharedo workflow list

# Download a workflow
sharedo workflow download my-workflow

# See all commands
sharedo --help
```

### VS Code Extension

1. Open the `packages/vscode` folder in VS Code
2. Press `F5` to launch a new VS Code window with the extension
3. Use Command Palette (`Ctrl+Shift+P`) and search for "ShareDo"

### MCP Server

```bash
# Start the MCP server
cd packages/mcp
npm start

# Configure Claude Desktop to use the server
# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "sharedo": {
      "command": "node",
      "args": ["path/to/packages/mcp/dist/index.js"]
    }
  }
}
```

## Documentation

- **Architecture**: See `docs/VSCODE_EXTENSION_CLI_UNIFIED_ARCHITECTURE.md`
- **API Catalog**: See `docs/SHAREDO_PUBLIC_API_CATALOG.md`
- **Implementation Guide**: See `docs/SHARED_CODE_IMPLEMENTATION_GUIDE.md`
- **Private API Registry**: See `docs/PRIVATE_API_REGISTRY.md`
- **Feature Mapping**: See `docs/VSCODE_EXTENSION_CLI_FEATURE_MAPPING.md`

## API Usage Guidelines

### Public APIs (Preferred)
- Always use public APIs (`/api/public/*`) when available
- These are officially supported and stable
- Full documentation in `docs/SHAREDO_PUBLIC_API_CATALOG.md`

### Private APIs (Last Resort)
When public APIs are insufficient:
1. Check the Derived APIs catalog at `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\DerivedAPIs\API_CATALOG_CONSOLIDATED.md`
2. Document usage in `docs/PRIVATE_API_REGISTRY.md`
3. Include:
   - Business justification
   - Risk assessment
   - Plugin migration plan
   - Timeline for migration
4. Implement with proper error handling and fallbacks

## Contributing

### Adding New Features
1. Implement business logic in `@sharedo/business`
2. Add types to `@sharedo/core`
3. Create platform adapters if needed
4. Add CLI commands and VS Code commands
5. Update documentation
6. Write comprehensive tests

### Code Sharing Principles
- Platform-agnostic business logic
- Platform adapters for UI and file system
- Shared interfaces and types
- No duplicate implementations

## Package Structure

| Package | Purpose | Sharing |
|---------|---------|---------|
| @sharedo/core | Authentication, API clients, models | 100% |
| @sharedo/business | Workflow, export, HLD logic | 95% |
| @sharedo/platform-adapter | Platform abstraction | Interface only |
| @sharedo/cli | Command-line interface | Platform-specific |
| @sharedo/vscode | VS Code extension | Platform-specific |
| @sharedo/mcp | MCP server | Platform-specific |

## Security

- Never hardcode credentials
- Use environment variables or secure storage
- Validate all inputs
- Implement rate limiting
- Log security events
- Encrypt sensitive data

## Support

- **Issues**: [GitHub Issues](https://github.com/sharedo/sharedo-platform/issues)
- **Documentation**: See `/docs` folder
- **Knowledge Base**: See paths listed above

## License

[MIT License](LICENSE)

---

**Version**: 1.0.0  
**Last Updated**: 2025-08-28  
**Maintainers**: ShareDo Platform Team