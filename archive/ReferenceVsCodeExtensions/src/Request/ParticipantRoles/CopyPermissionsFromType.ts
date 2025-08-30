//https://{{Env}}/api/modeller/sharedoTypes/kd-delete-me/participantRoles/mediator/_copyPermissionsFromType/milestone-standard


import { RequestBase, ResultType, MethodType } from "../../Execution/ExecutionBase";
import { ICloneUserInput } from "../Users/Clone/ICloneUserInput";

export type ICopyPermissionsFromType = {
    fromWorkTypeSystemName: string;
    toWorkTypeSystemName: string;
    participantRoleSystemName: string;
};


export class CopyPermissionsFromType extends RequestBase <undefined,ICopyPermissionsFromType>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties={
        fromWorkTypeSystemName: "",
        toWorkTypeSystemName: "",
        participantRoleSystemName: ""
    };
    information= 
    {
        description: "Copy Permissions from one Work Type to another",
        displayName: "Copy Permissions",
        created: "2023-Aug-4",
        categories: "Permission",
        note:""
    };
 
    get path()
    {
        return `/api/modeller/sharedoTypes/${this.inputProperties.toWorkTypeSystemName}/participantRoles/${this.inputProperties.participantRoleSystemName}/_copyPermissionsFromType/${this.inputProperties.fromWorkTypeSystemName}`;
      ///        api/modeller/sharedoTypes/kd-delete-me/participantRoles/mediator/_copyPermissionsFromType/milestone-standard

    }
    
}
