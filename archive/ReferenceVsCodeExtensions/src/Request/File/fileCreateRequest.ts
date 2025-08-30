
//create a file
//https://hsf-vnext.sharedo.co.uk/api/ide/file/fc5df006-b422-425f-9b02-afa400a32e7c/test.txt/_

import { FileType } from "vscode";
import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { SharedoIDEType } from "../IDE/ISharedoIDERequestResult";
import { ISharedoFileResponse } from "./ISharedoFileResponse";
import { v4 as uuidv4 } from 'uuid';
import { getFileNameFromPath } from "../../Utilities/common";

// Utility function for logging
function logInfo(module: string, func: string, message: string, context?: any) {
    console.log(`[INFO] [${module}::${func}] ${message}`, context || '');
}


export interface ISharedoIDEFileCreateInputProperties 
{   
    folderId: string | undefined, //undefined for root
    fileName: string,
    type: SharedoIDEType,
    content: string
}

export class SharedoFileCreateRequest extends RequestBase <ISharedoFileResponse,ISharedoIDEFileCreateInputProperties>
{
        
   resultType: ResultType = ResultType.json;
   method: MethodType = MethodType.put;
   inputProperties: ISharedoIDEFileCreateInputProperties = {
        folderId: "",
        fileName: "",
        type: SharedoIDEType.js,
        content: ""
    };

    information= 
    {
        description: "Save file to IDS",
        displayName: "Save IDE File",
        created: "14-Mar-2013",
        categories: "IDE"
    };
   

    override get body() 
    {

        //generate a new guid
        //https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript



        return {
            content: null,
            error: null,
            id: uuidv4(),
            name: this.inputProperties.fileName,
            success: true,
            type: this.inputProperties.type,
        };
    }
    // https://hsf-vnext.sharedo.co.uk/api/ide/file/fc5df006-b422-425f-9b02-afa400a32e7c/test.txt/_
    get path()
    {
        let pathType = "file";
        if(this.inputProperties.type === SharedoIDEType.folder)
        {
            pathType = "folder";
        }

        // Ensure fileName is just the filename, not a full path (cross-platform fix)
        let fileName = getFileNameFromPath(this.inputProperties.fileName);
        
        if (fileName !== this.inputProperties.fileName) {
            logInfo('SharedoFileCreateRequest', 'path', `Extracted filename from path: ${this.inputProperties.fileName} -> ${fileName}`);
        }

        // URL encode the components to handle special characters
        const encodedFolderId = encodeURIComponent(this.inputProperties.folderId || '');
        const encodedFileName = encodeURIComponent(fileName);

        return `api/ide/${pathType}/${encodedFolderId}/${encodedFileName}/_`;
    }
    
}
