# ShareDo Platform Implementation Plan

## Executive Summary

This plan outlines the implementation of a unified ShareDo platform that shares 80% of code between CLI, VS Code extension, and MCP server. The implementation follows a phased approach over 12 weeks, using git worktrees for parallel development with AI assistance.

## Development Strategy: Git Worktrees with AI Coordination

### Worktree Structure
```bash
sharedo-platform/                    # Main repository
├── CLAUDE.md                        # Project Architect AI instructions
├── packages/
│   ├── core/
│   │   └── CLAUDE.md                # Core Package AI instructions
│   ├── business/
│   │   └── CLAUDE.md                # Business Logic AI instructions
│   ├── platform-adapter/
│   │   └── CLAUDE.md                # Platform Adapter AI instructions
│   ├── cli/
│   │   └── CLAUDE.md                # CLI Developer AI instructions
│   ├── vscode/
│   │   └── CLAUDE.md                # VS Code Extension AI instructions
│   └── mcp/
│       └── CLAUDE.md                # MCP Server AI instructions

# Git Worktrees (separate working directories)
sharedo-core/                        # Worktree for core package
sharedo-business/                    # Worktree for business logic
sharedo-cli/                         # Worktree for CLI
sharedo-vscode/                      # Worktree for VS Code extension
sharedo-mcp/                         # Worktree for MCP server
```

### Setting Up Git Worktrees
```bash
# From main repository
git worktree add ../sharedo-core -b feature/core-package packages/core
git worktree add ../sharedo-business -b feature/business-logic packages/business
git worktree add ../sharedo-cli -b feature/cli-implementation packages/cli
git worktree add ../sharedo-vscode -b feature/vscode-extension packages/vscode
git worktree add ../sharedo-mcp -b feature/mcp-server packages/mcp

# Each worktree can be developed independently
cd ../sharedo-core
# Work on core package with dedicated AI assistant

cd ../sharedo-cli
# Work on CLI with another AI assistant
```

## AI Coordination Model

### 1. Project Architect AI (Root CLAUDE.md)
**Role**: Overall coordination, architecture decisions, integration
**Access**: Full repository view
**Responsibilities**:
- Maintain architectural consistency
- Review cross-package interfaces
- Coordinate between package AIs
- Resolve conflicts and dependencies
- Ensure 80% code sharing target

### 2. Package Developer AIs (Package-specific CLAUDE.md)
**Role**: Implement specific package features
**Access**: Package-specific worktree
**Responsibilities**:
- Implement package features
- Follow architectural guidelines
- Maintain package documentation
- Write tests for package
- Communicate needs to Architect AI

## Architecture Overview

```
sharedo-platform/
├── packages/
│   ├── core/                    # Phase 1: Core utilities (Week 1-2)
│   ├── business/                 # Phase 2: Business logic (Week 3-4)
│   ├── platform-adapter/        # Phase 1: Abstraction layer (Week 1-2)
│   ├── cli/                     # Phase 3: CLI implementation (Week 5-6)
│   ├── vscode/                  # Phase 4: VS Code extension (Week 7-8)
│   └── mcp/                     # Phase 5: MCP server (Week 9-10)
```

## Phase 1: Foundation & AI Setup (Weeks 1-2)

### Week 1: Infrastructure & AI Coordination Setup

#### Day 1-2: Git Worktree & AI Setup
```bash
# Priority: CRITICAL
# Owner: Project Architect AI

- [ ] Initialize git repository with main branch
- [ ] Create worktree structure
- [ ] Create CLAUDE.md files for each package
- [ ] Set up CI/CD pipeline
- [ ] Configure lerna for monorepo management
```

#### Day 3-5: Core Package Development
```typescript
// Priority: CRITICAL
// Owner: Core Package AI
// Worktree: sharedo-core

- [ ] Authentication Module (@sharedo/core/auth)
  - [ ] IAuthConfig interface
  - [ ] ITokenResponse interface
  - [ ] AuthenticationService class
  - [ ] SecureTokenStorage abstraction
  - [ ] Token refresh logic
  - [ ] Impersonation support

- [ ] API Client Base (@sharedo/core/api)
  - [ ] BaseApiClient abstract class
  - [ ] Request/response interceptors
  - [ ] Retry logic with exponential backoff
  - [ ] Rate limiting implementation
```

### Week 2: Platform Adapter & API Clients

