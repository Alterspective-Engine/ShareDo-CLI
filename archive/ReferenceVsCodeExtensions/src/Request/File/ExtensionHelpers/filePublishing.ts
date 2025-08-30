import { Settings, DOWNLOAD_IDE_ROOT_FOLDER } from "../../../settings";
import { SharedoClient } from "../../../sharedoClient";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IPostProcessedSharedoIDEItem, SharedoIDEType} from "../../IDE/ISharedoIDERequestResult";
import { ensureTreePath } from "../sharedoIDEFileHelper";
import { getWorkflowRootPath, getFileNameFromPath, getIDERootPath, normalizePath } from "../../../Utilities/common";
import { getStringContentsFromfileUri } from "../../../Helpers/stringHelpers";
import { CacheManagementService } from "../../../services/CacheManagementService";
import { PublishingLogger } from "../../../services/PublishingLogger";

export async function publishFileFolderToServers(infile: vscode.Uri | string, settings: Settings) {


   
    


    let retValues = new Array<{
         server: SharedoClient,
          ideItem: Promise<IPostProcessedSharedoIDEItem>, 
          progress:{
                files:Array<string>,
                processedFiles:Array<string>,

          } }
          >();
    let workflowRootPath = getWorkflowRootPath();


    let batchId = new Date().getTime().toString();
    const logger = PublishingLogger.getInstance();

    let fileUri:vscode.Uri = infile as vscode.Uri;

    if(typeof infile === "string"){
        fileUri = vscode.Uri.parse(infile);
    }
    
    // Show the log output channel
    logger.showLog();
    
    // Check if fileUri is in the _IDE folder
    const ideRootPath = getIDERootPath();
    const normalizedFilePath = normalizePath(fileUri.fsPath);
    const normalizedIDEPath = normalizePath(ideRootPath);
    
    if (!normalizedFilePath.startsWith(normalizedIDEPath)) {
        vscode.window.showErrorMessage(`Can only publish files from the ${DOWNLOAD_IDE_ROOT_FOLDER} folder. Please move your files to ${ideRootPath} first.`);
        return Promise.reject(`File must be within the ${DOWNLOAD_IDE_ROOT_FOLDER} folder`);
    }

    //check if fileUri is in the "_workflows" folder
    if (fileUri.fsPath.indexOf(workflowRootPath) > -1) {
        vscode.window.showErrorMessage("Can't publish workflow files yet! Coming Soon ");
        return Promise.reject("Can't publish workflow files");
    }


    settings.sharedoEnvironments.deployToServers?.forEach(async (server) => {
        let publishItem = { 
            server: server, 
            ideItem: publishFileFolder(fileUri, server,batchId),
             progress:
             {files:new Array<string>(), 
                processedFiles:new Array<string>()}};
        retValues.push(publishItem);
        
        // Count total files to publish (estimate)
        let totalFiles = 1;
        try {
            const stat = await vscode.workspace.fs.stat(fileUri);
            if (stat.type === vscode.FileType.Directory) {
                // Count files in directory
                const files = await vscode.workspace.fs.readDirectory(fileUri);
                totalFiles = files.filter(([_, type]) => type === vscode.FileType.File).length;
            }
        } catch {}
        
        // Start batch logging
        logger.startBatch(batchId, server.url, totalFiles);
        
        vscode.window.showInformationMessage(`🚀 Starting publish to [${server.url}]`);
        
        // Show fun starting message for cache preparation
        const cacheService = CacheManagementService.getInstance();
        // This will trigger the debouncer to start showing countdown
        cacheService.resetCacheHeadersDebounced(server);

        publishItem.server.onPublishingFilesUpdated((ev) => {
            if (ev.data.batchId === batchId) {           
                publishItem.progress.files.push(...ev.data.files);   
            }
        });

        publishItem.server.onPublishingFileCompleted((ev) => {

            if (ev.data.batchId === batchId) {
                publishItem.progress.processedFiles.push(ev.data.file);
                let filesToProcess = publishItem.progress.files.length - publishItem.progress.processedFiles.length;
                const total = publishItem.progress.files.length;
                const done = publishItem.progress.processedFiles.length;
                
                // Show progress with fun emoji
                const progressEmojis = ["🎯", "🚀", "⚡", "🎪", "🎨"];
                const emoji = progressEmojis[done % progressEmojis.length];
                
                if (filesToProcess > 0) {
                    vscode.window.showInformationMessage(`${emoji} Publishing: ${done}/${total} files done - ${filesToProcess} to go! [${ev.data.server.url}]`);
                }
            }
        });


        publishItem.ideItem.then(async (ideItem) => {
            if (ideItem !== undefined) {
                vscode.window.showInformationMessage(`✅ All files published to [${publishItem.server.url}]! Cache refresh incoming...`);
                
                // Complete the batch logging first
                logger.completeBatch(batchId);
                
                // The cache reset is already triggered by individual file publishes
                // This will just ensure it runs if not already triggered
                const cacheService = CacheManagementService.getInstance();
                const result = await cacheService.resetCacheHeadersDebounced(publishItem.server);
                
                // The cache reset logging is now handled inside CacheManagementService
                // which calls logger.logCacheReset() when the cache is actually reset
            }
        });

    });

    return retValues;

}



