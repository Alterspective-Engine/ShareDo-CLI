import { getIDERootPath } from "../../config/config";
import { IPostProcessedSharedoIDEItem, IPostProcessedSharedoIDERequestResult, SharedoIDEType } from "./IIDE";

export function buildIdeItemPath(ideItem: IPostProcessedSharedoIDEItem): string {
    
    let path = "";
   
    let current : IPostProcessedSharedoIDEItem | undefined = ideItem;
    do {

        if(current === undefined){break;}
        if(current.type === SharedoIDEType.folder)
        {
            path =current.name + "/" + path;
        }
        current=current.parent;

    }
    while (current !== undefined);

    return  path ;
}

export function getIDEItemByFilePath(filePath:string,ideDERequestResult: IPostProcessedSharedoIDERequestResult | undefined) : IPostProcessedSharedoIDEItem | undefined
{
    if(ideDERequestResult === undefined)
    {
        return undefined;
    }

    let rootFolder = getIDERootPath();

    for(let i = 0; i < ideDERequestResult.length; i++) {
        let ideItem = ideDERequestResult[i];
        
        let currentIDEItemPath = rootFolder + "/" + buildIdeItemPath(ideItem) ;
        if(ideItem.type !== SharedoIDEType.folder)
        {
            currentIDEItemPath = currentIDEItemPath + ideItem.name;
        }

        if(currentIDEItemPath.includes("_eeConfig"))
        {
            continue;
        }

        if(currentIDEItemPath === filePath)
        {
            return ideItem;
        }

        

    }

    for(let i = 0; i < ideDERequestResult.length; i++) {
        let ideItem = ideDERequestResult[i];
        let result = getIDEItemByFilePath(filePath,ideItem.children);
        if(result !== undefined)
        {
            return result;
        }
    }

    return undefined;

}
// Path: src/Request/IDE/ideHelper.ts]

export function getIDEFolderByFilePath(filePath:string,ideDERequestResult: IPostProcessedSharedoIDERequestResult | undefined) : IPostProcessedSharedoIDEItem | undefined
{
    //get the folder of the file
    let folderPath = filePath.substring(0,filePath.lastIndexOf("/")) + "/";
    return getIDEItemByFilePath(folderPath,ideDERequestResult);
}


