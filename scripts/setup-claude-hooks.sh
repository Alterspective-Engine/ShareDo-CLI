#!/bin/bash

# Setup git hooks for Claude Code integration

echo "Setting up Claude Code git hooks..."

# Make hooks executable
chmod +x .githooks/pre-push

# Configure git to use our hooks
git config core.hooksPath .githooks

echo "✅ Git hooks configured!"
echo ""
echo "Now when you push, you'll be reminded to use Claude Code for validation."
echo ""
echo "To disable: git config --unset core.hooksPath"