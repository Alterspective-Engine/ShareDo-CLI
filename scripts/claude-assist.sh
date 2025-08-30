#!/bin/bash

# Claude Code Build Assistant Script
# Run this locally with Claude Code VS Code extension installed

echo "🤖 Claude Code Build Assistant"
echo "================================"
echo ""
echo "This script helps you use Claude Code to fix build issues"
echo ""

# Function to prompt for Claude assistance
claude_assist() {
    echo "📋 Step $1:"
    echo "$2"
    echo ""
    echo "In VS Code with Claude Code:"
    echo "1. Press Ctrl+Shift+L to open Claude chat"
    echo "2. Paste: $3"
    echo ""
    read -p "Press Enter when complete..."
    echo ""
}

# Check if running in VS Code terminal
if [ -z "$TERM_PROGRAM" ] || [ "$TERM_PROGRAM" != "vscode" ]; then
    echo "⚠️  Warning: Not running in VS Code terminal"
    echo "Please run this script from VS Code's integrated terminal"
    echo ""
fi

# Main workflow
echo "Starting build validation..."
echo ""

# Step 1: Initial build
claude_assist 1 "Build all packages" \
    "Run 'npm run build:all' and fix any compilation errors"

# Step 2: Fix TypeScript errors
claude_assist 2 "Fix TypeScript issues" \
    "Run 'npm run typecheck:all' and fix all TypeScript errors"

# Step 3: Fix tests
claude_assist 3 "Fix failing tests" \
    "Run 'npm run test:all' and fix any failing tests"

# Step 4: Fix linting
claude_assist 4 "Fix linting issues" \
    "Run 'npm run lint:all' and fix all linting errors"

# Step 5: Final build
echo "📋 Step 5: Final validation"
npm run build:all

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready to commit."
else
    echo "❌ Build still failing. Ask Claude: 'Fix the remaining build errors'"
fi