#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import { Command } from '@commander-js/extra-typings';


const program = new Command()
  .option('-f, --force', 'force installation');

program.parse(process.argv);

const pkgs = program.args;

if (!pkgs.length) {
  console.error('packages required');
  process.exit(1);
}

console.log();
if (program.opts().force) console.log('  force: install');
pkgs.forEach(function(pkg) {
  console.log('  install : %s', pkg);
});
console.log();
