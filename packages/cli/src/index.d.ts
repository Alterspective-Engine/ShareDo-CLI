#!/usr/bin/env node
/**
 * @sharedo/cli - Command Line Interface for ShareDo platform
 *
 * Provides CLI access to ShareDo functionality:
 * - Authentication
 * - Workflow management
 * - Export operations
 * - Template management
 */
import { Command } from 'commander';
declare const program: Command;
export { program };
export default program;
