import { RequestBase, MethodType, ResultType } from "../../Execution/ExecutionBase";
import { IListViewManagerResponse } from "./IListViewManagerResponse";

export class ListViewManagerResponse extends RequestBase <IListViewManagerResponse,undefined>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    inputProperties=undefined   ;
    information= 
    {
        description: "Get List Views",
        displayName: "List Views",
        created: "2023-Apr-27",
        categories: "ListView"
    };
    path= "/api/listview/providers";
  
}
