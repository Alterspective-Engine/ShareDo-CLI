

import { RequestBase, MethodType, ResultType } from "../../Execution/ExecutionBase";
import { IGetWorkTypeAspectsRequestResult } from "./IGetWorkTypeAspectsRequest";


export type IGetWorkTypeAspectsRequestInput = {
    workTypeSystemName: string;
};


export class GetWorkTypeAspectsRequest extends RequestBase <IGetWorkTypeAspectsRequestResult,IGetWorkTypeAspectsRequestInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties= {
        workTypeSystemName: ""
    } ;
    information= 
    {
        description: "Get the Work Type Aspects",
        displayName: "Work Type Aspects",
        created: "7-Aug-2023",
        categories: "Modeller"
    };
    get path()
    {
        return `/api/admin/aspects/sharedoTypes/${this.inputProperties.workTypeSystemName}`;
    }
}
