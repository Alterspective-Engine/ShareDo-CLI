#!/usr/bin/env node

/**
 * Clean up all worktrees (remove them)
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧹 ShareDo Worktree Cleanup\n');

// Get list of worktrees
let worktrees;
try {
  worktrees = execSync('git worktree list --porcelain', { encoding: 'utf8' })
    .split('\n\n')
    .filter(Boolean)
    .map(block => {
      const lines = block.split('\n');
      const worktreePath = lines[0].replace('worktree ', '');
      const branch = lines[2]?.replace('branch refs/heads/', '') || 'detached';
      return { path: worktreePath, branch };
    })
    .filter(w => !w.branch.includes('main')); // Don't remove main worktree
} catch (error) {
  console.error('❌ Failed to get worktree list:', error.message);
  process.exit(1);
}

if (worktrees.length === 0) {
  console.log('✅ No worktrees to clean up');
  rl.close();
  process.exit(0);
}

console.log('Found the following worktrees:');
worktrees.forEach(w => {
  console.log(`  📁 ${w.branch} at ${w.path}`);
});

console.log('\n⚠️  WARNING: This will remove all worktrees listed above!');
console.log('Any uncommitted changes will be lost.\n');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🗑️  Removing worktrees...\n');
  
  let removed = 0;
  let failed = 0;
  
  worktrees.forEach(worktree => {
    try {
      console.log(`Removing ${worktree.branch}...`);
      execSync(`git worktree remove "${worktree.path}" --force`, { stdio: 'pipe' });
      console.log(`  ✅ Removed successfully`);
      removed++;
    } catch (error) {
      console.log(`  ❌ Failed to remove: ${error.message}`);
      failed++;
    }
  });
  
  // Prune any stale worktree references
  try {
    execSync('git worktree prune', { stdio: 'pipe' });
    console.log('\n🧹 Pruned stale worktree references');
  } catch (error) {
    console.log('\n⚠️  Failed to prune stale references');
  }
  
  // Show summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`  ✅ Removed: ${removed} worktrees`);
  if (failed > 0) {
    console.log(`  ❌ Failed: ${failed} worktrees`);
  }
  
  // Optionally clean up branches
  rl.question('\nDo you also want to delete the feature branches? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      console.log('\n🗑️  Deleting feature branches...\n');
      
      const branches = [
        'feature/core-package',
        'feature/business-logic',
        'feature/platform-adapter',
        'feature/cli-implementation',
        'feature/vscode-extension',
        'feature/mcp-server'
      ];
      
      branches.forEach(branch => {
        try {
          execSync(`git branch -D ${branch}`, { stdio: 'pipe' });
          console.log(`  ✅ Deleted branch: ${branch}`);
        } catch (error) {
          // Branch might not exist, that's okay
        }
      });
    }
    
    console.log('\n✅ Cleanup complete!');
    rl.close();
  });
});