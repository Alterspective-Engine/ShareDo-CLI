import { RequestBase, ResultType, MethodType } from "../ExecutionBase";
import { ISharedoWorkflowsRequestResult } from "./IWorkflows";

export class SharedoWorkflowsRequest extends RequestBase <ISharedoWorkflowsRequestResult,Array<any>[]>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties=[] ;
    information= 
    {
        description: "Get List of Workflows",
        displayName: "Get Workflows",
        created: "16-Mar-2023",
        categories: "Workflow"
    };
   
    override async postProcessResults(result: ISharedoWorkflowsRequestResult): Promise<ISharedoWorkflowsRequestResult> {
        return result;
    }
 
    get path()
    {
        return "/api/listview/core-admin-plan-list/20/1/noSort/asc/?view=table&withCounts=1";
    }

    
}

// '           https://hsf-vnext.sharedo.co.uk/api/listview/core-admin-plan-list/20/1/noSort/asc/?view=table&withCounts=1'
//Request URL: https://hsf-vnext.sharedo.co.uk/api/listview/core-admin-plan-list/20/1/noSort/asc/?view=table&withCounts=1

// var token = await tokenService.GetFixedImpersonationToken("client.fixed.ref", "not a secret", "sharedo");
           
