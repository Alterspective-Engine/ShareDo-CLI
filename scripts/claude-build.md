# Claude Code Build Instructions

When working on a PR in GitHub Codespaces with Claude Code:

## Quick Build Fix Commands

### 1. Open the PR in Codespaces
### 2. Open Claude Code chat (Ctrl+Shift+L)
### 3. Use these prompts:

```
Fix all TypeScript errors in this workspace
```

```
Run npm run build:all and fix any errors that occur
```

```
Make sure all tests pass for the packages I've modified
```

```
Review my changes and ensure they build correctly
```

## Automated Build Workflow

### For New PRs:
1. Open PR in Codespaces
2. Ask Claude: "Check this PR builds correctly and fix any issues"
3. Claude will:
   - Run build commands
   - Identify errors
   - Fix them automatically
   - Commit the fixes

### For Failed Builds:
1. Check GitHub Actions tab for error details
2. Open in Codespaces
3. Paste error to Claude: "Fix this build error: [error details]"
4. Push Claude's fixes

## Common Claude Commands for Building

| Issue | Claude Command |
|-------|---------------|
| TypeScript errors | "Fix all TypeScript errors" |
| Missing dependencies | "Install missing dependencies and update package.json" |
| Failed tests | "Fix the failing tests" |
| Linting issues | "Fix all linting errors" |
| Build optimization | "Optimize the build configuration" |

## Semi-Automated Workflow

Create a checklist in your PR description:
```markdown
## Pre-merge Checklist (Use Claude Code in Codespaces)
- [ ] Ask Claude: "Run build:all and fix errors"
- [ ] Ask Claude: "Run all tests and fix failures"  
- [ ] Ask Claude: "Check TypeScript types"
- [ ] Ask Claude: "Review code for best practices"
- [ ] Push Claude's fixes
```