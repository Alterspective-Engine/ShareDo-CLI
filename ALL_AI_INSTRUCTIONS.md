# 📋 ShareDo Platform - Instructions for ALL AI Developers

**CRITICAL: Read this FIRST before doing any work!**

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Sync with Latest Code
```bash
# STOP what you're doing and run:
git stash  # Save any work in progress
git checkout main
git pull origin main
npm install
npm run build
```

## 🚨 CRITICAL: PROJECT BLOCKED DUE TO CORE PACKAGE

## 🎯 Current Development Status

| Package | AI Status | Current Task | Dependencies Ready? |
|---------|-----------|--------------|-------------------|
| **@sharedo/core** | 🔴 FAILING | URGENT: Add 6 missing APIs + ALL TESTS | N/A |
| **@sharedo/platform-adapter** | ✅ COMPLETE | Week 1 Done - Monitoring Only | N/A |
| **@sharedo/business** | ⚠️ BLOCKED | Cannot start - Core incomplete | NO ❌ |
| **@sharedo/cli** | ⏸️ WAITING | Wait for business package | NO - Blocked |
| **@sharedo/vscode** | ⏸️ WAITING | Wait for business package | NO - Blocked |
| **@sharedo/mcp** | ⏸️ WAITING | Wait for business package | NO - Blocked |

### 🟢 PROJECT UNBLOCKED - BUSINESS CAN START NOW!

**Update 4:15 PM Aug 30: Core has delivered the critical components!**

#### Core Package Status:
1. ✅ **All 6 API clients COMPLETE** (IDE, Template, Form, Document, Validation, ChangeTracking)
2. ⚠️ Tests partial (~10% coverage, needs 80%)
3. ❌ JSDoc documentation still needed
4. ✅ **Build passing, code functional**

#### Action Items by Package:

**BUSINESS AI - START NOW:**
- Core's API clients are ready to use
- Begin implementing WorkflowManager
- Create ExportManager with progress tracking
- Use TDD approach even though Core didn't

**CORE AI - CONTINUE TODAY:**
- Write tests for all 6 new API clients
- Add JSDoc documentation
- Achieve 80% coverage by end of day

**CLI/VSCode/MCP AIs - WAIT:**
- Continue standing by until Business package ready
- Expected start: Monday, Sept 2
- Review Business implementation over weekend

**Timeline Update:**
- Core functional: ✅ DONE (4 PM)
- Business start: NOW
- Core tests/docs: By 6 PM today
- CLI/VSCode start: Monday morning

## 📚 Required Reading

1. **Your package's CLAUDE.md** - Your specific instructions
2. **GIT_BEST_PRACTICES.md** - MUST follow these Git rules
3. **COORDINATION_NOTES.md** - Current sprint status
4. **BUSINESS_AI_CHECKLIST.md** - If you're the business AI

## 🔄 Git Workflow (MANDATORY)

### Every AI MUST Follow This Pattern:

```bash
# 1. START OF WORK - Always create a feature branch
git checkout main
git pull origin main
git checkout -b feature/<package>-<feature>

# 2. DURING WORK - Commit frequently
git add <specific-files>  # NEVER use git add .
git commit -m "<type>(<package>): <description>"

# Examples:
git commit -m "feat(business): implement WorkflowManager"
git commit -m "test(business): add WorkflowManager tests"
git commit -m "fix(core): handle null token response"

# 3. END OF SESSION - Always push
git push -u origin feature/<package>-<feature>
```

### Commit Message Format:
- `feat(<package>):` - New feature
- `fix(<package>):` - Bug fix
- `test(<package>):` - Adding tests
- `docs(<package>):` - Documentation
- `refactor(<package>):` - Code restructuring

## 🏗️ Architecture Rules

### 1. Import Hierarchy
```typescript
// CLI, VSCode, MCP can import from:
import { ... } from '@sharedo/core';      // ✅
import { ... } from '@sharedo/business';  // ✅
import { ... } from '@sharedo/platform-adapter'; // ✅

// Business can import from:
import { ... } from '@sharedo/core';      // ✅
import { ... } from '@sharedo/platform-adapter'; // ✅
// import from '@sharedo/cli' // ❌ NEVER

// Core can import from:
// No @sharedo packages - it's the foundation! // ❌
```

### 2. Code Sharing Target
- **80% shared code** between CLI, VSCode, MCP
- All business logic in `@sharedo/business`
- Platform-specific code only for UI/environment

## 📦 Package-Specific Instructions

### For Core AI (✅ Complete)
```bash
# Your work is done! Just monitor and help others
git checkout main
git pull origin main
# Review completed implementation in packages/core/
```

**You built:**
- AuthenticationService
- BaseApiClient with retry logic
- WorkflowApiClient, WorkTypeApiClient, ExportApiClient
- All models and interfaces

### For Platform-Adapter AI (✅ Complete)
```bash
# Your work is done! Just monitor
git checkout main
git pull origin main
# Review interfaces in packages/platform-adapter/
```

**You defined:**
- IPlatform main interface
- IFileSystem, IUserInterface
- IConfiguration, ISecretStorage
- IProcessManager

