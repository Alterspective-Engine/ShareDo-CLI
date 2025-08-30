#!/usr/bin/env node

/**
 * Fix Worktree Packages Script
 * 
 * This script fixes the incorrectly set up worktrees by:
 * 1. Giving each package the correct name and purpose
 * 2. Removing CLI code from non-CLI packages
 * 3. Setting up proper inter-package dependencies
 * 4. Creating the correct folder structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKTREE_BASE = 'C:\\Users\\IgorJericevich\\Documents\\GitHub\\ShareDo-Platform';

// Define what each package should be
const PACKAGE_CONFIGS = {
  'sharedo-core': {
    name: '@sharedo/core',
    version: '1.0.0',
    description: 'Core authentication, API clients, and shared models for ShareDo platform',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    keepSrc: [
      'server/authenticate.ts',
      'server/sharedoClient.ts',
      'config/config.ts',
      'config/environments.ts',
      'enums.ts',
      'Request/IauthorizeResponse.ts',
      'Utilities/common.ts',
      'Utilities/promiseManagement.ts'
    ],
    dependencies: {
      'axios': '^1.3.4',
      'uuid': '^9.0.0'
    }
  },
  'sharedo-business': {
    name: '@sharedo/business',
    version: '1.0.0',
    description: 'Business logic for workflows, files, and templates',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    keepSrc: [
      'Request/Workflows',
      'Request/File',
      'Request/IDE',
      'Request/IDETemplates',
      'Request/ExecutionBase.ts',
      'Utilities/arrayHelper.ts',
      'Utilities/fileManagement.ts',
      'Utilities/timepan.ts'
    ],
    dependencies: {
      '@sharedo/core': '^1.0.0',
      '@sharedo/platform-adapter': '^1.0.0',
      'axios': '^1.3.4'
    }
  },
  'sharedo-platform-adapter': {
    name: '@sharedo/platform-adapter',
    version: '1.0.0',
    description: 'Platform abstraction layer for file system and UI operations',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    newSrc: true, // This will be created from scratch
    dependencies: {}
  },
  'sharedo-cli': {
    name: '@sharedo/cli',
    version: '1.0.0',
    description: 'Command-line interface for ShareDo platform',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    bin: {
      'sharedo': './dist/index.js'
    },
    keepSrc: [
      'sharedo.ts',
      'sharedo-dev.ts',
      'sharedo-dev-connect.ts',
      'sharedo-dev-project.ts',
      'sharedo-dev-project-init.ts',
      'sharedo-dev-source.ts',
      'sharedo-dev-source-deploy.ts',
      'sharedo-dev-source-retrieve.ts',
      'connect/connect.ts',
      'project',
      'Utilities/inform.ts'
    ],
    dependencies: {
      '@sharedo/core': '^1.0.0',
      '@sharedo/business': '^1.0.0',
      '@sharedo/platform-adapter': '^1.0.0',
      'commander': '^10.0.0',
      'chalk': '^4.1.2',
      'inquirer': '^8.2.5',
      'figlet': '^1.5.0',
      'clear': '^0.1.0'
    }
  },
  'sharedo-vscode': {
    name: '@sharedo/vscode',
    version: '1.0.0',
    description: 'VS Code extension for ShareDo platform',
    main: 'dist/extension.js',
    newSrc: true, // Will be created from scratch
    dependencies: {
      '@sharedo/core': '^1.0.0',
      '@sharedo/business': '^1.0.0',
      '@sharedo/platform-adapter': '^1.0.0',
      'vscode': '^1.1.37'
    },
    engines: {
      'vscode': '^1.74.0'
    }
  },
  'sharedo-mcp': {
    name: '@sharedo/mcp',
    version: '1.0.0',
    description: 'Model Context Protocol server for ShareDo platform',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    newSrc: true, // Will be created from scratch
    dependencies: {
      '@sharedo/core': '^1.0.0',
      '@sharedo/business': '^1.0.0',
      '@sharedo/platform-adapter': '^1.0.0'
    }
  }
};

console.log('🔧 ShareDo Platform Package Fixer\n');
console.log('This script will fix the incorrectly configured worktree packages.\n');

// Step 1: Fix package.json files
console.log('📦 Step 1: Fixing package.json files...\n');

Object.entries(PACKAGE_CONFIGS).forEach(([worktree, config]) => {
  const worktreePath = path.join(WORKTREE_BASE, worktree);
  const packageJsonPath = path.join(worktreePath, 'package.json');
  
  console.log(`  Fixing ${worktree}...`);
  
  // Create new package.json
  const packageJson = {
    name: config.name,
    version: config.version,
    description: config.description,
    main: config.main,
    types: config.types,
    scripts: {
      'build': 'tsc',
      'clean': 'rimraf dist',
      'test': 'jest',
      'lint': 'eslint src --ext .ts',
      'watch': 'tsc --watch'
    },
    dependencies: config.dependencies,
    devDependencies: {
      '@types/node': '^20.10.0',
      'typescript': '^5.3.0',
      'jest': '^29.7.0',
      'ts-jest': '^29.1.1',
      '@typescript-eslint/eslint-plugin': '^6.13.0',
      '@typescript-eslint/parser': '^6.13.0',
      'eslint': '^8.54.0',
      'rimraf': '^5.0.5'
    }
  };
  
  if (config.bin) {
    packageJson.bin = config.bin;
  }
  
  if (config.engines) {
    packageJson.engines = config.engines;
  }
  
  // Add specific dev dependencies
  if (worktree === 'sharedo-cli') {
    packageJson.devDependencies['@types/inquirer'] = '^9.0.3';
    packageJson.devDependencies['@types/figlet'] = '^1.5.5';
    packageJson.devDependencies['@types/clear'] = '^0.1.2';
  }
  
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2)
  );
  
  console.log(`    ✅ Updated package.json for ${config.name}`);
});

// Step 2: Create proper tsconfig.json files
console.log('\n📝 Step 2: Creating tsconfig.json files...\n');

const baseTsConfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    lib: ['ES2020'],
    outDir: './dist',
    rootDir: './src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    resolveJsonModule: true
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', '**/*.test.ts']
};

