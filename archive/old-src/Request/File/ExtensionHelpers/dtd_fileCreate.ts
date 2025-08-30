// import { Settings } from "../../../settings";
// import { SharedoClient } from "../../../sharedoClient";
// import * as vscode from 'vscode';
// import { getIDEFolderByFilePath, getIDEItemByFilePath } from "../../IDE/ideHelper";
// import { type } from "os";
// import { IPostProcessedSharedoIDEItem, SharedoIDEType, sharedoIDETypeTypesParser } from "../../IDE/IIDE";
// import { ISharedoIDEFileCreateInputProperties } from "../fileCreateRequest";
// import { ISharedoFileResponse } from "../IFile";



// export async function createIDEItem(path: string, sharedoIDEType: SharedoIDEType, settings: Settings): Promise<IPostProcessedSharedoIDEItem | undefined> {

//     let server: SharedoClient = settings.sharedoEnvironments.getCurent();

//     //root item
//     //https://hsf-vnext.sharedo.co.uk/api/ide/folder/tt/_

//     //check if workspace exists, and if so remove from path to get relative path for ShareDo
//     if (vscode.workspace.workspaceFolders !== undefined) 
//         {
//             let workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
//             path = path.replace(workspaceRoot, "");
//         }



//         //get name of the item
//         let itemName = path.split("/").pop();
//         if (itemName === undefined) {
//             vscode.window.showErrorMessage("Can't find file name");
//             return;
//         }
//         path = path.replace(itemName, ""); //remove last part of path as this is the name of the item


//         let pathArray = path.split("/");
//         //validate the path
//         let pathBuilder = "";
//         let previousIDEFolderItem: IPostProcessedSharedoIDEItem | undefined = undefined;
//         await server.getIDE(); //refresh IDE
//         for (let i = 0; i < pathArray.length; i++) {
//             let currentPath = pathArray[i];
//             if (pathArray[i] === "") {
//                 continue; //ignore empty paths
//             }
//             pathBuilder += "/" + currentPath;
//             //remove initial slash
//             if (pathBuilder.startsWith("/")) {
//                 pathBuilder = pathBuilder.substring(1);
//             }


//             let validatedPath = getIDEItemByFilePath(pathBuilder, server.ideResult);
//             if (validatedPath === undefined) {
//                 //create the folder
//                 let createIDEFolderInput: ISharedoIDEFileCreateInputProperties =
//                 {
//                     content: "",
//                     fileName: currentPath,
//                     folderId: previousIDEFolderItem?.id,
//                     type: SharedoIDEType.folder
//                 };

//                 let newIdeItem = await server.createIDEFile(createIDEFolderInput);
//                 validatedPath = getIDEFolderByFilePath(pathBuilder, server.ideResult);
//             }

//             previousIDEFolderItem = validatedPath;
//             await server.getIDE();
//         }




//         if (previousIDEFolderItem === undefined) {
//             //file not found in IDE
//             //find the files folder 
//             vscode.window.showErrorMessage("Can't find folder in IDE to save file");
//             return undefined;
//         }

//         //check the found ideItem is the same as the file we are trying to publish
//         if (previousIDEFolderItem.type !== SharedoIDEType.folder) {
//             vscode.window.showErrorMessage("Can't find folder in IDE");
//             return undefined;
//         }

//         let createIDEFileInput: ISharedoIDEFileCreateInputProperties =
//         {
//             content: "",
//             fileName: itemName,
//             folderId: previousIDEFolderItem.id,
//             type: sharedoIDEType
//         };

//         return server.createIDEFile(createIDEFileInput).then((result) => {
//             if (result === undefined) {
//                 vscode.window.showErrorMessage("Error creating file");
//                 Promise.reject("Error creating file");
//                 return undefined;
//             }

//             if (result.error === undefined) {
//                 vscode.window.showErrorMessage(result.error);
//                 Promise.reject(result.error);
//                 return;
//             }

//             if (result.success === true) {
//                 vscode.window.showInformationMessage("File published successfully to Sharedo");
//             }

//             return {
//                 id: result.id,
//                 name: result.name,
//                 type: result.type,
//                 parent: previousIDEFolderItem,
//                 children: []
//             };


//         }).catch((error) => {
//             vscode.window.showErrorMessage("Error publishing file :" + error);
//             Promise.reject(error);
//             return undefined;
//         });
//     }

export {};