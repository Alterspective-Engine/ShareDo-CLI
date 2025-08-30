import { RequestBase, ResultType, MethodType } from "../ExecutionBase";
import { ISharedoFileResponse } from "./IFile";

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
