#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import { Command } from 'commander';
import figlet from 'figlet';
import path from 'path';
import { getConfig } from './config/config';
import { publishFileFolderToServers } from './Request/File/ExtensionHelpers/filePublishing';
import { SharedoClient } from './server/sharedoClient';
import fs from 'fs';
import { Inform } from './Utilities/inform';

console.log(
  chalk.red(
    figlet.textSync('--Sharedo-Dev-Source-Deploy--')
  )
);

const program = new Command()
  .option('-p --path <path>', 'path/to/source')
  .action((commandAndOptions) => {
    Inform.writeInfo("deploying... with path:", commandAndOptions.path || "");
    if (commandAndOptions.path) {
      let config = getConfig();
      if (!config) {
        Inform.writeError("No config file found");
        return;
      }
      if (!config.activeServer) {
        Inform.writeError("No active server set");
        return;
      }
      let shareDoServer: SharedoClient = new SharedoClient(config.servers.find(s => s.alias === config!.activeServer));
      if(!shareDoServer)
      {
        Inform.writeError("No active server set");
        return;
      }
      //get current path
      let fullPath = process.cwd();
      //joing current path with path from command
      fullPath = path.join(fullPath, commandAndOptions.path);

      publishFileFolderToServers(fullPath, shareDoServer).then((result) => {
        Inform.writeSuccess("Finished..");
      }).catch((error) => {
        Inform.writeError("Error:",error);
      });
    }
  });
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}