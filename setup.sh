#!/bin/bash

# ShareDo Platform Setup - Unix/Linux/Mac Launcher
# This script runs the Node.js setup script

echo ""
echo "========================================"
echo "  ShareDo Platform Setup (Unix/Linux)"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Minimum version required: 18.0.0"
    exit 1
fi

# Run the setup script
node setup.js

# Check if setup was successful
if [ $? -ne 0 ]; then
    echo ""
    echo "Setup failed! See errors above."
    exit 1
fi