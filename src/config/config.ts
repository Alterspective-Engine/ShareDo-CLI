import { ISharedoClient, SharedoClient } from "../server/sharedoClient";
import * as JSON5 from "JSON5";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { Inform } from "../Utilities/inform";
import path from "path";
export type SharedoConfig = {
    /** The name of the server */
    name: string;
    /** The url of the server */
    servers: Array<ISharedoClient>;
    workflowsFilesFolder: string | undefined;
    ideFilesFolder: string | undefined;
    activeServer: string | undefined;

};

export const SharedoConfigDefaults: SharedoConfig =
{
    name: "",
    servers: new Array<SharedoClient>(),
    workflowsFilesFolder: "_workflows",
    ideFilesFolder: "_ide",
    activeServer: undefined
};

export type SharedoConfigFileOptions = {
    name?: string | undefined,
    servers?: Array<ISharedoClient>;
    workflowsFilesFolder?: string | undefined,
    ideFilesFolder?: string | undefined
    activeServer?: string | undefined;

};

export function upsertConfigFile(options: SharedoConfigFileOptions) {
    let config = getConfig();
    if (!config) {
        config = SharedoConfigDefaults;
    }
    //merge otpions with config
    config = Object.assign(config, options);
    //get name of current folder
    let folderName = process.cwd().split("\\").pop();
    //merge otpions with config
    writeFileSync("sharedo.config.json", JSON.stringify(config, null, 2));
    Inform.writeSuccess("Config file updated");
}

export function findConfigFileInDirectory() {
    //search current directory for sharedo.config.json
    let files = readdirSync(process.cwd());
    let configPath = files.find(f => f === "sharedo.config.json");
    if (configPath) {
        return configPath;
    }
    return null;
}

export function getConfig(): SharedoConfig | undefined {
    let configPath = findConfigFileInDirectory();
    if (configPath) {
        let config = JSON5.parse(readFileSync(configPath, "utf8"));
        if (config) {
            return config;
        }
    }
    return undefined;
}


export function getIDERootPath(): string | undefined {
    let config = getConfig();
    if (config) {
        let currentPath = process.cwd();
        let idePath = config.ideFilesFolder;
        if (idePath) {
            return path.join(currentPath , idePath);
        }

    }
    return undefined;
}

export function getWorkflowsRootPath(): string | undefined {
    let config = getConfig();
    if (config) {
        let currentPath = process.cwd();
        let workflowsPath = config.workflowsFilesFolder;
        if (workflowsPath) {
            return currentPath + "/" + workflowsPath;
        }

    }
    return undefined;
}
