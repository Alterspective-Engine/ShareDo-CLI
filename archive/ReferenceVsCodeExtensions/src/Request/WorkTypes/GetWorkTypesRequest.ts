
import { RequestBase, MethodType, ResultType } from "../../Execution/ExecutionBase";
import { IGetWorkTypesRequestResult } from "./IGetWorkTypesRequestResult";

export class GetWorkTypesRequest extends RequestBase <IGetWorkTypesRequestResult,undefined>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties= undefined ;
    information= 
    {
        description: "Get all the Work Types",
        displayName: "Get All Work Types",
        created: "2-Aug-2023",
        categories: "Work Types"
    };
    path= "/api/modeller/sharedoTypes";
    override async postProcessResults(result: IGetWorkTypesRequestResult): Promise<IGetWorkTypesRequestResult> {
        return result;
    }
}

