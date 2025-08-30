
//https://hsf-vnext.sharedo.co.uk/api/ide/file/e6a060db-25e8-4560-a99e-afa400a32e86

import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { ISharedoFileResponse } from "./ISharedoFileResponse";

export interface ISharedoFileRequestInputProperties {
    fileId: string;
}


export class SharedoFileDownloadRequest extends RequestBase <ISharedoFileResponse,ISharedoFileRequestInputProperties>
{
    
    
   resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties: ISharedoFileRequestInputProperties = {
        fileId: ""
    };
    information= 
    {
        description: "Get a file from the IDE",
        displayName: "Get File",
        created: "14-Mar-2013",
        categories: "IDE"
    };
    
    get path()
    {
        return `/api/ide/file/${this.inputProperties.fileId}`;
    }
    
}
