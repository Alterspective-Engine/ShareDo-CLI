# Git Worktree Setup Guide for Parallel Claude Code Development

## Overview

This guide explains how to set up Git worktrees for the ShareDo Platform, enabling multiple Claude Code instances to work on different packages simultaneously without interference.

## Initial Setup

### 1. Clone the Main Repository
```bash
# Clone if not already done
git clone https://github.com/sharedo/sharedo-platform.git
cd sharedo-platform

# Ensure you're on main branch
git checkout main
git pull origin main
```

### 2. Create Worktrees for Each Package

Run these commands from the main repository root:

```bash
# Core Package Worktree
git worktree add ../sharedo-core -b feature/core-package

# Business Logic Worktree  
git worktree add ../sharedo-business -b feature/business-logic

# Platform Adapter Worktree
git worktree add ../sharedo-platform-adapter -b feature/platform-adapter

# CLI Worktree
git worktree add ../sharedo-cli -b feature/cli-implementation

# VS Code Extension Worktree
git worktree add ../sharedo-vscode -b feature/vscode-extension

# MCP Server Worktree
git worktree add ../sharedo-mcp -b feature/mcp-server
```

### 3. Directory Structure After Setup
```
parent-directory/
├── sharedo-platform/           # Main repository
├── sharedo-core/              # Worktree for core package
├── sharedo-business/          # Worktree for business logic
├── sharedo-platform-adapter/  # Worktree for platform adapter
├── sharedo-cli/               # Worktree for CLI
├── sharedo-vscode/            # Worktree for VS Code extension
└── sharedo-mcp/               # Worktree for MCP server
```

## Running Claude Code in Each Worktree

### For Core Package Development
```bash
cd ../sharedo-core

# Initialize the environment
npm install
npm run bootstrap

# Start Claude Code for this package
claude

# Claude will see the CLAUDE.md specific to core package
# and work only on packages/core/*
```

### For Business Logic Development
```bash
cd ../sharedo-business

# Initialize the environment
npm install
npm run bootstrap

# Start Claude Code
claude

# Claude will focus on packages/business/*
```

### For CLI Development
```bash
cd ../sharedo-cli

# Initialize the environment
npm install
npm run bootstrap

# Start Claude Code
claude

# Claude will work on packages/cli/*
```

## Parallel Development Workflow

### Morning Setup (Project Architect)
```bash
# In main repository
cd sharedo-platform

# Update all worktrees with latest changes
git worktree list | while IFS= read -r line; do
    worktree_path=$(echo "$line" | awk '{print $1}')
    echo "Updating $worktree_path"
    cd "$worktree_path"
    git fetch origin
    git rebase origin/main
done

# Return to main
cd -
```

### During Development (Each Claude Instance)

#### Claude Instance 1: Core Package
```bash
# Terminal 1
cd ../sharedo-core
claude

# Claude reads packages/core/CLAUDE.md
# Works on authentication and API clients
# Commits to feature/core-package branch
```

#### Claude Instance 2: Business Logic
```bash
# Terminal 2
cd ../sharedo-business
claude

# Claude reads packages/business/CLAUDE.md
# Works on workflow management
# Commits to feature/business-logic branch
```

#### Claude Instance 3: CLI
```bash
# Terminal 3
cd ../sharedo-cli
claude

# Claude reads packages/cli/CLAUDE.md
# Works on CLI commands
# Commits to feature/cli-implementation branch
```

### End of Day Integration
```bash
# Project Architect reviews and merges
cd sharedo-platform

# Review each worktree's changes
git worktree list

# Merge completed features
git checkout main
git merge feature/core-package
git merge feature/business-logic
# Resolve any conflicts
git push origin main
```

## Managing Worktrees

### List All Worktrees
```bash
git worktree list

# Output example:
# /path/to/sharedo-platform      abc1234 [main]
# /path/to/sharedo-core          def5678 [feature/core-package]
# /path/to/sharedo-business      ghi9012 [feature/business-logic]
```

### Remove a Worktree When Complete
```bash
# First, merge the branch if needed
git checkout main
git merge feature/core-package

# Then remove the worktree
git worktree remove ../sharedo-core

# Delete the branch if no longer needed
git branch -d feature/core-package
```

### Prune Stale Worktrees
```bash
# Remove references to deleted worktrees
git worktree prune
```

## Environment Setup for Each Worktree

### JavaScript/TypeScript Projects
```bash
# In each worktree directory
npm install        # Install dependencies
npm run bootstrap  # Bootstrap monorepo packages
npm run build      # Build the package
npm test          # Run tests
```

