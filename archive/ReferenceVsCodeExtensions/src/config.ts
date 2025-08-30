/**
 * Configuration Utilities for ShareDo VS Code Extension
 *
 * Provides types and functions for managing extension configuration files and environment settings.
 * Handles reading, writing, and locating config files for ShareDo environments and folders.
 */
import { SharedoEnvironments } from "./environments";
import * as fs from "fs";
import * as JSON5 from 'json5';

export type SharedoConfig = {
    /** The name of the server */
    name: string;
    /** The url of the server */
    enviroments: SharedoEnvironments | undefined;
    workflowsFilesFolder: string | undefined;
    ideFilesFolder: string | undefined;

};

export type SharedoConfigFileOptions = {
    name: string | undefined,
     enviroments: SharedoEnvironments | undefined, 
     workflowsFilesFolder: string | undefined, 
     ideFilesFolder: string | undefined
};

export function createConfigFile(options: SharedoConfigFileOptions) {
    let configPath = findConfigFileInDirectory();
    if (!configPath) {
        //get name of current folder
        let folderName = process.cwd().split("\\").pop();
        let config: SharedoConfig =
        {
            name: "",
            enviroments: undefined,
            workflowsFilesFolder: "_workflows",
            ideFilesFolder: "_ide"
        };
        //merge otpions with config
        config = Object.assign(config, options);
        fs.writeFileSync("sharedo.config.json", JSON5.stringify(config, null, 2));
    }
}

export function findConfigFileInDirectory() {
    //search current directory for sharedo.config.json
    let files = fs.readdirSync(process.cwd());
    let configPath = files.find(f => f === "sharedo.config.json");
    if (configPath) {
        return configPath;
    }
    return null;
}