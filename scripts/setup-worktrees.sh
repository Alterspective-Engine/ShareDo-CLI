#!/bin/bash

# ShareDo Platform - Git Worktree Setup Script
# This script creates all necessary worktrees for parallel Claude Code development

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAIN_REPO_DIR=$(pwd)
PARENT_DIR=$(dirname "$MAIN_REPO_DIR")

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     ShareDo Platform - Git Worktree Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Function to create worktree
create_worktree() {
    local dir_name=$1
    local branch_name=$2
    local package_name=$3
    
    echo -e "${YELLOW}📁 Creating worktree: ${dir_name}${NC}"
    
    if [ -d "${PARENT_DIR}/${dir_name}" ]; then
        echo -e "${RED}   ⚠️  Directory already exists, skipping...${NC}"
    else
        git worktree add "${PARENT_DIR}/${dir_name}" -b "${branch_name}" 2>/dev/null || \
        git worktree add "${PARENT_DIR}/${dir_name}" "${branch_name}" 2>/dev/null || {
            echo -e "${RED}   ❌ Failed to create worktree${NC}"
            return 1
        }
        
        # Create a context file for Claude
        echo "Package: ${package_name}" > "${PARENT_DIR}/${dir_name}/.claude-context"
        echo "Branch: ${branch_name}" >> "${PARENT_DIR}/${dir_name}/.claude-context"
        echo "Focus: packages/${package_name}" >> "${PARENT_DIR}/${dir_name}/.claude-context"
        
        echo -e "${GREEN}   ✅ Worktree created successfully${NC}"
    fi
}

# Function to setup environment in worktree
setup_environment() {
    local dir_path=$1
    local package_name=$2
    
    echo -e "${YELLOW}   🔧 Setting up environment...${NC}"
    
    cd "${dir_path}"
    
    # Install dependencies
    if [ -f "package.json" ]; then
        npm install --silent 2>/dev/null || {
            echo -e "${RED}   ⚠️  npm install failed${NC}"
        }
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# ShareDo Platform Environment Variables
SHAREDO_API_URL=https://api.sharedo.com
SHAREDO_CLIENT_ID=your-client-id
SHAREDO_CLIENT_SECRET=your-client-secret
DEBUG=true
PACKAGE_FOCUS=${package_name}
EOF
        echo -e "${GREEN}   ✅ .env file created${NC}"
    fi
    
    cd "${MAIN_REPO_DIR}"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    echo "Please run this script from the ShareDo platform repository root"
    exit 1
fi

# Ensure we're on main branch
echo -e "${BLUE}🔄 Checking current branch...${NC}"
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo -e "${YELLOW}⚠️  Not on main branch, switching...${NC}"
    git checkout main
fi

# Update main branch
echo -e "${BLUE}🔄 Updating main branch...${NC}"
git pull origin main --quiet

# Create worktrees
echo ""
echo -e "${BLUE}📦 Creating Package Worktrees${NC}"
echo -e "${BLUE}─────────────────────────────${NC}"

# Core Package
create_worktree "sharedo-core" "feature/core-package" "core"
setup_environment "${PARENT_DIR}/sharedo-core" "core"

# Platform Adapter
create_worktree "sharedo-platform-adapter" "feature/platform-adapter" "platform-adapter"
setup_environment "${PARENT_DIR}/sharedo-platform-adapter" "platform-adapter"

# Business Logic
create_worktree "sharedo-business" "feature/business-logic" "business"
setup_environment "${PARENT_DIR}/sharedo-business" "business"

# CLI
create_worktree "sharedo-cli" "feature/cli-implementation" "cli"
setup_environment "${PARENT_DIR}/sharedo-cli" "cli"

# VS Code Extension
create_worktree "sharedo-vscode" "feature/vscode-extension" "vscode"
setup_environment "${PARENT_DIR}/sharedo-vscode" "vscode"

# MCP Server
create_worktree "sharedo-mcp" "feature/mcp-server" "mcp"
setup_environment "${PARENT_DIR}/sharedo-mcp" "mcp"

# Display summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Worktree Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Worktree Summary:${NC}"
git worktree list

echo ""
echo -e "${BLUE}🚀 Quick Start Commands:${NC}"
echo ""
echo "  Core Package Development:"
echo -e "    ${GREEN}cd ../sharedo-core && claude${NC}"
echo ""
echo "  Business Logic Development:"
echo -e "    ${GREEN}cd ../sharedo-business && claude${NC}"
echo ""
echo "  CLI Development:"
echo -e "    ${GREEN}cd ../sharedo-cli && claude${NC}"
echo ""
echo "  VS Code Extension Development:"
echo -e "    ${GREEN}cd ../sharedo-vscode && claude${NC}"
echo ""
echo "  MCP Server Development:"
echo -e "    ${GREEN}cd ../sharedo-mcp && claude${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Each worktree has its own CLAUDE.md with specific instructions${NC}"
echo -e "${YELLOW}💡 Tip: Run 'npm run sync-worktrees' to sync all worktrees with main${NC}"
echo ""