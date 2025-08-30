import arg from "arg";
import inquirer from "inquirer";
import { createProject } from "./createProject.js";

export interface IOptions {
  targetDirectory: string ;
   skipPrompts: boolean,
  workflowFolder: string,
    ideFolder: string,
     git: boolean; 
     runInstall: boolean;
}

function parseArgumentsIntoOptions(rawArgs:  any[]): IOptions {
 const args = arg(
   {
     '--git': Boolean,
     '--yes': Boolean,
     '--install': Boolean,
     '-g': '--git',
     '-y': '--yes',
     '-i': '--install',
   },
   {
     argv: rawArgs.slice(2),
   }
 );

 

 return {
   skipPrompts: args['--yes'] || false,
   git: args['--git'] || false,
   workflowFolder: args._[0],
   ideFolder: args._[1],
   runInstall: args['--install'] || false,
   targetDirectory: args._[2]
 };
}

async function promptForMissingOptions(options: IOptions) {
    const defaultWorkflowFolder = '_workflows';
    const defaultIdeFolder = '_ide';

    if (options.skipPrompts) {
      return {
        ...options,
        workflowFolder: options.workflowFolder || defaultWorkflowFolder,
        ideFolder: options.ideFolder || defaultIdeFolder,
      };
    }
   
    const questions = [];
    if (!options.workflowFolder) {
      questions.push({
        type: 'input',
        name: 'workflowFolder',
        message: 'Enter the name of the workflow folder:',
        default: defaultWorkflowFolder,
      });
    }

    if (!options.ideFolder) {
      questions.push({
        type: 'input',
        name: 'ideFolder',
        message: 'Enter the name of the ide folder:',
        default: defaultIdeFolder,
      });
    }
   
    if (!options.git) {
      questions.push({
        type: 'confirm',
        name: 'git',
        message: 'Initialize a git repository?',
        default: false,
      });
    }
   
    const answers = await inquirer.prompt(questions);
    return {
      ...options,
      workflowFolder: options.workflowFolder || answers.workflowFolder,
      ideFolder: options.ideFolder || answers.ideFolder,
      git: options.git || answers.git,
    };
   }

export async function init(args: any[]) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    console.log(options);
    await createProject(options);
}