### Environment Variables
Create `.env` file in each worktree:
```bash
# .env
SHAREDO_API_URL=https://api.sharedo.com
SHAREDO_CLIENT_ID=your-client-id
SHAREDO_CLIENT_SECRET=your-client-secret
DEBUG=true
```

## Tips for Parallel Claude Development

### 1. Independent File States
- Each Claude instance only sees files in its worktree
- Changes in one worktree don't affect others
- Perfect isolation for parallel development

### 2. Shared Git History
- All worktrees share the same Git repository
- Commits are visible across all worktrees after push/fetch
- Use `git fetch` to see other worktrees' pushed changes

### 3. Communication Between Claude Instances
Since Claude instances are isolated, use these methods to coordinate:

```bash
# Leave notes for other Claude instances
echo "TODO for CLI team: Need new method in core" >> ../COORDINATION.md

# Use Git commits as communication
git commit -m "feat(core): Add exportWorkflow method for CLI team"
```

### 4. Descriptive Directory Names
```bash
# Good naming
../sharedo-core-auth-feature
../sharedo-cli-export-command
../sharedo-bugfix-auth-timeout

# Bad naming
../worktree1
../temp
../test
```

### 5. Long-Running Tasks
```bash
# Start a long export in one worktree
cd ../sharedo-export-job
claude
# Let Claude work on export feature

# Meanwhile, in another terminal
cd ../sharedo-quick-fix
claude
# Work on a quick bug fix
```

## Troubleshooting

### Worktree Already Exists
```bash
# Error: 'sharedo-core' already exists
git worktree remove ../sharedo-core --force
git worktree add ../sharedo-core -b feature/core-package
```

### Branch Already Exists
```bash
# Use existing branch instead of creating new
git worktree add ../sharedo-core feature/core-package
```

### Conflicts During Rebase
```bash
# In worktree with conflicts
git status
# Resolve conflicts in files
git add .
git rebase --continue
```

### Clean Up All Worktrees
```bash
# List all worktrees
git worktree list

# Remove each worktree
git worktree remove ../sharedo-core
git worktree remove ../sharedo-business
# ... etc

# Prune references
git worktree prune
```

## Best Practices

### 1. Daily Sync Routine
```bash
#!/bin/bash
# sync-worktrees.sh

echo "🔄 Syncing all worktrees with main..."

for worktree in ../sharedo-*; do
    if [ -d "$worktree/.git" ]; then
        echo "Updating $worktree"
        cd "$worktree"
        git fetch origin
        git rebase origin/main
    fi
done

echo "✅ All worktrees synced!"
```

### 2. Status Check Script
```bash
#!/bin/bash
# check-status.sh

echo "📊 Worktree Status Report"
echo "========================"

git worktree list | while IFS= read -r line; do
    worktree_path=$(echo "$line" | awk '{print $1}')
    branch=$(echo "$line" | sed 's/.*\[\(.*\)\]/\1/')
    
    cd "$worktree_path"
    changes=$(git status --porcelain | wc -l)
    ahead=$(git rev-list --count origin/main..HEAD)
    
    echo "📁 $branch"
    echo "   Path: $worktree_path"
    echo "   Uncommitted changes: $changes"
    echo "   Commits ahead of main: $ahead"
    echo ""
done
```

### 3. Package-Specific Setup
Each worktree should have its own setup based on the package:

```bash
# Core package setup
cd ../sharedo-core
npm install
echo "Working on: Core Package" > .claude-context

# Business package setup
cd ../sharedo-business
npm install
echo "Working on: Business Logic" > .claude-context

# CLI package setup
cd ../sharedo-cli
npm install
echo "Working on: CLI Implementation" > .claude-context
```

## Integration with CLAUDE.md

Each worktree should have its package-specific CLAUDE.md file that Claude Code will read:

- `sharedo-core/packages/core/CLAUDE.md` - Core package instructions
- `sharedo-business/packages/business/CLAUDE.md` - Business logic instructions
- `sharedo-cli/packages/cli/CLAUDE.md` - CLI instructions

This ensures each Claude instance knows exactly what to work on.

## Example Workflow Session

```bash
# Terminal 1: Project Architect
cd sharedo-platform
# Review PRs, update documentation, coordinate

# Terminal 2: Core Package Developer
cd ../sharedo-core
claude
# "Implement authentication service"

# Terminal 3: Business Logic Developer  
cd ../sharedo-business
claude
# "Create workflow manager"

# Terminal 4: CLI Developer
cd ../sharedo-cli
claude
# "Add workflow commands"

# All working in parallel without interference!
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-29
**Purpose**: Enable parallel Claude Code development using Git worktrees