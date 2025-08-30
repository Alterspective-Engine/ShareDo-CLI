@echo off
REM ShareDo Platform Setup - Windows Launcher
REM This script runs the Node.js setup script

echo.
echo ========================================
echo   ShareDo Platform Setup (Windows)
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Minimum version required: 18.0.0
    pause
    exit /b 1
)

REM Run the setup script
node setup.js

REM Keep window open if there was an error
if %errorlevel% neq 0 (
    echo.
    echo Setup failed! See errors above.
    pause
)