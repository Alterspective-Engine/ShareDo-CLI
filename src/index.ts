#!/usr/bin/env node

/**
 * @sharedo/cli - Command-line interface
 */

import { Command } from 'commander';
import { version } from '../package.json';

const program = new Command();

program
  .name('sharedo')
  .description('ShareDo CLI - Workflow automation tool')
  .version(version);

// TODO: Register commands here

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
