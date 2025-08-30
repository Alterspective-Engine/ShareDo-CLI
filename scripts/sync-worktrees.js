#!/usr/bin/env node

/**
 * Sync all worktrees with main branch
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Syncing all worktrees with main branch...\n');

try {
  // Get list of worktrees
  const worktrees = execSync('git worktree list --porcelain', { encoding: 'utf8' })
    .split('\n\n')
    .filter(Boolean)
    .map(block => {
      const lines = block.split('\n');
      const worktreePath = lines[0].replace('worktree ', '');
      const branch = lines[2]?.replace('branch refs/heads/', '') || 'detached';
      return { path: worktreePath, branch };
    });

  // Skip the main worktree
  const worktreesToSync = worktrees.filter(w => !w.branch.includes('main'));

  console.log(`Found ${worktreesToSync.length} worktrees to sync:\n`);

  for (const worktree of worktreesToSync) {
    console.log(`📁 Syncing ${worktree.branch} at ${worktree.path}`);
    
    try {
      // Change to worktree directory
      process.chdir(worktree.path);
      
      // Fetch latest changes
      execSync('git fetch origin', { stdio: 'pipe' });
      
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        console.log(`   ⚠️  Uncommitted changes found, skipping rebase`);
        console.log(`   📝 ${status.split('\n').length} files modified`);
      } else {
        // Rebase on main
        try {
          execSync('git rebase origin/main', { stdio: 'pipe' });
          console.log(`   ✅ Successfully rebased on main`);
        } catch (rebaseError) {
          console.log(`   ❌ Rebase failed - manual intervention required`);
        }
      }
      
      // Show status
      const ahead = execSync('git rev-list --count origin/main..HEAD', { encoding: 'utf8' }).trim();
      const behind = execSync('git rev-list --count HEAD..origin/main', { encoding: 'utf8' }).trim();
      
      if (ahead !== '0' || behind !== '0') {
        console.log(`   📊 ${ahead} commits ahead, ${behind} commits behind main`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error syncing: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Return to original directory
  process.chdir(path.dirname(__dirname));
  
  console.log('✅ Sync complete!');
  
  // Show summary
  console.log('\n📊 Worktree Summary:');
  execSync('git worktree list', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
}