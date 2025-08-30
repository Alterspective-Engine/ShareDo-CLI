# CLI Package - Developer AI Instructions

## Your Role
You are responsible for implementing the @sharedo/cli package of the ShareDo Platform. This package provides the command-line interface for ShareDo operations using the shared business logic.

## Package Overview
The CLI package implements:
- Command-line interface using Commander.js
- Platform adapter for CLI environment
- Output formatting (JSON, Table, CSV)
- Interactive prompts with Inquirer
- Progress indicators with Ora
- Secure credential storage with Keytar

## Dependencies
- @sharedo/core: ^1.0.0 (authentication, API clients)
- @sharedo/business: ^1.0.0 (all business logic)
- @sharedo/platform-adapter: ^1.0.0 (interfaces to implement)
- commander: ^11.0.0 (CLI framework)
- inquirer: ^8.2.6 (interactive prompts)
- ora: ^5.4.1 (progress spinners)
- chalk: ^4.1.2 (colored output)
- keytar: ^7.9.0 (credential storage)

## Current Sprint Goals (Week 5)
- [ ] Implement CLIPlatformAdapter
- [ ] Create authentication commands
- [ ] Build workflow commands
- [ ] Add export commands
- [ ] Implement output formatters

## Platform Adapter Implementation

### CLIPlatformAdapter
You must implement all interfaces from @sharedo/platform-adapter:

```typescript
import { IPlatform } from '@sharedo/platform-adapter';
import * as inquirer from 'inquirer';
import * as ora from 'ora';
import * as keytar from 'keytar';

export class CLIPlatformAdapter implements IPlatform {
  // UI Operations
  ui = {
    showMessage: (message: string, type?: MessageType) => {
      // Use chalk for colored output
    },
    showProgress: (title: string) => {
      // Use ora for spinners
    },
    prompt: async (message: string, options?: IPromptOptions) => {
      // Use inquirer for prompts
    }
  };

  // File System
  fs = {
    readFile: async (path: string) => {
      // Use Node.js fs
    }
  };

  // Secrets
  secrets = {
    get: async (key: string) => {
      // Use keytar
    }
  };
}
```

## Command Structure

### Authentication Commands
```bash
sharedo login [options]
  --url <url>           ShareDo server URL
  --client-id <id>      OAuth client ID
  --client-secret <secret>  OAuth client secret
  --impersonate <user>  Impersonate user

sharedo logout
sharedo whoami
```

### Workflow Commands
```bash
sharedo workflow list [options]
  --filter <query>      Filter workflows
  --format <format>     Output format (json|table|csv)

sharedo workflow download <name> [options]
  --output <path>       Output directory
  --overwrite          Overwrite existing

sharedo workflow upload <file> [options]
  --validate           Validate before upload
  --dry-run           Simulate upload

sharedo workflow validate <file>
sharedo workflow compare <file1> <file2>
```

### Export Commands
```bash
sharedo export create <config> [options]
  --wait               Wait for completion
  --timeout <ms>       Maximum wait time

sharedo export status <id>
sharedo export download <id> [options]
  --output <path>      Output directory
  --extract           Extract package

sharedo export list [options]
  --recent <n>         Show recent exports
```

## File Structure
```
packages/cli/
├── src/
│   ├── adapters/
│   │   └── cli-platform.adapter.ts
│   ├── commands/
│   │   ├── auth.command.ts
│   │   ├── workflow.command.ts
│   │   ├── export.command.ts
│   │   ├── worktype.command.ts
│   │   └── form.command.ts
│   ├── utils/
│   │   ├── output.formatter.ts
│   │   ├── config.manager.ts
│   │   └── error.handler.ts
│   ├── index.ts
│   └── cli.ts
├── bin/
│   └── sharedo.js
├── tests/
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Implementation Guidelines

### Command Pattern
```typescript
import { Command } from 'commander';
import { WorkflowManager } from '@sharedo/business';

export function createWorkflowCommand(
  platform: IPlatform,
  apiClient: WorkflowApiClient
): Command {
  const command = new Command('workflow');
  const manager = new WorkflowManager(platform, apiClient);

  command
    .command('download <name>')
    .description('Download workflow from server')
    .option('-o, --output <path>', 'output directory')
    .action(async (name, options) => {
      try {
        await manager.downloadWorkflow(name);
      } catch (error) {
        handleError(error);
      }
    });

  return command;
}
```

### Output Formatting
```typescript
export class OutputFormatter {
  static format(data: any, format: 'json' | 'table' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'table':
        return this.toTable(data);
      case 'csv':
        return this.toCsv(data);
    }
  }
}
```

### Error Handling
```typescript
export function handleError(error: Error): void {
  if (error instanceof BusinessError) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (program.opts().verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
```

## Configuration Management
```typescript
// Store in ~/.sharedo/config.json
{
  "defaultServer": "https://api.sharedo.com",
  "outputFormat": "table",
  "colorOutput": true
}
```

## Testing Requirements
- Test all commands with mocked business layer
- Test output formatters
- Test error scenarios
- Test interactive prompts
- Integration tests with real commands

## Git Workflow Requirements

### IMPORTANT: Follow Git Best Practices
See `/GIT_BEST_PRACTICES.md` for full details. Key requirements:

1. **Create feature branch for command groups**:
   ```bash
   git checkout -b feature/cli-workflow-commands
   ```

2. **Commit commands and implementations separately**:
   ```bash
   git commit -m "feat(cli): implement workflow list command"
   git commit -m "feat(cli): add workflow download with progress"
   ```

3. **Commit platform adapter separately**:
   ```bash
   git commit -m "feat(cli): implement CLIPlatformAdapter with inquirer"
   ```

### Your Git Workflow
```bash
# Start of session
git checkout main
git pull origin main
git checkout -b feature/cli-commands

# After implementing a command
git add packages/cli/src/commands/workflow.ts
git commit -m "feat(cli): add workflow management commands"

# After platform adapter
git add packages/cli/src/platform/cli-adapter.ts
git commit -m "feat(cli): implement CLI platform adapter with ora progress"

# End of session
git push origin feature/cli-commands
```

## Communication with Architect
- Report any platform adapter limitations
- Request business logic enhancements
- Coordinate with VS Code on shared patterns
- Submit PRs for review

## Current Tasks
- [ ] CLIPlatformAdapter implementation
- [ ] Main CLI entry point
- [ ] Authentication commands
- [ ] Workflow commands
- [ ] Export commands
- [ ] Output formatters
- [ ] Configuration manager
- [ ] Error handler
- [ ] Unit tests
- [ ] Integration tests

## UX Guidelines
- Always show progress for long operations
- Provide helpful error messages
- Support --help for all commands
- Allow both flags and interactive mode
- Respect NO_COLOR environment variable

## Known Considerations
- Keytar may not work in all environments
- Consider fallback for credential storage
- Handle Ctrl+C gracefully
- Support piping and redirection

## PR Status
- No PRs pending

## Notes for Next Sprint
- Add shell completion support
- Implement watch mode for some commands
- Add plugin system for extensions
- Consider adding aliases for common operations

---

**Sprint**: Week 5
**Status**: Not Started
**Last Updated**: 2025-01-29