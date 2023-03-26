

//https://hsf-vnext.sharedo.co.uk/api/ide/file/e6a060db-25e8-4560-a99e-afa400a32e86

import { RequestBase, ResultType, MethodType } from "../ExecutionBase";
import { SharedoIDETemplateResponse } from "./IIDETemplate";

export class SharedoIDETemplateRequest extends RequestBase <SharedoIDETemplateResponse,undefined>
{
    
    
   resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties: undefined;
    information= 
    {
        description: "Get list of ide templates from ShareDo",
        displayName: "Get Templates",
        created: "15-Mar-2013",
        categories: "IDE"
    };
    
    get path()
    {
        return `/plugins/sharedo.core.case/ide/editor/templates/templates.json`;
    }
    
}
