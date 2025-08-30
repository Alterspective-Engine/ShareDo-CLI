
//https://demo-aus.sharedo.tech/api/modeller/sharedoTypes/instruction-b2c-enquiry-dispute-claimant/createPermission/team/af101f7b-5c31-439d-9120-c970359573bd

import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { ICloneUserInput } from "../Users/Clone/ICloneUserInput";

export type ICreatePermissionInputs = {
    workTypeSystemName: string;
    odsId: string;
    odsType: GrantCreatePermissionType;
};

export enum GrantCreatePermissionType {
    user = "user",
    team = "team"
}


export class RemoveCreatePermission extends RequestBase <undefined,ICreatePermissionInputs>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.delete;
    inputProperties={
        workTypeSystemName: "",
        odsId: "",
        odsType: GrantCreatePermissionType.user
    };
    information= 
    {
        description: "Remove Create Permissions to a Work Type",
        displayName: "Remove Create Permissions",
        created: "2023-Aug-3",
        categories: "Permission",
        note:""
    };
 
    get path()
    {
        return `/api/modeller/sharedoTypes/${this.inputProperties.workTypeSystemName}/createPermission/${this.inputProperties.odsType}/${this.inputProperties.odsId}`;
       //       /api/modeller/sharedoTypes/instruction-b2c-enquiry-dispute-claimant-pi/createPermission/user/e35935ac-006c-4d5f-bb34-17246220b06b


    }
    
}
