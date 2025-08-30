#!/usr/bin/env node

/**
 * Cross-platform runner for worktree setup
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const scriptDir = __dirname;

// Determine which script to run
const scriptFile = isWindows 
  ? path.join(scriptDir, 'setup-worktrees.ps1')
  : path.join(scriptDir, 'setup-worktrees.sh');

if (!fs.existsSync(scriptFile)) {
  console.error(`❌ Setup script not found: ${scriptFile}`);
  process.exit(1);
}

try {
  console.log('🚀 Starting worktree setup...\n');
  
  if (isWindows) {
    // Run PowerShell script
    execSync(`powershell -ExecutionPolicy Bypass -File "${scriptFile}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } else {
    // Make shell script executable and run it
    execSync(`chmod +x "${scriptFile}"`, { stdio: 'inherit' });
    execSync(`bash "${scriptFile}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  }
  
  console.log('\n✅ Worktree setup complete!');
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}