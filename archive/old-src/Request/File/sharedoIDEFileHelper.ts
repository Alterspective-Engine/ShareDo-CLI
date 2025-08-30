
import { IPostProcessedSharedoIDEItem, SharedoIDEType, sharedoIDETypeTypesParser } from "../IDE/IIDE";
import { ISharedoIDEFileCreateInputProperties } from "./fileCreateRequest";
import { Inform } from "../../Utilities/inform";
import { getIDERootPath } from "../../config/config";
import { SharedoClient } from "../../server/sharedoClient";


export async function ensureTreePath(inputPath: string, server: SharedoClient) {
    
    Inform.writeInfo("Refreshing IDE tree");
    await server.getIDE(); //refresh IDE
    let rootFolder = getIDERootPath();
    if(!rootFolder) {
        Inform.writeError("Can't find IDE root path");  
        return;
    }

    //remove root folder from path
    inputPath = inputPath.replace(rootFolder, '');

    let itemsCreated = [];
    
    const parts = inputPath.split('/');
   
    let currentItem: IPostProcessedSharedoIDEItem =
    {
        parent: undefined,
        children: await server.getIDE(),
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
        itemsCreated.push(x);
        childItem.id = x.id;
  
        currentItem.children = currentItem.children || [];
        currentItem.children.push(childItem);
  
        Inform.writeSuccess(`Created ${childItem.type === SharedoIDEType.folder ? 'directory' : 'file'}: ${part}`);
      } else {
        Inform.writeDebug(`${part} already exists.`);
      }
      currentItem = childItem;
    }
    return {ideItem : currentItem, itemsCreated : itemsCreated};
  }