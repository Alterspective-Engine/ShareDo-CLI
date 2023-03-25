#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
// import {program} from '@commander-js/extra-typings';
import { Command } from '@commander-js/extra-typings';


clear();
console.log(
  chalk.green(
    figlet.textSync('ShareDo', { horizontalLayout: 'full' })
  )
);
console.log(
  chalk.red(
    figlet.textSync('--cli--', { horizontalLayout: 'controlled smushing', font: 'Star Wars'  })
  )
);

const program = new Command()
  .name('sharedo')
  .version('0.0.3')
  .description("ShareDo CLI")
  .option('-s, --server', 'serverAlias')
  .option('-P, --publish', 'Publish')
  .option('-f, --folder', 'Folder Path')
  .option('-l, --log <type>', 'specify logging type [verboase,Error,Info]');
  
program.parse(process.argv);

const options = program.opts();

console.log('you executed the cli with:');
if (options) console.log('  - server');
if (options.publish) console.log('  - publish');
if (options.folder) console.log('  - folder');

console.log("options.log",options.log);
const log: string = undefined === options.log
    ? 'llooog'
    : options.log || '...no';

console.log('  - %s log', log);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}