#### Day 1-3: Platform Adapter Interface
```typescript
// Priority: CRITICAL
// Owner: Platform Adapter AI
// Worktree: sharedo-platform-adapter

- [ ] IPlatform interface
  - [ ] UI operations (showMessage, prompt, select)
  - [ ] File operations (read, write, exists)
  - [ ] Configuration management
  - [ ] Secret storage abstraction
  - [ ] Process execution
```

#### Day 4-5: API Client Implementations
```typescript
// Priority: HIGH
// Owner: Core Package AI
// Worktree: sharedo-core

- [ ] WorkflowApiClient
- [ ] WorkTypeApiClient
- [ ] ExportApiClient
- [ ] FormBuilderApiClient
- [ ] ExecutionEngineApiClient
```

## AI Instruction Files

### Root CLAUDE.md (Project Architect)
```markdown
# ShareDo Platform - Project Architect AI Instructions

## Your Role
You are the Project Architect responsible for coordinating the development of the ShareDo Platform across multiple packages and AI assistants.

## Key Objectives
1. Maintain 80% code sharing between CLI, VS Code, and MCP
2. Ensure architectural consistency across packages
3. Coordinate between package-specific AI assistants
4. Review and approve cross-package interfaces

## Available Worktrees
- sharedo-core: Core utilities and authentication
- sharedo-business: Business logic layer
- sharedo-cli: Command-line interface
- sharedo-vscode: VS Code extension
- sharedo-mcp: MCP server

## Communication Protocol
1. Review PRs from package worktrees
2. Update shared interfaces when needed
3. Resolve dependency conflicts
4. Maintain IMPLEMENTATION_PLAN.md
5. Update architecture documentation

## Current Phase
[Updated weekly with current sprint goals]

## Active Worktrees Status
- Core: [Status]
- Business: [Status]
- CLI: [Status]
- VS Code: [Status]
- MCP: [Status]
```

### Package CLAUDE.md Template
```markdown
# [Package Name] - Developer AI Instructions

## Your Role
You are responsible for implementing the [package name] package of the ShareDo Platform.

## Package Overview
[Package description and purpose]

## Dependencies
- @sharedo/core: [version]
- @sharedo/platform-adapter: [version]
- [Other dependencies]

## Current Sprint Goals
[Week-specific objectives from IMPLEMENTATION_PLAN.md]

## Interfaces You Must Implement
[List of interfaces from platform-adapter]

## Shared Code Requirements
- Use @sharedo/core for all authentication
- Use @sharedo/business for all business logic
- Only implement platform-specific code in this package

## Testing Requirements
- Minimum 80% code coverage
- Unit tests for all public methods
- Integration tests for key workflows

## Communication with Architect
- Create PR when feature is complete
- Document any needed shared interfaces
- Report blockers immediately

## Current Tasks
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]
```

## Phase 2: Business Logic (Weeks 3-4)

### Week 3: Core Business Services (Parallel Development)

#### Workflow Management
```typescript
// Owner: Business Logic AI
// Worktree: sharedo-business
// Location: packages/business/src/workflow/

- [ ] WorkflowManager
- [ ] WorkflowValidator  
- [ ] WorkflowComparator
- [ ] WorkflowTemplates
```

#### Export Service
```typescript
// Owner: Business Logic AI
// Worktree: sharedo-business
// Location: packages/business/src/export/

- [ ] ExportManager
- [ ] ExportStatusChecker
- [ ] PackageExtractor
```

### Week 4: Advanced Business Services

#### HLD Generation
```typescript
// Owner: Business Logic AI
// Worktree: sharedo-business
// Location: packages/business/src/hld/

- [ ] HLDGenerator
- [ ] DiagramGenerator
- [ ] DocumentBuilder
```

## Phase 3: CLI Implementation (Weeks 5-6)

### Week 5: CLI Core & Commands

#### CLI Development
```typescript
// Owner: CLI Developer AI
// Worktree: sharedo-cli

- [ ] CLI Platform Adapter
- [ ] Authentication commands
- [ ] Workflow commands
- [ ] Export commands
```

## Phase 4: VS Code Extension (Weeks 7-8)

### Week 7: VS Code Core

#### VS Code Development
```typescript
// Owner: VS Code Developer AI
// Worktree: sharedo-vscode

- [ ] VS Code Platform Adapter
- [ ] Tree View Provider
- [ ] Command palette integration
```

## Phase 5: MCP Server (Weeks 9-10)

### Week 9: MCP Implementation

#### MCP Development
```typescript
// Owner: MCP Developer AI
// Worktree: sharedo-mcp

- [ ] MCP server setup
- [ ] Tool registration
- [ ] Authentication handling
```

