import { RequestBase, ResultType, MethodType } from "../ExecutionBase";
import { ISharedoFileResponse } from "./IFile";


export interface ISharedoIDEFileSaveInputProperties {
    content: string,
    fileId: string
}


export class SharedoFileSaveRequest extends RequestBase <ISharedoFileResponse,ISharedoIDEFileSaveInputProperties>
{
        
   resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties: ISharedoIDEFileSaveInputProperties = {
        content: "",
        fileId: ""
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
        return {
            content: this.inputProperties.content,
        };
    }
    
    get path()
    {
        return `/api/ide/file/${this.inputProperties.fileId}`;
    }
    
}
