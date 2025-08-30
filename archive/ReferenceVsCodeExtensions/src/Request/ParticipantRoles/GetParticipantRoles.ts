
//https://demo-aus.sharedo.tech/api/listview/core-modeller-sharedo-roles/100/1/name/asc/?view=table&withCounts=1&contextId=instruction-b2c-enquiry

import {  MethodType, RequestBase, ResultType, SharedoInfo } from "../../Execution/ExecutionBase";
import { ListViewRequest } from "../ListViews/listViewRequest";
import { IExecutionBaseResult } from "../../Execution/IExecutionBaseResult";
import { IGetParticipantRolesResult } from "./IGetParticipantRolesResult";
import { IListViewResult } from "../ListViews/IListView";
import { getListViewAsIExecutionBaseResult } from "../ListViews/ListViewRequestHelper";


export class GetWorkTypeGetParticipantRoles extends RequestBase<IGetParticipantRolesResult[], {workTypeSystemName:string}>{
  
    path: string = "";
    information: SharedoInfo =
        {
            description: "Get Work Type Participant Permissions",
            displayName: "Get Work Type Participant Permissions",
            created: "4-Aug-2023",
            categories: "Permission"
        };
       
    inputProperties = 
    {
        workTypeSystemName: "",
    };
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;

   
    override async execute() {
        return getListViewAsIExecutionBaseResult<IGetParticipantRolesResult>(this.sharedoClient,"core-modeller-sharedo-roles",this.inputProperties.workTypeSystemName);
 
    }


    // async getParticipantRolesPermissionsUsingList(): Promise<IExecutionBaseResult<IGetParticipantRolesResult[]>> {
    //     let exec = new ListViewRequest<IGetParticipantRolesResult>(this.sharedoClient);
    //     exec.inputProperties.listView = "core-modeller-sharedo-roles";
    //     exec.inputProperties.contextId = this.inputProperties.workTypeSystemName;
    //     let r = await exec.execute();
    //     if(!r)
    //     {
    //         throw new Error("No result");
    //     }
    //     console.log("Result Length:", r.result?.rows.length);
    //     console.log("Result Total :", r.result?.resultCount);
    //     if (r.success !== true) {
    //         console.log("Result Success :", r.success);
    //         console.log("Result Error :", r.error);
    //     }
       
    //     let resultsData = r.result?.rows.map((row) => row.data);

    //     let result: IExecutionBaseResult<IGetParticipantRolesResult[]> = {
    //         success: r.success,
    //         error: r.error,
    //         result: resultsData,
    //         freindlyError: r.freindlyError,
    //         executionTime: r.executionTime
    //     };
    //     return result;

    // }
}

//
//https://demo-aus.sharedo.tech/api/modeller/sharedoTypes/instruction-b2c-enquiry-dispute-claimant/createPermission?_=1691053953205