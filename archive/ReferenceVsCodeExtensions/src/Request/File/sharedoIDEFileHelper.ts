import { DeferredPromise } from "../../Helpers/DeferredPromise";
import { getIDERootPath, normalizePath } from "../../Utilities/common";
import { Inform } from "../../Utilities/inform";
import { SharedoClient } from "../../sharedoClient";
import { IPostProcessedSharedoIDEItem, SharedoIDEType, sharedoIDETypeTypesParser } from "../IDE/ISharedoIDERequestResult";
import { ISharedoIDEFileCreateInputProperties } from "./fileCreateRequest";
import { DOWNLOAD_IDE_ROOT_FOLDER } from "../../settings";
import * as vscode from 'vscode';

let queue: Promise<any> = Promise.resolve();


// Locking mechanism to append function calls to the queue
/**
 * This function is used to ensure that the tree path exists in the IDE
 * * It will create any folders that don't exist 
 * * It also needs to run one at a time to ensure that the tree is created in the correct order
 * ! Locking mechanism to append function calls to the queue
 * @param inputPath 
 * @param server 
 */
export async function ensureTreePath(inputPath: string, server: SharedoClient): Promise<{ ideItem: IPostProcessedSharedoIDEItem, itemsCreated: any[] } | undefined> {
    let result =new DeferredPromise<{ ideItem: IPostProcessedSharedoIDEItem, itemsCreated: any[] } | undefined>;
    

    const func = async () => {
        const res = await ensureTreePathInternal(inputPath, server);
         result.resolve(res);
        return result;
    };
    
    const catchHandler = (error: any) => {
        console.error(error); // Or any other error handling mechanism
        result.reject(error); // This forwards the error
    };

    // Add the function to the chain
    queue = queue.then(()=>
    {
      func();
    }
    ).catch(catchHandler);

    // Also ensure that the queue continues even if there's an error in one call
    queue = queue.catch(() => {});

    // return new Promise((resolve, reject) => {
    //     result!.then(resolve).catch(reject);
    // });

    return result.promise;

}

  async function ensureTreePathInternal(inputPath: string, server: SharedoClient) {
    Inform.writeInfo("Refreshing IDE tree");
    await server.getIDE(); //refresh IDE
    let rootFolder = getIDERootPath();
    
    // Normalize paths for cross-platform compatibility
    inputPath = normalizePath(inputPath);
    rootFolder = normalizePath(rootFolder);
    
    // Check if the file is within the _IDE folder
    if (!inputPath.includes(normalizePath(DOWNLOAD_IDE_ROOT_FOLDER))) {
        throw new Error(`File must be within the ${DOWNLOAD_IDE_ROOT_FOLDER} folder to be published`);
    }
    
    // Extract only the path after _IDE folder
    const ideIndex = inputPath.indexOf(normalizePath(DOWNLOAD_IDE_ROOT_FOLDER));
    const idePathStart = ideIndex + normalizePath(DOWNLOAD_IDE_ROOT_FOLDER).length;
    inputPath = inputPath.substring(idePathStart);
    
    // Remove leading slash if present
    if (inputPath.startsWith('/') || inputPath.startsWith('\\')) {
        inputPath = inputPath.substring(1);
    }

    let itemsCreated = [];
    
    // Split by both forward slash and backslash to handle cross-platform paths
    const parts = inputPath.split(/[\\\/]+/).filter(part => part.length > 0);
   
    let currentItem: IPostProcessedSharedoIDEItem =
    {
        parent: undefined,
        children: server.ideResult,
        id: "",
        name: "Root",
        type: SharedoIDEType.folder
    };
    

    for (const part of parts) {
        if (part === '') {
            continue;
        }
        
      let childItem = currentItem.children?.find(child => child.name === part);
  
      if (!childItem) {
       
        //Template for new child item
        childItem = {
          id: "",
          name: part,
          type: SharedoIDEType.folder,
          parent: currentItem,
          children: [],
        };

        if (part.includes('.')) {
          childItem.type = sharedoIDETypeTypesParser(part);
        }

        let input : ISharedoIDEFileCreateInputProperties = {
            fileName: childItem.name,
            type: childItem.type,
            folderId: currentItem.id,
            content: ""
        };
        Inform.writeInfo(`Creating ${childItem.type === SharedoIDEType.folder ? 'directory' : 'file'}: ${part}`);
        let x = await server.createIDEFile(input);
        if(x === undefined) {
          Inform.writeError(`Error creating ${childItem.type === SharedoIDEType.folder ? 'directory' : 'file'}: ${part}`);
            return;
        }
        vscode.window.showInformationMessage(`Created ${childItem.type}: ${part}`);
        itemsCreated.push(x);
        childItem.id = x.id;
  
        currentItem.children = currentItem.children || [];
        currentItem.children.push(childItem);
  
        console.log(`Created ${childItem.type === SharedoIDEType.folder ? 'directory' : 'file'}: ${part}`);
      } else {
        console.log(`${part} already exists.`);
        Inform.writeDebug(`${part} already exists.`);
      }
  
      currentItem = childItem;
    }

    return {ideItem : currentItem, itemsCreated : itemsCreated};
  }