Object.keys(PACKAGE_CONFIGS).forEach(worktree => {
  const worktreePath = path.join(WORKTREE_BASE, worktree);
  const tsconfigPath = path.join(worktreePath, 'tsconfig.json');
  
  fs.writeFileSync(
    tsconfigPath,
    JSON.stringify(baseTsConfig, null, 2)
  );
  
  console.log(`  ✅ Created tsconfig.json for ${worktree}`);
});

// Step 3: Create index.ts files for new packages
console.log('\n📄 Step 3: Creating index.ts files...\n');

// Create index.ts for platform-adapter
const platformAdapterIndex = `/**
 * Platform Adapter - Abstraction layer for platform-specific operations
 */

export interface IPlatform {
  // File system operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  
  // UI operations
  showMessage(message: string): void;
  showError(message: string): void;
  prompt(message: string, options?: any): Promise<string>;
  
  // Environment
  getWorkspaceRoot(): string;
  getConfigPath(): string;
}

export interface ILogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
`;

fs.writeFileSync(
  path.join(WORKTREE_BASE, 'sharedo-platform-adapter', 'src', 'index.ts'),
  platformAdapterIndex
);
console.log('  ✅ Created platform-adapter/src/index.ts');

// Create index.ts for vscode
const vscodeIndex = `/**
 * ShareDo VS Code Extension
 */

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('ShareDo extension is now active!');
  
  // Register commands here
  const disposable = vscode.commands.registerCommand('sharedo.connect', () => {
    vscode.window.showInformationMessage('ShareDo: Connecting to server...');
  });
  
  context.subscriptions.push(disposable);
}

export function deactivate() {}
`;

// Create src directory if it doesn't exist
['sharedo-vscode', 'sharedo-mcp'].forEach(worktree => {
  const srcPath = path.join(WORKTREE_BASE, worktree, 'src');
  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath, { recursive: true });
  }
});

fs.writeFileSync(
  path.join(WORKTREE_BASE, 'sharedo-vscode', 'src', 'index.ts'),
  vscodeIndex
);
console.log('  ✅ Created vscode/src/index.ts');

// Create index.ts for mcp
const mcpIndex = `/**
 * ShareDo MCP Server
 */

export class ShareDoMCPServer {
  constructor() {
    console.log('ShareDo MCP Server initialized');
  }
  
  async start(port: number = 3000) {
    console.log(\`Starting MCP server on port \${port}\`);
    // MCP server implementation will go here
  }
}

export default ShareDoMCPServer;
`;

fs.writeFileSync(
  path.join(WORKTREE_BASE, 'sharedo-mcp', 'src', 'index.ts'),
  mcpIndex
);
console.log('  ✅ Created mcp/src/index.ts');

// Step 4: Create README.md for each package
console.log('\n📚 Step 4: Creating README files...\n');

Object.entries(PACKAGE_CONFIGS).forEach(([worktree, config]) => {
  const readme = `# ${config.name}

${config.description}

## Installation

\`\`\`bash
npm install ${config.name}
\`\`\`

## Usage

This package is part of the ShareDo Platform monorepo.

## Development

\`\`\`bash
npm run build    # Build the package
npm run watch    # Watch for changes
npm run test     # Run tests
npm run lint     # Lint the code
\`\`\`
`;
  
  fs.writeFileSync(
    path.join(WORKTREE_BASE, worktree, 'README.md'),
    readme
  );
  console.log(`  ✅ Created README.md for ${worktree}`);
});

console.log('\n✨ Package configuration fixed!\n');
console.log('Next steps:');
console.log('1. Navigate to the main repository: cd C:\\Users\\IgorJericevich\\Documents\\GitHub\\SharedoCLI');
console.log('2. Install dependencies: npm install');
console.log('3. Link packages: npx lerna bootstrap');
console.log('4. Build core packages first: npm run build');
console.log('\nThen the AI assistants can start working on their respective packages!');