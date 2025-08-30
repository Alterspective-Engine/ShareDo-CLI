
import { ElementTypes } from "../../../enums";
import { Settings } from "../../../settings";
import { SharedoClient } from "../../../sharedoClient";
import { TreeNode } from "../../../treeprovider";
import * as vscode from 'vscode';
import { IPostProcessedSharedoIDEItem, SharedoIDEType } from "../../IDE/ISharedoIDERequestResult";
import { buildIdeItemPath } from "../../IDE/ideHelper";
import { Inform } from "../../../Utilities/inform";
import { getIDERootPath } from "../../../Utilities/common";
import { getStringContentsFromfileUri } from "../../../Helpers/stringHelpers";
import * as path from 'path';


export async function downloadFolderItems(ideItem: IPostProcessedSharedoIDEItem, server: SharedoClient) {
    // let server: SharedoClient = settings.sharedoEnvironments.getCurent();

    //Types we can run a download for
  
    if (ideItem.type !== SharedoIDEType.folder) {
        vscode.window.showErrorMessage("Can't download this type of file");
        return;
    }


    //create folder
    // let ideItem = node.data as IPostProcessedSharedoIDEItem;

    let ideItemFilePath = buildIdeItemPath(ideItem);
    let rootFolder = getIDERootPath();
    let filePath = path.join(rootFolder, ideItemFilePath);
    let file = vscode.Uri.file(filePath);
    await vscode.workspace.fs.createDirectory(file);

    if (ideItem.children === undefined) {
        return;
    }


    for(let i = 0; i < ideItem.children.length; i++) {
        let child = ideItem.children[i];
        if (child.type === SharedoIDEType.folder) {
            await downloadFolderItems(child, server);
        } else {
            await downloadIDEFile(child, server);
        }
    }
   
}


export async function downloadIDEFile(ideItem: IPostProcessedSharedoIDEItem, server: SharedoClient) {
    // let server: SharedoClient = settings.sharedoEnvironments.getCurent();

    //get current time 
    let startTime = new Date().getTime();
    Inform.writeInfo(`Downloading file [${ideItem.name}]`);

    //Types we can run a download for
    let acceptableTypes = [
        SharedoIDEType.css,
        SharedoIDEType.html,
        SharedoIDEType.js,
        SharedoIDEType.json,
        SharedoIDEType.text,
        SharedoIDEType.wfActionManifest,
        SharedoIDEType.widgetManifest,
        SharedoIDEType.bladeManifest,
        SharedoIDEType.globalIncludeManifest,
        SharedoIDEType.widgetManifest
    ];

    if (acceptableTypes.indexOf(ideItem.type) === -1) {
        vscode.window.showErrorMessage("Can't download this type of file");
        return;
    }

    // get current root folder
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders === undefined || workspaceFolders.length === 0) {
        //TODO: allow to download without workspace into unsaved file
        vscode.window.showErrorMessage("Can't download file, create a workspace first");
        return "";
    }



    let rootFolder = getIDERootPath();
    Inform.writeInfo(`Root folder is [${rootFolder}]`);
    let fileName = ideItem.name;
    let ideItemFilePath = buildIdeItemPath(ideItem);
    let filePath = path.join(rootFolder, ideItemFilePath);
    let fullFileNameandPath = path.join(filePath, fileName);
    let file = vscode.Uri.file(fullFileNameandPath);

    // Download file
    let downloadedFileResult = await server.getIDEFile(ideItem);
    if (!downloadedFileResult) {
        Inform.writeError(`Could not download [${fileName}], request returned undefined.`);
        vscode.window.showErrorMessage("Error downloading file.");
        return;
    }
    let downloadedFileContents = downloadedFileResult.content;
    if (downloadedFileContents === undefined) {
        Inform.writeError(`File [${fileName}] contents are undefined.`);
        vscode.window.showErrorMessage("Error downloading file.");
        return;
    }

    //calculate time taken
    let endTime = new Date().getTime();
    Inform.writeInfo(`Downloaded file [${fileName}] in ${endTime - startTime}ms`);


    let fileExists = true;
    try {
        await vscode.workspace.fs.stat(file);
    } catch (e) {
        fileExists = false;
    }


    if (fileExists) {
        Inform.writeInfo(`File [${fileName}] already exists, comparing to downloaded file`);
        // Use fsPath for local file operations
        let existingFileContents = await getStringContentsFromfileUri(file.fsPath);
        if (existingFileContents === downloadedFileContents) {
            Inform.writeInfo(`File [${fileName}] already exists and is the same as downloaded file`);
            return;
        }

        Inform.writeInfo(`File [${fileName}] already exists and is different to downloaded file, renaming to .old`);
        vscode.window.showInformationMessage(`File [${fileName}] already exists, renaming to .old`);
        // Rename existing file to .old
        const currentdate = new Date();
        const datetime = currentdate.getDate() + "_"
            + (currentdate.getMonth() + 1) + "_"
            + currentdate.getFullYear() + "@"
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        const oldFileName = `${fileName}_${datetime}_.old`;
        const oldFilePath = path.join(filePath, oldFileName);
        const oldFile = vscode.Uri.file(oldFilePath);
        try {
            await vscode.workspace.fs.rename(file, oldFile);
        } catch (e) {
            Inform.writeError(`Could not rename [${fileName}] to [${oldFileName}] : ${e}`);
            vscode.window.showErrorMessage("Error renaming file");
            return;
        }
    }

    //write the downloaded contents into the file
    const data = new Uint8Array(
        Buffer.from(downloadedFileResult!.content)
    );
    //Create / Update file 
    startTime = new Date().getTime();
    await vscode.workspace.fs.writeFile(file, data);
    endTime = new Date().getTime();
    Inform.writeInfo(`Wrote file [${fileName}] in ${endTime - startTime}ms`);
    vscode.window.showInformationMessage(`File [${fileName}] downloaded`);
    // let downloadInfo = "";
    // downloadInfo += "Last Downloaded from Sharedo\n";
    // downloadInfo += "*  File            : " + ideItem.name + "\n";
    // downloadInfo += "*  IDE Path        : " + ideItemFilePath + "\n";
    // downloadInfo += "*  Downloaded Path : " + file.fsPath + "\n";
    // downloadInfo += "*  Date            : " + new Date().toLocaleString() + "\n";
    // downloadInfo += "*  ShareDo Server  : " + node.sharedoClient.url + "\n";


    //create download info a md file
    //let downloadInfoFile = vscode.Uri.parse(fullFileNameandPath + "_Download_Info.md");
   // await vscode.workspace.fs.writeFile(downloadInfoFile, new Uint8Array(Buffer.from(downloadInfo)));

}


