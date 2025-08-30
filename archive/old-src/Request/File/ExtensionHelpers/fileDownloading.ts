import { getIDERootPath } from "../../../config/config";
import { SharedoClient } from "../../../server/sharedoClient";
import { Inform } from "../../../Utilities/inform";
import { buildIdeItemPath } from "../../IDE/ideHelper";
import { IPostProcessedSharedoIDEItem, SharedoIDEType } from "../../IDE/IIDE";
import fs from "fs";

export async function downloadFolderItems(ideItem: IPostProcessedSharedoIDEItem, server: SharedoClient) {

    if (ideItem.type !== SharedoIDEType.folder) {
        throw new Error("Can't download this type of file");
        
    }

    //create folder
    // let ideItem = node.data as IPostProcessedSharedoIDEItem;
    let ideItemFilePath = buildIdeItemPath(ideItem);
    let rootFolder =  getIDERootPath();
    let filePath = rootFolder + "/" + ideItemFilePath;

    //check if folder exists using fs
    let folderExists = true;
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
    } catch (err) {
        folderExists = false;
    }
    if (!folderExists) {
        fs.mkdirSync(filePath);
    }
        

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
        SharedoIDEType.widgetManifest
    ];

    if (acceptableTypes.indexOf(ideItem.type) === -1) {
        Inform.writeError(`Can't download file [${ideItem.name}] of type [${ideItem.type}]`);
        return;
    }

    let rootFolder =  getIDERootPath();;
    Inform.writeInfo(`Root folder is [${rootFolder}]`);
    let fileName = ideItem.name;
    // let ideItem = node.data as IPostProcessedSharedoIDEItem;
    let ideItemFilePath = buildIdeItemPath(ideItem);
    let filePath = rootFolder + "/" + ideItemFilePath;
    let fullFileNameandPath = filePath + fileName;
    Inform.writeInfo(`File path is [${fullFileNameandPath}]`);

    let downloadedFileResultPromise = server.getIDEFile(ideItem); //start file download
    let downloadedFileResult = await downloadedFileResultPromise.then((downloadedFileResult) => {
        if (downloadedFileResult === undefined) {
            Inform.writeError(`Could not download [${fileName}], request returned undefined.`);
             return;
        }
        return downloadedFileResult;
    });
    if (downloadedFileResult === undefined) {
        return;
    }
    let downloadedFileContents = downloadedFileResult?.content;
    if(downloadedFileContents === undefined) {
        Inform.writeError(`File [${fileName}] contents are undefined.`);
        return;
    }

    //calculate time taken
    let endTime = new Date().getTime();
    Inform.writeInfo(`Downloaded file [${fileName}] in ${endTime - startTime}ms`);


    let fileExists = true;
    //check if file exists
    let existingFileStatus: fs.Stats | undefined;
    try {
        existingFileStatus = fs.statSync(fullFileNameandPath);
    } catch (e) {
        //file doesn't exist
        fileExists = false;
    }


    if (fileExists === true) {
        //*** HANDLE EXISTING FILE ***
      
        Inform.writeInfo(`File [${fileName}] already exists, comparing to downloaded file`);
         //get file contents as string
        let existingFile = fs.readFileSync(fullFileNameandPath);
        let existingFileContents = Buffer.from(existingFile).toString();
        if (existingFileContents === downloadedFileContents) {
            Inform.writeInfo(`File [${fileName}] already exists and is the same as downloaded file`);
            return;
        }


        Inform.writeInfo(`File [${fileName}] already exists and is different to downloaded file, renaming to .old`);
        //rename existing file to .old, first get current date time to append to file name
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
        let oldFile = filePath + oldFileName;
        //try to rename the file
        try {
             fs.renameSync(fullFileNameandPath, oldFile);
        } catch (e) {
            Inform.writeError(`Could not rename [${fileName}] to [${oldFileName}] : ${e}`);
            return;
        }
    }

    //write the downloaded contents into the file
    const data = new Uint8Array(
        Buffer.from(downloadedFileResult!.content)
    );
    //Create / Update file 
    startTime = new Date().getTime();
     fs.writeFileSync(fullFileNameandPath, data);
    endTime = new Date().getTime();
    Inform.writeInfo(`Wrote file [${fileName}] in ${endTime - startTime}ms`);
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


