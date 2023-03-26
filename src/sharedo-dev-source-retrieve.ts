#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
// import {program} from '@commander-js/extra-typings';
import { Command } from '@commander-js/extra-typings';
import { getConfig } from './config/config.js';
import { SharedoClient } from './server/sharedoClient.js';
import { Inform } from './Utilities/inform.js';


console.log(
  chalk.red(
    figlet.textSync('--Sharedo-Dev-Source-Retrive--')
  )
);
console.log("Args:", process.argv);
const program = new Command()
  .option('-p --path <path>', 'path/to/source')
  .action((commandAndOptions) => {
    if (commandAndOptions.path) {
      let config = getConfig();
      if (!config)
      {
        Inform.writeError("No config file found");
        return;
      }
      if (!config.activeServer)
      {
        Inform.writeError("No active server set");
        return;
      }
        let shareDoServer : SharedoClient = new SharedoClient(config.servers.find(s => s.alias === config!.activeServer));
        Inform.writeError("TODO...");
    }
    console.log(commandAndOptions)
  });
program.parse(process.argv);


if (!process.argv.slice(2).length) {
  program.outputHelp();
}