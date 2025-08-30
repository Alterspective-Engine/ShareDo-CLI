# ShareDo Platform - Git Worktree Setup Script (Windows)
# This script creates all necessary worktrees for parallel Claude Code development

# Colors for output
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

# Configuration
$MainRepoDir = Get-Location
$ParentDir = Split-Path -Parent $MainRepoDir
# Create a contained folder for all ShareDo worktrees
$WorktreeContainer = Join-Path $ParentDir "ShareDo-Platform"

Write-ColorOutput Cyan ""
Write-ColorOutput Cyan "     ShareDo Platform - Git Worktree Setup"
Write-ColorOutput Cyan ""
Write-Output ""

# Create container directory if it doesn't exist
if (-not (Test-Path $WorktreeContainer)) {
    Write-ColorOutput Blue " Creating container directory: ShareDo-Platform"
    New-Item -ItemType Directory -Path $WorktreeContainer | Out-Null
}

# Function to create worktree
function Create-Worktree {
    param(
        [string]$DirName,
        [string]$BranchName,
        [string]$PackageName
    )
    
    Write-ColorOutput Yellow " Creating worktree: $DirName"
    
    $WorktreePath = Join-Path $WorktreeContainer $DirName
    
    if (Test-Path $WorktreePath) {
        Write-ColorOutput Red "     Directory already exists, skipping..."
    }
    else {
        try {
            # Try to create new branch
            git worktree add $WorktreePath -b $BranchName 2>$null
            if ($LASTEXITCODE -ne 0) {
                # Branch might already exist, try without -b
                git worktree add $WorktreePath $BranchName 2>$null
            }
            
            if ($LASTEXITCODE -eq 0) {
                # Create context file for Claude
                $ContextContent = @"
Package: $PackageName
Branch: $BranchName
Focus: packages/$PackageName
"@
                Set-Content -Path "$WorktreePath\.claude-context" -Value $ContextContent
                
                Write-ColorOutput Green "    Worktree created successfully"
            }
            else {
                Write-ColorOutput Red "    Failed to create worktree"
            }
        }
        catch {
            Write-ColorOutput Red "    Error: $_"
        }
    }
}

# Function to setup environment in worktree
function Setup-Environment {
    param(
        [string]$DirPath,
        [string]$PackageName
    )
    
    Write-ColorOutput Yellow "    Setting up environment..."
    
    Push-Location $DirPath
    
    # Install dependencies
    if (Test-Path "package.json") {
        try {
            npm install --silent 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput Green "    Dependencies installed"
            }
            else {
                Write-ColorOutput Yellow "     npm install had warnings"
            }
        }
        catch {
            Write-ColorOutput Red "     npm install failed"
        }
    }
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path ".env")) {
        $EnvContent = @"
# ShareDo Platform Environment Variables
SHAREDO_API_URL=https://api.sharedo.com
SHAREDO_CLIENT_ID=your-client-id
SHAREDO_CLIENT_SECRET=your-client-secret
DEBUG=true
PACKAGE_FOCUS=$PackageName
"@
        Set-Content -Path ".env" -Value $EnvContent
        Write-ColorOutput Green "    .env file created"
    }
    
    Pop-Location
}

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-ColorOutput Red " Error: Not in a git repository"
    Write-Output "Please run this script from the ShareDo platform repository root"
    exit 1
}

# Ensure we're on main branch
Write-ColorOutput Blue " Checking current branch..."
$CurrentBranch = git branch --show-current
if ($CurrentBranch -ne "main") {
    Write-ColorOutput Yellow "  Not on main branch, switching..."
    git checkout main
}

# Update main branch
Write-ColorOutput Blue " Updating main branch..."
git pull origin main --quiet

# Create worktrees
Write-Output ""
Write-ColorOutput Blue " Creating Package Worktrees"
Write-ColorOutput Blue ""

# Core Package
Create-Worktree -DirName "sharedo-core" -BranchName "feature/core-package" -PackageName "core"
Setup-Environment -DirPath "$WorktreeContainer\sharedo-core" -PackageName "core"

# Platform Adapter
Create-Worktree -DirName "sharedo-platform-adapter" -BranchName "feature/platform-adapter" -PackageName "platform-adapter"
Setup-Environment -DirPath "$WorktreeContainer\sharedo-platform-adapter" -PackageName "platform-adapter"

# Business Logic
Create-Worktree -DirName "sharedo-business" -BranchName "feature/business-logic" -PackageName "business"
Setup-Environment -DirPath "$WorktreeContainer\sharedo-business" -PackageName "business"

# CLI
Create-Worktree -DirName "sharedo-cli" -BranchName "feature/cli-implementation" -PackageName "cli"
Setup-Environment -DirPath "$WorktreeContainer\sharedo-cli" -PackageName "cli"

# VS Code Extension
Create-Worktree -DirName "sharedo-vscode" -BranchName "feature/vscode-extension" -PackageName "vscode"
Setup-Environment -DirPath "$WorktreeContainer\sharedo-vscode" -PackageName "vscode"

# MCP Server
Create-Worktree -DirName "sharedo-mcp" -BranchName "feature/mcp-server" -PackageName "mcp"
Setup-Environment -DirPath "$WorktreeContainer\sharedo-mcp" -PackageName "mcp"

# Display summary
Write-Output ""
Write-ColorOutput Cyan ""
Write-ColorOutput Green " Worktree Setup Complete!"
Write-ColorOutput Cyan ""
Write-Output ""
Write-ColorOutput Blue " Worktree Summary:"
git worktree list

Write-Output ""
Write-ColorOutput Blue " Quick Start Commands:"
Write-Output ""
Write-Output "  Core Package Development:"
Write-ColorOutput Green "    cd ..\ShareDo-Platform\sharedo-core; claude"
Write-Output ""
Write-Output "  Business Logic Development:"
Write-ColorOutput Green "    cd ..\ShareDo-Platform\sharedo-business; claude"
Write-Output ""
Write-Output "  CLI Development:"
Write-ColorOutput Green "    cd ..\ShareDo-Platform\sharedo-cli; claude"
Write-Output ""
Write-Output "  VS Code Extension Development:"
Write-ColorOutput Green "    cd ..\ShareDo-Platform\sharedo-vscode; claude"
Write-Output ""
Write-Output "  MCP Server Development:"
Write-ColorOutput Green "    cd ..\ShareDo-Platform\sharedo-mcp; claude"
Write-Output ""
Write-ColorOutput Yellow "Tip: Each worktree has its own CLAUDE.md with specific instructions"
Write-ColorOutput Yellow "Tip: Run 'npm run sync-worktrees' to sync all worktrees with main"
Write-Output ""
