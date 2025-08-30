//https://hsf-vnext.sharedo.co.uk/api/ide/template/7E782FC8-92EF-4482-813F-E0491E528A1E/oops/fc5df006-b422-425f-9b02-afa400a32e7c

import { MethodType, RequestBase, ResultType } from "../../Execution/ExecutionBase";
import { ISharedoFileResponse } from "../File/ISharedoFileResponse";
import { SharedoIDETemplateResponse } from "./IIDETemplate";

export interface SharedoCreateFolderWithTemplateRequestInputs {
    newFolderName: any;
    templateId: string;
    parentFolderId: string;
}

//https://hsf-vnext.sharedo.co.uk/api/ide/file/e6a060db-25e8-4560-a99e-afa400a32e86

export class SharedoCreateFolderWithTemplateRequest extends RequestBase <ISharedoFileResponse,SharedoCreateFolderWithTemplateRequestInputs>
{
    
    
   resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties: SharedoCreateFolderWithTemplateRequestInputs ={
        templateId: "",
        parentFolderId: "",
        newFolderName: ""
    };
    information= 
    {
        description: "Get list of ide templates from ShareDo",
        displayName: "Get Templates",
        created: "15-Mar-2013",
        categories: "IDE"
    };

    override get body()
    {
        return {   
            content: null,
            error: null,
            id:  null,
            name: null,
            success: true,
            type: null
        };
    }
    
    get path()
    {
        return `api/ide/template/${this.inputProperties.templateId}/${this.inputProperties.newFolderName}/${this.inputProperties.parentFolderId}`;
    }
    
}//https://hsf-vnext.sharedo.co.uk/api/ide/template/7E782FC8-92EF-4482-813F-E0491E528A1E/oops/fc5df006-b422-425f-9b02-afa400a32e7c

