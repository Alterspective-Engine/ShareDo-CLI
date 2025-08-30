import arg from "arg";
import inquirer from "inquirer";
import { getConfig, upsertConfigFile } from "../config/config.js";
import { defaultSharedoClient, ISharedoClient, SharedoClient } from "../server/sharedoClient.js";
import { Inform } from "../Utilities/inform.js";

async function promptForMissingOptions(options: ISharedoClient) {
  const questions = [];

  let shareDoConfig = getConfig();
  let count = 0;
  if (shareDoConfig) {
    if(shareDoConfig.servers){
    count = shareDoConfig.servers.length;
    }
  }


  questions.push({
    type: 'input',
    name: 'alias',
    message: 'Enter the alias of the project:',
    default: 'server' + count,
  });


  // export interface ISharedoClient {
  //   alias: string | undefined;
  //   clientSecret: string | undefined;
  //   clientId: string | undefined;
  //   url: string;
  //   tokenEndpoint: string | undefined;
  //   impersonateUser: string | undefined;
  //   impersonateProvider: string | undefined;
  // }

  //build questions for all ISharedoClient
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      let defaultValue = (options as any)[key];
      questions.push({
        type: 'input',
        name: key,
        message: `Enter the ${key}:`,
        default: defaultValue,
      });
    }
  }
  const answers = await inquirer.prompt(questions);
  //add answers to options
  for (const key in answers) {
    if (answers.hasOwnProperty(key)) {
      (options as any)[key] = answers[key];
    }
  }
  return {
    ...options
  };
}

export async function connect(args?: any[]) {
  // let options = parseArgumentsIntoOptions(args);
  let options = defaultSharedoClient;
  options = await promptForMissingOptions(options);
  console.log(options);
  let server: SharedoClient = new SharedoClient(options);
  
  let shareDoConfig = getConfig();
  if (shareDoConfig) {

    //check if server already exists
    let serverExists = shareDoConfig.servers.find((s) => s.alias === options.alias);
    if (serverExists) {
      Inform.writeInfo("server already exists");
      return;
    }


    shareDoConfig.servers.push(options);
    upsertConfigFile(shareDoConfig);
  }
  
  server.getIDE().then((result) => {
    console.log(result);
    if (result) {
      result.forEach((element) => {
        console.log(element.name);
      });
    }
  });
}

