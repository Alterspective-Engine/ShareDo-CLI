# 🚀 Quick Reference for Each AI

## Core AI
```bash
# YOU'RE DONE! Just help others
git pull origin main
# Your code is in packages/core/
# Status: ✅ COMPLETE
```

## Platform-Adapter AI
```bash
# YOU'RE DONE! Just help others
git pull origin main
# Your interfaces in packages/platform-adapter/
# Status: ✅ COMPLETE
```

## Business AI
```bash
# YOU'RE ACTIVE NOW!
git stash
git checkout main
git pull origin main
git checkout -b feature/business-workflow-manager
npm install && npm run build

# Build these NOW:
# 1. WorkflowManager (use @sharedo/core APIs)
# 2. ExportManager (use @sharedo/core APIs)
# 3. Use IPlatform for UI/files

# Commit pattern:
git add packages/business/src/workflow/manager.ts
git commit -m "feat(business): implement WorkflowManager"
```

## CLI AI
```bash
# WAIT! Don't start yet
# Business package needs to be ~50% done first
# You'll be notified when ready (1-2 days)
# For now: Review packages/cli/CLAUDE.md
```

## VSCode AI
```bash
# WAIT! Don't start yet
# Business package needs to be ~50% done first
# You'll be notified when ready (1-2 days)
# For now: Review packages/vscode/CLAUDE.md
```

## MCP AI
```bash
# WAIT! Don't start yet
# Business package must be complete first
# You'll be notified when ready (3-4 days)
# For now: Review packages/mcp/CLAUDE.md
```

---

## 🔥 Key Commands Everyone Needs

```bash
# Check what branch you're on
git branch

# See your uncommitted changes
git status

# Build everything
npm run build

# Run tests
npm test

# See recent commits
git log --oneline -10
```

## 📋 Import Cheat Sheet

```typescript
// Business Package can use:
import { WorkflowApiClient } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';

// CLI/VSCode/MCP can use:
import { WorkflowManager } from '@sharedo/business';
import { AuthenticationService } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';
```

## 🚫 Never Do This
- Work on main branch
- Use `git add .`
- Commit without testing
- Import from packages that depend on you
- Implement business logic outside business package

## ✅ Always Do This
- Create feature branches
- Commit frequently
- Test before committing
- Push at end of session
- Read your CLAUDE.md file