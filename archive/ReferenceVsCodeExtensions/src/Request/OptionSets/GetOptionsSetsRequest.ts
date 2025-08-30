
import {  MethodType, RequestBase, ResultType, SharedoInfo } from "../../Execution/ExecutionBase";
import { getListViewAsIExecutionBaseResult } from "../ListViews/ListViewRequestHelper";


export type IOptionsSet = {
    "optionSetName": string,
    "name": string,
    "description": string,
    "isSystem": boolean,
    "allowHierarchy": boolean,
    "isActive": boolean,
};

export class GetOptionsSetsRequest extends RequestBase<IOptionsSet[], undefined>{
  
    path: string = "";
    information: SharedoInfo =
        {
            description: "Get Options Sets",
            displayName: "Get Options Sets",
            created: "9-Aug-2023",
            categories: "Modeller"
        };
       
    inputProperties = undefined;

    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;
    override async execute() {
        let listViewName = "core-admin-optionsets";
        return getListViewAsIExecutionBaseResult<IOptionsSet>(this.sharedoClient,listViewName);
    }
}

//https://demo-aus.sharedo.tech/api/listview/core-admin-optionsets/20/1/optionSetName/asc/?view=table&withCounts=1
