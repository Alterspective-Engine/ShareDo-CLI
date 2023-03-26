#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
// import {program} from '@commander-js/extra-typings';
import { Command } from '@commander-js/extra-typings';



console.log(
  chalk.red(
    figlet.textSync('--Projects--')
  )
);

const program = new Command()
.command('init', 'Creates a ShareDo project in the specified directory or the current working directory. The command creates the necessary configuration files and folders.');

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
  }