//{{BasePre}}{{BasePost}}/api/executionengine/plans/executing
import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { IPlansExecutingRequestResult } from "./IPlanExecuting";



export class SharedoWorkflowExecutingRequest extends RequestBase <IPlansExecutingRequestResult[],undefined>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties=undefined;
    information= 
    {
        description: "Get List of Executing Event Engine Plans",
        displayName: "Get Executing Event Engine Plans",
        created: "5-Sep-2023",
        categories: "Workflow"
    };
   
    
 
    get path()
    {
        return `/api/executionengine/plans/executing`;
    }

    
}