## Parallel Development Workflow

### Daily Synchronization
```bash
# Morning sync (each worktree)
git fetch origin
git rebase origin/main

# Work on feature
npm run dev
npm test

# Evening push
git push origin feature/[package-name]
```

### Weekly Integration
```bash
# Architect AI reviews and merges
git checkout main
git merge feature/core-package
git merge feature/business-logic
git merge feature/cli-implementation
# Resolve any conflicts
git push origin main

# Update all worktrees
git worktree list | while read -r worktree; do
  cd $worktree
  git rebase origin/main
done
```

## AI Collaboration Patterns

### 1. Interface Definition Pattern
```typescript
// Architect AI defines in platform-adapter
export interface INewFeature {
  method(): Promise<Result>;
}

// Package AIs implement in their packages
class ConcreteImplementation implements INewFeature {
  async method(): Promise<Result> {
    // Implementation
  }
}
```

### 2. Dependency Request Pattern
```markdown
# Package AI creates issue
Title: Need new method in @sharedo/core
Package: CLI
Requirement: Need bulk user operations
Proposed Interface: IBulkUserOperations

# Architect AI reviews and either:
1. Approves and adds to core
2. Suggests existing alternative
3. Requests modification
```

### 3. Conflict Resolution Pattern
```markdown
# When two packages need different versions of same interface
1. Package AIs document requirements
2. Architect AI designs unified interface
3. Package AIs update implementations
4. Architect AI merges changes
```

## Testing Strategy with AI

### Unit Testing (Each Package AI)
```bash
# Each worktree maintains its own tests
npm test
npm run coverage

# Goal: 80% coverage per package
```

### Integration Testing (Architect AI)
```bash
# Main repository runs integration tests
npm run test:integration

# Tests cross-package functionality
```

## Documentation Requirements

### Each Package Must Include
1. **README.md**: Package overview and usage
2. **CLAUDE.md**: AI instructions for package
3. **API.md**: Exported interfaces and methods
4. **EXAMPLES.md**: Usage examples
5. **CHANGELOG.md**: Version history

### Architect Maintains
1. **ARCHITECTURE.md**: Overall system design
2. **INTEGRATION.md**: How packages work together
3. **ROADMAP.md**: Future development plans

## Communication Channels

### Between AIs
- **Issues**: Feature requests and bugs
- **PRs**: Code reviews and integration
- **CLAUDE.md updates**: Sprint planning and status

### Status Tracking
```markdown
# In each CLAUDE.md
## Current Status
- Sprint: Week 3
- Tasks Completed: 5/10
- Blockers: None
- PRs Pending: #23, #24
```

## Success Metrics

### Per Package
- [ ] 80% test coverage
- [ ] All interfaces implemented
- [ ] Documentation complete
- [ ] No circular dependencies

### Overall Platform
- [ ] 80% code sharing achieved
- [ ] All packages integrated
- [ ] E2E tests passing
- [ ] Performance benchmarks met

## Quick Start for New AI Assistant

### Day 1: Setup Worktree
```bash
# Clone and create worktree
git clone [repo]
git worktree add ../sharedo-[package] -b feature/[package]
cd ../sharedo-[package]

# Install dependencies
npm install

# Read instructions
cat CLAUDE.md

# Start development
npm run dev
```

### Day 2-5: Implement Features
- Follow sprint goals in CLAUDE.md
- Write tests alongside code
- Update documentation
- Create PR when ready

### Weekly: Sync with Architect
- Update status in CLAUDE.md
- Participate in integration
- Address feedback on PRs
- Plan next sprint

## Risk Mitigation

### Parallel Development Risks
1. **Interface Conflicts**
   - Mitigation: Architect reviews all interface changes
   - Resolution: Version interfaces if needed

2. **Dependency Delays**
   - Mitigation: Mock interfaces for testing
   - Resolution: Prioritize blocking dependencies

3. **Integration Issues**
   - Mitigation: Daily rebasing from main
   - Resolution: Weekly integration sessions

## Deployment Strategy

### Package Publishing Order
1. @sharedo/platform-adapter (no dependencies)
2. @sharedo/core (depends on adapter)
3. @sharedo/business (depends on core, adapter)
4. @sharedo/cli (depends on all)
5. @sharedo/vscode (depends on all)
6. @sharedo/mcp (depends on all)

---

**Document Version**: 2.0.0
**Created**: 2025-01-29
**Updated**: Added Git Worktree and AI Coordination Strategy
**Owner**: ShareDo Platform Team
**Review Date**: Weekly