async function publishFileFolder(fileUri: vscode.Uri, server: SharedoClient, batchId:string): Promise<IPostProcessedSharedoIDEItem> {
    const logger = PublishingLogger.getInstance();
    const startTime = Date.now();
    
    try {
        // Log file start
        logger.logFileStart(fileUri.fsPath, server.url, batchId);
        
        server.emmitPublishingFolderEvent(
           { 
                    batchId:batchId, 
                    folderName: getFileNameFromPath(fileUri.fsPath) || 'unknown',
                    server: server
            } 
            
        );
        
        
        let extensionsToignore = [".git"];
        if (extensionsToignore.includes(fileUri.fsPath.split(".").pop() as string)) {
            return Promise.reject("File extension ignored");
        }
       
        //get the file extension
       


        // server.emitServerEvent(
        //     { type: EmmitType.publishingFiles, 
        //         data: { batchId:batchId, files: [fileUri.fsPath], server: server, currentFile: 0 } });

        let ensureResponse =await  ensureTreePath(fileUri.fsPath, server);

        let ideItem = ensureResponse?.ideItem;
        let itemsCreated = ensureResponse?.itemsCreated;

        if (ideItem === undefined) {
            // vscode.window.showErrorMessage("Can't find file in IDE");
            return Promise.reject("Can't find file in IDE");
        }
       

        if (ideItem.type === SharedoIDEType.folder) {

            //get all the files and folders in this folder and publish then too
            let files = await vscode.workspace.fs.readDirectory(fileUri);
            server.emmitPublishingFilesUpdateEvent(
                {
                    batchId:batchId,
                    files: files.map((file) => { return file[0]; }),
                    server: server
                }
            );

            let filesToPublish = new Array<Promise<IPostProcessedSharedoIDEItem>>();

            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                // Use path.join to ensure correct path separators for the OS
                let childPath = path.join(fileUri.fsPath, file[0]);
                let cfileUri = vscode.Uri.file(childPath);
                console.log(cfileUri.fsPath);
                filesToPublish.push(publishFileFolder(cfileUri, server, batchId));
            }

            let allDone =  await Promise.all(filesToPublish);

            allDone.forEach((ideItem) => {
                if (ideItem !== undefined) {
                    vscode.window.showInformationMessage(`File ${ideItem.name} published to [${server.url}]`);
                }
            });

            return ensureResponse!.ideItem;
        }

        //continue with file as we need to add the contents
        // let contents = await vscode.workspace.fs.readFile(fileUri);
        // let content = Buffer.from(contents).toString();
        // if (content.charCodeAt(0) === 0xFEFF) {
        //     content = content.substring(1);
        //   }

        let content = await getStringContentsFromfileUri(fileUri.fsPath);

        let fileName = getFileNameFromPath(fileUri.fsPath);
        if (fileName === undefined || fileName === '') {
            // vscode.window.showErrorMessage("Can't find file name");
            return Promise.reject("Can't find file name");
        }



        //check the found ideItem is the same as the file we are trying to publish
        if (ideItem.name !== getFileNameFromPath(fileUri.fsPath)) {
            // vscode.window.showErrorMessage("Can't find file in IDE");
            Promise.reject("Can't find file in IDE");
        }

        server.emmitPublishingFileStartedEvent(
            {
                batchId:batchId,
                file: fileUri.fsPath,
                server: server
            }
        );

        let result = await server.publishIDEFile(ideItem.id, content);

        server.emmitPublishingFileCompletedEvent(
            {
                batchId:batchId,
                file: fileUri.fsPath,
                server: server
            }
        );

        if (result === undefined) {
            const duration = Date.now() - startTime;
            logger.logFileFailure(fileUri.fsPath, server.url, "Publishing returned undefined", duration, batchId);
            vscode.window.showErrorMessage("Error publishing file");
            return Promise.reject("Error publishing file");
        }

        if (result.error !== undefined && result.error !== null) {
            const duration = Date.now() - startTime;
            logger.logFileFailure(fileUri.fsPath, server.url, result.error, duration, batchId);
            // vscode.window.showErrorMessage(result.error);
            return Promise.reject("Error publishing file");
        }

        if (result.success === true) {
            // vscode.window.showInformationMessage("File published successfully to Sharedo");
            
            // Get file size
            let fileSize = 0;
            try {
                const stats = fs.statSync(fileUri.fsPath);
                fileSize = stats.size;
            } catch {}
            
            // Log successful publish
            const duration = Date.now() - startTime;
            logger.logFileSuccess(fileUri.fsPath, server.url, duration, fileSize, batchId);
            
            // Trigger cache reset with debouncing (will batch if multiple files)
            const cacheService = CacheManagementService.getInstance();
            cacheService.resetCacheHeadersDebounced(server).catch(error => {
                console.error('Cache reset failed:', error);
            });
        }

        return ideItem;

    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.logFileFailure(fileUri.fsPath, server.url, errorMessage, duration, batchId);
        vscode.window.showErrorMessage("Error publishing file :" + error);
        return Promise.reject("Error publishing file");
    };
    // get current root folder   

}