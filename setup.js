#!/usr/bin/env node

/**
 * ShareDo Platform - Complete Setup Script
 * 
 * This script performs all necessary setup steps to prepare the development environment:
 * 1. Checks prerequisites (Node.js, npm, git)
 * 2. Installs dependencies
 * 3. Sets up monorepo with Lerna
 * 4. Builds all packages
 * 5. Sets up git worktrees for parallel development
 * 6. Initializes development environment
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logStep(step, description) {
  log(`${step}. ${description}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function execCommand(command, description, options = {}) {
  try {
    log(`   Executing: ${command}`, 'blue');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    logSuccess(description);
    return result;
  } catch (error) {
    logError(`Failed: ${description}`);
    if (!options.allowFailure) {
      throw error;
    }
    return null;
  }
}

async function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  const requirements = {
    node: { min: '18.0.0', current: null },
    npm: { min: '8.0.0', current: null },
    git: { min: '2.0.0', current: null }
  };
  
  // Check Node.js
  logStep('1', 'Checking Node.js version');
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim().substring(1);
    requirements.node.current = nodeVersion;
    if (compareVersions(nodeVersion, requirements.node.min) >= 0) {
      logSuccess(`Node.js ${nodeVersion} meets requirement (>= ${requirements.node.min})`);
    } else {
      throw new Error(`Node.js ${nodeVersion} is below minimum version ${requirements.node.min}`);
    }
  } catch (error) {
    logError('Node.js is not installed or version is too old');
    return false;
  }
  
  // Check npm
  logStep('2', 'Checking npm version');
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    requirements.npm.current = npmVersion;
    if (compareVersions(npmVersion, requirements.npm.min) >= 0) {
      logSuccess(`npm ${npmVersion} meets requirement (>= ${requirements.npm.min})`);
    } else {
      throw new Error(`npm ${npmVersion} is below minimum version ${requirements.npm.min}`);
    }
  } catch (error) {
    logError('npm is not installed or version is too old');
    return false;
  }
  
  // Check Git
  logStep('3', 'Checking Git installation');
  try {
    execSync('git --version', { encoding: 'utf8' });
    logSuccess('Git is installed');
  } catch (error) {
    logError('Git is not installed');
    return false;
  }
  
  return true;
}

function compareVersions(version1, version2) {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

async function installDependencies() {
  logSection('Installing Dependencies');
  
  // Install root dependencies
  logStep('1', 'Installing root dependencies');
  execCommand('npm install', 'Root dependencies installed');
  
  // Install lerna globally if not present
  logStep('2', 'Checking Lerna installation');
  try {
    execSync('npx lerna --version', { encoding: 'utf8', stdio: 'pipe' });
    logSuccess('Lerna is available');
  } catch {
    log('   Installing Lerna...', 'blue');
    execCommand('npm install -g lerna', 'Lerna installed globally');
  }
}

async function setupMonorepo() {
  logSection('Setting Up Monorepo');
  
  // Install dependencies for all packages
  logStep('1', 'Installing dependencies for all packages');
  execCommand('npm install', 'Package dependencies installed');
  
  // Link local packages
  logStep('2', 'Linking local packages');
  execCommand('npx lerna link', 'Local packages linked', { allowFailure: true });
  
  // Build all packages
  logStep('3', 'Building all packages');
  execCommand('npx lerna run build', 'All packages built', { allowFailure: true });
}

async function setupGitWorktrees() {
  logSection('Setting Up Git Worktrees');
  
  return new Promise((resolve) => {
    rl.question('Do you want to set up git worktrees for parallel development? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        logStep('1', 'Creating git worktrees');
        
        const isWindows = process.platform === 'win32';
        const scriptPath = path.join(__dirname, 'scripts', isWindows ? 'setup-worktrees.ps1' : 'setup-worktrees.sh');
        
        if (fs.existsSync(scriptPath)) {
          if (isWindows) {
            execCommand(
              `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
              'Git worktrees created',
              { allowFailure: true }
            );
          } else {
            execCommand(`chmod +x "${scriptPath}" && "${scriptPath}"`, 'Git worktrees created', { allowFailure: true });
          }
        } else {
          logWarning('Worktree setup script not found, skipping');
        }
      } else {
        log('Skipping git worktree setup', 'yellow');
      }
      resolve();
    });
  });
}

async function createEnvFile() {
  logSection('Setting Up Environment');
  
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    logWarning('.env file already exists, skipping creation');
    return;
  }
  
  logStep('1', 'Creating .env file template');
  
  const envTemplate = `# ShareDo Platform Environment Configuration
# Copy this file to .env and fill in your values

# ShareDo API Configuration
SHAREDO_API_URL=https://app.sharedo.co.uk
SHAREDO_CLIENT_ID=your_client_id_here
SHAREDO_CLIENT_SECRET=your_client_secret_here
SHAREDO_TENANT_ID=your_tenant_id_here

# Optional: User impersonation
# SHAREDO_IMPERSONATE_USER=user@example.com

# Development Settings
NODE_ENV=development
LOG_LEVEL=debug

# VS Code Extension Settings (if developing)
VSCODE_DEBUG=false

# MCP Server Settings
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
`;
  
  fs.writeFileSync(envPath, envTemplate);
  logSuccess('.env template created - please update with your credentials');
}

async function runTests() {
  logSection('Running Initial Tests');
  
  return new Promise((resolve) => {
    rl.question('Do you want to run tests now? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        logStep('1', 'Running all package tests');
        execCommand('npm test', 'Tests completed', { allowFailure: true });
      } else {
        log('Skipping tests', 'yellow');
      }
      resolve();
    });
  });
}

async function showNextSteps() {
  logSection('Setup Complete! 🎉');
  
  console.log('Next steps:\n');
  console.log('1. Update .env file with your ShareDo credentials');
  console.log('2. Choose your development approach:\n');
  
  console.log('   For CLI development:');
  log('   npm run dev:cli', 'cyan');
  
  console.log('\n   For VS Code extension development:');
  log('   npm run dev:vscode', 'cyan');
  
  console.log('\n   For MCP server development:');
  log('   npm run dev:mcp', 'cyan');
  
  console.log('\n   For parallel development with git worktrees:');
  log('   npm run claude:core      # Work on core package', 'cyan');
  log('   npm run claude:business  # Work on business logic', 'cyan');
  log('   npm run claude:cli       # Work on CLI', 'cyan');
  
  console.log('\n3. Read the documentation:');
  log('   - IMPLEMENTATION_PLAN.md for development roadmap', 'blue');
  log('   - docs/DEVELOPMENT_STANDARDS_AND_BEST_PRACTICES.md for coding standards', 'blue');
  log('   - WORKTREE_SETUP_GUIDE.md for parallel development guide', 'blue');
  
  console.log('\n' + '='.repeat(60));
  log('Happy coding! 🚀', 'green');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.clear();
  
  log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            ShareDo Platform Setup Script                 ║
║                                                           ║
║   This script will set up your development environment   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`, 'magenta');
  
  try {
    // Check prerequisites
    if (!await checkPrerequisites()) {
      logError('\nSetup failed: Prerequisites not met');
      logWarning('Please install the required software and try again');
      process.exit(1);
    }
    
    // Install dependencies
    await installDependencies();
    
    // Setup monorepo
    await setupMonorepo();
    
    // Create environment file
    await createEnvFile();
    
    // Setup git worktrees (optional)
    await setupGitWorktrees();
    
    // Run tests (optional)
    await runTests();
    
    // Show next steps
    await showNextSteps();
    
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
main();