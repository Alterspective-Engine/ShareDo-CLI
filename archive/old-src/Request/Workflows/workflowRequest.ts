import { RequestBase, ResultType, MethodType } from "../ExecutionBase";
import { SharedoWorkflowRequestResult } from "./IWorkflow";

export type SharedoWorkflowRequestInput = {
    systemName: string;
};


export class SharedoWorkflowRequest extends RequestBase <SharedoWorkflowRequestResult,SharedoWorkflowRequestInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties={
        systemName    : ""
    } ;
    information= 
    {
        description: "Get List of Workflows",
        displayName: "Get Workflows",
        created: "16-Mar-2023",
        categories: "Workflow"
    };
   
    override async postProcessResults(result: SharedoWorkflowRequestResult): Promise<SharedoWorkflowRequestResult> {
        return result;
    }
 
    get path()
    {
        return `/api/executionengine/visualmodeller/plans/${this.inputProperties.systemName}`;
    }

    
}

//https://hsf-vnext.sharedo.co.uk/api/executionengine/visualmodeller/plans/custom-playground?_=1679001176069
