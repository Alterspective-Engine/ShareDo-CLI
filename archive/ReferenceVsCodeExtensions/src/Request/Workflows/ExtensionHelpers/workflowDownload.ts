import { ElementTypes } from "../../../enums";
import { Settings } from "../../../settings";
import { SharedoClient } from "../../../sharedoClient";
import { TreeNode } from "../../../treeprovider";
import * as vscode from 'vscode';
import { IPostProcessedSharedoIDEItem, SharedoIDEType } from "../../IDE/ISharedoIDERequestResult";
import { buildIdeItemPath } from "../../IDE/ideHelper";
import { Inform } from "../../../Utilities/inform";
import { getWorkflowRootPath } from "../../../Utilities/common";


export async function downloadWorkflow(systemName: string, server: SharedoClient) {

    try {

        Inform.writeInfo(`Downloading workflow [${systemName}]`);
        //ensure there is a folder in the project called workflows
        Inform.writeInfo(`Ensuring workflows folder exists`);
        let rootFolder = getWorkflowRootPath();
        let workflowRootPath = vscode.Uri.file(rootFolder);
        await vscode.workspace.fs.createDirectory(workflowRootPath);


        

        let startTime = new Date().getTime();

        //download the workflow
        let sharedoWorkflowRequestResult = await server.getWorkflow({ systemName: systemName });
        if (sharedoWorkflowRequestResult === undefined) {
            vscode.window.showErrorMessage("Error downloading workflow");
            return;
        }

        let endTime = new Date().getTime();
        let timeTaken = endTime - startTime;
        Inform.writeInfo(`Downloaded workflow [${systemName}] in ${timeTaken}ms`);



        //write the workflow to the file
        let fileName = systemName + ".json";
        const path = require('path');
        let workflowFilePath = path.join(rootFolder, fileName);
        let workflowFileSaveURI = vscode.Uri.file(workflowFilePath);

        //check if file exists and ask if they want to overwrite
        let fileExists = false;
        try {
            fileExists = await vscode.workspace.fs.stat(workflowFileSaveURI).then(() => {
                return true;
            });
        } catch (e) {
            Inform.writeInfo(`File does not exist`);
        }

        
        if (fileExists) {

            //         vscode.diff - Opens the provided resources in the diff editor to compare their contents.

// left - Left-hand side resource of the diff editor
// right - Right-hand side resource of the diff editor
// title - (optional) Human readable title for the diff editor
// columnOrOptions - (optional) Either the column in which to open or editor options, see vscode.TextDocumentShowOptions
// (returns) - no result

   
            //compair the file contents
            let fileContent = await vscode.workspace.fs.readFile(workflowFileSaveURI);
            let existingFileContents = fileContent.toString();
            
            let existingFileAsObject = JSON.parse(existingFileContents);
          
    
            //compare the objects
            if (JSON.stringify(existingFileAsObject) === JSON.stringify(sharedoWorkflowRequestResult)) {
                vscode.window.showInformationMessage(`Workflow [${systemName}] already exists and is the same, skipping`);
                Inform.writeInfo(`Workflow [${systemName}] already exists and is the same, skipping`);
                return;
            }

            Inform.writeInfo(`File already exists and is different to server, validate overwrite`);
            // let overwrite = await vscode.window.showWarningMessage("File already exists, overwrite?", "Yes", "No");
            // if (overwrite === "No") {
            //     Inform.writeInfo(`User chose not to overwrite`);
            //     return;
            // }
            // Inform.writeInfo(`User chose to overwrite`);
        
            var currentdate = new Date(); 
        var datetime = currentdate.getDate() + "_"
                + (currentdate.getMonth()+1)  + "_" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
        let currentDateTime = `${datetime}` ;
        //set the new (.old) file name
        let oldFileName = `${fileName}_${currentDateTime}_.old`;
        let oldFilePath = path.join(rootFolder, oldFileName);
        let oldFile = vscode.Uri.file(oldFilePath);
        //try to rename the file
        try {
            await vscode.workspace.fs.rename(workflowFileSaveURI, oldFile);
        } catch (e) {
            Inform.writeError(`Could not rename [${fileName}] to [${oldFileName}] : ${e}`);
            vscode.window.showErrorMessage("Error renaming file");
            return;
        }



        }

        //write the file

        try {

            let fileContent = new Uint8Array(Buffer.from(JSON.stringify(sharedoWorkflowRequestResult, null, 4)));
            await vscode.workspace.fs.writeFile(workflowFileSaveURI, fileContent);
        } catch (e) {
            Inform.writeError("Error writing file: " + e);
            vscode.window.showErrorMessage("Error writing file: " + e);
        }
    } catch (e) {
        Inform.writeError("Error downloading workflow: " + e);
        vscode.window.showErrorMessage("Error downloading workflow: " + e);
    }



}
