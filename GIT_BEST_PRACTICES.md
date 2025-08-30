# Git Best Practices for ShareDo Platform Development

## 🎯 Overview

This document defines Git workflows and practices for all AI developers working on the ShareDo Platform. These practices ensure clean history, proper documentation, and safe parallel development.

## 🔀 Branch Strategy

### Branch Types

| Branch Type | Pattern | Purpose | Example |
|-------------|---------|---------|---------|
| Main | `main` | Production-ready code | `main` |
| Feature | `feature/*` | New features | `feature/workflow-manager` |
| Fix | `fix/*` | Bug fixes | `fix/auth-token-refresh` |
| Refactor | `refactor/*` | Code improvements | `refactor/api-client-structure` |
| Docs | `docs/*` | Documentation only | `docs/api-usage-guide` |
| Test | `test/*` | Test additions/improvements | `test/workflow-integration` |

### Branch Naming Rules
- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Include package name when specific: `feature/core-auth-improvement`
- Maximum 50 characters

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **perf**: Performance improvements

### Scope
- Package name: `core`, `business`, `cli`, `vscode`, `mcp`, `platform-adapter`
- Or component: `auth`, `workflow`, `export`, `hld`

### Examples

```bash
# Good commit messages
git commit -m "feat(core): add retry logic to BaseApiClient"
git commit -m "fix(auth): handle token refresh for impersonation"
git commit -m "docs(business): add workflow manager usage examples"
git commit -m "refactor(platform-adapter): simplify IFileSystem interface"
git commit -m "test(export): add integration tests for polling"

# Bad commit messages - DON'T DO THIS
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "updates"
```

## 🤖 AI Developer Workflow

### 1. Starting Work on a Package

```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/package-component

# Example for business package
git checkout -b feature/business-workflow-manager
```

### 2. During Development

#### Commit Frequency
- Commit after each completed component
- Commit when switching between major tasks
- Commit before taking a break
- Never leave uncommitted work at end of session

#### Commit Workflow
```bash
# Check what you're about to commit
git status
git diff

# Stage specific files (not everything)
git add packages/core/src/api/workflow.client.ts
git add packages/core/src/api/workflow.client.test.ts

# Commit with meaningful message
git commit -m "feat(core): implement WorkflowApiClient with filtering support"

# Push regularly to backup work
git push origin feature/branch-name
```

### 3. Making Clean Commits

#### Before Committing, Ask Yourself:
1. ✅ Does this commit do ONE thing?
2. ✅ Could someone understand what changed from the message?
3. ✅ Are all tests passing?
4. ✅ Is the code formatted correctly?

#### Atomic Commits
```bash
# Good - Separate commits for separate concerns
git add packages/core/src/auth
git commit -m "feat(core): add AuthenticationService"

git add packages/core/src/api/base.client.ts
git commit -m "feat(core): implement BaseApiClient with retry logic"

git add packages/core/tests
git commit -m "test(core): add auth service unit tests"

# Bad - Everything in one commit
git add .
git commit -m "add auth and api stuff"
```

### 4. Completing a Feature

```bash
# Ensure branch is up to date
git fetch origin
git rebase origin/main

# Push final changes
git push origin feature/branch-name

# Create PR (if GitHub CLI available)
gh pr create --title "feat(package): description" --body "Details..."

# Or push and create PR via GitHub web interface
```

## 🔧 Special Situations

### Fixing a Mistake in Last Commit

```bash
# Amend last commit (before pushing)
git add forgotten-file.ts
git commit --amend

# Or just change the message
git commit --amend -m "feat(core): better commit message"
```

### Work in Progress (WIP)

```bash
# If you must save WIP (end of day, switching tasks)
git add .
git commit -m "WIP: implementing export manager [skip ci]"

# When resuming, amend or squash before final push
git commit --amend -m "feat(business): implement export manager"
```

### Handling Conflicts

```bash
# Update your branch
git fetch origin
git rebase origin/main

# If conflicts occur
# 1. Fix conflicts in files
# 2. Stage resolved files
git add resolved-file.ts

# 3. Continue rebase
git rebase --continue
```

