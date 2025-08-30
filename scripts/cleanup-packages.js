#!/usr/bin/env node

/**
 * Cleanup Package Source Files Script
 * 
 * This script removes incorrect CLI code from each package and keeps only
 * what each package should have according to its purpose.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKTREE_BASE = 'C:\\Users\\IgorJericevich\\Documents\\GitHub\\ShareDo-Platform';
const BACKUP_BASE = 'C:\\Users\\IgorJericevich\\Documents\\GitHub\\ShareDo-Platform-Backup';

// Define what each package should keep
const PACKAGE_CLEANUP_RULES = {
  'sharedo-core': {
    keep: [
      'src/server/authenticate.ts',
      'src/server/sharedoClient.ts',
      'src/config/config.ts',
      'src/config/environments.ts',
      'src/enums.ts',
      'src/Request/IauthorizeResponse.ts',
      'src/Utilities/common.ts',
      'src/Utilities/promiseManagement.ts'
    ],
    createNew: [
      {
        path: 'src/index.ts',
        content: `/**
 * @sharedo/core - Authentication and API clients
 */

// Authentication
export * from './auth';

// API
export * from './api';

// Models
export * from './models';

// Config
export * from './config/config';
export * from './config/environments';

// Utils
export * from './utils';

// Enums
export * from './enums';
`
      },
      {
        path: 'src/auth/index.ts',
        content: `export { AuthenticationService } from './authentication.service';
export { TokenManager } from './token.manager';
export * from './interfaces';
`
      },
      {
        path: 'src/api/index.ts',
        content: `export { BaseApiClient } from './base-api.client';
export * from './interfaces';
`
      },
      {
        path: 'src/models/index.ts',
        content: `export * from './user.model';
export * from './workflow.model';
export * from './file.model';
`
      },
      {
        path: 'src/utils/index.ts',
        content: `export * from '../Utilities/common';
export * from '../Utilities/promiseManagement';
`
      }
    ]
  },
  
  'sharedo-business': {
    keep: [
      'src/Request/Workflows',
      'src/Request/File',
      'src/Request/IDE',
      'src/Request/IDETemplates',
      'src/Request/ExecutionBase.ts',
      'src/Utilities/arrayHelper.ts',
      'src/Utilities/fileManagement.ts',
      'src/Utilities/timepan.ts'
    ],
    createNew: [
      {
        path: 'src/index.ts',
        content: `/**
 * @sharedo/business - Business logic layer
 */

// Services
export { WorkflowService } from './services/workflow.service';
export { FileService } from './services/file.service';
export { TemplateService } from './services/template.service';
export { IDEService } from './services/ide.service';

// Interfaces
export * from './interfaces';

// Utils
export * from './utils';
`
      },
      {
        path: 'src/services/index.ts',
        content: `export { WorkflowService } from './workflow.service';
export { FileService } from './file.service';
export { TemplateService } from './template.service';
export { IDEService } from './ide.service';
`
      },
      {
        path: 'src/interfaces/index.ts',
        content: `export * from '../Request/Workflows/IWorkflow';
export * from '../Request/File/IFile';
export * from '../Request/IDETemplates/IIDETemplate';
export * from '../Request/IDE/IIDE';
`
      },
      {
        path: 'src/utils/index.ts',
        content: `export * from '../Utilities/arrayHelper';
export * from '../Utilities/fileManagement';
export * from '../Utilities/timepan';
`
      }
    ]
  },
  
  'sharedo-platform-adapter': {
    keep: [], // Keep nothing, it's all new
    createNew: [
      {
        path: 'src/index.ts',
        content: `/**
 * @sharedo/platform-adapter - Platform abstraction interfaces
 */

// Main platform interface
export { IPlatform } from './interfaces/platform.interface';

// Sub-interfaces
export { IFileSystem } from './interfaces/file-system.interface';
export { IUserInterface, IProgress } from './interfaces/user-interface.interface';
export { ILogger } from './interfaces/logger.interface';
export { IStorage } from './interfaces/storage.interface';

