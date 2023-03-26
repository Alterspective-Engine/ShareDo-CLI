#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
// import {program} from '@commander-js/extra-typings';
import { Command, Option } from '@commander-js/extra-typings';
import { getConfig, upsertConfigFile } from './config/config';
import { ColorInformation } from 'vscode';
import { Inform } from './Utilities/inform';

console.log(
  chalk.red(
    figlet.textSync('--ShareDo-Dev--')
  )
);

let serverOption = new Option('-s, --server <server>', 'Set the active server')

let sharedoConfig = getConfig();
if (sharedoConfig) {

  if (sharedoConfig.servers && sharedoConfig.servers.length > 0) {
    let serverNames = sharedoConfig.servers.map(s => s.alias || "");
    serverOption.choices(serverNames);
  }
}


//sharedo-dev
const program = new Command()
  .addOption(serverOption).action((options) => {
    if(!options){return};

    Inform.writeInfo("Setting active server to " + options.server);
    upsertConfigFile({ activeServer: options.server });
    Inform.writeSuccess("Active server set to " + options.server);
  })
  .command('project', 'Use the project commands to set up a ShareDo projects')
  .command('connect', 'connect to a server')
  .command('source', 'to deploy and retrieve source to and from servers')

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