### For Business AI (🚀 ACTIVE NOW)
```bash
# You should be working on:
git checkout main
git pull origin main
git checkout -b feature/business-workflow-manager

# Start implementing:
# 1. WorkflowManager (use WorkflowApiClient from core)
# 2. ExportManager (use ExportApiClient from core)
# 3. HLDGenerator
```

**Pattern to follow:**
```typescript
import { WorkflowApiClient } from '@sharedo/core';
import { IPlatform } from '@sharedo/platform-adapter';

export class WorkflowManager {
  constructor(
    private platform: IPlatform,
    private apiClient: WorkflowApiClient
  ) {}
  
  async downloadWorkflow(name: string): Promise<void> {
    const progress = this.platform.ui.showProgress('Downloading...');
    try {
      // Use apiClient for API calls
      // Use platform for UI/file operations
      progress.report({ message: 'Fetching...', percentage: 20 });
      const workflow = await this.apiClient.getWorkflow(name);
      // ... implementation
      progress.complete();
    } catch (error) {
      progress.error(error);
      throw error;
    }
  }
}
```

### For CLI AI (⏸️ WAITING)
```bash
# DO NOT START YET - Wait for business package
# When ready (in ~2 days), you will:
git checkout main
git pull origin main
git checkout -b feature/cli-commands

# You will implement:
# 1. CLIPlatformAdapter (implements IPlatform)
# 2. CLI commands using Commander.js
# 3. Use business logic from @sharedo/business
```

**Your future imports:**
```typescript
import { WorkflowManager, ExportManager } from '@sharedo/business';
import { IPlatform } from '@sharedo/platform-adapter';
import { AuthenticationService } from '@sharedo/core';
```

### For VSCode AI (⏸️ WAITING)
```bash
# DO NOT START YET - Wait for business package
# When ready (in ~2 days), you will:
git checkout main
git pull origin main
git checkout -b feature/vscode-extension

# You will implement:
# 1. VSCodePlatformAdapter (implements IPlatform)
# 2. Tree views and commands
# 3. Use business logic from @sharedo/business
```

### For MCP AI (⏸️ WAITING)
```bash
# DO NOT START YET - Wait for business package
# When ready (in ~3-4 days), you will:
git checkout main
git pull origin main
git checkout -b feature/mcp-server

# You will implement:
# 1. MCP tools and handlers
# 2. Use business logic from @sharedo/business
```

## 🧪 Testing Requirements

### Every Package Must:
1. Write tests alongside implementation
2. Achieve **80% code coverage**
3. Test error scenarios
4. Mock external dependencies

```bash
# Run tests
npm test

# Check coverage
npm run test:coverage

# Build check
npm run build
```

## 📊 Daily Checklist

### Start of Day:
- [ ] Pull latest changes: `git pull origin main`
- [ ] Check COORDINATION_NOTES.md for updates
- [ ] Create/switch to feature branch
- [ ] Run `npm install` if package.json changed

### During Work:
- [ ] Commit after each component completion
- [ ] Use descriptive commit messages
- [ ] Run tests frequently
- [ ] Check build: `npm run build`

### End of Day:
- [ ] Push all commits
- [ ] Update your progress in commits
- [ ] Leave notes if blocked

## 🚫 Common Mistakes to AVOID

1. **DON'T** work directly on main branch
2. **DON'T** use `git add .` - be specific
3. **DON'T** commit without testing
4. **DON'T** forget to push at end of session
5. **DON'T** implement business logic in CLI/VSCode/MCP
6. **DON'T** import from packages that depend on you
7. **DON'T** use console.log - use platform.ui methods
8. **DON'T** access file system directly - use platform.fs

## 🆘 When You're Blocked

If blocked, leave a note in COORDINATION_NOTES.md:
```markdown
### [Package Name] - BLOCKED
**Issue**: Need ExportManager from business package
**Blocking**: CLI export command implementation
**Workaround**: Implementing other commands first
```

## 📈 Progress Tracking

Check your progress:
```bash
# See your commits
git log --oneline --author="$(git config user.name)"

# Check package status
npm run build
npm test

# See what changed
git diff main...HEAD --stat
```

## 🎯 Success Criteria

Your package is ready when:
- ✅ All planned features implemented
- ✅ 80% test coverage
- ✅ No TypeScript errors
- ✅ Follows all patterns in CLAUDE.md
- ✅ Clean Git history with atomic commits
- ✅ Documentation on public methods

## 🔄 Coordination Protocol

1. **Business AI** builds first (NOW)
2. **CLI & VSCode AIs** start when business is 50% done
3. **MCP AI** starts last
4. **Core & Platform-Adapter AIs** provide support

## 📝 Remember

- **Read your CLAUDE.md file** - It has package-specific details
- **Follow GIT_BEST_PRACTICES.md** - No exceptions
- **Check COORDINATION_NOTES.md** - For latest updates
- **Commit frequently** - Small, atomic commits
- **Test everything** - Before committing
- **Communicate blockers** - Don't stay stuck

---

**Last Updated**: 2025-08-30
**Version**: 1.0.0
**Architect**: Platform Architect AI

**Questions?** Check COORDINATION_NOTES.md or ask the Architect AI.