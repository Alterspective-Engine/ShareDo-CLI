
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import { SharedoConfig, upsertConfigFile } from '../config/config.js';
import { Inform } from '../Utilities/inform.js';
import { IOptions } from './initWithTemplate.js';
import { mkdirSync, writeFileSync } from "fs"


const copy = promisify(ncp);

async function copyTemplateFiles(options: { templateDirectory: string; targetDirectory: string; }) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

export async function createProject(options: IOptions) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
  };
  
  if(!options.targetDirectory)
  {
    options.targetDirectory = process.cwd() + '/' + "SharedoProject";
  }
  //create a folder for workfows
  const workflowDirectory = path.join(options.targetDirectory, options.workflowFolder);
  mkdirSync(workflowDirectory, { recursive: true });
  Inform.writeInfo('Workflow folder created');
  //create a folder for ide
  const ideDirectory = path.join(options.targetDirectory, options.ideFolder);
  mkdirSync(ideDirectory, { recursive: true });
  Inform.writeInfo('Ide folder created');
  //create sharedo.config.json file
  const configFilePath = path.join(options.targetDirectory, 'sharedo.config.json');

  let config: SharedoConfig = {
    name: '',
    workflowsFilesFolder: options.workflowFolder,
    ideFilesFolder: options.ideFolder,
    servers: [],
    activeServer: ""
  }
  upsertConfigFile(config);
  Inform.writeSuccess('Project ready');
  return true;
}

