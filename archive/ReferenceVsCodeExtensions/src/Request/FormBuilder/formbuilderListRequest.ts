import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { IFormBuilderRequestResult } from "./IFormBuilderRequestResult";

export class FormbuilderListRequest extends RequestBase <IFormBuilderRequestResult[],null>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties=null;
    information= 
    {
        description: "Get List of Forms",
        displayName: "Get Forms",
        created: "16-Jun-2024",
        categories: "FormBuilder"
    };
   
    override async postProcessResults(result: IFormBuilderRequestResult[]): Promise<IFormBuilderRequestResult[]> {
        return result;
    }
 
    get path()
    {
        return "/api/formbuilder/forms";
    }
}


