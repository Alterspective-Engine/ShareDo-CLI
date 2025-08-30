#!/bin/bash
# Progress monitoring script for ShareDo Platform

echo "📊 ShareDo Platform Progress Report"
echo "==================================="
echo ""

# Check git status
echo "📋 Git Status:"
git status --short
echo ""

# Check recent commits
echo "📝 Recent Commits (last 24 hours):"
git log --oneline --since="24 hours ago" --all
echo ""

# Check package builds
echo "🏗️ Package Build Status:"
for pkg in core platform-adapter business cli vscode mcp; do
    if [ -d "packages/$pkg/dist" ]; then
        echo "✅ @sharedo/$pkg - Built"
    else
        echo "⏸️ @sharedo/$pkg - Not built"
    fi
done
echo ""

# Count lines of code
echo "📈 Lines of Code:"
for pkg in core platform-adapter business cli vscode mcp; do
    if [ -d "packages/$pkg/src" ]; then
        count=$(find packages/$pkg/src -name "*.ts" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
        echo "   @sharedo/$pkg: ${count:-0} lines"
    fi
done
echo ""

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️ Warning: Uncommitted changes detected!"
    echo "   Run 'git status' for details"
fi