// Types
export * from './types';
`
      },
      {
        path: 'src/interfaces/platform.interface.ts',
        content: `import { IFileSystem } from './file-system.interface';
import { IUserInterface } from './user-interface.interface';
import { ILogger } from './logger.interface';
import { IStorage } from './storage.interface';

export interface IPlatform {
  fs: IFileSystem;
  ui: IUserInterface;
  logger: ILogger;
  storage: IStorage;
  
  getWorkspaceRoot(): string;
  getExtensionPath(): string;
  getPlatformName(): 'cli' | 'vscode' | 'mcp';
  getVersion(): string;
}
`
      },
      {
        path: 'src/interfaces/file-system.interface.ts',
        content: `export interface IFileSystem {
  // Read operations
  readFile(path: string): Promise<string>;
  readFileSync(path: string): string;
  exists(path: string): Promise<boolean>;
  existsSync(path: string): boolean;
  
  // Write operations
  writeFile(path: string, content: string): Promise<void>;
  writeFileSync(path: string, content: string): void;
  createDirectory(path: string): Promise<void>;
  
  // Directory operations
  listFiles(directory: string, pattern?: string): Promise<string[]>;
  
  // Path operations
  join(...paths: string[]): string;
  resolve(path: string): string;
  relative(from: string, to: string): string;
  dirname(path: string): string;
  basename(path: string): string;
}
`
      },
      {
        path: 'src/interfaces/user-interface.interface.ts',
        content: `export interface IUserInterface {
  showMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
  showProgress(message: string, cancellable?: boolean): IProgress;
  prompt(message: string, defaultValue?: string): Promise<string | undefined>;
  confirm(message: string): Promise<boolean>;
  selectOption<T>(message: string, options: T[], display?: (item: T) => string): Promise<T | undefined>;
  selectFile(options?: any): Promise<string | undefined>;
  selectFolder(options?: any): Promise<string | undefined>;
}

export interface IProgress {
  report(increment: number, message?: string): void;
  complete(): void;
}
`
      },
      {
        path: 'src/interfaces/logger.interface.ts',
        content: `export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error | unknown): void;
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
  getLevel(): string;
}
`
      },
      {
        path: 'src/interfaces/storage.interface.ts',
        content: `export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  getWorkspace<T>(key: string): Promise<T | undefined>;
  setWorkspace<T>(key: string, value: T): Promise<void>;
}
`
      },
      {
        path: 'src/types/index.ts',
        content: `export type PlatformType = 'cli' | 'vscode' | 'mcp';

export interface PlatformConfig {
  name: string;
  version: string;
  type: PlatformType;
}
`
      }
    ]
  },
  
  'sharedo-cli': {
    keep: [
      'src/sharedo.ts',
      'src/sharedo-dev.ts',
      'src/sharedo-dev-connect.ts',
      'src/sharedo-dev-project.ts',
      'src/sharedo-dev-project-init.ts',
      'src/sharedo-dev-source.ts',
      'src/sharedo-dev-source-deploy.ts',
      'src/sharedo-dev-source-retrieve.ts',
      'src/connect/connect.ts',
      'src/project',
      'src/Utilities/inform.ts'
    ],
    createNew: [
      {
        path: 'src/index.ts',
        content: `#!/usr/bin/env node

/**
 * @sharedo/cli - Command-line interface
 */

import { Command } from 'commander';
import { version } from '../package.json';

const program = new Command();

program
  .name('sharedo')
  .description('ShareDo CLI - Workflow automation tool')
  .version(version);

// TODO: Register commands here

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
`
      }
    ]
  },
  
  'sharedo-vscode': {
    keep: [], // All new for VS Code
    createNew: [
      {
        path: 'src/extension.ts',
        content: `/**
 * @sharedo/vscode - VS Code Extension
 */

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('ShareDo extension is now active!');
  
  const disposable = vscode.commands.registerCommand('sharedo.connect', () => {
    vscode.window.showInformationMessage('ShareDo: Connecting to server...');
  });
  
  context.subscriptions.push(disposable);
}

export function deactivate() {}
`
      },
      {
        path: 'src/index.ts',
        content: `export { activate, deactivate } from './extension';