## 📋 Package-Specific Guidelines

### Core Package
- Commit auth changes separately from API clients
- Test commits should follow implementation commits
- Document breaking changes in commit body

### Business Package
- Commit each manager (Workflow, Export, HLD) separately
- Include integration points in commit messages
- Reference platform-adapter interfaces used

### Platform Packages (CLI, VS Code, MCP)
- Commit platform implementation separately from business usage
- Document UI/UX decisions in commit messages
- Include screenshots in PR descriptions when relevant

## 🚫 What NOT to Do

### Never Do This:
```bash
# Don't commit everything at once
git add .
git commit -m "lots of changes"

# Don't commit without testing
git commit -m "fix(core): hopefully fixes auth" # without running tests

# Don't push directly to main
git push origin main  # Always use branches

# Don't commit sensitive data
git add .env  # Check .gitignore!
git commit -m "add config"

# Don't rewrite public history
git push --force origin main  # Dangerous!
```

## 📊 Commit Checklist for AI Developers

Before EVERY commit:

- [ ] Is my branch up to date with main?
- [ ] Have I run the build? (`npm run build`)
- [ ] Have I run relevant tests? (`npm test`)
- [ ] Is my commit message descriptive?
- [ ] Am I committing only related changes?
- [ ] Have I checked for sensitive data?
- [ ] Is the code properly formatted?

## 🔄 Daily Workflow

### Morning
```bash
# Start fresh
git checkout main
git pull origin main
git checkout -b feature/todays-work
```

### During Work
```bash
# Commit completed components
git add packages/core/src/component.ts
git commit -m "feat(core): add component"

# Push to backup
git push -u origin feature/todays-work
```

### End of Day
```bash
# Ensure everything is committed
git status  # Should be clean
git push origin feature/todays-work

# Create PR if feature complete
gh pr create
```

## 📈 Progress Tracking

### For Architect AI
Monitor progress via:
```bash
# See all branches
git branch -a

# Check commit history
git log --oneline --graph --all

# Review specific package changes
git log --oneline packages/core
git log --oneline packages/business
```

### For Package AI Developers
Show your progress:
```bash
# List your commits for the day
git log --oneline --since="1 day ago" --author="AI"

# Show what you've changed
git diff origin/main...HEAD --stat
```

## 🎯 Golden Rules

1. **Commit early, commit often** - But make them meaningful
2. **One concept per commit** - Keep commits atomic
3. **Write for future developers** - Clear messages save time
4. **Test before committing** - Don't break the build
5. **Pull before pushing** - Stay synchronized
6. **Branch for everything** - Never work on main
7. **Document in commits** - Explain WHY, not just what

## 📚 Examples for Common Tasks

### Adding a New Feature
```bash
git checkout -b feature/workflow-validation
# ... implement feature ...
git add packages/business/src/workflow/validator.ts
git commit -m "feat(business): add workflow validation with schema support"
git add packages/business/tests/workflow/validator.test.ts  
git commit -m "test(business): add workflow validator unit tests"
git push origin feature/workflow-validation
```

### Fixing a Bug
```bash
git checkout -b fix/auth-token-expiry
# ... fix the bug ...
git add packages/core/src/auth/token.manager.ts
git commit -m "fix(core): correctly calculate token expiry with timezone

The token manager was not accounting for timezone differences when
calculating token expiry. This caused tokens to be considered expired
prematurely in non-UTC timezones.

Fixes #123"
git push origin fix/auth-token-expiry
```

### Refactoring Code
```bash
git checkout -b refactor/api-client-structure
# ... refactor code ...
git add packages/core/src/api
git commit -m "refactor(core): extract common API logic to base class

Reduced code duplication by extracting common retry and error
handling logic into BaseApiClient. All API clients now extend
this base class.

- Moved retry logic to BaseApiClient
- Standardized error handling
- Added request/response interceptors"
git push origin refactor/api-client-structure
```

---

**Remember**: Good Git practices make collaboration easier, debugging faster, and project history clearer. When in doubt, make smaller, more frequent commits rather than large, complex ones.

**Last Updated**: 2025-08-30
**Version**: 1.0.0