import assert = require("assert");
import { IBaseExecutionSettings, MethodType, RequestBase, ResultType, SharedoInfo } from "../../Execution/ExecutionBase";
import { ListViewRequest } from "../ListViews/listViewRequest";
import { IGetWorkTypesRequestResult } from "./IGetWorkTypesRequestResult";
import { filter, without } from "lodash";
import { ITemplateListData } from "../../RequestHelpers/Templates/ITemplateListData";
import { SharedoClient } from "../../sharedoClient";
import { IListViewFilterItem } from "../ListViews/IListViewInput";
import { ICreatePermission, ICreatePermissionListViewResult, IGetWorkTypeCreatePermissionResult } from "./IGetWorkTypeCreatePermissionResult";
import { IExecutionBaseResult } from "../../Execution/IExecutionBaseResult";


export class GetWorkTypeCreatePermissions extends RequestBase<IGetWorkTypeCreatePermissionResult[], {workTypeSystemName:string}>{
  
    information: SharedoInfo =
        {
            description: "Get Work Type Create Permissions",
            displayName: "Get Work Type Create Permissions",
            created: "2-Aug-2023",
            categories: "Work Types"
        };
       
    inputProperties = 
    {
        workTypeSystemName: "",
    };
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.get;

    get path()
    {

      

        //       /api/modeller/sharedoTypes/instruction-b2c-enquiry-dispute-claimant/createPermission?_=1691053953205
        return `/api/modeller/sharedoTypes/${this.inputProperties.workTypeSystemName}/createPermission`;
    }

    override postProcessResults(resultsAsAny: any[]): Promise<IGetWorkTypeCreatePermissionResult[]> {
        
        let results : ICreatePermission[] = resultsAsAny;
        let retValue = new Array<IGetWorkTypeCreatePermissionResult>();

        return this.getPermissionsIcons().then((withIcons) => {
            console.log("Result Length:", withIcons.result?.length);
            console.log("Result Total :", withIcons.result?.length);
            if (withIcons.success !== true) {
                console.log("Result Success :", withIcons.success);
                console.log("Result Error :", withIcons.error);
            }

            let withIconsResults = withIcons.result;

            results.forEach((x) => {

                //find the same subject type in the results
                let withIcon = withIconsResults?.find((y) => y.subject.text.toLowerCase() === x.subjectName.toLowerCase());
                if(!withIcon){
                    console.log("Could not find icon for subject:", x.subjectName);
                    throw new Error("Could not find icon for subject:" + x.subjectName);
                }
                //merge withIcon into x
                let merged: IGetWorkTypeCreatePermissionResult = {
                    subjectId: x.subjectId,
                    subjectName: x.subjectName,
                    subjectType: x.subjectType,
                    subjectObject: withIcon?.subject,
                    subjectTypeObject: withIcon?.subjectType
                };
               
                retValue.push(merged);

            });
            return retValue;
        });

        
    }

    async getPermissionsIcons(): Promise<IExecutionBaseResult<ICreatePermissionListViewResult[]>> {

        let exec = new ListViewRequest<ICreatePermissionListViewResult>(this.sharedoClient);

        exec.inputProperties.listView = "core-admin-sharedo-type-create-permissions";
        exec.inputProperties.contextId = this.inputProperties.workTypeSystemName;

        let r = await exec.execute();
        console.log("Result Length:", r.result?.rows.length);
        console.log("Result Total :", r.result?.resultCount);
        if (r.success !== true) {
            console.log("Result Success :", r.success);
            console.log("Result Error :", r.error);
        }
        let retValue: IExecutionBaseResult<ICreatePermissionListViewResult[]> = {
            result: r.result?.rows.map((x) => { return x.data;}),
            success: r.success,
            error: r.error,
            freindlyError: r.freindlyError,
            executionTime: r.executionTime
        };
        return retValue;

    }
}

//
//https://demo-aus.sharedo.tech/api/modeller/sharedoTypes/instruction-b2c-enquiry-dispute-claimant/createPermission?_=1691053953205