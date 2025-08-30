# ShareDo Platform - Quick Start Guide

## 🚀 One-Command Setup

### Windows
```cmd
setup.cmd
```

### Mac/Linux
```bash
chmod +x setup.sh
./setup.sh
```

### Or directly with Node.js
```bash
node setup.js
```

## 📋 What the Setup Does

1. **Checks Prerequisites**
   - Node.js >= 18.0.0
   - npm >= 8.0.0
   - Git installation

2. **Installs Dependencies**
   - Root dependencies
   - All package dependencies
   - Links local packages

3. **Creates Environment File**
   - Generates `.env` template
   - Ready for your ShareDo credentials

4. **Optional: Git Worktrees**
   - Sets up parallel development branches
   - One worktree per package

5. **Optional: Runs Tests**
   - Validates the setup
   - Ensures everything works

## 🔑 Required Credentials

After setup, update `.env` with your ShareDo credentials:

```env
SHAREDO_API_URL=https://app.sharedo.co.uk
SHAREDO_CLIENT_ID=your_client_id_here
SHAREDO_CLIENT_SECRET=your_client_secret_here
SHAREDO_TENANT_ID=your_tenant_id_here
```

## 💻 Development Commands

### Start developing the CLI
```bash
npm run dev:cli
```

### Start developing the VS Code extension
```bash
npm run dev:vscode
```

### Start developing the MCP server
```bash
npm run dev:mcp
```

### Build everything
```bash
npm run build
```

### Run tests
```bash
npm test
```

### Clean everything
```bash
npm run clean
```

## 🎯 Parallel Development with Git Worktrees

If you set up worktrees, you can develop multiple packages in parallel:

```bash
# Work on core package
cd ../sharedo-core
claude

# Work on business logic
cd ../sharedo-business
claude

# Work on CLI
cd ../sharedo-cli
claude
```

Each worktree has its own CLAUDE.md file with AI instructions for that specific package.

## 📚 Documentation

- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Complete development roadmap
- **[docs/DEVELOPMENT_STANDARDS_AND_BEST_PRACTICES.md](docs/DEVELOPMENT_STANDARDS_AND_BEST_PRACTICES.md)** - Coding standards
- **[WORKTREE_SETUP_GUIDE.md](WORKTREE_SETUP_GUIDE.md)** - Parallel development guide
- **[docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md)** - API documentation
- **[docs/USER_EXPERIENCE_SPECIFICATION.md](docs/USER_EXPERIENCE_SPECIFICATION.md)** - UX guidelines

## ❓ Need Help?

1. Check the error messages - they're designed to be helpful
2. Review the documentation links above
3. Ensure your Node.js version is >= 18.0.0
4. Make sure you have Git installed
5. Verify your ShareDo credentials are correct

## 🎉 Ready to Code!

Once setup is complete, you're ready to start building the ShareDo platform!