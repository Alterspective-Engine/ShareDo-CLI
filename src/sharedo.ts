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
    figlet.textSync('--cli--', { horizontalLayout: 'controlled smushing', font: 'Star Wars' })
  )
);

const program = new Command()
  .name('sharedo')
  .version('0.0.3')
  .description("ShareDo CLI")
  .command('dev', 'Commands to develop on the ShareDo.')
  


// .option('-l, --log <type>', 'specify logging type [verboase,Error,Info]');
// .command('connect', 'connect to a server')
// .command('publish', 'publish a folder')
// .command('download', 'download a item')
try {
  program.parse(process.argv);
}
catch (e) {
  console.log("e", e);
}

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

