# ShareDo CLI Package - AI Developer Instructions

## 🚨 IMPORTANT: Project Reset Notice
**Date**: 2025-08-29
**Status**: Fresh start after initial confusion

The project structure has been completely reorganized. This package now contains ONLY the CLI-specific code. The business logic has been moved to `@sharedo/business` and authentication to `@sharedo/core`.

## Your Package Identity
- **Package Name**: `@sharedo/cli`
- **Version**: 1.0.0
- **Purpose**: Command-line interface for ShareDo platform
- **Location**: `C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-cli`

## What This Package Should Contain

### ✅ IN SCOPE for @sharedo/cli:
1. **Command Definitions**
   - Commander.js command setup
   - Command argument parsing
   - Command option handling
   - Help text and documentation

2. **CLI User Interface**
   - Interactive prompts (inquirer)
   - Progress indicators (ora)
   - Colored output (chalk)
   - ASCII art (figlet)
   - Tables and formatting

3. **Platform Implementation**
   - Implement IPlatform from `@sharedo/platform-adapter`
   - File system operations for CLI
   - Console-based UI operations

4. **CLI-Specific Features**
   - Configuration file management (.sharedorc)
   - Command history
   - Shell completion
   - Environment setup

### ❌ NOT IN SCOPE (use from other packages):
- Authentication logic → Use `@sharedo/core`
- Workflow operations → Use `@sharedo/business`
- File operations logic → Use `@sharedo/business`
- API calls → Use `@sharedo/core`

## Current State of Your Package

### Existing CLI Code to Keep:
The `src/` folder contains old CLI code. Keep and refactor:

**Keep these command files:**
- `src/sharedo.ts` → Main CLI entry point
- `src/sharedo-dev.ts` → Dev commands
- `src/sharedo-dev-connect.ts` → Connect command
- `src/sharedo-dev-project.ts` → Project commands
- `src/sharedo-dev-source.ts` → Source commands
- `src/connect/connect.ts` → Connection logic (refactor to use @sharedo/core)
- `src/Utilities/inform.ts` → CLI output utilities

**Remove/Already moved:**
- `src/Request/*` → Business logic now in `@sharedo/business`
- `src/server/*` → Auth now in `@sharedo/core`
- `src/config/*` → Config now in `@sharedo/core`

## Your Dependencies

You depend on ALL the shared packages:
```typescript
import { AuthenticationService } from '@sharedo/core';
import { WorkflowService, FileService } from '@sharedo/business';
import { IPlatform } from '@sharedo/platform-adapter';
```

## Your Development Tasks

### Phase 1: Setup Platform Implementation (CURRENT)
1. Create CLIPlatform class implementing IPlatform
2. Refactor existing commands to use shared packages
3. Remove duplicate business logic
4. Clean up imports

### Phase 2: Command Structure
```typescript
// src/commands/workflow.commands.ts
import { Command } from 'commander';
import { WorkflowService } from '@sharedo/business';
import { AuthenticationService } from '@sharedo/core';
import { CLIPlatform } from '../platform/cli-platform';

export function registerWorkflowCommands(program: Command) {
  const platform = new CLIPlatform();
  const auth = new AuthenticationService();
  const workflowService = new WorkflowService(auth.getApiClient(), platform);

  program
    .command('workflow:list')
    .description('List all workflows')
    .action(async () => {
      const spinner = ora('Loading workflows...').start();
      try {
        const workflows = await workflowService.listWorkflows();
        spinner.succeed('Workflows loaded');
        console.table(workflows);
      } catch (error) {
        spinner.fail('Failed to load workflows');
        console.error(error);
      }
    });

  program
    .command('workflow:download <id>')
    .description('Download a workflow')
    .action(async (id) => {
      await workflowService.downloadWorkflow(id);
      console.log(chalk.green('✓ Workflow downloaded'));
    });
}
```

### Phase 3: Platform Implementation
```typescript
// src/platform/cli-platform.ts
import { IPlatform, IFileSystem, IUserInterface } from '@sharedo/platform-adapter';
import * as fs from 'fs/promises';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class CLIPlatform implements IPlatform {
  fs: IFileSystem = {
    readFile: async (path) => fs.readFile(path, 'utf-8'),
    writeFile: async (path, content) => fs.writeFile(path, content),
    exists: async (path) => {
      try {
        await fs.access(path);
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
          console.log(chalk.red('✗'), message);
          break;
        case 'warning':
          console.log(chalk.yellow('⚠'), message);
          break;
        default:
          console.log(chalk.blue('ℹ'), message);
      }
    },
    
    prompt: async (message, defaultValue) => {
      const { answer } = await inquirer.prompt([{
        name: 'answer',
        message,
        default: defaultValue
      }]);
      return answer;
    },
    
    showProgress: (message) => {
      const spinner = ora(message).start();
      return {
        report: (_, msg) => { if (msg) spinner.text = msg; },
        complete: () => spinner.succeed()
      };
    },
    // ... implement all IUserInterface methods
  };

  getWorkspaceRoot(): string {
    return process.cwd();
  }

  getPlatformName() {
    return 'cli' as const;
  }
  
  // ... implement rest of IPlatform
}
```

## Main Entry Point

Update `src/index.ts` (or create if needed):
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { registerWorkflowCommands } from './commands/workflow.commands';
import { registerFileCommands } from './commands/file.commands';
import { registerConnectCommands } from './commands/connect.commands';
import { version } from '../package.json';

const program = new Command();

program
  .name('sharedo')
  .description('ShareDo CLI - Workflow automation tool')
  .version(version);

// Register all command groups
registerWorkflowCommands(program);
registerFileCommands(program);
registerConnectCommands(program);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
```

## How to Start Fresh

```bash
# 1. Navigate to your package
cd C:\Users\IgorJericevich\Documents\GitHub\ShareDo-Platform\sharedo-cli

# 2. Clean old artifacts
rm -rf dist node_modules

# 3. Install dependencies
npm install

# 4. Create platform implementation
mkdir -p src/platform src/commands

# 5. Build the CLI
npm run build

# 6. Test locally
node dist/index.js --help
```

## Testing Your CLI

```bash
# Build first
npm run build

# Test commands
node dist/index.js connect --help
node dist/index.js workflow:list
node dist/index.js file:download test.txt

# Install globally for testing
npm link
sharedo --help
```

## Important Resources

### ShareDo Knowledge Base
**Path**: `C:\Users\IgorJericevich\Alterspective\Alterspective Knowledge Base - Documents\AI Knowledgebase\LearnSD\KB`

### Example Commands to Implement
From the existing CLI:
- `sharedo connect` - Connect to ShareDo server
- `sharedo workflow:list` - List workflows
- `sharedo workflow:download <id>` - Download workflow
- `sharedo file:create` - Create file
- `sharedo project:init` - Initialize project
- `sharedo source:deploy` - Deploy source

## Coordination Notes

**Wait for these packages to be built first:**
1. `@sharedo/core` - Need authentication
2. `@sharedo/platform-adapter` - Need interfaces
3. `@sharedo/business` - Need services

Then you can import and use them in your commands!

## Your Goal

Create a beautiful, user-friendly CLI that:
- Uses shared business logic (don't duplicate!)
- Provides great UX with colors, spinners, and clear messages
- Handles errors gracefully
- Supports both interactive and non-interactive modes

---
**Last Updated**: 2025-08-29
**Package Status**: Contains old CLI code - needs refactoring to use shared packages