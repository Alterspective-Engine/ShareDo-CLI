
import { getWorkflowsRootPath } from "../../../config/config";
import { SharedoClient } from "../../../server/sharedoClient";
import { Inform } from "../../../Utilities/inform";
import { IPostProcessedSharedoIDEItem, SharedoIDEType } from "../../IDE/IIDE";
import { ensureTreePath } from "../sharedoIDEFileHelper";
import fs from "fs";
import path from "path";

export async function publishFileFolderToServers(fullFilePath: string, server: SharedoClient) {


    //validate if fullFilePath exists
    try {
        fs.accessSync(fullFilePath, fs.constants.F_OK)
    } catch (err) {
        Inform.writeError("Can't find file/folder");
        return Promise.reject("Can't find file/folder");
    }

    let retValues = new Array<{ server: SharedoClient, ideItem: Promise<IPostProcessedSharedoIDEItem> }>();
    let workflowRootPath = getWorkflowsRootPath();
    if (!workflowRootPath) {
        Inform.writeError("Can't find workflow root path");
        return Promise.reject("Can't find workflow root path");
    }


    //check if file is in the "_workflows" folder
    if (fullFilePath.indexOf(workflowRootPath) > -1) {
        Inform.writeError("Can't publish workflow files yet! Coming Soon ");
        return Promise.reject("Can't publish workflow files");
    }
    return publishFileFolder(fullFilePath, server);
}

async function publishFileFolder(fullFilePath: string, server: SharedoClient): Promise<IPostProcessedSharedoIDEItem> {

    try {
        let ensureResponse = await ensureTreePath(fullFilePath, server);

        let ideItem = ensureResponse?.ideItem;
        let itemsCreated = ensureResponse?.itemsCreated;

        if (ideItem === undefined) {
            Inform.writeError("Can't find file in IDE");
            return Promise.reject("Can't find file in IDE");
        }

        if (ideItem.type === SharedoIDEType.folder) {

            //get all the files and folders in this folder and publish then too
            let files = fs.readdirSync(fullFilePath);
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                let cfileUri = path.join(fullFilePath, file);
                Inform.writeInfo("Publishing file " + cfileUri);
                await publishFileFolder(cfileUri, server);
            }
             return ideItem;
        }

        //continue with file as we need to add the contents
        let contents = fs.readFileSync(fullFilePath);
        let content = Buffer.from(contents).toString();
        let fileName = fullFilePath.split("/").pop();
        if (fileName === undefined) {
            Inform.writeError("Can't find file name");
            return Promise.reject("Can't find file name");
        }



        //check the found ideItem is the same as the file we are trying to publish
        if (ideItem.name !== fullFilePath.split("/").pop()) {
            Inform.writeError("Can't find file in IDE");
            Promise.reject("Can't find file in IDE");
        }

        try {
            let result = await server.publishIDEFile(ideItem.id, content);

            if (result === undefined) {
                Inform.writeError("Error publishing file");
                return Promise.reject("Error publishing file");
            }

            if (result.error) {
                Inform.writeError(result.error);
                return Promise.reject("Error publishing file");
            }

            if (result.success === true) {
                Inform.writeSuccess(`File published [${ideItem.type}] ${ideItem.name} successfully to Sharedo`);
            }

            return ideItem;

        }
        catch (error) {
            Inform.writeError("Error publishing file :" + error);
            return Promise.reject("Error publishing file");
        };
        // get current root folder   
    }
    catch (error) {
        Inform.writeError("Error publishing file :" + error);
        return Promise.reject("Error publishing file");
    }
}