`
      }
    ]
  },
  
  'sharedo-mcp': {
    keep: [], // All new for MCP
    createNew: [
      {
        path: 'src/index.ts',
        content: `/**
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
`
      }
    ]
  }
};

console.log('🧹 ShareDo Package Cleanup Script\n');
console.log('This will clean up incorrect source files from each package.\n');

// Function to recursively delete a directory
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        deleteDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// Function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Step 1: Create backups
console.log('📦 Step 1: Creating backups...\n');

if (!fs.existsSync(BACKUP_BASE)) {
  fs.mkdirSync(BACKUP_BASE, { recursive: true });
}

Object.keys(PACKAGE_CLEANUP_RULES).forEach(packageName => {
  const srcPath = path.join(WORKTREE_BASE, packageName, 'src');
  const backupPath = path.join(BACKUP_BASE, packageName, 'src');
  
  if (fs.existsSync(srcPath)) {
    console.log(`  Backing up ${packageName}...`);
    copyDirectory(srcPath, backupPath);
  }
});

console.log('\n✅ Backups created at:', BACKUP_BASE);

// Step 2: Clean up packages
console.log('\n🗑️ Step 2: Cleaning up packages...\n');

Object.entries(PACKAGE_CLEANUP_RULES).forEach(([packageName, rules]) => {
  const packagePath = path.join(WORKTREE_BASE, packageName);
  const srcPath = path.join(packagePath, 'src');
  
  console.log(`  Cleaning ${packageName}...`);
  
  // Save files we want to keep
  const filesToKeep = {};
  rules.keep.forEach(keepPath => {
    const fullPath = path.join(packagePath, keepPath);
    if (fs.existsSync(fullPath)) {
      if (fs.lstatSync(fullPath).isDirectory()) {
        // For directories, we'll copy them back later
        filesToKeep[keepPath] = 'directory';
      } else {
        // For files, save the content
        filesToKeep[keepPath] = fs.readFileSync(fullPath, 'utf-8');
      }
    }
  });
  
  // Delete entire src directory
  if (fs.existsSync(srcPath)) {
    deleteDirectory(srcPath);
  }
  
  // Recreate src directory
  fs.mkdirSync(srcPath, { recursive: true });
  
  // Restore kept files
  Object.entries(filesToKeep).forEach(([filePath, content]) => {
    const fullPath = path.join(packagePath, filePath);
    const dirPath = path.dirname(fullPath);
    
    // Create directory structure
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (content === 'directory') {
      // Copy directory from backup
      const backupDirPath = path.join(BACKUP_BASE, packageName, filePath);
      if (fs.existsSync(backupDirPath)) {
        copyDirectory(backupDirPath, fullPath);
      }
    } else {
      // Write file content
      fs.writeFileSync(fullPath, content);
    }
  });
  
  // Create new files
  rules.createNew.forEach(newFile => {
    const fullPath = path.join(packagePath, newFile.path);
    const dirPath = path.dirname(fullPath);
    
    // Create directory structure
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write new file
    fs.writeFileSync(fullPath, newFile.content);
  });
  
  console.log(`    ✅ ${packageName} cleaned and restructured`);
});

// Step 3: Summary
console.log('\n📊 Step 3: Cleanup Summary\n');

Object.keys(PACKAGE_CLEANUP_RULES).forEach(packageName => {
  const srcPath = path.join(WORKTREE_BASE, packageName, 'src');
  
  // Count files
  let fileCount = 0;
  function countFiles(dir) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          countFiles(filePath);
        } else {
          fileCount++;
        }
      });
    }
  }
  
  countFiles(srcPath);
  console.log(`  ${packageName}: ${fileCount} files`);
});

console.log('\n✨ Cleanup complete!\n');
console.log('Next steps:');
console.log('1. Review the cleaned packages');
console.log('2. Run npm install in each package if needed');
console.log('3. Start the AI assistants with npm run claude:*');
console.log('\nBackups saved to:', BACKUP_BASE);
console.log('You can delete the backup folder once you verify everything works.');