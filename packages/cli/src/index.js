#!/usr/bin/env node
"use strict";
/**
 * @sharedo/cli - Command Line Interface for ShareDo platform
 *
 * Provides CLI access to ShareDo functionality:
 * - Authentication
 * - Workflow management
 * - Export operations
 * - Template management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
var commander_1 = require("commander");
var program = new commander_1.Command();
exports.program = program;
program
    .name('sharedo')
    .description('ShareDo Platform CLI')
    .version('1.0.0');
program
    .command('auth')
    .description('Manage authentication')
    .action(function () {
    console.log('Authentication functionality - coming soon');
});
program
    .command('workflows')
    .description('Manage workflows')
    .action(function () {
    console.log('Workflow management functionality - coming soon');
});
program
    .command('export')
    .description('Export operations')
    .action(function () {
    console.log('Export functionality - coming soon');
});
program
    .command('templates')
    .description('Template operations')
    .action(function () {
    console.log('Template functionality - coming soon');
});
// Parse command line arguments
if (require.main === module) {
    program.parse();
}
exports.default = program;
