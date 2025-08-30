#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
// import {program} from '@commander-js/extra-typings';
import { Command } from '@commander-js/extra-typings';


console.log(
  chalk.red(
    figlet.textSync('--Sharedo-Dev-Source--')
  )
);

const program = new Command()
  .command('retrieve', 'Retrieve source from an server.')
  .command('deploy', 'Deploy source to the server.');

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}