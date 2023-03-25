#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
var program = new Command()
    .option('-f, --force', 'force installation');
program.parse(process.argv);
var pkgs = program.args;
if (!pkgs.length) {
    console.error('packages required');
    process.exit(1);
}
console.log();
if (program.opts().force)
    console.log('  force: install');
pkgs.forEach(function (pkg) {
    console.log('  install : %s', pkg);
});
console.log();
